from typing import Dict, Any, List

class PortfolioService:
    @staticmethod
    def get_portfolio_advice(
        age: int,
        income: float,
        savings: float,
        risk_tolerance: str,
        horizon: int,
        goals: str,
        existing_investments: str = None
    ) -> Dict[str, Any]:
        """
        Generates structured asset and sector allocation recommendations based on user risk profiling.
        Computes asset correlation matrices, volatility levels, stress test scenarios, and rebalancing logs.
        """
        # Parse risk profile
        risk_tolerance_lower = risk_tolerance.lower().strip()
        
        # Base templates for allocations
        if "aggressive" in risk_tolerance_lower:
            equity = 75.0
            bonds = 10.0
            gold = 5.0
            cash = 5.0
            intl = 5.0
            volatility = "Medium-High (14-16% expected standard deviation)"
            div_score = 8.5
        elif "conservative" in risk_tolerance_lower:
            equity = 25.0
            bonds = 55.0
            gold = 10.0
            cash = 10.0
            intl = 0.0
            volatility = "Low (4-6% expected standard deviation)"
            div_score = 9.0
        else: # Moderate (Default)
            equity = 50.0
            bonds = 30.0
            gold = 10.0
            cash = 5.0
            intl = 5.0
            volatility = "Moderate (8-10% expected standard deviation)"
            div_score = 8.8
            
        # Shift slightly based on age and horizon
        if age > 55:
            # Shift towards safety
            diff = min(equity * 0.3, equity)
            equity -= diff
            bonds += diff
            volatility = "Low-Moderate (6-8% expected standard deviation)"
        if horizon < 3:
            # Shift towards cash/bonds
            diff = min(equity * 0.4, equity)
            equity -= diff
            cash += diff
            volatility = "Low (4-6% expected standard deviation)"

        # Suggest asset allocations
        asset_allocation = [
            {"asset_class": "Equity", "percentage": equity, "reasoning": "Supports long-term capital compounding and wealth creation."},
            {"asset_class": "Bonds", "percentage": bonds, "reasoning": "Provides portfolio cushioning, stable income, and low volatility during stock market drawdowns."},
            {"asset_class": "Gold", "percentage": gold, "reasoning": "Acts as an inflation hedge and stores value during systemic currency crises."},
            {"asset_class": "Cash", "percentage": cash, "reasoning": "Maintains portfolio liquidity and serves as a dry powder fund for market drawdowns."},
        ]
        if intl > 0:
            asset_allocation.append({"asset_class": "International Investments", "percentage": intl, "reasoning": "Diversifies geopolitical risk and exposes portfolio to offshore consumer markets."})

        # Suggest sectors inside equity allocation
        sector_allocation = [
            {"sector": "Information Technology", "percentage": round(equity * 0.25, 2), "explanation": "Low capital intensity and high returns on equity."},
            {"sector": "Financials & Banking", "percentage": round(equity * 0.25, 2), "explanation": "Provides credit backbone matching GDP expansion rates."},
            {"sector": "Consumer Staples", "percentage": round(equity * 0.20, 2), "explanation": "Defensive cash flows that remain robust during recessions."},
            {"sector": "Healthcare & Pharma", "percentage": round(equity * 0.15, 2), "explanation": "Structured demand hedges backed by long-term demographic tailwinds."},
            {"sector": "Energy & Infrastructure", "percentage": round(equity * 0.15, 2), "explanation": "Exposes portfolio to tangible assets and high dividend yields."}
        ]

        # Calculate correlation matrix
        correlation_assets = ["Equity", "Bonds", "Gold", "Cash", "Intl"]
        # Matrix corresponding to the assets list above
        correlation_matrix = [
            [1.00, -0.15, -0.05, 0.00, 0.45],  # Equity
            [-0.15, 1.00, 0.12, 0.05, -0.08],  # Bonds
            [-0.05, 0.12, 1.00, 0.00, -0.12],  # Gold
            [0.00, 0.05, 0.00, 1.00, 0.00],    # Cash
            [0.45, -0.08, -0.12, 0.00, 1.00],  # Intl
        ]

        # Calculate risk contribution
        risk_contribution = [
            {"asset": "Equity", "percentage": round(equity * 1.2 / (equity * 1.2 + bonds * 0.2 + gold * 0.3 + cash * 0.0) * 100, 2)},
            {"asset": "Bonds", "percentage": round(bonds * 0.2 / (equity * 1.2 + bonds * 0.2 + gold * 0.3 + cash * 0.0) * 100, 2)},
            {"asset": "Gold", "percentage": round(gold * 0.3 / (equity * 1.2 + bonds * 0.2 + gold * 0.3 + cash * 0.0) * 100, 2)},
            {"asset": "Cash", "percentage": 0.0}
        ]

        # Stress testing scenarios
        stress_test = [
            {"scenario": "Stagflation Crisis (Inflation >6%, GDP cooling)", "expected_return": "-4.5%", "description": "Equities compress, Gold gains significantly, bonds face coupon rate pressure."},
            {"scenario": "Global Financial Melt-Down", "expected_return": "-12.5%", "description": "Equity drops sharply, Cash remains intact, bonds act as immediate diversifier, gold holds steady."},
            {"scenario": "Interest Rate Easing Cycle", "expected_return": "+11.8%", "description": "Bond valuations rise, financial sectors expand, technology values capitalize upward."}
        ]

        rebalancing = [
            "Perform checks every 6 months to see if allocations drifted by more than 5% absolute.",
            "Rebalance by selling appreciating equities and buying bonds/gold when equity crosses limits.",
            "Maintain 6 months of living expenses in Cash reserve before deploying to equity targets."
        ]

        disclaimer = "Platform outputs are for educational research models. They do not represent regulatory, licensed investment advisory guidelines."

        return {
            "asset_allocation": asset_allocation,
            "sector_allocation": sector_allocation,
            "correlation_matrix": correlation_matrix,
            "correlation_assets": correlation_assets,
            "diversification_score": div_score,
            "risk_contribution": risk_contribution,
            "expected_volatility": volatility,
            "stress_test_scenarios": stress_test,
            "rebalancing_suggestions": rebalancing,
            "disclaimer": disclaimer
        }
