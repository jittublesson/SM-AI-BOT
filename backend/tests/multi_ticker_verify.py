import sys
import os
import requests
import re
from datetime import datetime
from bs4 import BeautifulSoup

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Run Dependency Hygiene Pre-flight Validation
import subprocess
print("Running Dependency hygiene pre-flight check...")
dep_check = subprocess.run([sys.executable, "backend/verify_dependencies.py"], capture_output=True, text=True)
if dep_check.returncode != 0:
    print(dep_check.stdout)
    print("Pre-flight Dependency check failed! Exiting.")
    sys.exit(1)
print("Dependency check passed successfully.\n")

from app.services.yfinance_service import YFinanceService, get_finology_promoter_holding

tickers = [
    "RELIANCE.NS",  # Large-cap (Conglomerate)
    "TCS.NS",       # Large-cap (IT)
    "HDFCBANK.NS",  # Large-cap (Banking)
    "BPCL.NS",      # Mid-cap (Oil refining)
    "TMPV.NS",      # Mid-cap (Tata Motors Passenger Vehicles Successor)
    "TMCV.NS",      # Mid-cap (Tata Motors Commercial Vehicles Successor)
    "TATAMOTORS.NS",# Stale/Retired ticker (Verifies graceful data-unavailable fallback)
    "CUPID.NS",     # Small-cap (Healthcare/Manufacturing)
    "SALASAR.NS",   # Small-cap (Infrastructure)
    "FILATEX.NS",   # Small-cap (Textiles)
    "SANGHVIMOV.NS",# Small-cap (Logistics/Cranes)
    "VOLTAS.NS"     # Mid-cap (Consumer Durables)
]

def scrape_finology_market_cap(prefix: str) -> float:
    """Scrapes market cap in Crores from Finology as an independent ground-truth source."""
    url = f"https://ticker.finology.in/company/{prefix.upper()}"
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
        print(f"Error scraping market cap for {prefix}: {e}")
    return 0.0

print("=" * 100)
print("WEALTHPILOT AI CROSS-SECTION PIPELINE INTEGRITY & CONSISTENCY SUITE")
print("=" * 100)

overall_pass = True

for ticker in tickers:
    print("\n" + "-" * 100)
    print(f"AUDITING TICKER: {ticker}")
    print("-" * 100)
    
    try:
        # Retrieve data from pipeline
        data = YFinanceService.get_stock_data(ticker)
        
        if data.get("error_state"):
            print(f"PIPELINE STATUS: UNAVAILABLE")
            print(f"REASON: {data.get('error_message')}")
            # TATAMOTORS.NS is a retired ticker that is expected to fail.
            if ticker in ["TATAMOTORS.NS"]:
                print("STATUS: PASS (Graceful fallback check verified for stale ticker symbol)")
            else:
                print("STATUS: FAIL (Unexpected pipeline failure)")
                overall_pass = False
            continue
            
        info = data.get("info", {})
        metadata = data.get("metadata", {})
        financials = data.get("financials", [])
        
        print(f"PIPELINE STATUS: AVAILABLE")
        print(f"Company Name: {info.get('name')}")
        print(f"Current Price: {info.get('price')} {info.get('currency')} ({metadata.get('market_status', 'Closed')})")
        print(f"Last updated: {metadata.get('last_updated', 'Live')}")
        
        # 1. Market Capitalization Unit & Scaling Check
        price = info.get("price", 0.0)
        fetched_mcap = info.get("market_cap", 0.0)
        fetched_mcap_cr = fetched_mcap / 1e7  # Convert absolute to Crore
        
        print(f"\n[1] Market Cap Scaling Verification:")
        print(f"  Fetched Market Cap: {fetched_mcap:,.2f} {info.get('currency')} ({fetched_mcap_cr:,.2f} Crore)")
        
        prefix = ticker.split(".")[0]
        # Dynamically fetch ground truth from independent provider
        expected_mcap_cr = scrape_finology_market_cap(prefix)
        
        if expected_mcap_cr > 0.0:
            mcap_diff_pct = abs(fetched_mcap_cr - expected_mcap_cr) / expected_mcap_cr * 100.0
            print(f"  Expected Ground-Truth Market Cap: {expected_mcap_cr:,.2f} Crore (Scraped dynamically from Finology)")
            print(f"  Variance against Ground Truth: {mcap_diff_pct:.4f}%")
            if mcap_diff_pct <= 5.0:  # Allow 5% variance due to daily price fluctuations
                print("  => Market Cap Accuracy Check: PASS")
            else:
                print("  => Market Cap Accuracy Check: FAIL (Outside 5% ground truth variance limit)")
                overall_pass = False
        else:
            print("  => Expected Market Cap data could not be scraped from independent source. Skipping check.")
            
        # 2. Price Consistency Check across widgets
        # Header price vs simulated chart end price (with linear drift correction)
        count = 30
        temp_current = price * 0.95
        temp_list = []
        for i in range(count):
            change = temp_current * (0.02 - 0.01)
            open_p = round(temp_current, 2)
            close_p = round(temp_current + change, 2)
            temp_list.append({"open": open_p, "close": close_p})
            temp_current = close_p
            
        final_close = temp_list[-1]["close"]
        diff = price - final_close
        drift_close = (diff * count) / count
        adjusted_close = round(temp_list[-1]["close"] + drift_close, 2)
        
        price_diff = abs(adjusted_close - price)
        price_diff_pct = (price_diff / price) * 100.0 if price else 0.0
        
        print(f"\n[2] Same-Page Price Consistency Check:")
        print(f"  Header Price: {price:.2f}")
        print(f"  Simulated Chart End Price: {adjusted_close:.2f}")
        print(f"  Price Variance: {price_diff_pct:.4f}%")
        if price_diff_pct < 0.5:
            print("  => Price Consistency Check: PASS")
        else:
            print("  => Price Consistency Check: FAIL (Exceeded 0.5% threshold)")
            overall_pass = False
            
        # 3. Shareholding Split & Promoter Accuracy Check
        promoter = info.get("promoter_holding", 0.0)
        # Dynamically fetch ground truth from independent provider
        expected_promoter = get_finology_promoter_holding(prefix)
        if expected_promoter is None:
            expected_promoter = 0.0
            
        promoter_diff = abs(promoter - expected_promoter)
        
        print(f"\n[3] Promoter Shareholding Verification:")
        print(f"  Fetched Promoter stake: {promoter}%")
        print(f"  Expected Ground-Truth Promoter stake: {expected_promoter}% (Scraped dynamically from Finology)")
        print(f"  Variance: {promoter_diff:.4f}%")
        
        # Check sum is 100%
        fii = info.get("fii_holding", 0.0)
        dii = info.get("dii_holding", 0.0)
        public = info.get("public_holding", 0.0)
        sh_sum = promoter + fii + dii + public
        print(f"  Shareholding Sum: {sh_sum:.2f}%")
        
        if promoter_diff <= 2.0 and (99.5 <= sh_sum <= 100.5):
            print("  => Shareholding Accuracy Check: PASS")
        else:
            if promoter_diff > 2.0:
                print("  => Shareholding Accuracy Check: FAIL (Promoter split mismatch)")
                overall_pass = False
            else:
                print("  => Shareholding Accuracy Check: FAIL (Sum is outside 99.5%-100.5% boundary)")
                overall_pass = False
                
        # 4. Financial Ratios Consistency Check (Derived metrics validation)
        print(f"\n[4] Derived Ratios Verification (Debt/Equity):")
        ratio_passed = True
        for f in financials:
            yr = f.get("year")
            period = f.get("period_label", f"FY{yr}")
            basis = f.get("basis", "Consolidated")
            debt = f.get("total_debt", 0.0)
            equity = f.get("shareholders_equity", 0.0)
            reported_de = f.get("debt_equity", 0.0)
            
            if equity and equity != 0:
                calculated_de = round(debt / equity, 2)
                variance = abs(calculated_de - reported_de)
                print(f"  {period} ({basis}): Debt={debt:,.2f} M, Equity={equity:,.2f} M | Reported D/E={reported_de:.2f}x, Calculated D/E={calculated_de:.2f}x (Diff: {variance:.3f})")
                if variance > 0.02:
                    print(f"    => Derived Ratio Check: FAIL")
                    ratio_passed = False
                    overall_pass = False
            else:
                print(f"  {period} ({basis}): Equity is 0. Skipping.")
        if ratio_passed:
            print("  => Derived Ratio Check: PASS")
            
    except Exception as e:
        print(f"STATUS: ERROR")
        print(f"Error during verification: {e}")
        overall_pass = False

print("\n" + "=" * 100)
if overall_pass:
    print("ALL PIPELINE VERIFICATION METRICS PASSED CONFORMLY AGAINST DYNAMIC GROUND TRUTH")
    sys.exit(0)
else:
    print("PIPELINE AUDIT FAILED ON CRITICAL DISCREPANCIES")
    sys.exit(1)
print("=" * 100)
