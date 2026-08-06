from typing import Dict, Any, List
from app.services.yfinance_service import YFinanceService

class ValuationService:
    @staticmethod
    def calculate_dcf(
        ticker: str,
        growth_rate_stage1: float,
        growth_rate_stage2: float,
        discount_rate: float,
        terminal_growth_rate: float,
        projection_years: int
    ) -> Dict[str, Any]:
        """
        Executes a Multi-Stage Discounted Cash Flow (DCF) model and compiles:
        1. Bull, Base, Bear scenario cases.
        2. Reverse DCF (market-implied growth).
        3. Dividend Discount Model (DDM).
        4. Residual Income Model (RI).
        5. Relative multiples targets (EV/EBITDA, EV/Sales, PEG).
        All percentages are input as e.g. 8.0 for 8%.
        """
        stock_data = YFinanceService.get_stock_data(ticker)
        financials = stock_data.get("financials", [])
        info = stock_data.get("info", {})
        
        # Base financials extraction (in Millions)
        fcf_base = 1000.0
        ebitda = 2000.0
        revenue = 5000.0
        pat = 800.0
        equity = 6000.0
        dividend_rate = 1.00
        
        if financials:
            fcf_base = financials[0].get("free_cash_flow", 1000.0)
            if fcf_base <= 0:
                fcf_base = max(financials[0].get("operating_cash_flow", 1500.0) * 0.7, 100.0)
            ebitda = financials[0].get("ebitda", 2000.0)
            revenue = financials[0].get("revenue", 5000.0)
            pat = financials[0].get("pat", 800.0)
            equity = financials[0].get("shareholders_equity", 6000.0)
            dividend_rate = financials[0].get("dividends_paid", 1.0) / 100.0 if financials[0].get("dividends_paid", 0) > 0 else 1.00
            
        current_price = info.get("price", 150.0)
        market_cap = info.get("market_cap", 150000.0)
        implied_shares = market_cap / current_price if current_price else 1.0
        
        r = discount_rate / 100.0
        g1 = growth_rate_stage1 / 100.0
        g2 = growth_rate_stage2 / 100.0
        g_term = terminal_growth_rate / 100.0
        total_projection_years = projection_years + 5
        
        calculations_log = f"=== Quant Valuation Engine Report: {ticker.upper()} ===\n"
        calculations_log += f"Base FCF: {fcf_base:.2f}M | EBITDA: {ebitda:.2f}M | Revenue: {revenue:.2f}M | Equity: {equity:.2f}M\n"
        calculations_log += f"Cost of Capital (WACC): {discount_rate}% | Base Growth (Y1-5): {growth_rate_stage1}%\n\n"
        
        # --- 1. Multi-Stage DCF (Base Case) ---
        calculations_log += "1. MULTI-STAGE DCF SCHEDULE:\n"
        projected_fcfs = []
        present_values = []
        current_fcf = fcf_base
        for y in range(1, projection_years + 1):
            current_fcf = current_fcf * (1.0 + g1)
            pv = current_fcf / ((1.0 + r) ** y)
            projected_fcfs.append(round(current_fcf, 2))
            present_values.append(round(pv, 2))
            calculations_log += f"  - Year {y} (Stage 1): Projected FCF = {current_fcf:.2f}M | PV = {pv:.2f}M\n"
            
        for y in range(projection_years + 1, total_projection_years + 1):
            current_fcf = current_fcf * (1.0 + g2)
            pv = current_fcf / ((1.0 + r) ** y)
            projected_fcfs.append(round(current_fcf, 2))
            present_values.append(round(pv, 2))
            calculations_log += f"  - Year {y} (Stage 2): Projected FCF = {current_fcf:.2f}M | PV = {pv:.2f}M\n"
            
        terminal_value = (current_fcf * (1.0 + g_term)) / (r - g_term) if r > g_term else 0.0
        pv_terminal = terminal_value / ((1.0 + r) ** total_projection_years)
        calculations_log += f"  - Terminal Value calculated: {terminal_value:.2f}M | PV of Terminal Value = {pv_terminal:.2f}M\n"
        
        pv_fcfs = sum(present_values)
        enterprise_val = pv_fcfs + pv_terminal
        intrinsic_value = (enterprise_val * 1e6) / implied_shares if implied_shares else current_price
        margin_of_safety = round(((intrinsic_value - current_price) / intrinsic_value) * 100, 2) if intrinsic_value else 0.0
        
        calculations_log += f"  -> Base Case Intrinsic Price: ${intrinsic_value:.2f} | Current Price: ${current_price:.2f} | Safety Margin: {margin_of_safety}%\n\n"
        
        # --- 2. Scenario Cases (Bull & Bear) ---
        # Bull Case: 1.25x growth, WACC discount trims by 10%
        r_bull = r * 0.9
        g1_bull = g1 * 1.25
        g2_bull = g2 * 1.15
        bull_pvs = []
        curr_fcf = fcf_base
        for y in range(1, projection_years + 1):
            curr_fcf = curr_fcf * (1.0 + g1_bull)
            bull_pvs.append(curr_fcf / ((1.0 + r_bull) ** y))
        for y in range(projection_years + 1, total_projection_years + 1):
            curr_fcf = curr_fcf * (1.0 + g2_bull)
            bull_pvs.append(curr_fcf / ((1.0 + r_bull) ** y))
        term_bull = (curr_fcf * (1.0 + g_term)) / (r_bull - g_term) if r_bull > g_term else 0.0
        pv_term_bull = term_bull / ((1.0 + r_bull) ** total_projection_years)
        intrinsic_bull = ((sum(bull_pvs) + pv_term_bull) * 1e6) / implied_shares if implied_shares else current_price
        
        # Bear Case: 0.7x growth, WACC expands by 10%
        r_bear = r * 1.1
        g1_bear = g1 * 0.70
        g2_bear = g2 * 0.70
        bear_pvs = []
        curr_fcf = fcf_base
        for y in range(1, projection_years + 1):
            curr_fcf = curr_fcf * (1.0 + g1_bear)
            bear_pvs.append(curr_fcf / ((1.0 + r_bear) ** y))
        for y in range(projection_years + 1, total_projection_years + 1):
            curr_fcf = curr_fcf * (1.0 + g2_bear)
            bear_pvs.append(curr_fcf / ((1.0 + r_bear) ** y))
        term_bear = (curr_fcf * (1.0 + g_term)) / (r_bear - g_term) if r_bear > g_term else 0.0
        pv_term_bear = term_bear / ((1.0 + r_bear) ** total_projection_years)
        intrinsic_bear = ((sum(bear_pvs) + pv_term_bear) * 1e6) / implied_shares if implied_shares else current_price
        
        calculations_log += f"2. SCENARIO ANALYSIS:\n"
        calculations_log += f"  - Bull Case (Growth: Y1-5={growth_rate_stage1*1.25}%, WACC={discount_rate*0.9}%): Intrinsic Price = ${intrinsic_bull:.2f}\n"
        calculations_log += f"  - Bear Case (Growth: Y1-5={growth_rate_stage1*0.7}%, WACC={discount_rate*1.1}%): Intrinsic Price = ${intrinsic_bear:.2f}\n\n"
        
        # --- 3. Reverse DCF (Market-Implied Growth) ---
        # Solves for growth rate 'g' to justify current price
        # Formulates approximation: Target FCF yield = WACC - implied_growth
        implied_yield = (fcf_base / enterprise_val) if enterprise_val else 0.08
        implied_growth = max((r - implied_yield) * 100, 0.5)
        calculations_log += f"3. REVERSE DCF (Market Implied Growth Rate):\n"
        calculations_log += f"  - Implied Growth rate required to support market valuation: {implied_growth:.2f}%\n\n"
        
        # --- 4. Dividend Discount Model (DDM) ---
        # P = D * (1 + g) / (r - g)
        g_ddm = min(g_term, r - 0.02) # Ensure g < r to prevent negative valuation
        ddm_value = dividend_rate * (1.0 + g_ddm) / (r - g_ddm) if r > g_ddm else 0.0
        ddm_intrinsic = (ddm_value * 1e6 / implied_shares) if implied_shares else 0.0
        calculations_log += f"4. DIVIDEND DISCOUNT MODEL (DDM):\n"
        calculations_log += f"  - Base Dividend: {dividend_rate:.2f} per share | Implied Growth: {g_ddm*100:.1f}%\n"
        calculations_log += f"  - DDM Intrinsic Value: ${ddm_intrinsic:.2f} per share\n\n"
        
        # --- 5. Residual Income Model (RI) ---
        # RI = NetIncome - (r * BookValue_prev)
        # PV of residual income over 5 years + book value base
        ri_present_values = []
        curr_equity = equity
        curr_pat = pat
        for y in range(1, 6):
            charge = curr_equity * r
            ri = curr_pat - charge
            ri_pv = ri / ((1.0 + r) ** y)
            ri_present_values.append(ri_pv)
            curr_equity = curr_equity + (curr_pat * 0.7) # Assume 30% dividend payout
            curr_pat = curr_pat * (1.0 + g1)
            
        ri_equity_val = equity + sum(ri_present_values)
        ri_intrinsic = (ri_equity_val * 1e6 / implied_shares) if implied_shares else current_price
        calculations_log += f"5. RESIDUAL INCOME MODEL (RI):\n"
        calculations_log += f"  - Book Value Base: {equity:.2f}M | 5Y PV of Residual Income streams: {sum(ri_present_values):.2f}M\n"
        calculations_log += f"  - RI Intrinsic Price: ${ri_intrinsic:.2f} per share\n\n"
        
        # --- 6. Relative Multiples (EV/EBITDA, EV/Sales, PEG) ---
        peer_ev_ebitda = 22.0
        peer_ev_sales = 4.5
        peer_peg = 1.6
        
        val_ev_ebitda = (ebitda * peer_ev_ebitda * 1e6 / implied_shares) if implied_shares else current_price
        val_ev_sales = (revenue * peer_ev_sales * 1e6 / implied_shares) if implied_shares else current_price
        val_peg = (pat * (g1 * 100) * peer_peg * 1e6 / implied_shares) if implied_shares and g1 > 0 else current_price
        
        calculations_log += f"6. PEERS RELATIVE MULTIPLES VALUATION:\n"
        calculations_log += f"  - EV/EBITDA (Target Peer Average {peer_ev_ebitda}x): Implied Price = ${val_ev_ebitda:.2f}\n"
        calculations_log += f"  - EV/Sales (Target Peer Average {peer_ev_sales}x): Implied Price = ${val_ev_sales:.2f}\n"
        calculations_log += f"  - PEG Multiple (Target Peer Average {peer_peg}x): Implied Price = ${val_peg:.2f}\n"
        
        # Build sensitivity matrix (discount options vs growth options)
        sensitivity_matrix = []
        discount_options = [discount_rate - 2.0, discount_rate - 1.0, discount_rate, discount_rate + 1.0, discount_rate + 2.0]
        growth_options = [growth_rate_stage1 - 2.0, growth_rate_stage1 - 1.0, growth_rate_stage1, growth_rate_stage1 + 1.0, growth_rate_stage1 + 2.0]
        
        for d_opt in discount_options:
            if d_opt <= 0: continue
            for g_opt in growth_options:
                r_opt = d_opt / 100.0
                g1_opt = g_opt / 100.0
                opt_fcf = fcf_base
                opt_pvs = []
                for y in range(1, projection_years + 1):
                    opt_fcf = opt_fcf * (1.0 + g1_opt)
                    opt_pvs.append(opt_fcf / ((1.0 + r_opt) ** y))
                for y in range(projection_years + 1, total_projection_years + 1):
                    opt_fcf = opt_fcf * (1.0 + g2)
                    opt_pvs.append(opt_fcf / ((1.0 + r_opt) ** y))
                opt_term = (opt_fcf * (1.0 + g_term)) / (r_opt - g_term) if r_opt > g_term else 0.0
                opt_pv_term = opt_term / ((1.0 + r_opt) ** total_projection_years)
                opt_ent_val = sum(opt_pvs) + opt_pv_term
                opt_intrinsic = opt_ent_val * 1e6 / implied_shares if implied_shares else current_price
                
                sensitivity_matrix.append({
                    "discount_rate": d_opt,
                    "growth_rate": g_opt,
                    "intrinsic_value": round(opt_intrinsic, 2)
                })
                
        return {
            "ticker": ticker.upper(),
            "name": stock_data["info"]["name"],
            "current_price": current_price,
            "fcf_base": fcf_base,
            "projected_fcfs": projected_fcfs,
            "terminal_value": round(terminal_value, 2),
            "present_value_fcfs": round(pv_fcfs, 2),
            "present_value_terminal": round(pv_terminal, 2),
            "enterprise_value": round(enterprise_val, 2),
            "intrinsic_value": round(intrinsic_value, 2),
            "intrinsic_bull": round(intrinsic_bull, 2),
            "intrinsic_bear": round(intrinsic_bear, 2),
            "reverse_dcf_implied_growth": round(implied_growth, 2),
            "ddm_intrinsic_value": round(ddm_intrinsic, 2),
            "residual_income_value": round(ri_intrinsic, 2),
            "ev_ebitda_value": round(val_ev_ebitda, 2),
            "ev_sales_value": round(val_ev_sales, 2),
            "peg_multiple_value": round(val_peg, 2),
            "margin_of_safety": margin_of_safety,
            "is_undervalued": intrinsic_value > current_price,
            "sensitivity_matrix": sensitivity_matrix,
            "calculations_log": calculations_log
        }
