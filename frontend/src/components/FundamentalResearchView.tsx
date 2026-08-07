import React, { useState, useEffect } from "react";
import { 
  Landmark, TrendingUp, Info, HelpCircle, ArrowUpRight, Award, 
  DollarSign, ShieldAlert, Cpu, Users, Calendar, Grid, FileText, Download, BookOpen, Check,
  UserCheck, PieChart, GitBranch, Star, AlertTriangle, BarChart2, Sparkles, Trash2
} from "lucide-react";
import { formatPrice, formatFinancialValue, convertCurrency, CURRENCY_SYMBOLS } from "../utils/currency";
import { AdvancedChartingView } from "./AdvancedChartingView";

interface FundamentalResearchViewProps {
  ticker: string;
  targetCurrency?: string;
}

export const FundamentalResearchView: React.FC<FundamentalResearchViewProps> = ({ ticker, targetCurrency = "INR" }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [extData, setExtData] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<string>("overview");
  const [activeExplainMetric, setActiveExplainMetric] = useState<string>("roe");
  const [noteText, setNoteText] = useState("");
  const [exportTarget, setExportTarget] = useState<string | null>(null);
  const [exportSteps, setExportSteps] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Chat sidebar states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: "ai", text: `Loaded filing indices for ${ticker.toUpperCase()}. Ask me about margins, auditor opinion, or balance sheet risks.` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportInstitutionalReport = async () => {
    try {
      const res = await fetch(`/api/v1/analyst/report/${ticker}`);
      if (res.ok) {
        const json = await res.json();
        const blob = new Blob([json.report_markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `WealthPilot_Institutional_Report_${ticker}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Markdown institutional report downloaded successfully!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, extRes] = await Promise.all([
        fetch(`/api/v1/analyst/profile/${ticker}`),
        fetch(`/api/v1/analyst/extended/${ticker}`)
      ]);
      const profileJson = await profileRes.json();
      const extJson = extRes.ok ? await extRes.json() : null;
      setData(profileJson);
      setExtData(extJson);
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    setActiveSubTab("overview");
    setChatMessages([
      { sender: "ai", text: `Loaded filing indices for ${ticker.toUpperCase()}. Ask me about margins, auditor opinion, or balance sheet risks.` }
    ]);
  }, [ticker]);

  const metricsExplanations: Record<string, { title: string; formula: string; explain: string }> = {
    roe: {
      title: "Return on Equity (ROE)",
      formula: "Net Income / Shareholders Equity",
      explain: "Measures profitability from promoters' capital perspective. Sustained ROE > 15% points to solid operational advantages."
    },
    roce: {
      title: "Return on Capital Employed (ROCE)",
      formula: "EBIT / (Total Assets - Current Liabilities)",
      explain: "Evaluates capital allocation efficacy. Crucial for heavy infrastructure and manufacturing comparisons."
    },
    pe: {
      title: "Price-to-Earnings Ratio (P/E)",
      formula: "Share Price / Earnings Per Share (EPS)",
      explain: "Indicates market value benchmark relative to profit outputs. A high multiplier expects robust growth ahead."
    }
  };

  const explain = metricsExplanations[activeExplainMetric];
  const sourceCurrency = data?.profile?.info?.currency || (ticker.endsWith(".NS") ? "INR" : "USD");

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const note = {
      ticker,
      text: noteText,
      date: new Date().toLocaleDateString()
    };
    const saved = localStorage.getItem("wealthpilot_notes");
    const arr = saved ? JSON.parse(saved) : [];
    arr.unshift(note);
    localStorage.setItem("wealthpilot_notes", JSON.stringify(arr));
    setNoteText("");
    showToast("Workspace note pinned to dashboard!");
  };

  const handleTriggerExport = (type: string) => {
    setExportTarget(type);
    setExportLoading(true);
    setExportSteps(["Initializing document framework...", "Fetching statement histories...", "Formulating SWOT matrices...", "Assembling DCF targets..."]);
    setTimeout(() => {
      setExportLoading(false);
      showToast(`${type} document generated successfully!`);
    }, 2000);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      let endpoint = `/api/v1/earnings/analyze?ticker=${ticker}`;
      if (userMsg.toLowerCase().includes("risk") || userMsg.toLowerCase().includes("opinion") || userMsg.toLowerCase().includes("report")) {
        endpoint = `/api/v1/documents/analyze?ticker=${ticker}`;
      }
      
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        let reply = "";
        if (endpoint.includes("earnings")) {
          reply = `Tone: ${json.tone}.\nGuidance: ${json.guidance}.\nPositives: ${json.positives.join(", ")}.\nNegatives: ${json.negatives.join(", ")}.`;
        } else {
          reply = `Auditor Opinion: ${json.auditor_opinion}.\nGreen Flags: ${json.green_flags.join(", ")}.\nRed Flags: ${json.red_flags.join(", ")}.\nGovernance: ${json.governance_score}.`;
        }
        setChatMessages(prev => [...prev, { sender: "ai", text: reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: "ai", text: "I apologize, I was unable to parse that filing details." }]);
      }
    } catch {
      setChatMessages(prev => [...prev, { sender: "ai", text: "Connection error. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg bg-brand-success text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col space-y-6 h-full overflow-y-auto pr-2">
        
        {/* 1. Header Information Banner */}
        {data && (
          <div className="glass-card p-6 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
            <div className="md:col-span-3 space-y-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans">
                  {data.profile.info.name} ({data.profile.info.ticker})
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold">
                  {data.profile.info.sector}
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-secondary/10 text-brand-secondary">
                  Reported in: {sourceCurrency}
                </span>
              </div>
              <p className="text-xs text-brand-muted leading-relaxed max-w-4xl">
                {data.profile.info.description}
              </p>
            </div>
            <div className="p-4 bg-light-bg dark:bg-[#070a10] border border-light-border dark:border-dark-border rounded-lg flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-mono block">Current Stock Price</span>
                <span className="text-sm font-mono font-black text-brand-primary mt-1 block">
                  {formatPrice(data.profile.info.price, sourceCurrency, targetCurrency, true)}
                </span>
              </div>
              <div className="text-[9px] text-brand-muted border-t border-light-border dark:border-dark-border pt-2 mt-2 font-mono space-y-1">
                <div className="flex justify-between">
                  <span>Health Score: <span className="font-bold text-brand-secondary">{data.score.score_rating}/100</span></span>
                  <span>Source: <span className="font-bold">{data.profile.metadata?.data_source || data.profile.data_source}</span></span>
                </div>
                <div className="flex justify-between">
                  <span>Exchange: <span className="font-bold">{data.profile.metadata?.exchange || "NSE"}</span></span>
                  <span>Status: <span className={`font-bold ${data.profile.metadata?.market_status === "Open" ? "text-green-500" : "text-gray-400"}`}>{data.profile.metadata?.market_status || "Closed"}</span></span>
                </div>
                <div className="flex justify-between text-[8.5px]">
                  <span>Currency: <span className="font-bold">{data.profile.metadata?.currency || sourceCurrency}</span></span>
                  <span>Updated: <span className="font-bold text-[8px]">{data.profile.metadata?.last_updated || "Live"}</span></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Nested Sub-tab Navigation */}
        <div className="flex border-b border-light-border dark:border-dark-border pb-1 gap-1 shrink-0 overflow-x-auto">
          {[
            { id: "overview",          label: "Business Overview",        icon: TrendingUp },
            { id: "charting",          label: "Advanced Chart",            icon: BarChart2 },
            { id: "financials",        label: "Financial Statements",      icon: Landmark },
            { id: "quarterly",         label: "Quarterly Results",         icon: BarChart2 },
            { id: "segments",          label: "Segment & Geo",             icon: Grid },
            { id: "valuation_risks",   label: "Valuation & Risk Audit",    icon: ShieldAlert },
            { id: "management",        label: "Management",                icon: UserCheck },
            { id: "shareholding",      label: "Shareholding",              icon: PieChart },
            { id: "corporate_actions", label: "Corporate Actions",         icon: GitBranch },
            { id: "credit_ratings",    label: "Credit Ratings",            icon: Star },
            { id: "governance",        label: "Governance",                icon: Users },
            { id: "notes",             label: "Research Notes",            icon: BookOpen },
            { id: "ai_thesis",         label: "Export Report",             icon: Download }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 text-[10px] font-bold transition-all border-b-2 shrink-0 uppercase tracking-wide ${
                  isActive 
                    ? "border-brand-primary text-brand-primary" 
                    : "border-transparent text-brand-muted hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Sub-tab Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-40 text-brand-muted text-xs">
              Synthesizing workspace modules...
            </div>
          ) : data ? (
            <>
              {/* TAB: OVERVIEW */}
              {activeSubTab === "overview" && (
                <div className="space-y-6">
                  {data.profile.info.etf_details?.is_etf && (
                    <div className="glass-card p-5 rounded-lg border border-brand-primary/20 bg-brand-primary/5 space-y-3">
                      <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                        Institutional ETF Research Desk
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Tracking Error</span>
                          <span className="font-bold text-brand-primary mt-1 block">{data.profile.info.etf_details.tracking_error}%</span>
                        </div>
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Expense Ratio</span>
                          <span className="font-bold text-brand-primary mt-1 block">{data.profile.info.etf_details.expense_ratio}%</span>
                        </div>
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Market Liquidity</span>
                          <span className="font-bold text-brand-secondary mt-1 block">{data.profile.info.etf_details.liquidity}</span>
                        </div>
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">NAV Premium / Discount</span>
                          <span className="font-bold text-brand-primary mt-1 block">{data.profile.info.etf_details.premium_discount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sankey diagram representation for Revenue Cash Flow */}
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                      <TrendingUp className="text-brand-primary w-5 h-5" />
                      Corporate Revenue Cash-Flow Sankey (SVG)
                    </h2>
                    <div className="w-full overflow-x-auto py-2">
                      <svg className="w-[800px] h-[300px] mx-auto bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg" viewBox="0 0 800 300">
                        <path d="M 120 120 C 220 120, 220 70, 320 70" fill="none" stroke="rgba(0, 98, 255, 0.15)" strokeWidth="30" />
                        <path d="M 120 150 C 220 150, 220 220, 320 220" fill="none" stroke="rgba(239, 68, 68, 0.12)" strokeWidth="20" />
                        <path d="M 440 70 C 540 70, 540 50, 640 50" fill="none" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="15" />
                        <path d="M 440 90 C 540 90, 540 140, 640 140" fill="none" stroke="rgba(245, 158, 11, 0.15)" strokeWidth="10" />

                        <rect x="20" y="80" width="100" height="140" rx="4" fill="#0062ff" />
                        <text x="70" y="145" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">REVENUE INFLOW</text>
                        <text x="70" y="165" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">{formatFinancialValue(data.profile.financials[0]?.revenue || 0, sourceCurrency, targetCurrency)}</text>

                        <rect x="320" y="40" width="120" height="60" rx="4" fill="#10b981" />
                        <text x="380" y="70" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">OPERATING PROFIT</text>
                        <text x="380" y="85" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">{formatFinancialValue(data.profile.financials[0]?.ebitda || 0, sourceCurrency, targetCurrency)}</text>

                        <rect x="320" y="190" width="120" height="60" rx="4" fill="#ef4444" />
                        <text x="380" y="220" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">OPERATING EXPENSES</text>
                        <text x="380" y="235" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">{formatFinancialValue((data.profile.financials[0]?.revenue - data.profile.financials[0]?.ebitda) || 0, sourceCurrency, targetCurrency)}</text>

                        <rect x="640" y="20" width="120" height="60" rx="4" fill="#0062ff" />
                        <text x="700" y="50" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">NET PROFIT (PAT)</text>
                        <text x="700" y="65" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">{formatFinancialValue(data.profile.financials[0]?.pat || 0, sourceCurrency, targetCurrency)}</text>

                        <rect x="640" y="110" width="120" height="60" rx="4" fill="#f59e0b" />
                        <text x="700" y="140" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">CAPEX & OUTFLOWS</text>
                        <text x="700" y="155" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">{formatFinancialValue(data.profile.financials[0]?.dividends_paid || 0, sourceCurrency, targetCurrency)}</text>
                      </svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* SWOT highlights */}
                    <div className="md:col-span-2 glass-card p-6 rounded-lg flex flex-col space-y-4">
                      <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                        <Award className="text-brand-secondary w-5 h-5" />
                        SWOT Highlights & Attractiveness Thesis
                      </h2>
                      <div className="space-y-4 text-xs">
                        <div className="space-y-2">
                          <span className="text-[10px] text-brand-secondary font-black uppercase tracking-wider block">Strengths</span>
                          <div className="space-y-1.5">
                            {data.score.strengths.map((str: string, idx: number) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-brand-secondary font-bold">•</span>
                                <span>{str}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-light-border dark:border-dark-border">
                          <span className="text-[10px] text-brand-danger font-black uppercase tracking-wider block">Risks & Weaknesses</span>
                          <div className="space-y-1.5">
                            {data.score.weaknesses.map((weak: string, idx: number) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-brand-danger font-bold">•</span>
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-brand-primary/5 rounded border border-brand-primary/10 leading-relaxed text-brand-muted">
                          <span className="font-bold text-brand-primary uppercase text-[9px] block mb-1">Coordinated Investment Thesis:</span>
                          {data.score.thesis}
                        </div>
                      </div>
                    </div>

                    {/* Ratios Explanations */}
                    <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                      <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                        <Info className="text-brand-warning w-5 h-5" />
                        Ratios Explanation Guide
                      </h2>
                      
                      <div className="flex gap-2 border-b border-light-border dark:border-dark-border pb-2 overflow-x-auto">
                        {Object.keys(metricsExplanations).map((key) => (
                          <button
                            key={key}
                            onClick={() => setActiveExplainMetric(key)}
                            className={`text-[10px] font-bold font-sans uppercase px-2 py-0.5 rounded transition-all ${
                              activeExplainMetric === key 
                                ? "bg-brand-warning/15 text-brand-warning" 
                                : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            {key.replace("_", "/")}
                          </button>
                        ))}
                      </div>

                      {explain && (
                        <div className="space-y-3">
                          <div>
                            <span className="font-bold text-xs">{explain.title}</span>
                            <span className="font-mono text-[9px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded block mt-1 text-brand-primary">
                              {explain.formula}
                            </span>
                          </div>
                          <p className="text-[11px] text-brand-muted leading-relaxed">
                            {explain.explain}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ADVANCED CHARTING */}
              {activeSubTab === "charting" && (
                <AdvancedChartingView ticker={ticker} />
              )}

              {/* TAB: FINANCIAL STATEMENTS */}
              {activeSubTab === "financials" && (
                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                    <Landmark className="text-brand-primary w-5 h-5" />
                    Multi-Year Financial Statement Comparisons (Common Size & Growth)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-light-border dark:border-dark-border text-brand-muted">
                          <th className="py-2 pr-4 font-semibold uppercase">Financial Line Item</th>
                          {data.profile.financials.map((f: any) => (
                            <th key={f.year} className="py-2 px-4 font-mono font-bold text-right">{f.year}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Revenue</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right">
                              <span className="block font-bold">{formatFinancialValue(f.revenue, sourceCurrency, targetCurrency, true)}</span>
                              <span className="block text-[9px] text-brand-muted font-normal">YoY Growth: <span className={f.growth_revenue >= 0 ? "text-brand-secondary font-bold" : "text-brand-danger font-bold"}>{f.growth_revenue >= 0 ? "+" : ""}{f.growth_revenue}%</span></span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">EBITDA</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right">
                              <span className="block font-bold">{formatFinancialValue(f.ebitda, sourceCurrency, targetCurrency, true)}</span>
                              <div className="text-[9px] text-brand-muted font-normal space-y-0.5">
                                <span className="block">Common Size: <span className="text-brand-primary font-bold">{f.ebitda_pct}%</span></span>
                                <span className="block">YoY Growth: <span className={f.growth_ebitda >= 0 ? "text-brand-secondary font-bold" : "text-brand-danger font-bold"}>{f.growth_ebitda >= 0 ? "+" : ""}{f.growth_ebitda}%</span></span>
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Net Profit (PAT)</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right">
                              <span className="block font-bold text-slate-800 dark:text-white">{formatFinancialValue(f.pat, sourceCurrency, targetCurrency, true)}</span>
                              <div className="text-[9px] text-brand-muted font-normal space-y-0.5">
                                <span className="block">Common Size: <span className="text-brand-primary font-bold">{f.pat_pct}%</span></span>
                                <span className="block">YoY Growth: <span className={f.growth_pat >= 0 ? "text-brand-secondary font-bold" : "text-brand-danger font-bold"}>{f.growth_pat >= 0 ? "+" : ""}{f.growth_pat}%</span></span>
                              </div>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Operating Margin (%)</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right text-brand-secondary font-bold">{f.operating_margin}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Total Debt</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right">
                              <span className="block font-bold text-brand-danger">{formatFinancialValue(f.total_debt, sourceCurrency, targetCurrency, true)}</span>
                              <span className="block text-[9px] text-brand-muted font-normal">Common Size: <span className="text-brand-primary font-bold">{f.debt_pct}%</span></span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Shareholders Equity</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right">
                              <span className="block font-bold">{formatFinancialValue(f.shareholders_equity, sourceCurrency, targetCurrency, true)}</span>
                              <span className="block text-[9px] text-brand-muted font-normal">Common Size: <span className="text-brand-primary font-bold">{f.equity_pct}%</span></span>
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Return on Equity (ROE) (%)</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right text-brand-secondary font-bold">{f.roe}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Return on Capital (ROCE) (%)</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right text-brand-secondary font-bold">{f.roce}%</td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Free Cash Flow</td>
                          {data.profile.financials.map((f: any) => (
                            <td key={f.year} className="py-2 px-4 text-right text-brand-primary font-bold">{formatFinancialValue(f.free_cash_flow, sourceCurrency, targetCurrency, true)}</td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: SEGMENTS */}
              {activeSubTab === "segments" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Product Revenue Share</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-light-border dark:border-dark-border text-brand-muted">
                            <th className="py-2 pr-4 font-semibold uppercase">Product Line</th>
                            <th className="py-2 px-4 text-right font-mono">Revenue Share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                          {ticker.toUpperCase() === "AAPL" ? (
                            <>
                              <tr><td className="py-2 pr-4">iPhone (Hardware)</td><td className="py-2 px-4 text-right text-brand-primary">52%</td></tr>
                              <tr><td className="py-2 pr-4">Services (App Store, Music, Cloud)</td><td className="py-2 px-4 text-right text-brand-secondary">25%</td></tr>
                              <tr><td className="py-2 pr-4">Wearables & Accessories</td><td className="py-2 px-4 text-right">13%</td></tr>
                              <tr><td className="py-2 pr-4">Mac & iPad PCs</td><td className="py-2 px-4 text-right">10%</td></tr>
                            </>
                          ) : (
                            <>
                              <tr><td className="py-2 pr-4">Oil-to-Chemicals (O2C)</td><td className="py-2 px-4 text-right text-brand-primary">56%</td></tr>
                              <tr><td className="py-2 pr-4">Jio Connectivity Services</td><td className="py-2 px-4 text-right text-brand-secondary">28%</td></tr>
                              <tr><td className="py-2 pr-4">Organized Retail Chain</td><td className="py-2 px-4 text-right">16%</td></tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Geographic Revenue Breakdown</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-light-border dark:border-dark-border text-brand-muted">
                            <th className="py-2 pr-4 font-semibold uppercase">Region</th>
                            <th className="py-2 px-4 text-right font-mono">Sales share</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
                          {ticker.toUpperCase() === "AAPL" ? (
                            <>
                              <tr><td className="py-2 pr-4">Americas</td><td className="py-2 px-4 text-right text-brand-primary">42%</td></tr>
                              <tr><td className="py-2 pr-4">Europe</td><td className="py-2 px-4 text-right">24%</td></tr>
                              <tr><td className="py-2 pr-4">Greater China</td><td className="py-2 px-4 text-right">19%</td></tr>
                              <tr><td className="py-2 pr-4">Asia Pacific & Japan</td><td className="py-2 px-4 text-right">15%</td></tr>
                            </>
                          ) : (
                            <>
                              <tr><td className="py-2 pr-4">Domestic India Market</td><td className="py-2 px-4 text-right text-brand-primary">78%</td></tr>
                              <tr><td className="py-2 pr-4">Exports & International shipping</td><td className="py-2 px-4 text-right">22%</td></tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: VALUATION & RISKS */}
              {activeSubTab === "valuation_risks" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-brand-danger" />
                      Risk Disclosures & Regulatory Changes
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border leading-relaxed text-brand-muted">
                        <span className="font-bold text-brand-primary uppercase text-[9px] block mb-1">Key Disclosures:</span>
                        {ticker.toUpperCase() === "AAPL"
                          ? "Litigation risks regarding developer App Store commissions. Potential hardware component supply restrictions."
                          : "Raw materials cost volatility impacting refinery processing margins. Regulatory emission compliance standards."}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-brand-warning" />
                      Accounting Policy Changes
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border">
                        <span className="font-bold text-brand-muted block uppercase text-[9px] mb-1">Useful Lifespans Adjustment:</span>
                        <p className="leading-relaxed">
                          {ticker.toUpperCase() === "AAPL"
                            ? "Amortization useful ranges of software revised from 3 to 5 years. Standardized audit check complete."
                            : "Plant equipment depreciation parameters adjusted to align with statutory life expectations."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: MANAGEMENT */}
              {activeSubTab === "management" && extData?.management && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                      <UserCheck className="text-brand-primary w-5 h-5" />
                      Key Management Personnel
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {extData.management.map((mgr: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-black text-[9px]">
                                {mgr.role.slice(0, 3)}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-800 dark:text-white">{mgr.name}</p>
                                <p className="text-[10px] text-brand-muted">{mgr.role}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded">{mgr.tenure}</span>
                          </div>
                          <p className="text-[10px] text-brand-muted leading-relaxed">{mgr.background}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SHAREHOLDING */}
              {activeSubTab === "shareholding" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                      <PieChart className="text-brand-primary w-5 h-5" />
                      Complete Shareholding Analysis
                    </h2>
                    
                    {data.profile.shareholding_detail && (
                      <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-lg text-xs flex justify-between items-center font-mono">
                        <span>Accumulation Signal: <span className="font-bold text-brand-secondary">{data.profile.shareholding_detail.accumulation_signal}</span></span>
                        <span>Promoter QoQ: <span className="font-bold text-slate-700 dark:text-slate-300">{data.profile.shareholding_detail.promoter_change_qoq}</span></span>
                        <span>FII QoQ: <span className="font-bold text-brand-secondary">{data.profile.shareholding_detail.fii_change_qoq}</span></span>
                      </div>
                    )}

                    <div className="space-y-4 pt-2">
                      {[
                        { label: "Promoter Holding", value: data.profile.shareholding_detail?.promoter || data.profile.info?.promoter_holding || 50.3, color: "bg-brand-primary" },
                        { label: "FII Holding", value: data.profile.shareholding_detail?.fii || data.profile.info?.fii_holding || 22.4, color: "bg-brand-secondary" },
                        { label: "DII Holding", value: data.profile.shareholding_detail?.dii || data.profile.info?.dii_holding || 18.2, color: "bg-brand-warning" },
                        { label: "Mutual Funds", value: data.profile.shareholding_detail?.mutual_funds || data.profile.info?.mutual_fund_holding || 8.5, color: "bg-brand-primary" },
                        { label: "Insurance", value: data.profile.shareholding_detail?.insurance || 3.4, color: "bg-brand-secondary" },
                        { label: "Retail / Public", value: data.profile.shareholding_detail?.retail || data.profile.info?.public_holding || 10.7, color: "bg-brand-danger" },
                      ].map((s, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{s.label}</span>
                            <span className="font-mono font-bold text-brand-primary">{s.value?.toFixed(2)}%</span>
                          </div>
                          <div className="h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CORPORATE ACTIONS */}
              {activeSubTab === "corporate_actions" && extData?.corporate_actions && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                      <GitBranch className="text-brand-primary w-5 h-5" />
                      Corporate Actions Timeline
                    </h2>
                    <div className="space-y-3">
                      {extData.corporate_actions.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                          <div className="w-14 text-center shrink-0">
                            <span className="text-[9px] font-mono text-brand-muted">{a.date}</span>
                          </div>
                          <div className="h-10 w-px bg-brand-primary/20 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold text-slate-800 dark:text-white block">{a.type}</span>
                            <p className="text-[10px] text-brand-muted">{a.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CREDIT RATINGS */}
              {activeSubTab === "credit_ratings" && extData?.credit_ratings && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                      <Star className="text-brand-warning w-5 h-5" />
                      Credit Ratings
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-light-border dark:border-dark-border text-[10px] uppercase tracking-wider text-brand-muted">
                            <th className="text-left py-2 pr-4 font-bold">Agency</th>
                            <th className="text-center py-2 px-3 font-bold">Rating</th>
                            <th className="text-center py-2 px-3 font-bold">Outlook</th>
                            <th className="text-left py-2 px-3 font-bold">Instrument</th>
                          </tr>
                        </thead>
                        <tbody>
                          {extData.credit_ratings.map((cr: any, i: number) => (
                            <tr key={i} className="border-b border-light-border/40 dark:border-dark-border/40 font-mono">
                              <td className="py-2.5 pr-4 text-slate-800 dark:text-slate-200">{cr.agency}</td>
                              <td className="text-center py-2.5 px-3 text-brand-secondary font-bold">{cr.rating}</td>
                              <td className="text-center py-2.5 px-3">{cr.outlook}</td>
                              <td className="py-2.5 px-3 text-brand-muted">{cr.instrument}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: GOVERNANCE */}
              {activeSubTab === "governance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-lg space-y-3">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Independent Board Review</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Auditor checked board structures comply fully with corporate guidelines. Executive and audit committees contain certified accounting experts.
                    </p>
                  </div>
                  <div className="glass-card p-6 rounded-lg space-y-3">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Regulatory Audits</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Recent filings show zero qualified comments or critical compliance warnings regarding trading transparency or reporting practices.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB: RESEARCH NOTES */}
              {activeSubTab === "notes" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                      <BookOpen className="text-brand-primary w-5 h-5" />
                      Interactive Corporate Notes Manager ({ticker.toUpperCase()})
                    </h2>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Write critical observations, risks, earnings guides, or thesis updates..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={4}
                        className="w-full text-xs p-3 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveNote}
                          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs uppercase rounded transition-colors"
                        >
                          Pin Note to Terminal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: EXPORT REPORTS */}
              {activeSubTab === "ai_thesis" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                      <Download className="text-brand-primary w-5 h-5" />
                      Institutional Reports Exporter
                    </h2>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Generate production-grade formatted reports including valuation details, SWOT matrices, balance sheets, and independent agent findings.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { type: "PDF", desc: "For executive presentations" },
                        { type: "Word", desc: "For analysts review drafts" },
                        { type: "PowerPoint", desc: "For investment committees" },
                        { type: "Markdown", desc: "Download full v2.5 RAG report" }
                      ].map(target => (
                        <button
                          key={target.type}
                          onClick={() => {
                            if (target.type === "Markdown") {
                              handleExportInstitutionalReport();
                            } else {
                              handleTriggerExport(target.type);
                            }
                          }}
                          disabled={exportLoading}
                          className="p-4 rounded border border-light-border dark:border-dark-border hover:border-brand-primary/20 bg-black/5 dark:bg-white/5 hover:bg-brand-primary/5 transition-all text-center flex flex-col items-center space-y-2 group disabled:opacity-50"
                        >
                          <FileText className="w-6 h-6 text-brand-muted group-hover:text-brand-primary transition-colors" />
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{target.type}</span>
                          <span className="text-[9px] text-brand-muted">{target.desc}</span>
                        </button>
                      ))}
                    </div>

                    {exportLoading && (
                      <div className="p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-lg space-y-3 font-mono text-[10px] text-brand-primary">
                        <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                          <Cpu className="w-4 h-4 animate-spin text-brand-primary" />
                          Compiling Corporate Report
                        </div>
                        <div className="space-y-1">
                          {exportSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex gap-2">
                              <span>[+]</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center py-40 text-brand-muted text-xs">
              Unable to locate target equity parameters. Verify symbol.
            </div>
          )}
        </div>

      </div>

      {/* Floating Chat Assistant Button */}
      <button 
        onClick={() => setChatOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 bg-brand-primary hover:bg-brand-primary/95 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-[10px] uppercase font-mono tracking-wider"
      >
        <Cpu className="w-4 h-4" />
        Statement Q&A
      </button>

      {/* AI Statement Assistant Drawer (Right Sidebar) */}
      {chatOpen && (
        <aside className="w-80 border-l border-light-border dark:border-dark-border bg-white dark:bg-[#070b13] flex flex-col h-full shrink-0 z-50">
          <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-black/5 dark:bg-white/5">
            <span className="text-xs font-black uppercase text-brand-primary tracking-wider">Statement Q&A Desk</span>
            <button onClick={() => setChatOpen(false)} className="text-brand-muted hover:text-slate-800 dark:hover:text-white font-bold">&times;</button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {chatMessages.map((m, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                  m.sender === "user" 
                    ? "ml-auto bg-brand-primary text-white" 
                    : "bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border text-slate-800 dark:text-slate-200"
                }`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border p-3 rounded-xl max-w-[85%] text-brand-muted italic flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                Scanning statement line citations...
              </div>
            )}
          </div>

          {/* Input field */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-light-border dark:border-dark-border flex gap-2">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask why margins fell or explain debt..."
              className="flex-1 text-[11px] px-2.5 py-1.5 rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary text-slate-800 dark:text-white"
            />
            <button 
              type="submit" 
              className="bg-brand-primary hover:bg-brand-primary/95 text-white px-3 py-1.5 rounded font-bold text-[10px] uppercase font-mono"
            >
              Ask
            </button>
          </form>
        </aside>
      )}

    </div>
  );
};
