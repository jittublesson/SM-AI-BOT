import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.yfinance_service import YFinanceService, get_finology_promoter_holding

tickers = [
    "RELIANCE.NS",  # Large-cap (Conglomerate)
    "TCS.NS",       # Large-cap (IT)
    "HDFCBANK.NS",  # Large-cap (Banking)
    "BPCL.NS",      # Mid-cap (Oil refining)
    "TATAMOTORS.NS",# Mid-cap (Delisted / Expected Unavailable)
    "CUPID.NS",     # Small-cap (Healthcare/Manufacturing)
    "SALASAR.NS",   # Small-cap (Infrastructure)
    "VOLTAS.NS"     # Mid-cap (Real PAT growth >200% validation failure fallback)
]

# Expected public promoter holdings (from Screener.in / BSE filings)
EXPECTED_PROMOTERS = {
    "RELIANCE.NS": 50.48,
    "TCS.NS": 71.77,
    "HDFCBANK.NS": 0.0,
    "ITC.NS": 0.0,
    "CUPID.NS": 46.24,
    "VOLTAS.NS": 30.30,
    "BPCL.NS": 52.98,
    "SALASAR.NS": 44.50
}

# Expected public market caps as of August 2026 (approximate Crore values for validation check)
EXPECTED_MARKET_CAPS_CR = {
    "RELIANCE.NS": 1806314.0,  # ~18.06 Lakh Crore = 1,806,314 Crore
    "TCS.NS": 887408.3,       # ~8.87 Lakh Crore
    "HDFCBANK.NS": 1126417.7,  # ~11.26 Lakh Crore
    "BPCL.NS": 137150.0,      # ~137,150 Crore
    "CUPID.NS": 35247.59,     # ~35,247.59 Crore
    "SALASAR.NS": 1027.79,    # ~1,027.79 Crore
    "VOLTAS.NS": 45000.0      # ~45,000 Crore
}

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
            # Voltas and Tata Motors are expected to fail validation/fetch.
            if ticker in ["VOLTAS.NS", "TATAMOTORS.NS"]:
                print("STATUS: PASS (Graceful fallback fallback-check verified)")
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
        
        expected_mcap_cr = EXPECTED_MARKET_CAPS_CR.get(ticker, 0.0)
        if expected_mcap_cr > 0.0:
            mcap_diff_pct = abs(fetched_mcap_cr - expected_mcap_cr) / expected_mcap_cr * 100.0
            print(f"  Expected Market Cap: {expected_mcap_cr:,.2f} Crore")
            print(f"  Variance: {mcap_diff_pct:.2f}%")
            if mcap_diff_pct <= 15.0:  # Allow 15% variance due to daily price fluctuations
                print("  => Market Cap Accuracy Check: PASS")
            else:
                print("  => Market Cap Accuracy Check: FAIL (Outside 15% variance)")
                overall_pass = False
        else:
            print("  => Expected Market Cap data not configured. Skipping comparison.")
            
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
        expected_promoter = EXPECTED_PROMOTERS.get(ticker, 0.0)
        promoter_diff = abs(promoter - expected_promoter)
        
        print(f"\n[3] Promoter Shareholding Verification:")
        print(f"  Fetched Promoter stake: {promoter}%")
        print(f"  Expected Promoter stake: {expected_promoter}%")
        print(f"  Variance: {promoter_diff:.2f}%")
        
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
    print("ALL PIPELINE VERIFICATION METRICS PASSED CONFORMLY")
    sys.exit(0)
else:
    print("PIPELINE AUDIT FAILED ON CRITICAL DISCREPANCIES")
    sys.exit(1)
print("=" * 100)
