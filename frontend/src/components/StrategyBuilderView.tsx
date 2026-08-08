import React, { useState } from "react";
import { Code, Play, ShieldAlert, Award, Grid, Compass } from "lucide-react";

interface StrategyBuilderViewProps {
  targetCurrency?: string;
}

export const StrategyBuilderView: React.FC<StrategyBuilderViewProps> = ({ targetCurrency = "INR" }) => {
  const [params, setParams] = useState({
    indicators: ["EMA 20", "SMA 50"],
    stop_loss_pct: 1.5,
    take_profit_pct: 4.5,
    entry_rules: "Enter Long when EMA 20 crosses above SMA 50",
    exit_rules: "Exit when EMA 20 crosses below SMA 50",
    risk_rules: "Cut position sizing by 50% during high ATR volatility",
    position_sizing: "1.0% risk per trade base sizing"
  });

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"pine" | "python">("pine");

  const handleRunBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/strategy/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Custom backtest",
          indicators: params.indicators,
          stop_loss_pct: params.stop_loss_pct,
          take_profit_pct: params.take_profit_pct,
          entry_rules: params.entry_rules,
          exit_rules: params.exit_rules,
          risk_rules: params.risk_rules,
          position_sizing: params.position_sizing
        })
      });
      const json = await res.json();
      setResults(json);
    } catch (err) {
      console.error("Backtest failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto">
      {/* Strategy parameters sidebar */}
      <div className="md:col-span-1 glass-card p-4 rounded-lg flex flex-col md:sticky md:top-20 h-fit pr-1">
        <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
          <Code className="text-brand-primary w-5 h-5" />
          Quant Strategy Setup
        </h2>
        
        <form onSubmit={handleRunBacktest} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-brand-muted">Stop Loss (%)</label>
            <input
              type="number"
              step="0.1"
              value={params.stop_loss_pct}
              onChange={(e) => setParams(prev => ({ ...prev, stop_loss_pct: parseFloat(e.target.value) || 1.5 }))}
              className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-muted">Take Profit (%)</label>
            <input
              type="number"
              step="0.1"
              value={params.take_profit_pct}
              onChange={(e) => setParams(prev => ({ ...prev, take_profit_pct: parseFloat(e.target.value) || 4.5 }))}
              className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-muted">Entry Signals Description</label>
            <textarea
              value={params.entry_rules}
              onChange={(e) => setParams(prev => ({ ...prev, entry_rules: e.target.value }))}
              className="w-full p-2 h-16 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-muted">Exit Signals Description</label>
            <textarea
              value={params.exit_rules}
              onChange={(e) => setParams(prev => ({ ...prev, exit_rules: e.target.value }))}
              className="w-full p-2 h-16 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-brand-muted">Sizing & Risk constraints</label>
            <input
              type="text"
              value={params.position_sizing}
              onChange={(e) => setParams(prev => ({ ...prev, position_sizing: e.target.value }))}
              className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded bg-brand-primary hover:bg-brand-primary/95 text-white font-bold uppercase transition-colors flex justify-center items-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            {loading ? "Backtesting..." : "Generate & Backtest"}
          </button>
        </form>
      </div>

      {/* Script code & performance results */}
      <div className="md:col-span-3 glass-card p-6 rounded-lg flex flex-col space-y-6">
        {results ? (
          <>
            {/* Header metrics */}
            <div className="border-b border-light-border dark:border-dark-border pb-4 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-brand-secondary/15 text-brand-secondary font-bold">
                  Walk-Forward Efficiency: {results.walk_forward_metrics?.efficiency_ratio}%
                </span>
                <h1 className="text-lg font-extrabold mt-2 text-slate-800 dark:text-white">
                  Strategy Performance & Backtest Engine
                </h1>
              </div>
              <div className="text-right flex gap-3">
                <div>
                  <span className="text-[9px] text-brand-muted uppercase font-mono block">Win Rate</span>
                  <span className="text-xs font-bold text-brand-secondary font-mono">{results.win_rate}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-brand-muted uppercase font-mono block">Sharpe</span>
                  <span className="text-xs font-bold text-brand-primary font-mono">{results.sharpe_ratio}</span>
                </div>
                <div>
                  <span className="text-[9px] text-brand-muted uppercase font-mono block">Max Drawdown</span>
                  <span className="text-xs font-bold text-brand-danger font-mono">-{results.max_drawdown}%</span>
                </div>
              </div>
            </div>

            {/* Code compilers */}
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-center border-b border-light-border dark:border-dark-border pb-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("pine")}
                    className={`text-xs font-bold uppercase px-3 py-1 rounded transition-colors ${
                      activeTab === "pine" ? "bg-brand-primary/10 text-brand-primary" : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    Pine Script v6
                  </button>
                  <button
                    onClick={() => setActiveTab("python")}
                    className={`text-xs font-bold uppercase px-3 py-1 rounded transition-colors ${
                      activeTab === "python" ? "bg-brand-primary/10 text-brand-primary" : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    Python Backtest Code
                  </button>
                </div>
              </div>

              <pre className="p-4 bg-light-bg dark:bg-[#070a10] border border-light-border dark:border-dark-border rounded-lg text-[11px] font-mono leading-relaxed overflow-x-auto max-h-[300px]">
                <code>
                  {activeTab === "pine" ? results.pine_script : results.python_code}
                </code>
              </pre>
            </div>

            {/* SVG Monte Carlo curve plots */}
            <div className="space-y-4 pt-4 border-t border-light-border dark:border-dark-border">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1">
                <Grid className="w-4 h-4" />
                Monte Carlo Equity Shuffles Simulation (SVG Traces)
              </h3>
              <div className="w-full overflow-x-auto py-2">
                <svg className="w-[600px] h-[200px] mx-auto bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg" viewBox="0 0 600 200">
                  {/* Grid lines */}
                  <line x1="50" y1="40" x2="550" y2="40" stroke="rgba(100, 116, 139, 0.08)" />
                  <line x1="50" y1="80" x2="550" y2="80" stroke="rgba(100, 116, 139, 0.08)" />
                  <line x1="50" y1="120" x2="550" y2="120" stroke="rgba(100, 116, 139, 0.08)" />
                  <line x1="50" y1="160" x2="550" y2="160" stroke="rgba(100, 116, 139, 0.08)" />

                  {/* Draw traces */}
                  {results.monte_carlo_traces?.map((trace: number[], tIdx: number) => {
                    // map points to svg coordinates (x: 50 -> 550, y: 180 -> 20)
                    const minVal = Math.min(...trace) * 0.95;
                    const maxVal = Math.max(...trace) * 1.05;
                    const points = trace.map((val, stepIdx) => {
                      const x = 50 + (stepIdx / (trace.length - 1)) * 500;
                      const y = 180 - ((val - minVal) / (maxVal - minVal)) * 160;
                      return `${x},${y}`;
                    }).join(" ");

                    // Generate varying trace opacity/colors
                    let color = "rgba(0, 98, 255, 0.18)";
                    if (tIdx === 0) color = "#10b981"; // Highlight best path
                    if (tIdx === 1) color = "#ef4444"; // Highlight worst path

                    return (
                      <polyline
                        key={tIdx}
                        fill="none"
                        stroke={color}
                        strokeWidth={tIdx < 2 ? "1.8" : "0.8"}
                        points={points}
                      />
                    );
                  })}
                  <text x="50" y="30" fill="#64748b" fontSize="8" fontWeight="bold">Best path (Green)</text>
                  <text x="180" y="30" fill="#64748b" fontSize="8" fontWeight="bold">Worst path (Red)</text>
                </svg>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-brand-muted text-center py-20">
            <Compass className="w-12 h-12 text-brand-primary/20 mb-3" />
            <span className="font-bold text-sm">Generate Custom Quant Strategy Code</span>
            <p className="text-xs leading-relaxed max-w-xs mt-1">
              Specify your trailing boundaries in the parameters wizard, then click compile to run simulations and generate Pine Script code.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
