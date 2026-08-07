import React, { useState, useEffect } from "react";
import { 
  Briefcase, Plus, Trash2, PieChart, BarChart2, ShieldCheck, 
  TrendingUp, Activity, Coins, Globe, Landmark, RefreshCw, X, ArrowUpRight
} from "lucide-react";
import { formatPrice, formatFinancialValue } from "../utils/currency";

interface Holding {
  id: number;
  asset_class: string;
  symbol: string;
  name: string;
  quantity: number;
  buy_price: number;
  current_value: number;
  sector?: string;
  country: string;
  cagr: number;
  volatility: number;
}

interface PortfolioManagerViewProps {
  targetCurrency?: string;
}

export const PortfolioManagerView: React.FC<PortfolioManagerViewProps> = ({ targetCurrency = "INR" }) => {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedHoldingId, setExpandedHoldingId] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleExpandHolding = (id: number) => {
    setExpandedHoldingId(prev => prev === id ? null : id);
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingHolding, setAddingHolding] = useState(false);

  // New Holding Form State
  const [form, setForm] = useState<Omit<Holding, "id">>({
    asset_class: "Stock",
    symbol: "",
    name: "",
    quantity: 10,
    buy_price: 100,
    current_value: 120,
    sector: "Technology",
    country: "India",
    cagr: 12.0,
    volatility: 15.0
  });

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/v1/portfolio/analytics");
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHoldings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/portfolio/holdings");
      if (response.ok) {
        const data = await response.json();
        setHoldings(data);
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Seed default holdings if database is empty on first load
  const seedDefaultHoldings = async () => {
    try {
      const checkRes = await fetch("/api/v1/portfolio/holdings");
      if (checkRes.ok) {
        const data = await checkRes.json();
        if (data.length === 0) {
          // Add default items
          const defaults = [
            { asset_class: "Stock", symbol: "RELIANCE.NS", name: "Reliance Industries Ltd.", quantity: 50, buy_price: 2300, current_value: 2450.75, sector: "Energy / Conglomerate", country: "India", cagr: 13.5, volatility: 18.2 },
            { asset_class: "Stock", symbol: "AAPL", name: "Apple Inc.", quantity: 15, buy_price: 180, current_value: 210.50, sector: "Technology", country: "US", cagr: 16.0, volatility: 14.8 },
            { asset_class: "Mutual Fund", symbol: "PP-FLEXICAP", name: "Parag Parikh Flexi Cap Fund", quantity: 2500, buy_price: 52.4, current_value: 92.4, sector: "Financial Services", country: "India", cagr: 18.9, volatility: 11.2 },
            { asset_class: "Fixed Deposit", symbol: "HDFC-FD", name: "HDFC Bank FD 7.2%", quantity: 1, buy_price: 500000, current_value: 536000, sector: "Banking", country: "India", cagr: 7.2, volatility: 0.1 },
            { asset_class: "Gold", symbol: "GOLD-BEES", name: "Gold BeES ETF", quantity: 200, buy_price: 52, current_value: 62.5, sector: "Precious Metals", country: "India", cagr: 10.2, volatility: 8.5 },
            { asset_class: "PPF", symbol: "POST-PPF", name: "Public Provident Fund", quantity: 1, buy_price: 250000, current_value: 278500, sector: "Sovereign Debt", country: "India", cagr: 7.1, volatility: 0.0 }
          ];

          for (const item of defaults) {
            await fetch("/api/v1/portfolio/holdings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item)
            });
          }
          fetchHoldings();
        } else {
          setHoldings(data);
        }
      }
    } catch (err) {
      console.error("Seed default holdings failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    seedDefaultHoldings();
  }, []);

  const handleAddHoldingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingHolding(true);
    try {
      const res = await fetch("/api/v1/portfolio/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowAddModal(false);
        setForm({
          asset_class: "Stock",
          symbol: "",
          name: "",
          quantity: 10,
          buy_price: 100,
          current_value: 120,
          sector: "Technology",
          country: "India",
          cagr: 12.0,
          volatility: 15.0
        });
        fetchHoldings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingHolding(false);
    }
  };

  const handleRemoveHolding = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/portfolio/holdings/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchHoldings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Portfolio calculations
  const calculateMetrics = () => {
    if (holdings.length === 0) return { netWorth: 0, cagr: 0, volatility: 0, riskScore: 0, divScore: 0, assetAlloc: {}, sectorAlloc: {}, countryAlloc: {} };

    let totalVal = 0;
    let totalInvested = 0;
    let cagrWeightedSum = 0;
    let volWeightedSum = 0;

    const assetAlloc: Record<string, number> = {};
    const sectorAlloc: Record<string, number> = {};
    const countryAlloc: Record<string, number> = {};

    holdings.forEach(h => {
      // Calculate current valuation in reporting currency (since DB holds direct values)
      // Wait, is h.current_value the price per unit, or total valuation?
      // symbol/buy_price is price per unit, quantity is units, total current valuation = h.quantity * h.current_value
      // Let's check: quantity * current_value. Wait, for FD/PPF quantity=1 and price is total valuation.
      // So total valuation = quantity * current_value
      const holdingValue = h.quantity * h.current_value;
      totalVal += holdingValue;
      totalInvested += h.quantity * h.buy_price;

      cagrWeightedSum += h.cagr * holdingValue;
      volWeightedSum += h.volatility * holdingValue;

      // Group asset class allocations
      assetAlloc[h.asset_class] = (assetAlloc[h.asset_class] || 0) + holdingValue;

      // Group sector allocations
      if (h.sector) {
        sectorAlloc[h.sector] = (sectorAlloc[h.sector] || 0) + holdingValue;
      } else {
        sectorAlloc["Other / Fixed Income"] = (sectorAlloc["Other / Fixed Income"] || 0) + holdingValue;
      }

      // Group country allocations
      countryAlloc[h.country] = (countryAlloc[h.country] || 0) + holdingValue;
    });

    const netWorth = totalVal;
    const expectedCagr = totalVal > 0 ? (cagrWeightedSum / totalVal) : 0;
    const expectedVolatility = totalVal > 0 ? (volWeightedSum / totalVal) : 0;

    // Risk score out of 10 based on equity ratio and volatility
    const equityVal = assetAlloc["Stock"] || 0;
    const mfVal = assetAlloc["Mutual Fund"] || 0;
    const highRiskVal = equityVal + mfVal;
    const riskRatio = totalVal > 0 ? (highRiskVal / totalVal) : 0;
    const riskScore = Math.min(Math.round(riskRatio * 8 + (expectedVolatility / 20) * 2), 10);

    // Diversification score (1-10 based on standard deviation of allocation shares)
    const shares = Object.values(assetAlloc).map(val => val / totalVal);
    const entropy = shares.reduce((acc, sh) => acc - sh * Math.log2(sh), 0);
    const divScore = Math.min(Math.round((entropy / 2) * 9 + 1), 10);

    return {
      netWorth,
      cagr: expectedCagr,
      volatility: expectedVolatility,
      riskScore,
      divScore,
      assetAlloc,
      sectorAlloc,
      countryAlloc
    };
  };

  const metrics = calculateMetrics();

  return (
    <div className="flex flex-col space-y-6 h-full overflow-hidden relative">
      {/* 1. Header Summaries */}
      <div className="glass-card p-5 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase text-brand-primary tracking-widest block font-mono">Consolidated Net Worth</span>
          <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-white font-mono flex items-baseline gap-2">
            {metrics.netWorth > 0 ? formatPrice(metrics.netWorth, "INR", targetCurrency) : "₹0"}
            <span className="text-[10px] font-bold text-brand-secondary font-sans leading-none uppercase">Portfolio Value</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto font-mono text-center">
          <div className="p-2 border border-light-border dark:border-dark-border rounded bg-black/3 dark:bg-white/3 min-w-28">
            <span className="text-[8px] text-brand-muted uppercase block leading-tight">Expected CAGR</span>
            <span className="text-xs font-bold text-brand-secondary mt-0.5 block">+{metrics.cagr.toFixed(2)}%</span>
          </div>
          <div className="p-2 border border-light-border dark:border-dark-border rounded bg-black/3 dark:bg-white/3 min-w-28">
            <span className="text-[8px] text-brand-muted uppercase block leading-tight">Volatility Std</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">{metrics.volatility.toFixed(2)}%</span>
          </div>
          <div className="p-2 border border-light-border dark:border-dark-border rounded bg-black/3 dark:bg-white/3 min-w-28">
            <span className="text-[8px] text-brand-muted uppercase block leading-tight">Risk Rating</span>
            <span className="text-xs font-bold text-brand-warning mt-0.5 block">{metrics.riskScore} / 10</span>
          </div>
          <div className="p-2 border border-light-border dark:border-dark-border rounded bg-black/3 dark:bg-white/3 min-w-28">
            <span className="text-[8px] text-brand-muted uppercase block leading-tight">Diversification</span>
            <span className="text-xs font-bold text-brand-success mt-0.5 block">{metrics.divScore} / 10</span>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold uppercase rounded flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* 2. Main content panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Ledger list of assets */}
        <div className="lg:col-span-2 glass-card rounded-lg flex flex-col overflow-hidden h-full">
          <div className="p-3 border-b border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 flex justify-between items-center shrink-0">
            <span className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-brand-primary" />
              Asset holdings Ledger
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 pb-4">
            {loading ? (
              <div className="h-full flex items-center justify-center text-brand-muted text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading ledger records...
              </div>
            ) : holdings.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-brand-muted text-xs p-8">
                <span>Holdings ledger is empty. Click 'Add Transaction' to start tracking.</span>
              </div>
            ) : isMobile ? (
              /* Mobile Expandable Cards view */
              <div className="space-y-3 p-3 select-none">
                {holdings.map((h) => {
                  const totalVal = h.quantity * h.current_value;
                  const costVal = h.quantity * h.buy_price;
                  const gainVal = totalVal - costVal;
                  const gainPct = costVal > 0 ? (gainVal / costVal) * 100 : 0;
                  const isExpanded = expandedHoldingId === h.id;
                  
                  return (
                    <div 
                      key={h.id} 
                      onClick={() => toggleExpandHolding(h.id)}
                      className="glass-card p-4 rounded-xl border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 flex flex-col gap-2 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 block text-xs">{h.symbol}</span>
                          <span className="text-[9px] uppercase tracking-wider bg-brand-primary/10 text-brand-primary font-bold px-1.5 py-0.5 rounded font-mono mt-1 inline-block">{h.asset_class}</span>
                        </div>
                        <div className="text-right font-mono">
                          <span className="font-bold text-slate-800 dark:text-slate-100 block text-xs">{formatPrice(totalVal, "INR", targetCurrency)}</span>
                          <span className={`text-[10px] font-bold ${gainVal >= 0 ? "text-brand-success" : "text-brand-danger"}`}>
                            {gainVal >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="border-t border-light-border dark:border-dark-border pt-3 mt-1 space-y-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans animate-fade-in">
                          <div className="flex justify-between">
                            <span>Description:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{h.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Units Held:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">{h.quantity.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Avg Cost Price:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">{formatPrice(h.buy_price, "INR", targetCurrency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Market Price:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">{formatPrice(h.current_value, "INR", targetCurrency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Geographic Exposure:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">{h.sector} ({h.country})</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CAGR & Volatility:</span>
                            <span className="font-mono text-slate-800 dark:text-slate-200">+{h.cagr}% / {h.volatility}% Std</span>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveHolding(h.id);
                              }}
                              className="px-3 py-2 bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-danger rounded text-[10px] font-bold uppercase transition-colors"
                              style={{ minHeight: "44px", minWidth: "120px" }}
                            >
                              Delete Record
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Desktop Sticky Header Table view */
              <div className="overflow-x-auto w-full relative">
                <table className="w-full text-xs text-left">
                  <thead className="sticky top-0 bg-white dark:bg-[#101217] z-10">
                    <tr className="border-b border-light-border dark:border-dark-border text-brand-muted bg-black/2 dark:bg-white/2">
                      <th className="px-4 py-3 font-bold font-sans uppercase">Asset</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase">Class</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase text-right">Units</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase text-right">Buy Price</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase text-right">Market Price</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase text-right">Valuation</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase text-center">Gain</th>
                      <th className="px-4 py-3 font-bold font-sans uppercase text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                    {holdings.map((h) => {
                      const totalVal = h.quantity * h.current_value;
                      const costVal = h.quantity * h.buy_price;
                      const gainVal = totalVal - costVal;
                      const gainPct = costVal > 0 ? (gainVal / costVal) * 100 : 0;
                      return (
                        <tr key={h.id} className="hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200">
                            <div>{h.symbol}</div>
                            <div className="text-[9px] text-brand-muted font-sans font-normal truncate max-w-44">{h.name}</div>
                          </td>
                          <td className="px-4 py-3"><span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold">{h.asset_class}</span></td>
                          <td className="px-4 py-3 text-right">{h.quantity.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{formatPrice(h.buy_price, "INR", targetCurrency)}</td>
                          <td className="px-4 py-3 text-right">{formatPrice(h.current_value, "INR", targetCurrency)}</td>
                          <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-slate-100">{formatPrice(totalVal, "INR", targetCurrency)}</td>
                          <td className={`px-4 py-3 text-center font-bold ${gainVal >= 0 ? "text-brand-success" : "text-brand-danger"}`}>
                            <div>{gainVal >= 0 ? "+" : ""}{gainPct.toFixed(1)}%</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveHolding(h.id)}
                              className="p-1 hover:bg-brand-danger/10 text-brand-danger rounded transition-colors"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Allocations visualizer sidebar */}
        <div className="lg:col-span-1 glass-card rounded-lg p-4 flex flex-col space-y-6 h-full overflow-y-auto pr-1">
          {/* Asset Allocation splits */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2 flex items-center gap-1.5">
              <PieChart className="w-4 h-4" />
              Asset Class splits
            </h3>
            
            <div className="space-y-2 text-xs">
              {Object.entries(metrics.assetAlloc).map(([ac, val], i) => {
                const pct = metrics.netWorth > 0 ? (val / metrics.netWorth) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-brand-muted">
                      <span>{ac}</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded overflow-hidden">
                      <div className="h-full bg-brand-primary rounded" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sector Allocation splits */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4" />
              Equity & Credit Sectors
            </h3>
            
            <div className="space-y-2 text-xs">
              {Object.entries(metrics.sectorAlloc).map(([sector, val], i) => {
                const pct = metrics.netWorth > 0 ? (val / metrics.netWorth) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-brand-muted">
                      <span>{sector}</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded overflow-hidden">
                      <div className="h-full bg-brand-secondary rounded" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Country Allocation splits */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Geographic exposure
            </h3>
            
            <div className="space-y-2 text-xs">
              {Object.entries(metrics.countryAlloc).map(([country, val], i) => {
                const pct = metrics.netWorth > 0 ? (val / metrics.netWorth) * 100 : 0;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-semibold text-brand-muted">
                      <span>{country} Exposure</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded overflow-hidden">
                      <div className="h-full bg-brand-info rounded" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Advanced Risk Ratios & Capital Ratios */}
          {analytics && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brand-primary" />
                Advanced Risk & Capital Ratios
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
                <div className="p-2.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                  <span className="text-[8px] text-brand-muted uppercase block leading-tight">Sharpe Ratio</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">{analytics.sharpe_ratio}</span>
                </div>
                <div className="p-2.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                  <span className="text-[8px] text-brand-muted uppercase block leading-tight">Sortino Ratio</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">{analytics.sortino_ratio}</span>
                </div>
                <div className="p-2.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                  <span className="text-[8px] text-brand-muted uppercase block leading-tight">Treynor Ratio</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">{analytics.treynor_ratio}</span>
                </div>
                <div className="p-2.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                  <span className="text-[8px] text-brand-muted uppercase block leading-tight">Beta (Market Corr)</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 block">{analytics.beta}</span>
                </div>
                <div className="p-2.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl col-span-2">
                  <span className="text-[8px] text-brand-muted uppercase block leading-tight">Max Drawdown (Est)</span>
                  <span className="text-xs font-bold text-brand-danger mt-1 block">-{analytics.max_drawdown}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Tax Estimation & Income Forecast */}
          {analytics && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-brand-secondary" />
                Capital Gains Tax & Forecast
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border">
                  <span>Dividend Yield (1.5% Est)</span>
                  <span className="font-mono font-bold text-green-500">{formatPrice(analytics.dividend_forecast, "INR", targetCurrency)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border">
                  <div>
                    <span className="block font-bold">STCG Est (20% rate)</span>
                    <span className="text-[8px] text-brand-muted font-normal block">Short Term Gains Tax</span>
                  </div>
                  <span className="font-mono font-bold text-brand-danger">{formatPrice(analytics.tax_estimation.stcg, "INR", targetCurrency)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border">
                  <div>
                    <span className="block font-bold">LTCG Est (12.5% rate)</span>
                    <span className="text-[8px] text-brand-muted font-normal block">Exempting first ₹1.25L</span>
                  </div>
                  <span className="font-mono font-bold text-brand-danger">{formatPrice(analytics.tax_estimation.ltcg, "INR", targetCurrency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Rebalancing Suggestions */}
          {analytics && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-brand-warning animate-pulse" />
                AI Rebalancing Advisor
              </h3>
              <div className="space-y-2">
                {analytics.rebalancing_suggestions.map((sug: string, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-brand-warning/10 border border-brand-warning/20 text-[11px] leading-relaxed text-slate-800 dark:text-slate-200">
                    {sug}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. Transaction Creator Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#101217] border border-light-border dark:border-dark-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-brand-primary tracking-widest flex items-center gap-1.5">
                <Plus className="w-4.5 h-4.5" />
                Add Asset Transaction
              </span>
              <button onClick={() => setShowAddModal(false)} className="text-brand-muted hover:text-slate-800 dark:hover:text-white font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddHoldingSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Asset Class</label>
                  <select
                    value={form.asset_class}
                    onChange={(e) => setForm(prev => ({ ...prev, asset_class: e.target.value }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-transparent rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
                  >
                    <option value="Stock">Stock Equity</option>
                    <option value="Mutual Fund">Mutual Fund</option>
                    <option value="ETF">ETF</option>
                    <option value="Gold">Gold</option>
                    <option value="Fixed Deposit">Fixed Deposit</option>
                    <option value="PPF">PPF</option>
                    <option value="EPF">EPF</option>
                    <option value="NPS">NPS</option>
                    <option value="Bond">Sovereign Bond</option>
                    <option value="Cash">Cash Reserve</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Symbol / Code</label>
                  <input
                    type="text" required placeholder="e.g. RELIANCE.NS"
                    value={form.symbol}
                    onChange={(e) => setForm(prev => ({ ...prev, symbol: e.target.value }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-brand-muted">Asset Name</label>
                <input
                  type="text" required placeholder="e.g. Reliance Industries Limited"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Quantity</label>
                  <input
                    type="number" step="any" min="0.0001" required
                    value={form.quantity}
                    onChange={(e) => setForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Buy Price (₹)</label>
                  <input
                    type="number" step="any" min="0" required
                    value={form.buy_price}
                    onChange={(e) => setForm(prev => ({ ...prev, buy_price: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Latest Price (₹)</label>
                  <input
                    type="number" step="any" min="0" required
                    value={form.current_value}
                    onChange={(e) => setForm(prev => ({ ...prev, current_value: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Expected CAGR %</label>
                  <input
                    type="number" step="0.1" required
                    value={form.cagr}
                    onChange={(e) => setForm(prev => ({ ...prev, cagr: parseFloat(e.target.value) || 12.0 }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Expected Volatility %</label>
                  <input
                    type="number" step="0.1" required
                    value={form.volatility}
                    onChange={(e) => setForm(prev => ({ ...prev, volatility: parseFloat(e.target.value) || 15.0 }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Equity Sector (Optional)</label>
                  <input
                    type="text" placeholder="e.g. Technology"
                    value={form.sector}
                    onChange={(e) => setForm(prev => ({ ...prev, sector: e.target.value }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-brand-muted">Country Exposure</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-transparent rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
                  >
                    <option value="India">India</option>
                    <option value="US">United States</option>
                    <option value="Global">Global Market</option>
                  </select>
                </div>
              </div>

              <button
                type="submit" disabled={addingHolding}
                className="w-full py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold uppercase rounded transition-colors disabled:opacity-50 text-center"
              >
                {addingHolding ? "Recording..." : "Save holding transaction"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
