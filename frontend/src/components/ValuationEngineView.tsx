import React, { useState, useEffect, useRef, useCallback } from "react";
import { Landmark, ShieldAlert, Award, Grid, Compass, ArrowRight, TrendingUp, RefreshCw } from "lucide-react";
import { formatPrice } from "../utils/currency";

interface ValuationEngineViewProps {
  ticker: string;
  targetCurrency?: string;
}

export const ValuationEngineView: React.FC<ValuationEngineViewProps> = ({ ticker, targetCurrency = "INR" }) => {
  const sourceCurrency = ticker.toUpperCase().endsWith(".NS") ? "INR" : "USD";
  const [params, setParams] = useState({
    growth_rate_stage1: 8.0,
    growth_rate_stage2: 5.0,
    discount_rate: 10.0,
    terminal_growth_rate: 2.5,
    projection_years: 5
  });

  const [dcf, setDcf] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculateValuation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/valuation/calculate?ticker=${ticker}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      const json = await res.json();
      setDcf(json);
    } catch (err) {
      console.error("Valuation calculation failed:", err);
    } finally {
      setLoading(false);
    }
  }, [ticker, params]);

  // Debounce: wait 600ms after last slider change before firing API
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      calculateValuation();
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [ticker, params]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-hidden">
      {/* Parameter Sliders Sidebar */}
      <div className="md:col-span-1 glass-card p-4 rounded-lg flex flex-col h-full overflow-y-auto pr-1">
        <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
          <Landmark className="text-brand-primary w-5 h-5" />
          Valuation Assumptions
        </h2>
        
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-brand-muted">
              <span>Stage 1 Growth (Years 1-5)</span>
              <span className="font-mono text-brand-primary">{params.growth_rate_stage1}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={params.growth_rate_stage1}
              onChange={(e) => setParams(prev => ({ ...prev, growth_rate_stage1: parseFloat(e.target.value) }))}
              className="w-full accent-brand-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-brand-muted">
              <span>Stage 2 Growth (Years 6-10)</span>
              <span className="font-mono text-brand-primary">{params.growth_rate_stage2}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={params.growth_rate_stage2}
              onChange={(e) => setParams(prev => ({ ...prev, growth_rate_stage2: parseFloat(e.target.value) }))}
              className="w-full accent-brand-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-brand-muted">
              <span>Discount Rate (WACC)</span>
              <span className="font-mono text-brand-primary">{params.discount_rate}%</span>
            </div>
            <input
              type="range"
              min="4"
              max="20"
              step="0.5"
              value={params.discount_rate}
              onChange={(e) => setParams(prev => ({ ...prev, discount_rate: parseFloat(e.target.value) }))}
              className="w-full accent-brand-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-brand-muted">
              <span>Terminal Growth Rate</span>
              <span className="font-mono text-brand-primary">{params.terminal_growth_rate}%</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={params.terminal_growth_rate}
              onChange={(e) => setParams(prev => ({ ...prev, terminal_growth_rate: parseFloat(e.target.value) }))}
              className="w-full accent-brand-primary cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-light-border dark:border-dark-border">
            <button
              onClick={calculateValuation}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs uppercase rounded transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Calculating..." : "Recalculate"}
            </button>
            <p className="text-[9px] text-brand-muted text-center mt-1.5 font-mono">Auto-recalculates 600ms after slider change</p>
          </div>
        </div>
      </div>

      {/* Main Intrinsic outputs & sensitivity matrix */}
      <div className="md:col-span-3 glass-card p-6 rounded-lg overflow-y-auto h-full flex flex-col space-y-6">
        {loading ? (
          <div className="h-full flex items-center justify-center text-brand-muted text-xs">
            Running multi-model pricing streams...
          </div>
        ) : dcf ? (
          <>
            {/* Header Intrinsic Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-light-border dark:border-dark-border pb-4">
              <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg">
                <span className="text-[10px] text-brand-muted uppercase font-mono block">Current Stock Price</span>
                <span className="text-md font-mono font-bold mt-1 block">{formatPrice(dcf.current_price, sourceCurrency, targetCurrency, true)}</span>
              </div>
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
                <span className="text-[10px] text-brand-muted uppercase font-mono block">Intrinsic Value (Fair Value)</span>
                <span className="text-md font-mono font-bold text-brand-primary mt-1 block">{formatPrice(dcf.intrinsic_value, sourceCurrency, targetCurrency, true)}</span>
              </div>
              <div className={`p-4 rounded-lg border ${
                dcf.is_undervalued ? "bg-brand-secondary/5 border-brand-secondary/10" : "bg-brand-danger/5 border-brand-danger/10"
              }`}>
                <span className="text-[10px] text-brand-muted uppercase font-mono block">Margin of Safety</span>
                <span className={`text-md font-mono font-bold mt-1 block ${
                  dcf.is_undervalued ? "text-brand-secondary" : "text-brand-danger"
                }`}>
                  {dcf.margin_of_safety}% {dcf.is_undervalued ? "(Undervalued)" : "(Overvalued)"}
                </span>
              </div>
            </div>

            {/* Scenario Cases & Reverse DCF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-brand-secondary/5 border border-brand-secondary/10 rounded-lg text-center">
                <span className="text-[10px] text-brand-secondary font-black uppercase tracking-wider block">Bull Case Value</span>
                <span className="text-lg font-mono font-bold mt-1 block text-brand-secondary">{formatPrice(dcf.intrinsic_bull, sourceCurrency, targetCurrency, true)}</span>
              </div>
              <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg text-center">
                <span className="text-[10px] text-brand-muted font-black uppercase tracking-wider block">Base Case Value</span>
                <span className="text-lg font-mono font-bold mt-1 block text-slate-800 dark:text-white">{formatPrice(dcf.intrinsic_value, sourceCurrency, targetCurrency, true)}</span>
              </div>
              <div className="p-4 bg-brand-danger/5 border border-brand-danger/10 rounded-lg text-center">
                <span className="text-[10px] text-brand-danger font-black uppercase tracking-wider block">Bear Case Value</span>
                <span className="text-lg font-mono font-bold mt-1 block text-brand-danger">{formatPrice(dcf.intrinsic_bear, sourceCurrency, targetCurrency, true)}</span>
              </div>
            </div>

            {/* DDM, Residual Income, Reverse DCF Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg text-xs space-y-1">
                <span className="text-[9px] text-brand-muted uppercase font-mono block">Reverse DCF Implied Growth</span>
                <span className="text-sm font-mono font-bold block text-brand-primary">{dcf.reverse_dcf_implied_growth}%</span>
                <p className="text-[10px] text-brand-muted">Growth required to justify {formatPrice(dcf.current_price, sourceCurrency, targetCurrency, true)} price.</p>
              </div>

              <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg text-xs space-y-1">
                <span className="text-[9px] text-brand-muted uppercase font-mono block">Dividend Discount Model (DDM)</span>
                <span className="text-sm font-mono font-bold block text-brand-secondary">{formatPrice(dcf.ddm_intrinsic_value, sourceCurrency, targetCurrency, true)}</span>
                <p className="text-[10px] text-brand-muted">Valuation based on perpetual dividend growth.</p>
              </div>

              <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg text-xs space-y-1">
                <span className="text-[9px] text-brand-muted uppercase font-mono block">Residual Income (RI) Value</span>
                <span className="text-sm font-mono font-bold block text-brand-warning">{formatPrice(dcf.residual_income_value, sourceCurrency, targetCurrency, true)}</span>
                <p className="text-[10px] text-brand-muted">Equity value based on return charge excess.</p>
              </div>
            </div>

            {/* Relative Valuation Multiples */}
            <div className="space-y-3 pt-4 border-t border-light-border dark:border-dark-border">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Target Peer Relative Valuations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border border-light-border dark:border-dark-border rounded-lg text-xs">
                  <span className="text-brand-muted block">EV/EBITDA Peer Valuation</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-white block mt-1">{formatPrice(dcf.ev_ebitda_value, sourceCurrency, targetCurrency, true)}</span>
                  <span className="text-[10px] text-brand-muted">Target Peer Average: 22.0x</span>
                </div>
                <div className="p-3 border border-light-border dark:border-dark-border rounded-lg text-xs">
                  <span className="text-brand-muted block">EV/Sales Peer Valuation</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-white block mt-1">{formatPrice(dcf.ev_sales_value, sourceCurrency, targetCurrency, true)}</span>
                  <span className="text-[10px] text-brand-muted">Target Peer Average: 4.5x</span>
                </div>
                <div className="p-3 border border-light-border dark:border-dark-border rounded-lg text-xs">
                  <span className="text-brand-muted block">PEG Peer Valuation</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-white block mt-1">{formatPrice(dcf.peg_multiple_value, sourceCurrency, targetCurrency, true)}</span>
                  <span className="text-[10px] text-brand-muted">Target Peer Average: 1.6x</span>
                </div>
              </div>
            </div>

            {/* Calculations logs & PV schedule */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">
                Discounted Cash Flow Projections Log
              </h3>
              <div className="p-4 bg-light-bg dark:bg-[#070a10] border border-light-border dark:border-dark-border rounded-lg text-xs font-mono max-h-[200px] overflow-y-auto pr-2 whitespace-pre-line">
                {dcf.calculations_log}
              </div>
            </div>

            {/* Sensitivity analysis grid table */}
            <div className="space-y-4 pt-4 border-t border-light-border dark:border-dark-border">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1">
                <Grid className="w-4 h-4" />
                WACC vs Stage 1 Growth Sensitivity Matrix
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-center border-collapse">
                  <thead>
                    <tr className="border-b border-light-border dark:border-dark-border text-brand-muted font-mono font-bold">
                      <th className="py-2 px-3 text-left">WACC \ Growth</th>
                      {Array.from(new Set(dcf.sensitivity_matrix.map((c: any) => c.growth_rate))).map((g: any) => (
                        <th key={g} className="py-2 px-3">{g}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                    {Array.from(new Set(dcf.sensitivity_matrix.map((c: any) => c.discount_rate))).map((d: any) => (
                      <tr key={d}>
                        <td className="py-2 px-3 text-left font-bold text-slate-800 dark:text-slate-200">{d}%</td>
                        {dcf.sensitivity_matrix.filter((c: any) => c.discount_rate === d).map((cell: any, idx: number) => {
                          const isUnder = cell.intrinsic_value > dcf.current_price;
                          return (
                            <td 
                              key={idx} 
                              className={`py-2 px-3 font-semibold ${
                                isUnder ? "text-brand-secondary bg-brand-secondary/5" : "text-brand-danger bg-brand-danger/5"
                              }`}
                            >
                              {formatPrice(cell.intrinsic_value, sourceCurrency, targetCurrency, false)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
