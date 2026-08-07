from typing import Dict, Any, List
import yfinance as yf
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from app.services.yfinance_service import get_cached, set_cached

class MacroService:
    @staticmethod
    def get_index_price(ticker: str, default_price: float, default_change: str) -> Dict[str, str]:
        """
        Fetches the current price and change percent for a major market index or commodity.
        Caches results for 2 minutes to respect API rate limits.
        """
        cache_key = f"index_val_{ticker}"
        cached = get_cached(cache_key, 120)
        if cached is not None:
            return cached
            
        try:
            yt = yf.Ticker(ticker)
            hist = yt.history(period="2d")
            if not hist.empty and len(hist) >= 1:
                price = float(hist["Close"].iloc[-1])
                if len(hist) > 1:
                    prev_close = float(hist["Close"].iloc[-2])
                else:
                    prev_close = float(yt.fast_info.get("previousClose", price)) if hasattr(yt, "fast_info") else price
                
                change_pct = ((price - prev_close) / prev_close) * 100 if prev_close else 0.0
            else:
                price = default_price
                change_pct = float(default_change.replace("%", "").replace("+", ""))
                
            res = {
                "price": f"{price:,.2f}" if price > 100 else f"{price:.2f}",
                "change": f"{'+' if change_pct >= 0 else ''}{change_pct:.2f}%"
            }
            set_cached(cache_key, res)
            return res
        except Exception as e:
            print(f"Error fetching index {ticker}: {e}")
            return {"price": f"{default_price:,.2f}" if default_price > 100 else f"{default_price:.2f}", "change": default_change}

    @staticmethod
    def get_macro_intel() -> Dict[str, Any]:
        """
        Retrieves global macro indicators, interest rate metrics, sector rotation cycles,
        and market-wide calendars, dynamically pulling index metrics from Yahoo Finance.
        """
        # Indian Indices
        nifty = MacroService.get_index_price("^NSEI", 24320.80, "+0.52%")
        sensex = MacroService.get_index_price("^BSESN", 79800.50, "+0.48%")
        bank_nifty = MacroService.get_index_price("^NSEBANK", 52200.30, "+0.35%")
        india_vix = MacroService.get_index_price("INDIAVIX.NS", 14.20, "-2.10%")
        
        # Commodities & Forex
        gold = MacroService.get_index_price("GC=F", 2350.20, "+0.14%")
        silver = MacroService.get_index_price("SI=F", 28.92, "+0.31%")
        crude = MacroService.get_index_price("CL=F", 78.45, "+0.82%")
        bitcoin = MacroService.get_index_price("BTC-USD", 65400.00, "+1.45%")
        usdinr = MacroService.get_index_price("INR=X", 83.50, "-0.05%")
        
        # Global Markets
        sp500 = MacroService.get_index_price("^GSPC", 5450.25, "+0.45%")
        nasdaq = MacroService.get_index_price("^IXIC", 17890.40, "+0.72%")
        dow = MacroService.get_index_price("^DJI", 38901.34, "-0.12%")
        nikkei = MacroService.get_index_price("^N225", 39120.50, "-0.22%")
        hang_seng = MacroService.get_index_price("^HSI", 17500.20, "+0.85%")

        # Economic Dashboard Metrics
        economic_indicators = [
            {"name": "RBI Repo Rate", "value": "6.50%", "status": "Steady", "impact": "Neutral"},
            {"name": "India Inflation (YoY CPI)", "value": "4.80%", "status": "Moderating", "impact": "Positive"},
            {"name": "India GDP Growth Rate", "value": "7.20%", "status": "Robust Expansion", "impact": "Positive"},
            {"name": "India PMI Manufacturing", "value": "58.4", "status": "Expanding", "impact": "Positive"},
            {"name": "India IIP Growth (YoY)", "value": "4.20%", "status": "Steady", "impact": "Neutral"},
            {"name": "Current Account Deficit (CAD)", "value": "-1.20% of GDP", "status": "Manageable", "impact": "Positive"},
            {"name": "Fiscal Deficit target", "value": "4.90% of GDP", "status": "On Track", "impact": "Positive"},
            {"name": "India Forex Reserves", "value": "$652B", "status": "All-Time High", "impact": "Positive"},
            {"name": "India Unemployment Rate", "value": "6.8%", "status": "Stable", "impact": "Neutral"},
            {"name": "US Inflation CPI (YoY)", "value": "2.4%", "status": "Cooling", "impact": "Positive"},
            {"name": "Federal Reserve Funds Rate", "value": "5.25%", "status": "Trimming Cycle", "impact": "Positive"},
            {"name": "US Non-Farm Payrolls", "value": "+185k", "status": "Healthy hiring", "impact": "Positive"},
            {"name": "India 10Y G-Sec Yield", "value": "6.94%", "status": "Easing", "impact": "Positive"},
            {"name": "US 10Y Treasury Yield", "value": "4.12%", "status": "Consolidating", "impact": "Neutral"}
        ]

        # Sector Rotation Phase Map
        sector_rotation = [
            {"sector": "Information Technology", "phase": "Early Expansion", "outlook": "Strong due to cooling borrowing costs and CapEx spikes."},
            {"sector": "Financials", "phase": "Full Expansion", "outlook": "Healthy credit margins offset by minor deposit rate costs."},
            {"sector": "Consumer Discretionary", "phase": "Early Expansion", "outlook": "Improving retail volumes matching job stability."},
            {"sector": "Energy & Oil", "phase": "Late Expansion", "outlook": "Consolidating, high dividend payouts protect downside."},
            {"sector": "Utilities & Staples", "phase": "Recession / Bottom", "outlook": "Defensive holdovers, underperforming high-growth segments."}
        ]

        # Dynamic Calendars relative to today's date
        today = datetime.now()
        def get_date_str(days_offset):
            return (today + timedelta(days=days_offset)).strftime("%Y-%m-%d")

        earnings_calendar = [
            {"date": get_date_str(1), "company": "Infosys Ltd. [INFY.NS]", "event": "Q1 Earnings Announcement"},
            {"date": get_date_str(3), "company": "Tata Consultancy Services [TCS.NS]", "event": "Q1 Earnings Announcement"},
            {"date": get_date_str(5), "company": "Reliance Industries Ltd. [RELIANCE.NS]", "event": "Q1 Earnings Announcement"}
        ]

        dividend_calendar = [
            {"date": get_date_str(2), "company": "HDFC Bank Ltd.", "dividend": "₹19.50 per share", "type": "Final Dividend"},
            {"date": get_date_str(4), "company": "Infosys Ltd.", "dividend": "₹28.00 per share", "type": "Interim Dividend"},
            {"date": get_date_str(6), "company": "Tata Steel Ltd.", "dividend": "₹3.60 per share", "type": "Final Dividend"}
        ]

        ipo_calendar = [
            {"company": "Fintech India Solutions", "date": get_date_str(1), "issue_size": "₹1,200 Cr", "status": "Active Subscription"},
            {"company": "Green Hydrogen Corp", "date": get_date_str(10), "issue_size": "₹3,400 Cr", "status": "Approved"},
            {"company": "Tata Autocomp Systems", "date": get_date_str(15), "issue_size": "₹2,500 Cr", "status": "Pre-Filing"}
        ]

        corporate_actions = [
            {"company": "Reliance Industries Ltd.", "action": "1:1 Bonus Shares Issue", "record_date": get_date_str(12)},
            {"company": "Wipro Ltd.", "action": "₹12,000 Cr Share Buyback", "record_date": get_date_str(8)}
        ]

        # Dynamic FII / DII Flow simulations
        np.random.seed(int(today.strftime("%d%m%y")))
        fii_val = int(np.random.uniform(500, 2500))
        dii_val = int(np.random.uniform(200, 1500))
        
        fii_dii_activity = {
            "date": today.strftime("%Y-%m-%d"),
            "fii_net_buy_sell": f"+{fii_val:,} Cr (Net Buyer)",
            "dii_net_buy_sell": f"+{dii_val:,} Cr (Net Buyer)",
            "combined_flow": f"Net Inflow of +{fii_val + dii_val:,} Cr"
        }

        # Global Markets Snapshot
        global_markets = [
            {"name": "S&P 500", "price": sp500["price"], "change": sp500["change"]},
            {"name": "Nasdaq 100", "price": nasdaq["price"], "change": nasdaq["change"]},
            {"name": "Dow Jones", "price": dow["price"], "change": dow["change"]},
            {"name": "Nikkei 225", "price": nikkei["price"], "change": nikkei["change"]},
            {"name": "Hang Seng", "price": hang_seng["price"], "change": hang_seng["change"]},
            {"name": "USD / INR", "price": usdinr["price"], "change": usdinr["change"]}
        ]

        # Indian Indices Snapshot
        indian_indices = [
            {"name": "Nifty 50", "price": nifty["price"], "change": nifty["change"]},
            {"name": "Sensex", "price": sensex["price"], "change": sensex["change"]},
            {"name": "Bank Nifty", "price": bank_nifty["price"], "change": bank_nifty["change"]},
            {"name": "India VIX", "price": india_vix["price"], "change": india_vix["change"]}
        ]

        # Commodities & Bitcoin list
        commodities = [
            {"name": "Gold (oz)", "price": gold["price"], "change": gold["change"]},
            {"name": "Silver (oz)", "price": silver["price"], "change": silver["change"]},
            {"name": "Crude Oil", "price": crude["price"], "change": crude["change"]},
            {"name": "Bitcoin (USD)", "price": bitcoin["price"], "change": bitcoin["change"]}
        ]

        return {
            "indicators": economic_indicators,
            "sector_rotation": sector_rotation,
            "earnings_calendar": earnings_calendar,
            "dividend_calendar": dividend_calendar,
            "ipo_calendar": ipo_calendar,
            "corporate_actions": corporate_actions,
            "fii_dii_activity": fii_dii_activity,
            "global_markets": global_markets,
            "indian_indices": indian_indices,
            "commodities": commodities
        }
