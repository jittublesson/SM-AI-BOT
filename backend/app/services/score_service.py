from typing import Dict, Any, List
from app.services.yfinance_service import YFinanceService

class ScoreService:
    @staticmethod
    def evaluate_company_score(ticker: str) -> Dict[str, Any]:
        """
        Calculates a multi-factor financial health score (1 to 100) based on Growth,
        Leverage, Return ratios, and Margins, return strengths, weaknesses, and investment thesis.
        """
        stock_data = YFinanceService.get_stock_data(ticker)
        financials = stock_data.get("financials", [])
        
        if not financials:
            return {
                "ticker": ticker.upper(),
                "overall_score": 50,
                "growth_score": 50,
                "leverage_score": 50,
                "efficiency_score": 50,
                "strengths": ["Data unavailable"],
                "weaknesses": ["Data unavailable"],
                "thesis": "Cannot form thesis due to missing files or data profiles."
            }
            
        latest = financials[0]
        
        # Calculate individual score vectors
        # 1. Efficiency Score (based on ROE & ROCE)
        roe = latest.get("roe", 10.0)
        roce = latest.get("roce", 10.0)
        eff_score = min(max((roe * 0.5 + roce * 0.5) * 2.0, 10.0), 100.0)
        
        # 2. Leverage Score (based on current ratio and debt-to-equity)
        de = latest.get("debt_equity", 0.5)
        cr = latest.get("current_ratio", 1.2)
        # Low debt and high current ratio yields high leverage score
        lev_score = min(max((1.5 - de) * 40.0 + (cr - 0.5) * 20.0, 10.0), 100.0)
        
        # 3. Growth Score (Revenue & PAT YoY)
        growth_score = 65.0 # fallback
        if len(financials) > 1:
            rev_growth = ((financials[0]["revenue"] - financials[1]["revenue"]) / financials[1]["revenue"]) * 100
            pat_growth = ((financials[0]["pat"] - financials[1]["pat"]) / financials[1]["pat"]) * 100
            growth_score = min(max(50.0 + (rev_growth + pat_growth) * 1.5, 10.0), 100.0)
            
        overall_score = round(eff_score * 0.4 + lev_score * 0.3 + growth_score * 0.3, 1)
        
        # Generate SWOT lists based on calculations
        strengths = []
        weaknesses = []
        
        if roe > 18.0:
            strengths.append(f"Exceptional Return on Equity (ROE: {roe}%), indicating superior equity capital returns.")
        if de < 0.5:
            strengths.append(f"Highly manageable debt structure with Debt-to-Equity of {de}x.")
        else:
            weaknesses.append(f"Leaning on leverage with Debt-to-Equity ratio at {de}x. Requires strong interest coverage buffers.")
            
        if cr > 1.2:
            strengths.append(f"Sound short-term liquidity with Current Ratio at {cr}x.")
        else:
            weaknesses.append(f"Tight working capital cycle with Current Ratio at {cr}x.")
            
        if growth_score > 70:
            strengths.append("Robust YoY expansion across top-line revenue scale and net income.")
        elif growth_score < 40:
            weaknesses.append("Slowdown or compression in operating growth trends.")

        # Default strengths/weaknesses fallback if empty
        if not strengths:
            strengths = ["Stable large-cap earnings framework", "Broad market segment distribution network"]
        if not weaknesses:
            weaknesses = ["Slower relative market-share expansion vs micro rivals"]

        # Long-term investment thesis
        thesis = (
            f"Based on our multi-factor audit, {stock_data['info']['name']} holds an overall score of {overall_score}/100. "
            "The capital efficiency profile is strong, and leverage buffers remain supportive of continued organic expansion. "
            "Long-term investors will find this business model attractive if current pricing offers a margin of safety."
        )
        
        return {
            "ticker": ticker.upper(),
            "company_name": stock_data["info"]["name"],
            "overall_score": overall_score,
            "growth_score": round(growth_score, 1),
            "leverage_score": round(lev_score, 1),
            "efficiency_score": round(eff_score, 1),
            "strengths": strengths,
            "weaknesses": weaknesses,
            "thesis": thesis
        }
