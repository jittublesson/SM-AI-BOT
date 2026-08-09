import React, { useState, useEffect } from "react";
import { Grid, ArrowRight, TrendingUp, Check, Plus, Trash2, BarChart2 } from "lucide-react";

interface CompareCompaniesViewProps {
  targetCurrency?: string;
}

export const CompareCompaniesView: React.FC<CompareCompaniesViewProps> = ({ targetCurrency = "INR" }) => {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(["AAPL", "RELIANCE.NS"]);
  const [newTicker, setNewTicker] = useState("");
  const [profilesData, setProfilesData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [chartMetric, setChartMetric] = useState<string>("revenue");

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const dataMap: Record<string, any> = {};
      for (const ticker of selectedTickers) {
        const res = await fetch(`/api/v1/analyst/profile/${ticker}`);
        if (res.ok) {
          const json = await res.json();
          dataMap[ticker] = json;
        }
      }
      setProfilesData(dataMap);
    } catch (err) {
      console.error("Comparison load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [selectedTickers]);

  const handleAddTicker = () => {
    const sym = newTicker.trim().toUpperCase();
    if (sym && !selectedTickers.includes(sym)) {
      setSelectedTickers(prev => [...prev, sym]);
      setNewTicker("");
    }
  };

  const handleRemoveTicker = (sym: string) => {
    if (selectedTickers.length > 1) {
      setSelectedTickers(prev => prev.filter(t => t !== sym));
    }
  };

  // Metric definitions matching database lookups
  const compareList = [
    { label: "Market Cap (M)", key: "market_cap", type: "number", higherIsBetter: true },
    { label: "Revenue (M)", key: "revenue", type: "financial", higherIsBetter: true },
    { label: "EBITDA (M)", key: "ebitda", type: "financial", higherIsBetter: true },
    { label: "Net Profit PAT (M)", key: "pat", type: "financial", higherIsBetter: true },
    { label: "Operating Margin (%)", key: "operating_margin", type: "financial", higherIsBetter: true },
    { label: "ROE (%)", key: "roe", type: "financial", higherIsBetter: true },
    { label: "ROCE (%)", key: "roce", type: "financial", higherIsBetter: true },
    { label: "Total Debt (M)", key: "total_debt", type: "financial", higherIsBetter: false },
    { label: "Interest Coverage", key: "interest_coverage", type: "financial", higherIsBetter: true },
    { label: "Free Cash Flow (M)", key: "free_cash_flow", type: "financial", higherIsBetter: true }
  ];

  const getMetricVal = (ticker: string, key: string, type: string) => {
    const data = profilesData[ticker];
    if (!data) return null;
    if (key === "market_cap") {
      return data.profile?.info?.market_cap ? data.profile.info.market_cap / 1e6 : null;
    }
    const latest = data.profile?.financials?.[0];
    return latest ? latest[key] : null;
  };

  // Find the winning value index per row
  const getWinnerTicker = (item: any) => {
    let bestVal = item.higherIsBetter ? -Infinity : Infinity;
    let winner = "";
    
    selectedTickers.forEach(ticker => {
      const val = getMetricVal(ticker, item.key, item.type);
      if (val !== null && val !== undefined) {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          if (item.higherIsBetter) {
            if (num > bestVal) {
              bestVal = num;
              winner = ticker;
            }
          } else {
            if (num < bestVal) {
              bestVal = num;
              winner = ticker;
            }
          }
        }
      }
    });
    return winner;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Tickers Selection Header */}
      <div className="glass-card p-6 rounded-lg grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div className="lg:col-span-2">
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-white">
            Multi-Company Peer Workspace
          </h1>
          <p className="text-xs text-brand-muted mt-1 leading-relaxed">
            Specify multiple stock tickers to analyze revenue parameters, margins, leverage, and FCF streams side-by-side.
          </p>
        </div>
        <div className="flex gap-2 items-center justify-end text-xs">
          <input
            type="text"
            placeholder="Add ticker (e.g. TSLA)"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            className="p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200 uppercase w-32"
          />
          <button
            onClick={handleAddTicker}
            className="p-2 rounded bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center gap-1 font-bold font-sans uppercase shrink-0"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-40 text-center text-xs text-brand-muted">Assembling comparison columns...</div>
      ) : Object.keys(profilesData).length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Comparison matrix Table Column */}
          <div className="xl:col-span-3 glass-card p-6 rounded-lg flex flex-col space-y-4 overflow-x-auto">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 shrink-0">
              <Grid className="text-brand-primary w-5 h-5" />
              Comparative Peers Matrix Grid
            </h2>
            <div className="w-full">
              <table className="w-full text-xs text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-light-border dark:border-dark-border text-brand-muted font-bold">
                    <th className="py-2 pr-4 uppercase">Financial Line Item</th>
                    {selectedTickers.map((ticker) => {
                      const name = profilesData[ticker]?.profile?.info?.name || ticker;
                      return (
                        <th key={ticker} className="py-2 px-4 text-center font-mono relative">
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-white block w-full">{ticker}</span>
                            <button
                              onClick={() => handleRemoveTicker(ticker)}
                              disabled={selectedTickers.length <= 1}
                              className="text-brand-muted hover:text-brand-danger transition-colors disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="text-[10px] text-brand-muted block font-sans truncate font-normal max-w-[120px] mx-auto mt-0.5">{name}</span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                  {compareList.map((item, idx) => {
                    const winnerTicker = getWinnerTicker(item);
                    return (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2.5 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-200">{item.label}</td>
                        {selectedTickers.map((ticker) => {
                          const val = getMetricVal(ticker, item.key, item.type);
                          const isWinner = winnerTicker === ticker;
                          return (
                            <td 
                              key={ticker} 
                              className={`py-2.5 px-4 text-center ${
                                isWinner ? "bg-brand-secondary/10 text-brand-secondary font-bold" : ""
                              }`}
                            >
                              <div className="flex justify-center items-center gap-1.5">
                                <span>
                                  {val !== null && val !== undefined
                                    ? typeof val === "number" ? val.toLocaleString() : parseFloat(val).toLocaleString()
                                    : "-"}
                                  {item.key.includes("margin") || item.key.includes("ro") ? "%" : ""}
                                </span>
                                {isWinner && <Check className="w-3.5 h-3.5 text-brand-secondary shrink-0" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* SVG Comparative charts panel */}
          <div className="xl:col-span-1 glass-card p-6 rounded-lg flex flex-col space-y-4">
            <div className="border-b border-light-border dark:border-dark-border pb-3 flex justify-between items-center">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <BarChart2 className="text-brand-warning w-5 h-5" />
                Metrics Comparison Chart
              </h2>
              <select
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value)}
                className="p-1 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded text-[10px] focus:outline-none text-slate-800 dark:text-slate-200 font-mono"
              >
                <option value="revenue">Revenue</option>
                <option value="pat">Net Profit</option>
                <option value="roe">ROE</option>
                <option value="free_cash_flow">Free Cash Flow</option>
              </select>
            </div>

            {/* Dynamic SVG bar chart */}
            <div className="w-full overflow-x-auto py-2">
              <svg className="w-[200px] h-[150px] mx-auto bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg" viewBox="0 0 200 150">
                {selectedTickers.map((ticker, idx) => {
                  const val = getMetricVal(ticker, chartMetric, "financial");
                  const num = val !== null ? parseFloat(val) : 0;
                  
                  // Find max val in current selection to scale height (0 -> 100)
                  const allVals = selectedTickers.map(t => parseFloat(getMetricVal(t, chartMetric, "financial") || 0));
                  const maxVal = Math.max(...allVals, 1.0);
                  const barHeight = Math.max((num / maxVal) * 100, 10);
                  const x = 30 + idx * 55;
                  const y = 120 - barHeight;

                  return (
                    <g key={ticker}>
                      <rect
                        x={x}
                        y={y}
                        width="30"
                        height={barHeight}
                        fill={idx % 2 === 0 ? "#0062ff" : "#10b981"}
                        rx="2"
                      />
                      <text x={x + 15} y="135" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {ticker}
                      </text>
                      <text x={x + 15} y={y - 5} fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle" className="font-mono">
                        {num.toFixed(0)}
                      </text>
                    </g>
                  );
                })}
                <line x1="10" y1="120" x2="190" y2="120" stroke="rgba(100, 116, 139, 0.4)" strokeWidth="1" />
              </svg>
            </div>

            <div className="text-[11px] text-brand-muted leading-relaxed space-y-2 border-t border-light-border dark:border-dark-border pt-3">
              <span className="font-bold text-brand-primary uppercase text-[9px] block">Audit Thesis:</span>
              <p>
                Row highlights pinpoint sector leaders. Green checkmarks identify return-maximizing assets. Compare valuations to verify if premiums are supported by cash yields.
              </p>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};
