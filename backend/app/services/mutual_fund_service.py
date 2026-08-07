"""
MutualFundService — Indian Mutual Fund data via mfapi.in (free, real-time NAV).

All NAV and returns data is fetched live from https://www.mfapi.in/.
Covers 20,000+ Indian mutual fund schemes across all AMCs and categories.
Static MOCK_FUNDS has been fully removed. No hardcoded returns or NAV values.
"""

from typing import Dict, Any, List, Optional
from app.services.mfapi_service import MFAPIService


class MutualFundService:

    @staticmethod
    def get_all_funds() -> List[Dict[str, Any]]:
        """
        Returns the featured fund list with live NAV and calculated returns from mfapi.in.
        For full fund search, use search_funds().
        """
        return MFAPIService.get_featured_funds()

    @staticmethod
    def get_fund_by_id(fund_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a single fund by its mfapi.in scheme code (numeric string, e.g. '119598').
        Returns None if not found or data unavailable.
        """
        return MFAPIService.get_fund_detail(str(fund_id).strip())

    @staticmethod
    def search_funds(query: str) -> List[Dict[str, Any]]:
        """
        Search 20,000+ Indian mutual fund schemes by name or AMC.
        Returns lightweight search results (schemeCode + schemeName).
        For full detail, call get_fund_by_id() with the schemeCode.
        """
        return MFAPIService.search_funds(query)

    @staticmethod
    def compare_funds(fund_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Fetch details for multiple funds by scheme codes for comparison view.
        """
        results = []
        for fid in fund_ids:
            detail = MFAPIService.get_fund_detail(str(fid).strip())
            if detail:
                results.append(detail)
        return results

    @staticmethod
    def screen_funds(
        category: str = "All",
        amc: str = "All",
        risk: str = "All",
        max_expense: float = 2.0,
        min_nav: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Screen funds from the featured list by category, AMC, risk level, and expense ratio.
        For full market screening, a paid data provider (e.g. MFCentral, Morningstar) is required.
        """
        all_funds = MFAPIService.get_featured_funds()
        results = []

        for fund in all_funds:
            if not fund:
                continue

            # Category filter
            if category != "All":
                fund_cat = (fund.get("category") or "").lower()
                if category.lower() not in fund_cat:
                    continue

            # AMC filter
            if amc != "All":
                fund_amc = (fund.get("amc") or "").lower()
                if amc.lower() not in fund_amc:
                    continue

            # Risk filter
            if risk != "All":
                fund_risk = (fund.get("risk_level") or "").lower()
                if fund_risk != risk.lower():
                    continue

            # Expense ratio filter (only if metadata available)
            expense = fund.get("expense_ratio_pct")
            if expense is not None and expense > max_expense:
                continue

            # NAV filter
            nav = fund.get("nav", 0.0)
            if nav < min_nav:
                continue

            results.append(fund)

        return results

    @staticmethod
    def get_fund_nav_history(fund_id: str, limit: int = 365) -> List[Dict[str, Any]]:
        """
        Fetch NAV history for a fund from mfapi.in.
        Returns list of {"date": "DD-MM-YYYY", "nav": float} sorted newest-first.
        """
        history = MFAPIService.get_nav_history(str(fund_id).strip(), limit=limit)
        # Convert to UI-friendly format (newest-first already, convert date to ISO)
        result = []
        for item in history:
            try:
                # mfapi.in returns DD-MM-YYYY, convert to YYYY-MM-DD for frontend
                parts = item["date"].split("-")
                if len(parts) == 3:
                    iso_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
                else:
                    iso_date = item["date"]
                result.append({"date": iso_date, "nav": item["nav"]})
            except (KeyError, ValueError):
                continue
        return result

    @staticmethod
    def get_rolling_returns(fund_id: str) -> Dict[str, Any]:
        """
        Compute rolling 1y/3y/5y returns from real NAV history.
        Rolling statistics are derived from point-to-point NAV snapshots.
        NOTE: True rolling return distribution (max/min/avg) requires 5+ years of history
        and multiple rolling window samples. This simplified version returns CAGR-equivalent.
        """
        history = MFAPIService.get_nav_history(str(fund_id).strip(), limit=1300)
        if not history:
            return {"data_available": False, "note": "NAV history unavailable from mfapi.in"}

        returns = MFAPIService.calculate_returns(history)

        return {
            "data_available": True,
            "source": "mfapi.in (live NAV history)",
            "note": "Returns are point-to-point CAGR. Rolling distribution stats require longer history.",
            "rolling_1y": {"cagr": returns.get("1y"), "data_available": returns.get("1y") is not None},
            "rolling_3y": {"cagr": returns.get("3y"), "data_available": returns.get("3y") is not None},
            "rolling_5y": {"cagr": returns.get("5y"), "data_available": returns.get("5y") is not None},
        }

    @staticmethod
    def get_rolling_sip_returns(fund_id: str) -> Dict[str, Any]:
        """
        Simulate SIP returns from real NAV history.
        Monthly investment of ₹5,000 simulated from available history.
        """
        history = MFAPIService.get_nav_history(str(fund_id).strip(), limit=1300)
        if not history:
            return {"data_available": False, "note": "NAV history unavailable from mfapi.in"}

        result = MFAPIService.calculate_sip_returns(history, monthly_amount=5000)
        result["source"] = "mfapi.in (live NAV history)"
        return result

    @staticmethod
    def get_rolling_lumpsum_returns(fund_id: str) -> Dict[str, Any]:
        """
        Calculate lumpsum returns for 1y/3y/5y horizons from real NAV history.
        """
        history = MFAPIService.get_nav_history(str(fund_id).strip(), limit=1300)
        if not history:
            return {"data_available": False, "note": "NAV history unavailable from mfapi.in"}

        result = MFAPIService.calculate_lumpsum_returns(history)
        result["source"] = "mfapi.in (live NAV history)"
        return result

    @staticmethod
    def get_fund_overlap_analysis(fund_id_a: str, fund_id_b: str) -> Dict[str, Any]:
        """
        Fund overlap analysis based on disclosed top holdings.
        mfapi.in does not provide holdings data — this requires Morningstar or AMFI filings.
        Returns appropriate unavailable state.
        """
        return {
            "data_available": False,
            "overlap_percentage": None,
            "mutual_holdings": [],
            "note": (
                "Fund holdings data requires AMFI portfolio disclosure scraping or a paid provider "
                "(e.g. Morningstar, MFCentral). This feature is currently unavailable on the free tier. "
                "Check https://www.amfiindia.com for monthly portfolio disclosures."
            ),
        }

    @staticmethod
    def get_ai_suitability_report(fund_id: str, risk_profile: str, horizon: int) -> Dict[str, Any]:
        """
        Generate a basic suitability assessment based on live fund metadata from mfapi.in.
        """
        fund = MFAPIService.get_fund_detail(str(fund_id).strip())
        if not fund:
            return {
                "data_available": False,
                "suitable": False,
                "analysis": "Fund data unavailable. Please verify the scheme code and try again."
            }

        risk_lower = risk_profile.lower()
        fund_risk = (fund.get("risk_level") or "Very High").lower()
        suitable = True
        reason = "Based on the fund's category and your investment parameters, this fund appears suitable."

        if "very high" in fund_risk and "conservative" in risk_lower:
            suitable = False
            reason = "⚠️ This is a Very High risk equity fund. It is not suitable for conservative investors."
        elif horizon < 3:
            suitable = False
            reason = "⚠️ Equity mutual funds require a minimum 3–5 year investment horizon for adequate risk management."
        elif "very high" in fund_risk and "moderate" in risk_lower and horizon < 5:
            suitable = True
            reason = "This high-risk equity fund can suit moderate investors with a 5+ year horizon. Consider SIP mode to average entry costs."

        return {
            "data_available": True,
            "fund_id": fund_id,
            "fund_name": fund.get("name"),
            "amc": fund.get("amc"),
            "category": fund.get("category"),
            "risk_level": fund.get("risk_level"),
            "suitable": suitable,
            "reasoning": reason,
            "source": "mfapi.in (live) + analytical assessment",
        }
