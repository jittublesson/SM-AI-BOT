import sys
import os

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.yfinance_service import YFinanceService

tickers = ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "VOLTAS.NS", "ITC.NS", "TATAMOTORS.NS"]

print("=" * 80)
print("WEALTHPILOT AI MULTI-TICKER DATA PIPELINE VERIFICATION SUITE")
print("=" * 80)

for ticker in tickers:
    print("\n" + "-" * 80)
    print(f"VERIFYING TICKER: {ticker}")
    print("-" * 80)
    
    try:
        data = YFinanceService.get_stock_data(ticker)
        
        if data.get("error_state"):
            print(f"STATUS: UNAVAILABLE")
            print(f"REASON: {data.get('error_message')}")
            continue
            
        info = data.get("info", {})
        metadata = data.get("metadata", {})
        financials = data.get("financials", [])
        
        print(f"STATUS: AVAILABLE")
        print(f"Company Name: {info.get('name')}")
        print(f"Sector/Industry: {info.get('sector')} / {info.get('industry')}")
        print(f"Current Price: {info.get('price')} {info.get('currency')} (Change: {info.get('intraday_change')}%)")
        print(f"Data Source: {metadata.get('data_source')} (Updated: {metadata.get('last_updated')})")
        
        # Shareholding
        promoter = info.get("promoter_holding", 0)
        fii = info.get("fii_holding", 0)
        dii = info.get("dii_holding", 0)
        public = info.get("public_holding", 0)
        sh_sum = promoter + fii + dii + public
        print(f"\nShareholding Pattern:")
        print(f"  Promoters: {promoter}%")
        print(f"  FII: {fii}%")
        print(f"  DII: {dii}%")
        print(f"  Public / Retail: {public}%")
        print(f"  Total Sum: {sh_sum:.2f}% (Normal: {100.00 <= sh_sum <= 100.00})")
        
        # Financials
        print(f"\nFinancial Statements:")
        if financials:
            for f in financials[:3]: # print last 3 years
                print(f"  Period: {f.get('period_label')} | Year: {f.get('year')} | Basis: {f.get('basis')}")
                print(f"    Total Revenue: {f.get('revenue'):,.2f} Million {info.get('currency')}")
                print(f"    Net Profit (PAT): {f.get('pat'):,.2f} Million {info.get('currency')}")
                print(f"    EBITDA: {f.get('ebitda'):,.2f} Million {info.get('currency')}")
                print(f"    Debt-to-Equity: {f.get('debt_equity')}x")
                print(f"    YoY Revenue Growth: {f.get('growth_revenue')}%")
                print(f"    YoY PAT Growth: {f.get('growth_pat')}%")
        else:
            print("  No financials found.")
            
    except Exception as e:
        print(f"STATUS: ERROR")
        print(f"Error during verification: {e}")

print("\n" + "=" * 80)
print("VERIFICATION SUITE RUN COMPLETE")
print("=" * 80)
