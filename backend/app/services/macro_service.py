from typing import Dict, Any, List

class MacroService:
    @staticmethod
    def get_macro_intel() -> Dict[str, Any]:
        """
        Retrieves global macro indicators, interest rate metrics, sector rotation cycles,
        and market-wide calendars (Earnings, Dividends, IPOs, FII/DII volumes).
        """
        # Economic Indicators
        indicators = [
            {"name": "US CPI Inflation (YoY)", "value": "2.4%", "status": "Cooling", "impact": "Positive"},
            {"name": "RBI Repo Rate", "value": "6.50%", "status": "Steady", "impact": "Neutral"},
            {"name": "Fed Funds Rate", "value": "5.25%", "status": "Trimming Cycle", "impact": "Positive"},
            {"name": "US 10Y Bond Yield", "value": "4.12%", "status": "Easing", "impact": "Positive"},
            {"name": "Brent Crude (per Barrel)", "value": "$78.50", "status": "Range Bound", "impact": "Neutral"},
        ]

        # Sector Rotation Phase Map
        # Phases: Early Expansion, Full Expansion, Late Expansion, Recession
        sector_rotation = [
            {"sector": "Information Technology", "phase": "Early Expansion", "outlook": "Strong due to cooling borrowing costs and CapEx spikes."},
            {"sector": "Financials", "phase": "Full Expansion", "outlook": "Healthy credit margins offset by minor deposit rate costs."},
            {"sector": "Consumer Discretionary", "phase": "Early Expansion", "outlook": "Improving retail volumes matching job stability."},
            {"sector": "Energy & Oil", "phase": "Late Expansion", "outlook": "Consolidating, high dividend payouts protect downside."},
            {"sector": "Utilities & Staples", "phase": "Recession / Bottom", "outlook": "Defensive holdovers, underperforming high-growth segments."}
        ]

        # Market Calendars
        earnings_calendar = [
            {"date": "2026-07-20", "company": "Infosys [INFY]", "event": "Q1 Earnings Announcement"},
            {"date": "2026-07-22", "company": "Apple Inc. [AAPL]", "event": "Q3 Earnings Announcement"},
            {"date": "2026-07-25", "company": "Tesla Inc. [TSLA]", "event": "Q2 Earnings Announcement"}
        ]

        dividend_calendar = [
            {"date": "2026-07-18", "company": "HDFC Bank Ltd.", "dividend": "Rs 19.50 per share", "type": "Final Dividend"},
            {"date": "2026-07-21", "company": "Apple Inc.", "dividend": "$0.25 per share", "type": "Quarterly Dividend"}
        ]

        ipo_calendar = [
            {"company": "Fintech Solutions Ltd.", "date": "2026-07-17", "issue_size": "Rs 1,200 Cr", "status": "Active Subscription"},
            {"company": "Green Hydrogen Corp.", "date": "2026-07-28", "issue_size": "Rs 3,400 Cr", "status": "Approved"}
        ]

        corporate_actions = [
            {"company": "Reliance Industries Ltd.", "action": "1:1 Bonus Shares Issue", "record_date": "2026-08-01"},
            {"company": "Infosys Ltd.", "action": "Interim Dividend Registry", "record_date": "2026-07-28"}
        ]

        # FII/DII Net Activity Logs (Simulated recent trading day in Crores)
        fii_dii_activity = {
            "date": "2026-07-12",
            "fii_net_buy_sell": "+1,420 Cr (Net Buyer)",
            "dii_net_buy_sell": "+850 Cr (Net Buyer)",
            "combined_flow": "Net Inflow of +2,270 Cr"
        }

        # Global Markets Snapshot
        global_markets = [
            {"name": "S&P 500", "price": "5,450.25", "change": "+0.45%"},
            {"name": "Nifty 50", "price": "24,320.80", "change": "+0.52%"},
            {"name": "Nasdaq 100", "price": "19,890.40", "change": "+0.68%"},
            {"name": "Nikkei 225", "price": "39,120.50", "change": "-0.22%"}
        ]

        return {
            "indicators": indicators,
            "sector_rotation": sector_rotation,
            "earnings_calendar": earnings_calendar,
            "dividend_calendar": dividend_calendar,
            "ipo_calendar": ipo_calendar,
            "corporate_actions": corporate_actions,
            "fii_dii_activity": fii_dii_activity,
            "global_markets": global_markets
        }
