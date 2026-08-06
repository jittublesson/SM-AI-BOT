import React, { useState, useEffect } from "react";
import { Newspaper, Calendar, Flame, TrendingUp, Landmark, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Globe, Cpu, Percent, FileText, Plus, Eye } from "lucide-react";
import { formatPrice } from "../utils/currency";

interface DashboardViewProps {
  onSelectTicker: (ticker: string) => void;
  targetCurrency?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectTicker, targetCurrency = "INR" }) => {
  const [loading, setLoading] = useState(true);
  const [fgData, setFgData] = useState<any>(null);
  const [macroData, setMacroData] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  // Local storage notes state
  const [pinnedNotes, setPinnedNotes] = useState<Array<{ ticker: string; text: string; date: string }>>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const fgRes = await fetch("/api/v1/news/feed");
      const fgJson = await fgRes.json();
      setFgData(fgJson);

      const macroRes = await fetch("/api/v1/macro/indicators");
      const macroJson = await macroRes.json();
      setMacroData(macroJson);

      const bRes = await fetch("/api/v1/bookmarks");
      const bJson = await bRes.json();
      setBookmarks(bJson);

      // Load pinned notes from local storage
      const savedNotes = localStorage.getItem("wealthpilot_notes");
      if (savedNotes) {
        setPinnedNotes(JSON.parse(savedNotes));
      }
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteNote = (idx: number) => {
    const updated = pinnedNotes.filter((_, i) => i !== idx);
    setPinnedNotes(updated);
    localStorage.setItem("wealthpilot_notes", JSON.stringify(updated));
  };

  const topGainers = [
    { ticker: "INFY", name: "Infosys Ltd.", priceVal: 18.20, currency: "USD", change: "+3.45%", sector: "Technology" },
    { ticker: "HDFCBANK.NS", name: "HDFC Bank Ltd.", priceVal: 1650.40, currency: "INR", change: "+2.12%", sector: "Financials" },
    { ticker: "RELIANCE.NS", name: "Reliance Industries", priceVal: 2468.20, currency: "INR", change: "+1.35%", sector: "Energy" },
    { ticker: "NVDA", name: "NVIDIA Corporation", priceVal: 920.15, currency: "USD", change: "+1.08%", sector: "Semiconductors" }
  ];

  const topLosers = [
    { ticker: "TSLA", name: "Tesla Inc.", priceVal: 180.20, currency: "USD", change: "-3.14%", sector: "Automotive" },
    { ticker: "AAPL", name: "Apple Inc.", priceVal: 209.10, currency: "USD", change: "-0.80%", sector: "Technology" },
    { ticker: "HCLTECH.NS", name: "HCL Tech", priceVal: 1320.10, currency: "INR", change: "-0.45%", sector: "Technology" },
    { ticker: "INTC", name: "Intel Corporation", priceVal: 29.45, currency: "USD", change: "-0.32%", sector: "Semiconductors" }
  ];

  const commodities = [
    { name: "Brent Crude", value: "$78.45", change: "+0.8%" },
    { name: "Gold (oz)", value: "$2,350.20", change: "+0.1%" },
    { name: "US 10Y Yield", value: "4.12%", change: "-1.2%" },
    { name: "DXY Index", value: "104.25", change: "+0.2%" }
  ];

  const handleQuickAddWatchlist = async (ticker: string, name: string, sector: string) => {
    try {
      const res = await fetch("/api/v1/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, name, sector })
      });
      if (res.status === 409) {
        alert(`${ticker} is already in your watchlist.`);
      } else if (res.ok) {
        alert(`${ticker} added to watchlist!`);
      }
    } catch {
      console.error("Quick watchlist add failed");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full overflow-hidden">
      
      {/* LEFT COLUMN: Live Market Indicators Sidebar */}
      <div className="xl:col-span-1 glass-card p-4 rounded-lg flex flex-col space-y-6 h-full overflow-y-auto pr-1">
        <div>
          <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5 mb-3">
            <Globe className="w-4 h-4 text-brand-primary" />
            Commodities & Rates Ticker
          </h2>
          <div className="space-y-2 text-xs font-mono">
            {commodities.map((c, idx) => {
              const isUp = c.change.startsWith("+");
              return (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                  <span className="text-brand-muted font-sans font-semibold">{c.name}</span>
                  <div className="text-right">
                    <span className="font-bold block text-slate-800 dark:text-slate-200">{c.value}</span>
                    <span className={`text-[10px] ${isUp ? "text-brand-secondary" : "text-brand-danger"}`}>
                      {c.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Breadth advances vs declines */}
        <div>
          <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5 mb-3">
            <BarChart2 className="w-4 h-4 text-brand-secondary" />
            Market Breadth (Advances)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between font-mono text-[10px] text-brand-muted">
              <span>Advances: 1,420</span>
              <span>Declines: 640</span>
            </div>
            {/* Color bar indicator */}
            <div className="h-3 w-full rounded overflow-hidden flex">
              <div className="h-full bg-brand-secondary" style={{ width: "69%" }}></div>
              <div className="h-full bg-brand-danger" style={{ width: "31%" }}></div>
            </div>
            <span className="text-[10px] text-brand-muted block text-center italic mt-1">Advances capture 69% of indexed volume.</span>
          </div>
        </div>

        {/* Saved Watchlist bookmarks list */}
        <div>
          <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5 mb-3">
            <Landmark className="w-4 h-4 text-brand-warning" />
            Investments Watchlist
          </h2>
          <div className="space-y-2">
            {bookmarks.length > 0 ? (
              bookmarks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => onSelectTicker(b.ticker)}
                  className="p-2.5 rounded border border-light-border dark:border-dark-border hover:border-brand-primary/20 bg-black/5 dark:bg-white/5 flex justify-between items-center cursor-pointer transition-colors text-xs font-mono"
                >
                  <div>
                    <span className="font-bold text-brand-primary block">{b.ticker}</span>
                    <span className="text-[10px] text-brand-muted font-sans block truncate max-w-[120px]">{b.title}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-brand-muted" />
                </div>
              ))
            ) : (
              <div className="text-[10px] text-brand-muted text-center py-4 border border-dashed border-light-border dark:border-dark-border rounded">
                Bookmarks appear here. Click the bookmark flag in headers.
              </div>
            )}
          </div>
        </div>

        {/* Pinned Research Notes */}
        <div>
          <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5 mb-3">
            <FileText className="w-4 h-4 text-brand-primary" />
            Pinned Research Notes
          </h2>
          <div className="space-y-2">
            {pinnedNotes.length > 0 ? (
              pinnedNotes.map((n, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 text-xs space-y-1 relative"
                >
                  <div className="flex justify-between items-center text-[10px] font-mono text-brand-primary">
                    <span className="font-bold">{n.ticker}</span>
                    <span>{n.date}</span>
                  </div>
                  <p className="text-brand-muted leading-relaxed text-[11px] pr-4">{n.text}</p>
                  <button
                    onClick={() => handleDeleteNote(idx)}
                    className="absolute right-2 top-2 text-[10px] text-brand-danger hover:underline"
                  >
                    ×
                  </button>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-brand-muted text-center py-4 border border-dashed border-light-border dark:border-dark-border rounded">
                No pinned notes. Add notes inside corporate workspaces.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE & RIGHT AREA: Main Ticker boards */}
      <div className="xl:col-span-3 flex flex-col space-y-6 h-full overflow-y-auto pr-1">
        
        {/* live index ticker tape header banner */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          {macroData?.global_markets?.map((index: any, idx: number) => {
            const isUp = index.change.startsWith("+");
            return (
              <div key={idx} className="glass-card p-3 rounded-lg flex justify-between items-center border border-light-border dark:border-dark-border">
                <div>
                  <span className="text-[10px] text-brand-muted uppercase font-mono block">{index.name}</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-white">{index.price}</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isUp ? "bg-brand-secondary/10 text-brand-secondary" : "bg-brand-danger/10 text-brand-danger"
                }`}>
                  {index.change}
                </span>
              </div>
            );
          })}
        </div>

        {/* AI daily market summary and gainers/losers row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
          {/* AI Daily Market Summary */}
          <div className="lg:col-span-2 glass-card p-4 rounded-lg flex flex-col space-y-3">
            <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2">
              <Cpu className="w-4 h-4 text-brand-primary" />
              AI Daily Market Summary
            </h2>
            <div className="text-xs leading-relaxed text-brand-muted space-y-2">
              <p>
                Global index benchmarks trade in minor consolidation bounds as inflation metrics settle at 2.4%.
                Macro flows indicate significant index support around the 50-day SMA thresholds, supported by positive FII allocations.
              </p>
              <div className="p-2.5 bg-brand-primary/5 border border-brand-primary/10 rounded font-mono text-[10px] text-brand-primary">
                Consensus Verdict: ACCUMULATE core sector rotations on support bounces. Keep capital risk weights below 8.0%.
              </div>
            </div>
          </div>

          {/* Fear & Greed index */}
          <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
            <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2">
              <Flame className="w-4 h-4 text-brand-warning" />
              Fear & Greed Index
            </h2>
            {fgData ? (
              <div className="flex flex-col items-center space-y-2 text-center text-xs">
                <div className="text-2xl font-mono font-black text-brand-warning">{fgData.fear_greed_score}/100</div>
                <span className="font-extrabold uppercase text-[10px] tracking-widest text-brand-warning">{fgData.fear_greed_label}</span>
                <p className="text-[10px] text-brand-muted leading-tight truncate w-full">Led by index momentum & low VIX limits.</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Financial Gainers & Losers grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-secondary tracking-wider flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" />
              Top Gainers Today
            </h3>
            <div className="space-y-2 text-xs">
              {topGainers.map((g, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-brand-secondary/5 border border-brand-secondary/10 hover:bg-brand-secondary/10 transition-colors group">
                  <div
                    onClick={() => onSelectTicker(g.ticker)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{g.ticker}</span>
                      <span className="text-[8px] font-mono bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">{g.sector}</span>
                    </div>
                    <span className="text-[10px] text-brand-muted block">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{formatPrice(g.priceVal, g.currency, targetCurrency, true)}</span>
                      <span className="text-[10px] text-brand-secondary font-bold">{g.change}</span>
                    </div>
                    <button
                      onClick={() => handleQuickAddWatchlist(g.ticker, g.name, g.sector)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-all"
                      title="Add to Watchlist"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-danger tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-4 h-4" />
              Top Losers Today
            </h3>
            <div className="space-y-2 text-xs">
              {topLosers.map((l, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded bg-brand-danger/5 border border-brand-danger/10 hover:bg-brand-danger/10 transition-colors group">
                  <div
                    onClick={() => onSelectTicker(l.ticker)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{l.ticker}</span>
                      <span className="text-[8px] font-mono bg-black/5 dark:bg-white/5 px-1 py-0.5 rounded">{l.sector}</span>
                    </div>
                    <span className="text-[10px] text-brand-muted block">{l.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right font-mono">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{formatPrice(l.priceVal, l.currency, targetCurrency, true)}</span>
                      <span className="text-[10px] text-brand-danger font-bold">{l.change}</span>
                    </div>
                    <button
                      onClick={() => handleQuickAddWatchlist(l.ticker, l.name, l.sector)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-all"
                      title="Add to Watchlist"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* News timeline section */}
        <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-2">
            <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-brand-primary" />
              Institutional News Intelligence Feed
            </h2>
            <button onClick={fetchDashboardData} className="text-brand-muted hover:text-slate-800 dark:hover:text-white p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="text-xs text-brand-muted text-center py-20">Refreshing news feed logs...</div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {fgData?.positive_news?.concat(fgData?.negative_news || [])?.map((art: any, idx: number) => (
                <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg text-xs space-y-1 hover:border-brand-primary/10 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 dark:text-white">{art.title}</span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                      art.sentiment === "Bullish" ? "bg-brand-secondary/15 text-brand-secondary" : "bg-brand-danger/15 text-brand-danger"
                    }`}>{art.sentiment}</span>
                  </div>
                  <p className="text-brand-muted leading-relaxed text-[11px]">{art.content}</p>
                  <div className="text-[10px] text-brand-primary font-mono mt-1">
                    Evidence: {art.accumulation_distribution_evidence}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
