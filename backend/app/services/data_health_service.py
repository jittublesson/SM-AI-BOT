import logging
import requests
import re
import math
from datetime import datetime
from bs4 import BeautifulSoup
from typing import List, Set, Dict, Any
from sqlalchemy.orm import Session

from app.models.models import DataHealthReport, WatchlistItem, UserHolding, ResearchJournalEntry
from app.services.yfinance_service import YFinanceService, get_finology_promoter_holding, set_cached, is_market_open
from app.services.macro_service import NIFTY50_BASKET

logger = logging.getLogger("wealthpilot.health")
logger.setLevel(logging.INFO)

class DataHealthService:

    @staticmethod
    def scrape_finology_market_cap(ticker_prefix: str) -> float:
        """Scrapes market cap in Crores from Finology as an independent ground-truth source."""
        url = f"https://ticker.finology.in/company/{ticker_prefix.upper()}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, 'html.parser')
                
                # Check target structure for Market Cap card
                target_span = soup.find(string=re.compile(r"Market Cap", re.I))
                if target_span:
                    parent = target_span.find_parent()
                    card = parent.find_parent() if parent else None
                    if card:
                        text_content = card.get_text()
                        match = re.search(r'(?:Rs\.|₹)?\s*([0-9,]+\.?[0-9]*)\s*(?:Cr|Crores|Cr\.)?', text_content, re.I)
                        if match:
                            try:
                                val = match.group(1).replace(",", "").strip(".")
                                if val:
                                    return float(val)
                            except ValueError:
                                pass
                            
                # Fallback to general cards search
                cards = soup.find_all(class_=re.compile(r"compess", re.I))
                for card in cards:
                    text = card.get_text()
                    if "Market Cap" in text:
                        nums = re.findall(r'[0-9]+[0-9,.]*', text)
                        if nums:
                            try:
                                return float(nums[0].replace(",", "").strip("."))
                            except ValueError:
                                pass
        except Exception as e:
            logger.error(f"[Health Service] Error scraping market cap for {ticker_prefix}: {e}")
        return 0.0

    @classmethod
    def batch_refetch_live_prices(cls, db: Session):
        """Discovers all tracked tickers, downloads their latest prices in a single batch query, and updates their cache."""
        if not is_market_open():
            logger.info("[Batch Price Refetcher] Market is closed. Skipping price poll.")
            return

        tickers = cls.get_all_tracked_tickers(db)
        if not tickers:
            return

        tickers_list = list(tickers)
        logger.info(f"[Batch Price Refetcher] Batch updating prices for {len(tickers_list)} tickers...")

        try:
            import yfinance as yf
            
            # Perform a single batch download
            df = yf.download(" ".join(tickers_list), period="1d", interval="1m", group_by="ticker", progress=False)
            
            for ticker in tickers_list:
                try:
                    if len(tickers_list) > 1:
                        if ticker in df.columns.levels[0]:
                            ticker_df = df[ticker]
                        else:
                            continue
                    else:
                        ticker_df = df
                        
                    if not ticker_df.empty:
                        close_series = ticker_df["Close"].dropna()
                        open_series = ticker_df["Open"].dropna()
                        if not close_series.empty:
                            last_price = float(close_series.iloc[-1])
                            first_open = float(open_series.iloc[0]) if not open_series.empty else last_price
                            change = round(((last_price - first_open) / first_open) * 100.0, 2) if first_open else 0.0
                            
                            cache_key = f"price_{ticker}"
                            price_data = {
                                "price": round(last_price, 2),
                                "change": change,
                                "volume": 0,
                                "currency": "INR" if (".NS" in ticker or ".BO" in ticker) else "USD",
                                "as_of": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                            }
                            set_cached(cache_key, price_data)
                except Exception as ticker_err:
                    logger.error(f"[Batch Price Refetcher] Error extracting price for {ticker}: {ticker_err}")
            logger.info("[Batch Price Refetcher] Completed batch price update.")
        except Exception as e:
            logger.error(f"[Batch Price Refetcher] Error in batch download: {e}")

    @staticmethod
    def get_all_tracked_tickers(db: Session) -> Set[str]:
        """Discovers all tickers currently tracked in the system."""
        tickers: Set[str] = set()
        
        # 1. Nifty 50 constituent tickers
        for t in NIFTY50_BASKET:
            tickers.add(t.upper())
            
        # 2. Watchlist tickers
        try:
            watchlist = db.query(WatchlistItem.ticker).all()
            for w in watchlist:
                tickers.add(w.ticker.upper())
        except Exception as e:
            logger.error(f"[Health Service] Error querying watchlist tickers: {e}")
            
        # 3. User holdings
        try:
            holdings = db.query(UserHolding.symbol).all()
            for h in holdings:
                tickers.add(h.symbol.upper())
        except Exception as e:
            logger.error(f"[Health Service] Error querying holding symbols: {e}")
            
        # 4. Research Journal entries
        try:
            journal = db.query(ResearchJournalEntry.ticker).all()
            for j in journal:
                tickers.add(j.ticker.upper())
        except Exception as e:
            logger.error(f"[Health Service] Error querying journal tickers: {e}")
            
        return tickers

    @classmethod
    def run_daily_health_check(cls, db: Session) -> List[Dict[str, Any]]:
        """Runs the validation audits and ground-truth comparisons across all active tickers."""
        tickers = cls.get_all_tracked_tickers(db)
        logger.info(f"[Health Service] Starting data health check for {len(tickers)} tickers...")
        
        results = []
        checked_time = datetime.now().isoformat()
        
        for ticker in sorted(tickers):
            # Parse ticker prefix
            prefix = ticker.split(".")[0]
            
            # 1. Fetch yfinance data from the pipeline
            try:
                stock_data = YFinanceService.get_stock_data(ticker)
            except Exception as e:
                stock_data = {"error_state": True, "error_message": str(e)}
                
            # 2. Fetch independent ground-truth values from Finology
            # Scraping is only done if the symbol ends in .NS or .BO (Indian stocks)
            is_indian = ticker.endswith(".NS") or ticker.endswith(".BO") or "." not in ticker
            gt_mcap = 0.0
            gt_promoter = 0.0
            
            if is_indian:
                gt_mcap = cls.scrape_finology_market_cap(prefix)
                gt_prom = get_finology_promoter_holding(prefix)
                if gt_prom is not None:
                    gt_promoter = gt_prom
            
            # Prepare health report mapping
            report = db.query(DataHealthReport).filter(DataHealthReport.ticker == ticker).first()
            if not report:
                report = DataHealthReport(ticker=ticker)
                db.add(report)
                
            report.checked_at = checked_time
            
            if stock_data.get("error_state"):
                report.status = "FAIL"
                report.error_message = stock_data.get("error_message") or "Pipeline retrieval error"
                report.last_price_fetch = None
                report.last_financials_fetch = None
                report.last_financials_period = None
                report.basis = None
                report.price = None
                report.fetched_mcap_cr = None
                report.ground_truth_mcap_cr = gt_mcap if gt_mcap > 0 else None
                report.mcap_variance_pct = None
                report.fetched_promoter = None
                report.ground_truth_promoter = gt_promoter if gt_promoter > 0 else None
                report.promoter_variance = None
            else:
                info = stock_data.get("info", {})
                metadata = stock_data.get("metadata", {})
                financials = stock_data.get("financials", [])
                latest_f = financials[0] if financials else {}
                
                fetched_mcap = info.get("market_cap", 0.0)
                fetched_mcap_cr = fetched_mcap / 1e7
                fetched_promoter = info.get("promoter_holding", 0.0)
                
                mcap_variance = 0.0
                if gt_mcap > 0:
                    mcap_variance = abs(fetched_mcap_cr - gt_mcap) / gt_mcap * 100.0
                    
                promoter_variance = abs(fetched_promoter - gt_promoter)
                
                # Check tolerances (Market Cap: 5%, Promoter stake: 2%)
                has_diverged = False
                error_msgs = []
                
                # Check for direct BSE filings scraping failures (Requirement 4)
                filing_docs = info.get("filing_documents", {})
                annual_report = filing_docs.get("annual_report")
                quarterly_result = filing_docs.get("quarterly_result")
                if is_indian:
                    if not annual_report or not quarterly_result:
                        has_diverged = True
                        missing = []
                        if not annual_report: missing.append("Annual Report PDF")
                        if not quarterly_result: missing.append("Quarterly Result PDF")
                        error_msgs.append(f"Missing direct BSE filings: {', '.join(missing)}")
                
                if gt_mcap > 0 and mcap_variance > 5.0:
                    has_diverged = True
                    error_msgs.append(f"Market Cap variance ({mcap_variance:.2f}%) exceeds 5% threshold.")
                    
                if gt_promoter > 0 and promoter_variance > 2.0:
                    has_diverged = True
                    error_msgs.append(f"Promoter holding variance ({promoter_variance:.2f}%) exceeds 2% threshold.")
                
                report.name = info.get("name", ticker)
                report.last_price_fetch = metadata.get("last_updated") or checked_time
                report.last_financials_fetch = checked_time if financials else None
                report.last_financials_period = latest_f.get("period_label")
                report.basis = latest_f.get("basis", "Consolidated")
                report.price = info.get("price")
                report.fetched_mcap_cr = round(fetched_mcap_cr, 2)
                report.ground_truth_mcap_cr = round(gt_mcap, 2) if gt_mcap > 0 else None
                report.mcap_variance_pct = round(mcap_variance, 4) if gt_mcap > 0 else None
                report.fetched_promoter = fetched_promoter
                report.ground_truth_promoter = gt_promoter if gt_promoter > 0 else None
                report.promoter_variance = round(promoter_variance, 4)
                
                if has_diverged:
                    report.status = "FAIL"
                    report.error_message = " | ".join(error_msgs)
                    # Trigger a highly visible log warning in console
                    logger.error(
                        f"\n[DATA HEALTH ALERT] Ticker '{ticker}' failed ground-truth validation!\n"
                        f"  Reason: {report.error_message}\n"
                        f"  Market Cap: Fetched={fetched_mcap_cr:,.2f} Cr, Ground Truth={gt_mcap:,.2f} Cr\n"
                        f"  Promoter %: Fetched={fetched_promoter}%, Ground Truth={gt_promoter}%\n"
                    )
                else:
                    report.status = "PASS"
                    report.error_message = None
                    
            db.commit()
            
            results.append({
                "ticker": report.ticker,
                "name": report.name,
                "status": report.status,
                "price": report.price,
                "fetched_mcap_cr": report.fetched_mcap_cr,
                "ground_truth_mcap_cr": report.ground_truth_mcap_cr,
                "mcap_variance_pct": report.mcap_variance_pct,
                "fetched_promoter": report.fetched_promoter,
                "ground_truth_promoter": report.ground_truth_promoter,
                "promoter_variance": report.promoter_variance,
                "last_price_fetch": report.last_price_fetch,
                "last_financials_period": report.last_financials_period,
                "error_message": report.error_message,
                "checked_at": report.checked_at
            })
            
        logger.info(f"[Health Service] Completed data health check. Audited: {len(results)} tickers.")
        return results
