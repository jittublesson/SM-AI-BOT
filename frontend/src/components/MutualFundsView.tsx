import React, { useState, useEffect, useRef } from "react";
import { 
  Coins, Search, Filter, Landmark, TrendingUp, ShieldAlert, 
  HelpCircle, Info, Calculator, Check, Plus, Trash2, Eye, Bell,
  RefreshCw, FileText, ArrowRight, Star, AlertTriangle, ArrowUpRight, BarChart2,
  Cpu
} from "lucide-react";

interface Fund {
  id: string;
  name: string;
  amc: string;
  category: string;
  nav: number;
  aum_crore: number;
  expense_ratio_pct: number;
  exit_load: string;
  fund_manager: string;
  launch_date: string;
  risk_level: string;
  benchmark: string;
  min_sip: number;
  min_lumpsum: number;
  asset_allocation: Array<{ asset: string; percentage: number }>;
  sector_allocation: Array<{ sector: string; percentage: number }>;
  top_holdings: Array<{ company: string; percentage: number }>;
  returns: Record<string, string>;
  research: {
    summary: string;
    objective: string;
    strategy: string;
    risk_ratios: {
      sharpe: number;
      sortino: number;
      alpha: number;
      beta: number;
      volatility: number;
      drawdown: string;
    };
    pros: string[];
    cons: string[];
    suitable_investors: string;
    opinion: string;
  };
}

interface MutualFundsViewProps {
  targetCurrency?: string;
}

export const MutualFundsView: React.FC<MutualFundsViewProps> = ({ targetCurrency = "INR" }) => {
  const [activeSubTab, setActiveSubTab] = useState<"explorer" | "compare" | "sip" | "lumpsum" | "watchlist">("explorer");
  const [funds, setFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Screener / Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedRisk, setSelectedRisk] = useState("All");
  const [maxExpense, setMaxExpense] = useState(2.0);
  const [minAum, setMinAum] = useState(0.0);
  
  // Active selected fund for detail research view
  const [selectedFundId, setSelectedFundId] = useState<string | null>(null);
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [showAiReport, setShowAiReport] = useState(false);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // Watchlist states
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [watchlistNotes, setWatchlistNotes] = useState("");
  const [watchlistAlertNav, setWatchlistAlertNav] = useState("");
  const [watchlistSipDay, setWatchlistSipDay] = useState("");

  // Comparison states
  const [compareFundIds, setCompareFundIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<Fund[]>([]);

  // SIP Calculator states
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipReturnRate, setSipReturnRate] = useState(12.0);
  const [sipPeriod, setSipPeriod] = useState(10);
  const [sipStepUp, setSipStepUp] = useState(10); // annual step up %
  const [sipInflation, setSipInflation] = useState(6.0);
  const [sipResult, setSipResult] = useState<any>(null);

  // Lumpsum Calculator states
  const [lumpAmount, setLumpAmount] = useState(100000);
  const [lumpRate, setLumpRate] = useState(12.0);
  const [lumpPeriod, setLumpPeriod] = useState(10);
  const [lumpResult, setLumpResult] = useState<any>(null);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch all funds
  const fetchFunds = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/funds/screener?category=${selectedCategory}&risk=${selectedRisk}&max_expense=${maxExpense}&min_aum=${minAum}`);
      if (res.ok) {
        const json = await res.json();
        setFunds(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [selectedCategory, selectedRisk, maxExpense, minAum]);

  // Fetch fund details
  useEffect(() => {
    if (selectedFundId) {
      const fetchDetail = async () => {
        try {
          const res = await fetch(`/api/v1/funds/profile/${selectedFundId}`);
          if (res.ok) {
            const json = await res.json();
            setSelectedFund(json);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchDetail();
    } else {
      setSelectedFund(null);
    }
  }, [selectedFundId]);

  // Fetch watchlist
  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/v1/funds/watchlist");
      if (res.ok) {
        setWatchlist(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const handleAddToWatchlist = async (fund: Fund) => {
    try {
      const res = await fetch("/api/v1/funds/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fund_id: fund.id,
          name: fund.name,
          category: fund.category,
          notes: watchlistNotes || "Conviction watchlist entry",
          alert_nav: watchlistAlertNav ? parseFloat(watchlistAlertNav) : null,
          sip_reminder_day: watchlistSipDay ? parseInt(watchlistSipDay) : null
        })
      });
      if (res.ok) {
        showToast(`${fund.name} added to watchlist`);
        setWatchlistNotes("");
        setWatchlistAlertNav("");
        setWatchlistSipDay("");
        fetchWatchlist();
      } else {
        showToast("Fund is already watchlisted");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveWatchlist = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/funds/watchlist/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Fund removed from watchlist");
        fetchWatchlist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compare funds
  const triggerComparison = async () => {
    if (compareFundIds.length === 0) return;
    try {
      const res = await fetch(`/api/v1/funds/compare?ids=${compareFundIds.join(",")}`);
      if (res.ok) {
        setCompareData(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    triggerComparison();
  }, [compareFundIds]);

  // SIP Compounding Calculation
  useEffect(() => {
    let currentSip = sipMonthly;
    let totalInvested = 0;
    let balance = 0;
    const yearData = [];

    const monthlyRate = (sipReturnRate / 100) / 12;

    for (let yr = 1; yr <= sipPeriod; yr++) {
      let yearlyInvested = 0;
      for (let m = 0; m < 12; m++) {
        yearlyInvested += currentSip;
        balance = (balance + currentSip) * (1 + monthlyRate);
      }
      totalInvested += yearlyInvested;
      yearData.push({
        year: yr,
        invested: Math.round(totalInvested),
        wealth: Math.round(balance),
        currentSip: currentSip
      });
      // Step up SIP monthly amount at year end
      currentSip = currentSip * (1 + (sipStepUp / 100));
    }

    // Apply inflation adjustment if set
    const inflationAdjustedFutureValue = balance / Math.pow(1 + (sipInflation / 100), sipPeriod);

    // Compute approximate XIRR (simplified for regular monthly cash flows)
    const xirr = sipReturnRate; // Simplified proxy matching expectation rate

    setSipResult({
      futureValue: Math.round(balance),
      totalInvested: Math.round(totalInvested),
      estimatedWealth: Math.round(balance - totalInvested),
      inflationAdjusted: Math.round(inflationAdjustedFutureValue),
      xirr: xirr,
      chartData: yearData
    });
  }, [sipMonthly, sipReturnRate, sipPeriod, sipStepUp, sipInflation]);

  // Lumpsum Compounding Calculation
  useEffect(() => {
    const yearData = [];
    const r = lumpRate / 100;
    
    for (let yr = 0; yr <= lumpPeriod; yr++) {
      const futureVal = lumpAmount * Math.pow(1 + r, yr);
      yearData.push({
        year: yr,
        invested: lumpAmount,
        wealth: Math.round(futureVal)
      });
    }

    const finalVal = lumpAmount * Math.pow(1 + r, lumpPeriod);

    setLumpResult({
      futureValue: Math.round(finalVal),
      profit: Math.round(finalVal - lumpAmount),
      chartData: yearData
    });
  }, [lumpAmount, lumpRate, lumpPeriod]);

  // Filtered funds list for explorer search box
  const filteredExplorerFunds = funds.filter(f => 
    searchQuery === "" || 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.amc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-6 h-full overflow-hidden relative">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg bg-brand-success text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Top Tabs */}
      <div className="flex justify-between items-center border-b border-light-border dark:border-dark-border pb-1 shrink-0 overflow-x-auto">
        <div className="flex gap-2">
          {[
            { id: "explorer", label: "Explorer & Screener", icon: Search },
            { id: "compare", label: "Fund Comparison", icon: Landmark },
            { id: "sip", label: "SIP Compounding", icon: Calculator },
            { id: "lumpsum", label: "Lumpsum Calculator", icon: Calculator },
            { id: "watchlist", label: "Watchlist Alerts", icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveSubTab(tab.id as any); setSelectedFundId(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                  isActive 
                    ? "bg-brand-primary/10 text-brand-primary border-l-2 border-brand-primary" 
                    : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* View Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* SUBVIEW: EXPLORER & SCREENER */}
        {activeSubTab === "explorer" && !selectedFundId && (
          <div className="flex flex-col md:flex-row gap-6 h-full overflow-hidden">
            {/* Filter sidebar */}
            <div className="w-full md:w-64 glass-card p-4 rounded-lg flex flex-col space-y-4 shrink-0 h-fit md:h-full overflow-y-auto">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5">
                <Filter className="w-4 h-4" />
                Screener Filters
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-brand-muted block mb-1">Fund Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-transparent rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Categories</option>
                    <option value="Large Cap">Large Cap</option>
                    <option value="Mid Cap">Mid Cap</option>
                    <option value="Small Cap">Small Cap</option>
                    <option value="Flexi Cap">Flexi Cap</option>
                    <option value="ELSS (Tax Saver)">ELSS (Tax Saver)</option>
                    <option value="Liquid Funds">Liquid / Money Market</option>
                    <option value="Hybrid Funds">Hybrid Allocation</option>
                    <option value="Gold Funds">Precious Gold</option>
                    <option value="International Funds">International Tech</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-brand-muted block mb-1">Risk Classification</label>
                  <select
                    value={selectedRisk}
                    onChange={(e) => setSelectedRisk(e.target.value)}
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-transparent rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
                  >
                    <option value="All">All Risks</option>
                    <option value="Very High">Very High Risk</option>
                    <option value="High">High Risk</option>
                    <option value="Moderate">Moderate Risk</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-brand-muted mb-1">
                    <span>Max Expense Ratio</span>
                    <span className="font-mono text-brand-primary">{maxExpense}%</span>
                  </div>
                  <input
                    type="range" min="0.2" max="2.0" step="0.05"
                    value={maxExpense}
                    onChange={(e) => setMaxExpense(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-brand-muted mb-1">
                    <span>Min AUM (Crores)</span>
                    <span className="font-mono text-brand-primary">₹{minAum.toLocaleString()} Cr</span>
                  </div>
                  <input
                    type="range" min="0" max="50000" step="1000"
                    value={minAum}
                    onChange={(e) => setMinAum(parseInt(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Funds grid list */}
            <div className="flex-1 flex flex-col space-y-4 h-full overflow-hidden">
              <div className="flex items-center gap-2 border border-light-border dark:border-dark-border rounded px-3 py-2 bg-black/5 dark:bg-white/5 shrink-0 text-xs">
                <Search className="w-4 h-4 text-brand-muted" />
                <input
                  type="text"
                  placeholder="Search funds by name, category, or AMC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:outline-none w-full text-slate-800 dark:text-slate-200"
                />
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center text-brand-muted text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  Querying mutual funds database...
                </div>
              ) : filteredExplorerFunds.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-light-border dark:border-dark-border rounded-lg text-brand-muted text-xs p-12">
                  <AlertTriangle className="w-8 h-8 text-brand-warning mb-2" />
                  <span>No mutual funds match your screener criteria. Try expanding filters.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                  {filteredExplorerFunds.map((fund) => (
                    <div key={fund.id} className="glass-card p-4 rounded-lg flex justify-between items-center hover:border-brand-primary/25 transition-all group">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{fund.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold">{fund.category}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                            fund.risk_level === "Very High" ? "bg-brand-danger/10 text-brand-danger" : fund.risk_level === "High" ? "bg-brand-warning/10 text-brand-warning" : "bg-brand-secondary/10 text-brand-secondary"
                          }`}>{fund.risk_level} Risk</span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] text-brand-muted">
                          <span>AUM: <strong className="text-slate-700 dark:text-slate-300">₹{fund.aum_crore.toLocaleString()} Cr</strong></span>
                          <span>NAV: <strong className="text-slate-700 dark:text-slate-300">₹{fund.nav}</strong></span>
                          <span>Expense: <strong className="text-slate-700 dark:text-slate-300">{fund.expense_ratio_pct}%</strong></span>
                          <span>Manager: <strong className="text-slate-700 dark:text-slate-300">{fund.fund_manager}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4 shrink-0 font-mono text-right">
                        <div>
                          <span className="text-xs text-brand-secondary font-black block">{fund.returns["1y"]}</span>
                          <span className="text-[9px] text-brand-muted">1-Year Return</span>
                        </div>
                        <button
                          onClick={() => setSelectedFundId(fund.id)}
                          className="px-3 py-1.5 bg-brand-primary/5 hover:bg-brand-primary text-brand-primary hover:text-white rounded text-[10px] font-bold uppercase transition-colors"
                        >
                          Research
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* DETAILED FUND RESEARCH WORKSPACE (WHEN selectedFundId IS SET) */}
        {selectedFundId && selectedFund && (
          <div className="h-full flex flex-col overflow-hidden space-y-4">
            {/* Header info */}
            <div className="glass-card p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setSelectedFundId(null)} className="text-xs text-brand-primary hover:underline font-bold uppercase mr-2">&larr; Back to list</button>
                  <h2 className="text-base font-black text-slate-800 dark:text-white">{selectedFund.name}</h2>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold">{selectedFund.category}</span>
                </div>
                <div className="text-[10px] text-brand-muted font-mono">AMC: {selectedFund.amc} | Launch Date: {selectedFund.launch_date} | Benchmark: {selectedFund.benchmark}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleAddToWatchlist(selectedFund)}
                  className="px-3 py-1.5 border border-light-border dark:border-dark-border rounded text-[10px] font-bold uppercase hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted"
                >
                  Watchlist Fund
                </button>
                <button
                  onClick={async () => {
                    setAiReportLoading(true);
                    setShowAiReport(true);
                    // simulated RAG delay
                    setTimeout(() => setAiReportLoading(false), 1200);
                  }}
                  className="px-3 py-1.5 bg-brand-secondary hover:bg-brand-secondary/90 text-white rounded text-[10px] font-bold uppercase"
                >
                  AI Consensus Report
                </button>
              </div>
            </div>

            {/* Fund statistics grids */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                {[
                  { label: "Current NAV", value: `₹${selectedFund.nav}` },
                  { label: "Asset Size (AUM)", value: `₹${selectedFund.aum_crore.toLocaleString()} Cr` },
                  { label: "Expense Ratio", value: `${selectedFund.expense_ratio_pct}%` },
                  { label: "Risk Rating", value: selectedFund.risk_level }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-3 rounded-lg text-center font-mono">
                    <span className="text-[9px] text-brand-muted uppercase block">{stat.label}</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-white mt-0.5 block">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* Allocations & returns side by side */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card p-4 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Fund Return Matrix</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-mono text-center">
                      <thead>
                        <tr className="text-brand-muted border-b border-light-border dark:border-dark-border">
                          <th className="py-2 px-1 text-left font-sans">Period</th>
                          <th className="py-2 px-1">1M</th>
                          <th className="py-2 px-1">3M</th>
                          <th className="py-2 px-1">6M</th>
                          <th className="py-2 px-1">1Y</th>
                          <th className="py-2 px-1">3Y</th>
                          <th className="py-2 px-1">5Y</th>
                          <th className="py-2 px-1 font-sans">Inception</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-border dark:divide-dark-border">
                        <tr className="font-bold">
                          <td className="py-2.5 px-1 text-left font-sans text-slate-800 dark:text-slate-200">Return Rate</td>
                          <td className="py-2.5 px-1 text-brand-secondary">{selectedFund.returns["1m"]}</td>
                          <td className="py-2.5 px-1 text-brand-secondary">{selectedFund.returns["3m"]}</td>
                          <td className="py-2.5 px-1 text-brand-secondary">{selectedFund.returns["6m"]}</td>
                          <td className="py-2.5 px-1 text-brand-secondary">{selectedFund.returns["1y"]}</td>
                          <td className="py-2.5 px-1 text-brand-secondary">{selectedFund.returns["3y"]}</td>
                          <td className="py-2.5 px-1 text-brand-secondary">{selectedFund.returns["5y"]}</td>
                          <td className="py-2.5 px-1 text-brand-primary">{selectedFund.returns["inception"]}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Asset Allocation</h3>
                  <div className="space-y-2 text-xs">
                    {selectedFund.asset_allocation.map((aa, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-brand-muted">{aa.asset}</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{aa.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Holdings and Sector distributions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sector Allocation */}
                <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Sector Distributions</h3>
                  <div className="space-y-2.5 text-xs">
                    {selectedFund.sector_allocation.map((sa, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold text-brand-muted">
                          <span>{sa.sector}</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">{sa.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded overflow-hidden">
                          <div className="h-full bg-brand-primary rounded" style={{ width: `${sa.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Holdings */}
                <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Top Underlying Equity Holdings</h3>
                  <div className="space-y-2 text-xs font-mono">
                    {selectedFund.top_holdings.map((hold, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                        <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">{hold.company}</span>
                        <span className="font-bold text-brand-primary">{hold.percentage.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Report Sidebar overlay */}
            {showAiReport && (
              <div className="absolute inset-0 bg-black/60 z-50 flex justify-end">
                <div className="w-full max-w-xl bg-white dark:bg-[#0c111d] h-full shadow-2xl flex flex-col border-l border-light-border dark:border-dark-border">
                  <div className="p-4 border-b border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 flex justify-between items-center shrink-0">
                    <span className="font-black text-xs uppercase tracking-wider text-brand-secondary flex items-center gap-1">
                      <Cpu className="w-4 h-4 text-brand-secondary" />
                      AI Consensus Report — {selectedFund.name}
                    </span>
                    <button onClick={() => setShowAiReport(false)} className="text-brand-muted hover:text-slate-800 dark:hover:text-white font-bold">&times; Close</button>
                  </div>

                  {aiReportLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-brand-muted text-xs gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-brand-secondary" />
                      <span>Synthesizing multi-agent rolling ratios...</span>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                      <div>
                        <h4 className="font-black uppercase tracking-wider text-brand-primary text-[10px] mb-1">Executive Summary</h4>
                        <p>{selectedFund.research.summary}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-black uppercase tracking-wider text-brand-primary text-[10px] mb-1">Objective</h4>
                          <p>{selectedFund.research.objective}</p>
                        </div>
                        <div>
                          <h4 className="font-black uppercase tracking-wider text-brand-primary text-[10px] mb-1">Strategy</h4>
                          <p>{selectedFund.research.strategy}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-black uppercase tracking-wider text-brand-primary text-[10px] mb-2">Fund Risk Metrics</h4>
                        <div className="grid grid-cols-3 gap-3 text-center font-mono">
                          {[
                            { label: "Sharpe Ratio", value: selectedFund.research.risk_ratios.sharpe },
                            { label: "Sortino Ratio", value: selectedFund.research.risk_ratios.sortino },
                            { label: "Alpha", value: `+${selectedFund.research.risk_ratios.alpha}%` },
                            { label: "Beta", value: selectedFund.research.risk_ratios.beta },
                            { label: "Expected Volatility", value: `${selectedFund.research.risk_ratios.volatility}%` },
                            { label: "Max Drawdown", value: selectedFund.research.risk_ratios.drawdown }
                          ].map((rm, i) => (
                            <div key={i} className="p-2 border border-light-border dark:border-dark-border rounded bg-black/3 dark:bg-white/3">
                              <span className="text-[8px] text-brand-muted uppercase block leading-tight">{rm.label}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{rm.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-3 bg-brand-secondary/5 border border-brand-secondary/15 rounded-lg space-y-1.5">
                          <h5 className="font-extrabold uppercase text-[9px] text-brand-secondary tracking-widest block">Pros & Advantages</h5>
                          <ul className="list-disc pl-4 space-y-1">
                            {selectedFund.research.pros.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                        <div className="p-3 bg-brand-danger/5 border border-brand-danger/15 rounded-lg space-y-1.5">
                          <h5 className="font-extrabold uppercase text-[9px] text-brand-danger tracking-widest block">Cons & Disadvantages</h5>
                          <ul className="list-disc pl-4 space-y-1">
                            {selectedFund.research.cons.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      </div>

                      <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-lg">
                        <h4 className="font-black uppercase tracking-wider text-brand-primary text-[10px] mb-1">AI Investment Verdict</h4>
                        <div className="font-mono text-sm font-bold text-brand-primary mb-2 uppercase">{selectedFund.research.opinion}</div>
                        <p className="text-brand-muted text-[10px] italic">Suitability: {selectedFund.research.suitable_investors}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW: FUND COMPARISON */}
        {activeSubTab === "compare" && (
          <div className="space-y-6 h-full overflow-y-auto pr-1 pb-6">
            <div className="glass-card p-4 rounded-lg flex flex-col space-y-3">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2.5">Select Mutual Funds to Compare</h3>
              
              <div className="flex gap-4 items-center">
                <select
                  multiple
                  value={compareFundIds}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setCompareFundIds(values);
                  }}
                  className="w-full p-2 border border-light-border dark:border-dark-border bg-transparent rounded focus:outline-none focus:border-brand-primary text-xs h-24 text-slate-800 dark:text-slate-200"
                >
                  <option value="sbi-bluechip">SBI Bluechip Fund (Large Cap)</option>
                  <option value="hdfc-midcap">HDFC Mid-Cap Opportunities Fund (Mid Cap)</option>
                  <option value="nippon-smallcap">Nippon India Small Cap Fund (Small Cap)</option>
                  <option value="pp-flexicap">Parag Parikh Flexi Cap Fund (Flexi Cap)</option>
                  <option value="mirae-elss">Mirae Asset Tax Saver Fund (ELSS)</option>
                  <option value="icici-liquid">ICICI Prudential Liquid Fund (Liquid)</option>
                  <option value="sbi-hybrid">SBI Equity Hybrid Fund (Hybrid)</option>
                  <option value="hdfc-gold">HDFC Gold Fund (Gold)</option>
                  <option value="motilal-nasdaq">Motilal Oswal Nasdaq 100 FOF (International)</option>
                </select>
                <div className="text-[10px] text-brand-muted italic leading-snug w-48">
                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple funds.
                </div>
              </div>
            </div>

            {compareData.length > 0 && (
              <div className="glass-card rounded-lg overflow-hidden border border-light-border dark:border-dark-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-black/3 dark:bg-white/3 border-b border-light-border dark:border-dark-border">
                        <th className="px-4 py-3 font-extrabold uppercase text-brand-muted">Parameter</th>
                        {compareData.map(f => (
                          <th key={f.id} className="px-4 py-3 font-black text-slate-800 dark:text-white">{f.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Category</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 font-sans"><span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-bold bg-brand-primary/10 text-brand-primary">{f.category}</span></td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Current NAV</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3">₹{f.nav}</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Asset Size (AUM)</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3">₹{f.aum_crore.toLocaleString()} Cr</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Expense Ratio</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3">{f.expense_ratio_pct}%</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Risk Class</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 font-sans font-bold">{f.risk_level}</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">1-Year Return</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 text-brand-secondary font-bold">{f.returns["1y"]}</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">3-Year Return</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 text-brand-secondary font-bold">{f.returns["3y"]}</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Sharpe Ratio</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3">{f.research.risk_ratios.sharpe}</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Alpha</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 text-brand-secondary">+{f.research.risk_ratios.alpha}%</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Beta</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3">{f.research.risk_ratios.beta}</td>)}
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-sans font-bold text-slate-700 dark:text-slate-300">Fund Manager</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 font-sans">{f.fund_manager}</td>)}
                      </tr>
                      <tr className="bg-brand-primary/5 text-brand-primary">
                        <td className="px-4 py-3 font-sans font-bold">AI Verdict</td>
                        {compareData.map(f => <td key={f.id} className="px-4 py-3 font-bold uppercase">{f.research.opinion}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW: SIP CALCULATOR */}
        {activeSubTab === "sip" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
            {/* Input sliders */}
            <div className="lg:col-span-1 glass-card p-4 rounded-lg flex flex-col space-y-4 overflow-y-auto h-full pr-1">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2.5">SIP Inputs</h3>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Monthly SIP Amount</span>
                    <span className="font-mono text-brand-primary">₹{sipMonthly.toLocaleString()}</span>
                  </div>
                  <input
                    type="range" min="500" max="100000" step="500"
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(parseInt(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Expected Return Rate (CAGR)</span>
                    <span className="font-mono text-brand-primary">{sipReturnRate}%</span>
                  </div>
                  <input
                    type="range" min="5" max="30" step="0.5"
                    value={sipReturnRate}
                    onChange={(e) => setSipReturnRate(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Investment Horizon</span>
                    <span className="font-mono text-brand-primary">{sipPeriod} Years</span>
                  </div>
                  <input
                    type="range" min="1" max="40" step="1"
                    value={sipPeriod}
                    onChange={(e) => setSipPeriod(parseInt(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Annual SIP Step-up</span>
                    <span className="font-mono text-brand-primary">{sipStepUp}%</span>
                  </div>
                  <input
                    type="range" min="0" max="25" step="1"
                    value={sipStepUp}
                    onChange={(e) => setSipStepUp(parseInt(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Inflation Rate</span>
                    <span className="font-mono text-brand-primary">{sipInflation}%</span>
                  </div>
                  <input
                    type="range" min="0" max="12" step="0.5"
                    value={sipInflation}
                    onChange={(e) => setSipInflation(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Calculations outputs */}
            <div className="lg:col-span-3 glass-card p-6 rounded-lg overflow-y-auto h-full flex flex-col space-y-6">
              {sipResult && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-b border-light-border dark:border-dark-border pb-4 font-mono text-center">
                    <div className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Total Invested</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">₹{sipResult.totalInvested.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Estimated Wealth Gain</span>
                      <span className="text-sm font-bold text-brand-primary mt-1 block">₹{sipResult.estimatedWealth.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-brand-secondary/5 border border-brand-secondary/10 rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Total Future Value</span>
                      <span className="text-sm font-bold text-brand-secondary mt-1 block">₹{sipResult.futureValue.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Inflation Adj. Value</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">₹{sipResult.inflationAdjusted.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Compound Growth Canvas Chart */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-brand-primary tracking-wider">SIP Compound Growth Schedule</h4>
                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg h-60 flex items-end gap-2.5">
                      {sipResult.chartData.map((data: any, idx: number) => {
                        const maxVal = sipResult.futureValue;
                        const investedHeight = (data.invested / maxVal) * 100;
                        const wealthHeight = (data.wealth / maxVal) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                            {/* tooltip */}
                            <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[8px] font-mono p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 w-24 text-center pointer-events-none">
                              Yr {data.year}: ₹{data.wealth.toLocaleString()}
                            </div>
                            
                            <div className="w-full flex gap-1 items-end h-full">
                              <div className="w-1/2 bg-brand-muted rounded-t" style={{ height: `${investedHeight}%` }}></div>
                              <div className="w-1/2 bg-brand-primary rounded-t" style={{ height: `${wealthHeight}%` }}></div>
                            </div>
                            <span className="text-[9px] font-mono text-brand-muted mt-1.5">Yr {data.year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SUBVIEW: LUMPSUM CALCULATOR */}
        {activeSubTab === "lumpsum" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
            <div className="lg:col-span-1 glass-card p-4 rounded-lg flex flex-col space-y-4 overflow-y-auto h-full pr-1">
              <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2.5">Lumpsum Inputs</h3>
              
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Investment Amount</span>
                    <span className="font-mono text-brand-primary">₹{lumpAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range" min="5000" max="1000000" step="5000"
                    value={lumpAmount}
                    onChange={(e) => setLumpAmount(parseInt(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Expected CAGR Rate</span>
                    <span className="font-mono text-brand-primary">{lumpRate}%</span>
                  </div>
                  <input
                    type="range" min="5" max="30" step="0.5"
                    value={lumpRate}
                    onChange={(e) => setLumpRate(parseFloat(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-semibold text-brand-muted">
                    <span>Horizon</span>
                    <span className="font-mono text-brand-primary">{lumpPeriod} Years</span>
                  </div>
                  <input
                    type="range" min="1" max="40" step="1"
                    value={lumpPeriod}
                    onChange={(e) => setLumpPeriod(parseInt(e.target.value))}
                    className="w-full accent-brand-primary"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 glass-card p-6 rounded-lg overflow-y-auto h-full flex flex-col space-y-6">
              {lumpResult && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-light-border dark:border-dark-border pb-4 font-mono text-center">
                    <div className="p-3 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Principal Invested</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">₹{lumpAmount.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Estimated Gain (Profit)</span>
                      <span className="text-sm font-bold text-brand-primary mt-1 block">₹{lumpResult.profit.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-brand-secondary/5 border border-brand-secondary/10 rounded">
                      <span className="text-[9px] text-brand-muted uppercase block leading-tight">Total Future Value</span>
                      <span className="text-sm font-bold text-brand-secondary mt-1 block">₹{lumpResult.futureValue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-brand-primary tracking-wider">Lumpsum Capital Compounding</h4>
                    <div className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg h-60 flex items-end gap-2.5">
                      {lumpResult.chartData.map((data: any, idx: number) => {
                        const maxVal = lumpResult.futureValue;
                        const investedHeight = (data.invested / maxVal) * 100;
                        const wealthHeight = (data.wealth / maxVal) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative">
                            {/* tooltip */}
                            <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[8px] font-mono p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 w-24 text-center pointer-events-none">
                              Yr {data.year}: ₹{data.wealth.toLocaleString()}
                            </div>
                            
                            <div className="w-full flex gap-1 items-end h-full">
                              <div className="w-1/2 bg-brand-muted rounded-t" style={{ height: `${investedHeight}%` }}></div>
                              <div className="w-1/2 bg-brand-primary rounded-t" style={{ height: `${wealthHeight}%` }}></div>
                            </div>
                            <span className="text-[9px] font-mono text-brand-muted mt-1.5">Yr {data.year}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* SUBVIEW: WATCHLIST */}
        {activeSubTab === "watchlist" && (
          <div className="space-y-6 h-full overflow-y-auto pr-1 pb-6">
            {watchlist.length === 0 ? (
              <div className="glass-card rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-5 bg-brand-primary/10 rounded-full">
                  <Star className="w-8 h-8 text-brand-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-white">Mutual Fund Watchlist is Empty</h2>
                  <p className="text-xs text-brand-muted mt-1">Add funds from the explorer tab to monitor live alerts and SIP schedules.</p>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl overflow-hidden border border-light-border dark:border-dark-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-light-border dark:border-dark-border bg-black/3 dark:bg-white/3">
                        <th className="text-left px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Fund</th>
                        <th className="text-left px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Category</th>
                        <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Alert Threshold NAV</th>
                        <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">SIP Day of Month</th>
                        <th className="text-left px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Conviction notes</th>
                        <th className="text-center px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlist.map((item) => (
                        <tr key={item.id} className="border-b border-light-border dark:border-dark-border hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3 font-bold text-brand-primary uppercase font-mono">{item.name}</td>
                          <td className="px-4 py-3"><span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold">{item.category}</span></td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.alert_nav ? `₹${item.alert_nav}` : "—"}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{item.sip_reminder_day ? `${item.sip_reminder_day}th` : "—"}</td>
                          <td className="px-4 py-3 text-brand-muted">{item.notes || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleRemoveWatchlist(item.id)}
                              className="p-1.5 hover:bg-brand-danger/10 text-brand-danger rounded transition-colors"
                              title="Delete from Watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
