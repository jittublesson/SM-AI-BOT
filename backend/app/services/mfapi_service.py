"""
Indian Mutual Fund data service using mfapi.in (free, no API key required).
Provides live NAV, NAV history, and scheme metadata for 20,000+ Indian MF schemes.
API Docs: https://www.mfapi.in/
"""

import urllib.request
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services.yfinance_service import get_cached, set_cached

MFAPI_BASE = "https://api.mfapi.in/mf"

# Supplementary non-financial metadata for top Indian mutual funds.
# Only contains operational data (expense ratio, manager, minimums).
# NAV, returns, and AUM are always fetched live from mfapi.in.
TOP_FUND_META: Dict[str, Dict[str, Any]] = {
    "119598": {
        "expense_ratio_pct": 0.83,
        "exit_load": "1% if redeemed within 1 year",
        "fund_manager": "Sohini Andani",
        "min_sip": 500.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty 100 TRI",
        "risk_level": "Very High",
    },
    "120503": {
        "expense_ratio_pct": 0.58,
        "exit_load": "2% within 365 days; 1% within 730 days",
        "fund_manager": "Rajeev Thakkar",
        "min_sip": 1000.0,
        "min_lumpsum": 1000.0,
        "benchmark": "Nifty 500 TRI",
        "risk_level": "Very High",
    },
    "118989": {
        "expense_ratio_pct": 0.68,
        "exit_load": "1% within 1 month",
        "fund_manager": "Sailesh Raj Bhan",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty Smallcap 250 TRI",
        "risk_level": "Very High",
    },
    "119046": {
        "expense_ratio_pct": 0.78,
        "exit_load": "1% if redeemed within 1 year",
        "fund_manager": "Chirag Setalvad",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty Midcap 150 TRI",
        "risk_level": "Very High",
    },
    "120483": {
        "expense_ratio_pct": 0.52,
        "exit_load": "0.5% within 30 days",
        "fund_manager": "Shreyash Devalkar",
        "min_sip": 500.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty 50 TRI",
        "risk_level": "Very High",
    },
    "148620": {
        "expense_ratio_pct": 0.50,
        "exit_load": "0.5% within 15 days",
        "fund_manager": "Nishit Patel",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty US Tech 50 Index",
        "risk_level": "Very High",
    },
    "125354": {
        "expense_ratio_pct": 0.56,
        "exit_load": "1% within 1 year",
        "fund_manager": "Harsha Upadhyaya",
        "min_sip": 500.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty 200 TRI",
        "risk_level": "Very High",
    },
    "112090": {
        "expense_ratio_pct": 0.60,
        "exit_load": "1% within 1 year",
        "fund_manager": "S. Naren",
        "min_sip": 100.0,
        "min_lumpsum": 5000.0,
        "benchmark": "Nifty 500 TRI",
        "risk_level": "Very High",
    },
}

# Default featured fund scheme codes (diverse categories for initial display)
FEATURED_FUND_CODES = [
    "119598",   # SBI Bluechip Direct Growth
    "120503",   # Parag Parikh Flexicap Direct Growth
    "118989",   # Nippon India Small Cap Direct Growth
    "119046",   # HDFC Mid-Cap Opportunities Direct Growth
    "120483",   # Axis Bluechip Direct Growth
    "148620",   # Mirae Asset NYSE FANG+ ETF FoF Direct Growth
    "125354",   # Kotak Standard Multicap Direct Growth
    "112090",   # ICICI Pru Value Discovery Direct Growth
]


class MFAPIService:

    @staticmethod
    def _fetch_json(url: str, timeout: int = 12) -> Optional[Any]:
        """Fetch JSON from mfapi.in with proper headers."""
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "WealthPilotAI/4.0 (market data terminal)"}
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception as e:
            print(f"[MFAPIService] fetch error for {url}: {e}")
            return None

    @staticmethod
    def get_all_schemes() -> List[Dict[str, Any]]:
        """
        Fetch the complete list of Indian mutual fund schemes from mfapi.in.
        Returns list of {schemeCode, schemeName} objects.
        Cached 24 hours (the scheme list rarely changes).
        """
        cache_key = "mfapi_all_schemes"
        cached = get_cached(cache_key, 86400)
        if cached is not None:
            return cached

        data = MFAPIService._fetch_json(MFAPI_BASE)
        if data and isinstance(data, list) and len(data) > 0:
            set_cached(cache_key, data)
            return data

        print("[MFAPIService] get_all_schemes: failed to fetch scheme list")
        return []

    @staticmethod
    def search_funds(query: str) -> List[Dict[str, Any]]:
        """
        Search Indian mutual funds by name or AMC.
        Searches the full mfapi.in scheme list and returns top 20 matches.
        """
        if not query or not query.strip():
            return []

        q = query.lower().strip()
        cache_key = f"mfapi_search_{q}"
        cached = get_cached(cache_key, 1800)  # 30 min
        if cached is not None:
            return cached

        all_schemes = MFAPIService.get_all_schemes()
        if not all_schemes:
            return []

        matched = [
            {"schemeCode": str(s.get("schemeCode", "")), "schemeName": s.get("schemeName", "")}
            for s in all_schemes
            if q in s.get("schemeName", "").lower()
        ][:20]

        set_cached(cache_key, matched)
        return matched

    @staticmethod
    def get_fund_detail(scheme_code: str) -> Optional[Dict[str, Any]]:
        """
        Fetch live fund NAV, NAV history, and calculated returns from mfapi.in.
        scheme_code: numeric string like "119598"
        Cached 15 minutes.
        """
        sc = str(scheme_code).strip()
        cache_key = f"mfapi_fund_{sc}"
        cached = get_cached(cache_key, 900)  # 15 min
        if cached is not None:
            return cached

        data = MFAPIService._fetch_json(f"{MFAPI_BASE}/{sc}")
        if not data or data.get("status") != "SUCCESS":
            print(f"[MFAPIService] fund detail unavailable for code {sc}")
            return None

        meta = data.get("meta", {})
        nav_history = data.get("data", [])

        if not nav_history:
            return None

        try:
            latest_nav = round(float(nav_history[0]["nav"]), 4)
            latest_date = nav_history[0].get("date", "")
        except (ValueError, KeyError, IndexError):
            return None

        returns = MFAPIService.calculate_returns(nav_history)
        extra_meta = TOP_FUND_META.get(sc, {})

        result = {
            "id": sc,
            "scheme_code": sc,
            "name": meta.get("scheme_name", "Unknown Fund"),
            "amc": meta.get("fund_house", "Unknown AMC"),
            "category": meta.get("scheme_category", "N/A"),
            "type": meta.get("scheme_type", "Open Ended"),
            "nav": latest_nav,
            "nav_date": latest_date,
            "returns": returns,
            # Supplementary metadata (from curated file, not from live API)
            "expense_ratio_pct": extra_meta.get("expense_ratio_pct"),
            "exit_load": extra_meta.get("exit_load"),
            "fund_manager": extra_meta.get("fund_manager"),
            "min_sip": extra_meta.get("min_sip"),
            "min_lumpsum": extra_meta.get("min_lumpsum"),
            "benchmark": extra_meta.get("benchmark"),
            "risk_level": extra_meta.get("risk_level"),
            # Source attribution
            "data_source": "mfapi.in",
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        }

        set_cached(cache_key, result)
        return result

    @staticmethod
    def get_featured_funds() -> List[Dict[str, Any]]:
        """
        Fetch details for all featured funds.
        Used for the main mutual funds listing page.
        """
        funds = []
        for code in FEATURED_FUND_CODES:
            detail = MFAPIService.get_fund_detail(code)
            if detail:
                funds.append(detail)
        return funds

    @staticmethod
    def get_nav_history(scheme_code: str, limit: int = 365) -> List[Dict[str, Any]]:
        """
        Fetch NAV history for charting purposes.
        Returns list of {"date": "DD-MM-YYYY", "nav": float} sorted newest-first.
        Cached 15 minutes.
        """
        sc = str(scheme_code).strip()
        cache_key = f"mfapi_history_{sc}"
        cached = get_cached(cache_key, 900)
        if cached is not None:
            return cached[:limit]

        data = MFAPIService._fetch_json(f"{MFAPI_BASE}/{sc}")
        if not data or data.get("status") != "SUCCESS":
            return []

        history = []
        for item in data.get("data", []):
            try:
                history.append({
                    "date": item["date"],
                    "nav": round(float(item["nav"]), 4)
                })
            except (KeyError, ValueError):
                continue

        set_cached(cache_key, history)
        return history[:limit]

    @staticmethod
    def calculate_returns(nav_history: List[Dict]) -> Dict[str, Optional[str]]:
        """
        Calculate point-to-point and CAGR returns from NAV history.
        nav_history: list sorted newest-first (nav_history[0] = today).
        Uses approximate trading day counts: 22/month.
        """
        if not nav_history:
            return {}

        try:
            current_nav = float(nav_history[0]["nav"])
        except (ValueError, KeyError, IndexError):
            return {}

        def nav_at(idx: int) -> Optional[float]:
            if idx < len(nav_history):
                try:
                    return float(nav_history[idx]["nav"])
                except (ValueError, KeyError):
                    return None
            return None

        def ptp_return(past_nav: Optional[float]) -> Optional[str]:
            if past_nav and past_nav > 0:
                ret = ((current_nav - past_nav) / past_nav) * 100
                return f"{'+' if ret >= 0 else ''}{ret:.1f}%"
            return None

        def cagr(past_nav: Optional[float], years: float) -> Optional[str]:
            if past_nav and past_nav > 0 and current_nav > 0:
                c = ((current_nav / past_nav) ** (1.0 / years) - 1.0) * 100
                return f"{'+' if c >= 0 else ''}{c:.1f}%"
            return None

        return {
            "1m":  ptp_return(nav_at(22)),
            "3m":  ptp_return(nav_at(66)),
            "6m":  ptp_return(nav_at(132)),
            "1y":  ptp_return(nav_at(252)),
            "3y":  cagr(nav_at(756), 3.0),
            "5y":  cagr(nav_at(1260), 5.0),
        }

    @staticmethod
    def calculate_sip_returns(nav_history: List[Dict], monthly_amount: float = 5000) -> Dict[str, Any]:
        """
        Calculate SIP returns by simulating monthly investments.
        nav_history: newest-first. Invests on 1st nav of each month.
        """
        if len(nav_history) < 22:
            return {"data_available": False}

        current_nav = float(nav_history[0]["nav"])
        total_invested = 0.0
        total_units = 0.0

        # Simulate monthly SIP over available history
        # Sample every ~22 entries (1 month approx)
        for i in range(0, min(len(nav_history), 1260), 22):  # up to 5 years
            try:
                nav_on_date = float(nav_history[i]["nav"])
                units = monthly_amount / nav_on_date
                total_units += units
                total_invested += monthly_amount
            except (ValueError, KeyError):
                continue

        current_value = total_units * current_nav
        gain = current_value - total_invested

        if total_invested > 0 and total_units > 0:
            months = min(len(nav_history), 1260) // 22
            years = max(months / 12, 0.08)
            xirr_approx = ((current_value / total_invested) ** (1 / years) - 1) * 100

            return {
                "total_invested": round(total_invested, 2),
                "current_value": round(current_value, 2),
                "gain": round(gain, 2),
                "gain_pct": round((gain / total_invested) * 100 if total_invested else 0, 2),
                "xirr_approx_pct": round(xirr_approx, 2),
                "months_simulated": months,
                "data_available": True,
            }

        return {"data_available": False}

    @staticmethod
    def calculate_lumpsum_returns(nav_history: List[Dict]) -> Dict[str, Any]:
        """
        Calculate lumpsum point-to-point return scenarios.
        """
        if not nav_history:
            return {"data_available": False}

        try:
            current = float(nav_history[0]["nav"])
        except (ValueError, KeyError):
            return {"data_available": False}

        scenarios = {}
        for label, idx in [("1y", 252), ("3y", 756), ("5y", 1260)]:
            if idx < len(nav_history):
                try:
                    past = float(nav_history[idx]["nav"])
                    years = {"1y": 1, "3y": 3, "5y": 5}[label]
                    cagr_val = ((current / past) ** (1.0 / years) - 1.0) * 100
                    ptp = ((current - past) / past) * 100
                    scenarios[label] = {
                        "cagr_pct": round(cagr_val, 2),
                        "absolute_pct": round(ptp, 2),
                        "data_available": True,
                    }
                except (ValueError, KeyError, ZeroDivisionError):
                    scenarios[label] = {"data_available": False}
            else:
                scenarios[label] = {"data_available": False}

        return scenarios
