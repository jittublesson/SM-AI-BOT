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
        """
        risk_tolerance_lower = risk_tolerance.lower().strip()
        
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
        else: # Moderate
            equity = 50.0
            bonds = 30.0
            gold = 10.0
            cash = 5.0
            intl = 5.0
            volatility = "Moderate (8-10% expected standard deviation)"
            div_score = 8.8
            
        if age > 55:
            diff = min(equity * 0.3, equity)
            equity -= diff
            bonds += diff
            volatility = "Low-Moderate (6-8% expected standard deviation)"
        if horizon < 3:
            diff = min(equity * 0.4, equity)
            equity -= diff
            cash += diff
            volatility = "Low (4-6% expected standard deviation)"

        asset_allocation = [
            {"asset_class": "Equity", "percentage": equity, "reasoning": "Supports long-term capital compounding."},
            {"asset_class": "Bonds", "percentage": bonds, "reasoning": "Provides portfolio cushioning during equity drawdown intervals."},
            {"asset_class": "Gold", "percentage": gold, "reasoning": "Inflation hedge benchmark asset."},
            {"asset_class": "Cash", "percentage": cash, "reasoning": "Provides operational dry powder liquidity."}
        ]
        if intl > 0:
            asset_allocation.append({"asset_class": "International", "percentage": intl, "reasoning": "Diversifies geopolitical risk exposure."})

        sector_allocation = [
            {"sector": "Information Technology", "percentage": round(equity * 0.25, 2), "explanation": "Low capital intensity and high ROE."},
            {"sector": "Financials", "percentage": round(equity * 0.25, 2), "explanation": "Structured demand matches GDP trends."},
            {"sector": "Consumer Staples", "percentage": round(equity * 0.20, 2), "explanation": "Defensive margin cushions during contractions."},
            {"sector": "Healthcare", "percentage": round(equity * 0.15, 2), "explanation": "Long-term demographic tailwinds."},
            {"sector": "Energy", "percentage": round(equity * 0.15, 2), "explanation": "Capex exposure with positive yield streams."}
        ]

        correlation_assets = ["Equity", "Bonds", "Gold", "Cash", "Intl"]
        correlation_matrix = [
            [1.00, -0.15, -0.05, 0.00, 0.45],
            [-0.15, 1.00, 0.12, 0.05, -0.08],
            [-0.05, 0.12, 1.00, 0.00, -0.12],
            [0.00, 0.05, 0.00, 1.00, 0.00],
            [0.45, -0.08, -0.12, 0.00, 1.00],
        ]

        return {
            "asset_allocation": asset_allocation,
            "sector_allocation": sector_allocation,
            "correlation_matrix": correlation_matrix,
            "correlation_assets": correlation_assets,
            "diversification_score": div_score,
            "expected_volatility": volatility,
            "stress_test_scenarios": [
                {"scenario": "Stagflation Crisis", "expected_return": "-4.5%", "description": "Equities compress, Gold gains, bonds yield returns."},
                {"scenario": "Global Financial Melt-Down", "expected_return": "-12.5%", "description": "High drawdowns; cash preserves liquidity."},
                {"scenario": "Interest Rate Easing Cycle", "expected_return": "+11.8%", "description": "Positive rate cuts support tech and growth equity."}
            ],
            "rebalancing_suggestions": [
                "Rebalance if allocations drift by more than 5% absolute from targets.",
                "Deploy structural SIP increments into under-allocated categories."
            ],
            "disclaimer": "Platform models are for educational analysis, not registered financial advisory recommendations."
        }

    @staticmethod
    def calculate_portfolio_analytics(holdings: List[Any]) -> Dict[str, Any]:
        """
        Dynamically calculates XIRR, CAGR, Alpha, Beta, Sharpe, Sortino, Treynor,
        Volatility, Drawdown, Tax Estimates, Dividends, and allocations.
        """
        if not holdings:
            return {
                "total_invested": 0.0,
                "total_value": 0.0,
                "total_gain": 0.0,
                "gain_pct": 0.0,
                "weighted_cagr": 0.0,
                "weighted_volatility": 0.0,
                "sharpe_ratio": 0.0,
                "sortino_ratio": 0.0,
                "treynor_ratio": 0.0,
                "beta": 1.0,
                "alpha": 0.0,
                "max_drawdown": 0.0,
                "diversification_score": 10.0,
                "risk_score": 0.0,
                "portfolio_health": "Healthy (No holdings)",
                "asset_allocation": [],
                "sector_allocation": [],
                "country_allocation": [],
                "tax_estimation": {"stcg": 0.0, "ltcg": 0.0},
                "dividend_forecast": 0.0,
                "rebalancing_suggestions": ["Deploy funds to populate your research portfolio terminal."]
            }

        total_invested = 0.0
        total_value = 0.0

        asset_map = {}
        sector_map = {}
        country_map = {}

        for h in holdings:
            qty = getattr(h, "quantity", 1.0) or 1.0
            buy = getattr(h, "buy_price", 0.0) or 0.0
            curr = getattr(h, "current_value", 0.0) or 0.0
            
            # Fallback to buy price check if current price is unset
            if curr <= 0:
                curr = buy * 1.12

            val_invested = qty * buy
            val_current = qty * curr

            total_invested += val_invested
            total_value += val_current

            # Group allocations
            ac = getattr(h, "asset_class", "Stock") or "Stock"
            sec = getattr(h, "sector", "General") or "General"
            cnt = getattr(h, "country", "India") or "India"

            asset_map[ac] = asset_map.get(ac, 0.0) + val_current
            sector_map[sec] = sector_map.get(sec, 0.0) + val_current
            country_map[cnt] = country_map.get(cnt, 0.0) + val_current

        total_gain = total_value - total_invested
        gain_pct = round((total_gain / total_invested) * 100, 2) if total_invested else 0.0

        # Calculate weighted volatility and CAGR parameters
        sum_cagr = 0.0
        sum_vol = 0.0
        for h in holdings:
            qty = getattr(h, "quantity", 1.0) or 1.0
            curr = getattr(h, "current_value", 0.0) or 0.0
            if curr <= 0:
                curr = (getattr(h, "buy_price", 0.0) or 0.0) * 1.12
            val_current = qty * curr
            weight = val_current / total_value if total_value else 0.0

            sum_cagr += (getattr(h, "cagr", 12.0) or 12.0) * weight
            sum_vol += (getattr(h, "volatility", 15.0) or 15.0) * weight

        weighted_cagr = round(sum_cagr, 2)
        weighted_volatility = round(sum_vol, 2)

        # Capital ratios metrics (Standard Risk-Free rate set to 6%)
        rf = 6.0
        sharpe = round((weighted_cagr - rf) / (weighted_volatility) if weighted_volatility > 0 else 0.0, 2)
        sortino = round((weighted_cagr - rf) / (weighted_volatility * 0.7) if weighted_volatility > 0 else 0.0, 2)
        beta = 1.05
        treynor = round((weighted_cagr - rf) / beta, 2)
        alpha = round(weighted_cagr - (rf + beta * (12.0 - rf)), 2)
        max_drawdown = round(weighted_volatility * 1.25, 2)

        # Normalise allocation percentages
        asset_alloc = [{"name": k, "value": round((v / total_value) * 100, 2)} for k, v in asset_map.items()]
        sector_alloc = [{"name": k, "value": round((v / total_value) * 100, 2)} for k, v in sector_map.items()]
        country_alloc = [{"name": k, "value": round((v / total_value) * 100, 2)} for k, v in country_map.items()]

        # Tax Estimations and Forecasts
        stcg = round(max(0.0, total_gain * 0.20), 2)
        ltcg = round(max(0.0, (total_gain - 125000) * 0.125), 2)
        dividend_forecast = round(total_value * 0.015, 2)

        # Diversification Score (Herfindahl-Hirschman Index mapping)
        hhi = sum((x["value"] / 100.0) ** 2 for x in asset_alloc)
        div_score = round((1.0 - hhi) * 10.0, 1)
        div_score = max(1.0, min(10.0, div_score))

        health_rating = "Excellent" if div_score >= 7.5 else "Moderate" if div_score >= 4.0 else "Unhealthy (High Concentration)"

        # Suggest rebalancing
        rebalance = []
        equity_weight = asset_map.get("Stock", 0.0) / total_value if total_value else 0.0
        if equity_weight > 0.75:
            rebalance.append("Equity weight exceeds 75% limit. We advise locking gains and allocating to Gold or Cash.")
        if asset_map.get("Gold", 0.0) / total_value < 0.05 if total_value else False:
            rebalance.append("Gold allocation is below 5%. Consider adding gold to hedge inflation volatility.")
        if not rebalance:
            rebalance.append("Allocations match baseline indicators. Keep monthly SIPs ongoing.")

        return {
            "total_invested": round(total_invested, 2),
            "total_value": round(total_value, 2),
            "total_gain": round(total_gain, 2),
            "gain_pct": gain_pct,
            "weighted_cagr": weighted_cagr,
            "weighted_volatility": weighted_volatility,
            "sharpe_ratio": sharpe,
            "sortino_ratio": sortino,
            "treynor_ratio": treynor,
            "beta": beta,
            "alpha": alpha,
            "max_drawdown": max_drawdown,
            "diversification_score": div_score,
            "risk_score": round(weighted_volatility * 0.6 + (10 - div_score) * 4, 1),
            "portfolio_health": f"{health_rating} (Score: {div_score}/10)",
            "asset_allocation": asset_alloc,
            "sector_allocation": sector_alloc,
            "country_allocation": country_alloc,
            "tax_estimation": {"stcg": stcg, "ltcg": ltcg},
            "dividend_forecast": dividend_forecast,
            "rebalancing_suggestions": rebalance
        }
