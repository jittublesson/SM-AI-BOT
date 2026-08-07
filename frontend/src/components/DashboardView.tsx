import React, { useState, useEffect } from "react";
import { Newspaper, Calendar, Flame, TrendingUp, Landmark, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart2, Globe, Cpu, Percent, FileText, Plus, Trash2, Zap, Eye, ShieldAlert } from "lucide-react";
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
  const [portfolioSummary, setPortfolioSummary] = useState({
    totalValue: 1250000.00,
    dailyChange: 14500.00,
    dailyChangePct: 1.17
  });

  const [activeCalendarTab, setActiveCalendarTab] = useState<"earnings" | "dividends" | "ipos" | "economic">("earnings");

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

      // Load pinned notes
      const savedNotes = localStorage.getItem("wealthpilot_notes");
      if (savedNotes) {
        setPinnedNotes(JSON.parse(savedNotes));
      }

      // Compute simple portfolio stats from holdings if available
      const holdingsRes = await fetch("/api/v1/portfolio/holdings");
      if (holdingsRes.ok) {
        const holdings = await holdingsRes.ok ? await holdingsRes.json() : [];
        if (holdings && holdings.length > 0) {
          let sumValue = 0;
          let sumBuy = 0;
          holdings.forEach((h: any) => {
            sumValue += h.quantity * h.current_price;
            sumBuy += h.quantity * h.buy_price;
          });
          const dailyDiff = sumValue * 0.012; // simulated daily gain
          setPortfolioSummary({
            totalValue: sumValue,
            dailyChange: dailyDiff,
            dailyChangePct: 1.2
          });
        }
      }
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
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
    { ticker: "TCS.NS", name: "Tata Consultancy Services", priceVal: 3850.50, currency: "INR", change: "+3.45%", sector: "Technology" },
    { ticker: "RELIANCE.NS", name: "Reliance Industries Ltd.", priceVal: 2450.75, currency: "INR", change: "+2.12%", sector: "Energy" },
    { ticker: "HDFCBANK.NS", name: "HDFC Bank Ltd.", priceVal: 1650.40, currency: "INR", change: "+1.85%", sector: "Financials" },
    { ticker: "INFY", name: "Infosys Ltd.", priceVal: 18.20, currency: "USD", change: "+1.35%", sector: "Technology" }
  ];

  const topLosers = [
    { ticker: "TSLA", name: "Tesla Inc.", priceVal: 180.20, currency: "USD", change: "-3.14%", sector: "Automotive" },
    { ticker: "AAPL", name: "Apple Inc.", priceVal: 210.50, currency: "USD", change: "-1.80%", sector: "Technology" },
    { ticker: "TATAMOTORS.NS", name: "Tata Motors Ltd.", priceVal: 980.10, currency: "INR", change: "-1.45%", sector: "Automotive" },
    { ticker: "WIPRO.NS", name: "Wipro Ltd.", priceVal: 485.45, currency: "INR", change: "-0.95%", sector: "Technology" }
  ];

  const mostActive = [
    { ticker: "RELIANCE.NS", name: "Reliance Industries", volume: "6.5M shares", change: "+2.12%" },
    { ticker: "TATASTEEL.NS", name: "Tata Steel Ltd.", volume: "12.4M shares", change: "+0.85%" },
    { ticker: "HDFCBANK.NS", name: "HDFC Bank Ltd.", volume: "5.8M shares", change: "+1.85%" },
    { ticker: "TATAMOTORS.NS", name: "Tata Motors Ltd.", volume: "8.2M shares", change: "-1.45%" }
  ];

  const trendingStocks = [
    { ticker: "NIPPON_ETF", name: "Nifty 50 BeES ETF", volume: "High Volume Spike", change: "+0.54%" },
    { ticker: "ADANIPORTS.NS", name: "Adani Ports & SEZ", volume: "Brokerage Upgrade", change: "+3.10%" },
    { ticker: "SUNPHARMA.NS", name: "Sun Pharmaceutical", volume: "New FDA Approval", change: "+2.45%" }
  ];

  const sectorHeatmap = [
    { name: "Tech", change: "+2.1%", trend: "up", signal: "Strong Acc" },
    { name: "Banks", change: "+1.6%", trend: "up", signal: "Steady Acc" },
    { name: "Pharma", change: "+1.2%", trend: "up", signal: "Selective" },
    { name: "Auto", change: "-0.4%", trend: "down", signal: "Neutral" },
    { name: "Energy", change: "+0.8%", trend: "up", signal: "Neutral" },
    { name: "Metals", change: "-1.1%", trend: "down", signal: "Reduce" }
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

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 100 + minutes;
    
    // Weekend closed
    if (day === 0 || day === 6) return false;
    // NSE/BSE Hours: 9:15 AM to 3:30 PM (915 to 1530)
    return timeVal >= 915 && timeVal <= 1530;
  };

  const marketStatus = isMarketOpen();

  return (
    <div className="flex flex-col space-y-6 h-full overflow-y-auto pr-2 pb-6">
      
      {/* HEADER HERO AREA: Portfolio Valuation & Market Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Portfolio Valuation Card */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent border border-light-border dark:border-dark-border">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-brand-muted block">Today's Portfolio Net Worth</span>
            <div className="flex items-baseline gap-3 mt-2">
              <h1 className="text-3xl font-black font-mono tracking-tight text-slate-800 dark:text-white">
                {formatPrice(portfolioSummary.totalValue, "INR", targetCurrency, true)}
              </h1>
              <span className={`flex items-center text-xs font-bold font-mono px-2 py-0.5 rounded ${
                portfolioSummary.dailyChange >= 0 ? "bg-brand-secondary/10 text-brand-secondary" : "bg-brand-danger/10 text-brand-danger"
              }`}>
                {portfolioSummary.dailyChange >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {formatPrice(portfolioSummary.dailyChange, "INR", targetCurrency, true)} ({portfolioSummary.dailyChangePct}%)
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-light-border dark:border-dark-border pt-4 mt-6 text-xs text-brand-muted">
            <span>Terminal Source: SQLite Ledger</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${marketStatus ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Market Status: {marketStatus ? "Open (NSE/BSE Live)" : "Closed (Delayed Fallback)"}
              </span>
            </div>
          </div>
        </div>

        {/* Global Market Breadth & Sentiment Indicator */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between border border-light-border dark:border-dark-border">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-brand-muted block">Fear & Greed Score</span>
              <div className="text-3xl font-black font-mono mt-1.5 text-brand-warning">
                {fgData?.fear_greed_score ? fgData.fear_greed_score * 10 : 50}/100
              </div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-brand-muted block mt-1">
                {fgData?.fear_greed_label || "Neutral"}
              </span>
            </div>
            <Flame className="w-8 h-8 text-brand-warning" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-brand-muted">
              <span>Advances: 1,428</span>
              <span>Declines: 652</span>
            </div>
            <div className="h-2 w-full rounded-full bg-light-border dark:bg-dark-border overflow-hidden flex">
              <div className="h-full bg-brand-secondary" style={{ width: "68%" }}></div>
              <div className="h-full bg-brand-danger" style={{ width: "32%" }}></div>
            </div>
            <span className="text-[9px] text-brand-muted block italic text-center">Nifty 50 advances capturing 68% participant volume.</span>
          </div>
        </div>

      </div>

      {/* INDEX TICKER TAPE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {macroData?.global_indices?.map((index: any, idx: number) => {
          const isUp = index.change.startsWith("+");
          return (
            <div key={idx} className="glass-card p-4 rounded-xl flex justify-between items-center border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5">
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-bold tracking-wider block">{index.name}</span>
                <span className="text-sm font-mono font-bold mt-1 block text-slate-800 dark:text-white">{index.value}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                isUp ? "bg-brand-secondary/10 text-brand-secondary" : "bg-brand-danger/10 text-brand-danger"
              }`}>
                {index.change}
              </span>
            </div>
          );
        })}
      </div>

      {/* PRIMARY COLUMNS: Main Area & Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* LEFT & CENTER 3 COLS: Live Tables & Heatmaps */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* Active Stock Intelligence Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Gainers & Losers Tabbed Section */}
            <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4">
              <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                <Landmark className="w-4 h-4 text-brand-secondary" />
                <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Top Daily Performers (NSE/BSE)</h3>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-secondary">Gainers</span>
                  {topGainers.slice(0, 3).map((g, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded bg-brand-secondary/5 border border-brand-secondary/10 hover:bg-brand-secondary/15 transition-all group">
                      <div onClick={() => onSelectTicker(g.ticker)} className="flex-1 cursor-pointer">
                        <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-200">{g.ticker}</span>
                        <span className="text-[9px] text-brand-muted block truncate max-w-[150px]">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right font-mono text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatPrice(g.priceVal, g.currency, targetCurrency, true)}</span>
                          <span className="text-[10px] text-brand-secondary font-bold block">{g.change}</span>
                        </div>
                        <button onClick={() => handleQuickAddWatchlist(g.ticker, g.name, g.sector)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-danger">Losers</span>
                  {topLosers.slice(0, 3).map((l, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 rounded bg-brand-danger/5 border border-brand-danger/10 hover:bg-brand-danger/15 transition-all group">
                      <div onClick={() => onSelectTicker(l.ticker)} className="flex-1 cursor-pointer">
                        <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-200">{l.ticker}</span>
                        <span className="text-[9px] text-brand-muted block truncate max-w-[150px]">{l.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right font-mono text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{formatPrice(l.priceVal, l.currency, targetCurrency, true)}</span>
                          <span className="text-[10px] text-brand-danger font-bold block">{l.change}</span>
                        </div>
                        <button onClick={() => handleQuickAddWatchlist(l.ticker, l.name, l.sector)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Active & Trending */}
            <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4">
              <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Most Active & Trending Stocks</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-muted">Volume Leaders</span>
                  {mostActive.slice(0, 2).map((ma, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                      <div>
                        <span onClick={() => onSelectTicker(ma.ticker)} className="font-bold font-mono text-xs cursor-pointer hover:underline text-slate-800 dark:text-slate-200">{ma.ticker}</span>
                        <span className="text-[9px] text-brand-muted block">{ma.name}</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-bold block text-slate-800 dark:text-slate-200">{ma.volume}</span>
                        <span className={`text-[10px] font-bold ${ma.change.startsWith("+") ? "text-brand-secondary" : "text-brand-danger"}`}>{ma.change}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-muted">Trending Catalysts</span>
                  {trendingStocks.slice(0, 2).map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 rounded bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                      <div>
                        <span onClick={() => onSelectTicker(t.ticker)} className="font-bold font-mono text-xs cursor-pointer hover:underline text-slate-800 dark:text-slate-200">{t.ticker}</span>
                        <span className="text-[9px] text-brand-muted block">{t.name}</span>
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">{t.volume}</span>
                        <span className="text-[10px] text-brand-secondary font-bold">{t.change}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Sector Heatmap & FII/DII Net Cash Flows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Sector Heatmap Blocks */}
            <div className="md:col-span-2 glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4">
              <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                <Percent className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Sector Rotation Performance</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {sectorHeatmap.map((s, idx) => {
                  const isUp = s.change.startsWith("+");
                  return (
                    <div key={idx} className={`p-3 rounded-xl border flex flex-col justify-between text-center ${
                      isUp 
                        ? "bg-brand-secondary/5 border-brand-secondary/15 text-brand-secondary" 
                        : "bg-brand-danger/5 border-brand-danger/15 text-brand-danger"
                    }`}>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-brand-muted font-sans">{s.name}</span>
                      <span className="text-xs font-black font-mono mt-1.5">{s.change}</span>
                      <span className="text-[8px] bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded mt-2 max-w-max mx-auto">{s.signal}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FII / DII Flow Summary */}
            <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                  <Zap className="w-4 h-4 text-brand-warning" />
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">FII / DII Flows</h3>
                </div>
                <div className="space-y-2.5 mt-3 text-xs font-mono">
                  <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded">
                    <span className="text-brand-muted font-sans font-semibold">FII Cash Net</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {macroData?.fii_dii_flows?.fii_net_today_cr || "+0 Cr"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-black/5 dark:bg-white/5 p-2 rounded">
                    <span className="text-brand-muted font-sans font-semibold">DII Cash Net</span>
                    <span className="font-bold text-brand-secondary">
                      {macroData?.fii_dii_flows?.dii_net_today_cr || "+0 Cr"}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[9px] leading-relaxed text-brand-muted italic mt-3 bg-black/5 dark:bg-white/5 p-2 rounded">
                {macroData?.fii_dii_flows?.summary || "FII net accumulation is balanced by domestic funds support."}
              </p>
            </div>

          </div>

          {/* Unified Dynamic Calendars Hub */}
          <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Corporate & Economic Events Hub</h3>
              </div>
              
              {/* Hub Tabs */}
              <div className="flex gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg text-[10px] font-bold font-mono">
                <button 
                  onClick={() => setActiveCalendarTab("earnings")} 
                  className={`px-2.5 py-1 rounded-md transition-all ${activeCalendarTab === "earnings" ? "bg-brand-primary text-white" : "text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
                >
                  Earnings
                </button>
                <button 
                  onClick={() => setActiveCalendarTab("dividends")} 
                  className={`px-2.5 py-1 rounded-md transition-all ${activeCalendarTab === "dividends" ? "bg-brand-primary text-white" : "text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
                >
                  Dividends
                </button>
                <button 
                  onClick={() => setActiveCalendarTab("ipos")} 
                  className={`px-2.5 py-1 rounded-md transition-all ${activeCalendarTab === "ipos" ? "bg-brand-primary text-white" : "text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
                >
                  IPOs
                </button>
                <button 
                  onClick={() => setActiveCalendarTab("economic")} 
                  className={`px-2.5 py-1 rounded-md transition-all ${activeCalendarTab === "economic" ? "bg-brand-primary text-white" : "text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
                >
                  Economic
                </button>
              </div>
            </div>

            <div className="min-h-[140px] text-xs">
              {activeCalendarTab === "earnings" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {macroData?.earnings_calendar?.map((ec: any, idx: number) => (
                    <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                      <span className="text-[10px] font-mono text-brand-muted block">{ec.date}</span>
                      <span className="font-bold block mt-1 text-slate-800 dark:text-slate-200">{ec.company}</span>
                      <span className="text-[10px] text-brand-primary font-mono block mt-1">{ec.event}</span>
                    </div>
                  )) || <div className="text-brand-muted py-8 text-center">No upcoming earnings logged.</div>}
                </div>
              )}

              {activeCalendarTab === "dividends" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {macroData?.dividend_calendar?.map((dc: any, idx: number) => (
                    <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                      <span className="text-[10px] font-mono text-brand-muted block">{dc.date}</span>
                      <span className="font-bold block mt-1 text-slate-800 dark:text-slate-200">{dc.company}</span>
                      <span className="text-[10px] font-mono text-brand-secondary block mt-1">{dc.dividend} ({dc.type})</span>
                    </div>
                  )) || <div className="text-brand-muted py-8 text-center">No upcoming corporate distributions logged.</div>}
                </div>
              )}

              {activeCalendarTab === "ipos" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {macroData?.ipo_calendar?.map((ipo: any, idx: number) => (
                    <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl">
                      <span className="text-[10px] font-mono text-brand-muted block">Status: {ipo.status}</span>
                      <span className="font-bold block mt-1 text-slate-800 dark:text-slate-200">{ipo.company}</span>
                      <span className="text-[10px] font-mono text-brand-primary block mt-1">Issue: {ipo.issue_size} | Date: {ipo.date}</span>
                    </div>
                  )) || <div className="text-brand-muted py-8 text-center">No active IPO books found.</div>}
                </div>
              )}

              {activeCalendarTab === "economic" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {macroData?.economic_calendar?.map((ec: any, idx: number) => (
                    <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl flex justify-between items-center">
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-slate-200">{ec.event}</span>
                        <span className="text-[10px] text-brand-muted font-mono">Date: {ec.date} | Forecast: {ec.forecast} (Prior: {ec.prior})</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                        ec.impact === "High" || ec.impact === "Critical" ? "bg-brand-danger/10 text-brand-danger" : "bg-brand-primary/10 text-brand-primary"
                      }`}>{ec.impact}</span>
                    </div>
                  )) || <div className="text-brand-muted py-8 text-center">No major reports scheduled this week.</div>}
                </div>
              )}
            </div>
          </div>

          {/* Institutional News Intelligence */}
          <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4">
            <div className="flex items-center justify-between border-b border-light-border dark:border-dark-border pb-3">
              <div className="flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Terminal News Intelligence & Sentiment</h3>
              </div>
              <button onClick={fetchDashboardData} className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-brand-muted hover:text-slate-800 dark:hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-brand-muted">Fetching news cycles...</div>
            ) : (
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {fgData?.all_news && fgData.all_news.length > 0 ? (
                  fgData.all_news.map((art: any, idx: number) => (
                    <div key={idx} className="p-3.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl text-xs space-y-2 hover:border-brand-primary/10 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <a href={art.link} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 dark:text-white hover:underline block leading-tight">{art.title}</a>
                          <span className="text-[9px] text-brand-muted block mt-1">Publisher: {art.publisher} | Scope: {art.impact}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                          art.sentiment === "Bullish" ? "bg-brand-secondary/10 text-brand-secondary" : "bg-brand-danger/10 text-brand-danger"
                        }`}>{art.sentiment}</span>
                      </div>
                      <p className="text-brand-muted leading-relaxed text-[11px]">{art.content}</p>
                      <div className="text-[10px] text-brand-primary font-mono bg-brand-primary/5 p-2 rounded border border-brand-primary/10">
                        Evidence Signal: {art.accumulation_distribution_evidence}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-brand-muted text-center py-12">No active intelligence stories found.</div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* SIDEBAR RIGHT AREA: Watchlists, Research Notes & Quick Actions */}
        <div className="space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold font-mono">
              <button onClick={() => onSelectTicker("RELIANCE.NS")} className="p-2.5 rounded bg-brand-primary text-white hover:bg-brand-primary/95 transition-all">
                Reliance Res
              </button>
              <button onClick={() => onSelectTicker("TCS.NS")} className="p-2.5 rounded bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border hover:border-brand-primary/20 text-slate-800 dark:text-slate-200 transition-all">
                TCS Audit
              </button>
            </div>
          </div>

          {/* Bookmarked Watchlist */}
          <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-3">
            <div className="flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5">
              <Landmark className="w-4 h-4 text-brand-warning" />
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Bookmarked Watchlist</h3>
            </div>
            
            <div className="space-y-2">
              {bookmarks.length > 0 ? (
                bookmarks.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onSelectTicker(b.ticker)}
                    className="p-2.5 rounded-xl border border-light-border dark:border-dark-border hover:border-brand-primary/25 bg-black/5 dark:bg-white/5 flex justify-between items-center cursor-pointer transition-colors text-xs font-mono group"
                  >
                    <div>
                      <span className="font-bold text-brand-primary block">{b.ticker}</span>
                      <span className="text-[10px] text-brand-muted font-sans block truncate max-w-[140px]">{b.title}</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-brand-muted group-hover:text-brand-primary transition-colors" />
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-brand-muted text-center py-6 border border-dashed border-light-border dark:border-dark-border rounded-xl">
                  Saved tickers appear here. Bookmark items inside stock profile workspaces.
                </div>
              )}
            </div>
          </div>

          {/* Pinned Analyst Notes */}
          <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-3">
            <div className="flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5">
              <FileText className="w-4 h-4 text-brand-primary" />
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Pinned Workspace Notes</h3>
            </div>

            <div className="space-y-2">
              {pinnedNotes.length > 0 ? (
                pinnedNotes.map((n, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 text-xs space-y-1.5 relative group"
                  >
                    <div className="flex justify-between items-center text-[9px] font-mono text-brand-primary">
                      <span className="font-bold">{n.ticker}</span>
                      <span>{n.date}</span>
                    </div>
                    <p className="text-brand-muted leading-relaxed text-[11px] pr-4">{n.text}</p>
                    <button
                      onClick={() => handleDeleteNote(idx)}
                      className="absolute right-2 top-2 p-1 rounded hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-brand-muted text-center py-6 border border-dashed border-light-border dark:border-dark-border rounded-xl">
                  No notes saved. Add them inside Company Workspace pages.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
