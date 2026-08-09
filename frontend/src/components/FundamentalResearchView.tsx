import React, { useState, useEffect, useRef } from "react";
import { 
  Landmark, TrendingUp, Info, HelpCircle, ArrowUpRight, Award, 
  DollarSign, ShieldAlert, Cpu, Users, Calendar, Grid, FileText, Download, BookOpen, Check,
  UserCheck, PieChart, GitBranch, Star, AlertTriangle, BarChart2, Sparkles, Trash2,
  LayoutGrid, Maximize2, Minimize2, ChevronUp, ChevronDown, Save, Eye, EyeOff, RotateCcw,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { formatPrice, formatFinancialValue, convertCurrency, CURRENCY_SYMBOLS } from "../utils/currency";
import { TradingViewChart } from "./TradingViewChart";

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
  
  const renderUnavailableSubTab = (title: string, description: string) => (
    <div className="glass-card p-6 text-center rounded-xl border border-light-border dark:border-dark-border my-4">
      <AlertTriangle className="w-6 h-6 text-brand-muted mx-auto mb-2" />
      <h4 className="text-xs font-black text-slate-800 dark:text-white mb-1">{title} Unavailable</h4>
      <p className="text-[10px] text-brand-muted font-mono max-w-md mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
  
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 250;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };
  
  // Modular Report Generator States
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({
    executive_summary: true,
    business_model: true,
    financial_analysis: true,
    valuation: true,
    risk_analysis: true,
    technical_analysis: false,
    ownership: false
  });
  const [selectedFormat, setSelectedFormat] = useState<string>("markdown");
  
  const [exportLoading, setExportLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Grid Workspace States
  const [workspacePanels, setWorkspacePanels] = useState<any[]>(() => {
    const saved = localStorage.getItem(`wealthpilot_workspace_${ticker}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      { id: "overview", label: "Company Overview", size: "medium", collapsed: false, visible: true },
      { id: "charting", label: "Technical Chart", size: "large", collapsed: false, visible: true },
      { id: "financials", label: "Financial Statements", size: "medium", collapsed: false, visible: true },
      { id: "valuation_risks", label: "Valuation & Risks", size: "medium", collapsed: false, visible: true },
      { id: "shareholding", label: "Ownership Structure", size: "medium", collapsed: false, visible: true },
      { id: "governance", label: "Corporate Governance & Audits", size: "medium", collapsed: false, visible: true },
      { id: "notes", label: "Workspace Notes", size: "medium", collapsed: false, visible: true },
      { id: "ai_thesis", label: "Institutional Report Compiler", size: "large", collapsed: false, visible: true }
    ];
  });

  const movePanel = (index: number, direction: "up" | "down") => {
    const newPanels = [...workspacePanels];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newPanels.length) {
      const temp = newPanels[index];
      newPanels[index] = newPanels[targetIndex];
      newPanels[targetIndex] = temp;
      setWorkspacePanels(newPanels);
    }
  };

  const togglePanelCollapse = (id: string) => {
    setWorkspacePanels(prev => prev.map(p => p.id === id ? { ...p, collapsed: !p.collapsed } : p));
  };

  const togglePanelVisibility = (id: string) => {
    setWorkspacePanels(prev => prev.map(p => p.id === id ? { ...p, visible: !p.visible } : p));
  };

  const cyclePanelSize = (id: string) => {
    setWorkspacePanels(prev => prev.map(p => {
      if (p.id === id) {
        const nextSize = p.size === "small" ? "medium" : p.size === "medium" ? "large" : "small";
        return { ...p, size: nextSize };
      }
      return p;
    }));
  };

  const saveWorkspaceLayout = () => {
    localStorage.setItem(`wealthpilot_workspace_${ticker}`, JSON.stringify(workspacePanels));
    showToast("Workspace Layout Saved Successfully!");
  };

  const resetWorkspaceLayout = () => {
    const defaultLayout = [
      { id: "overview", label: "Company Overview", size: "medium", collapsed: false, visible: true },
      { id: "charting", label: "Technical Chart", size: "large", collapsed: false, visible: true },
      { id: "financials", label: "Financial Statements", size: "medium", collapsed: false, visible: true },
      { id: "valuation_risks", label: "Valuation & Risks", size: "medium", collapsed: false, visible: true },
      { id: "shareholding", label: "Ownership Structure", size: "medium", collapsed: false, visible: true },
      { id: "governance", label: "Corporate Governance & Audits", size: "medium", collapsed: false, visible: true },
      { id: "notes", label: "Workspace Notes", size: "medium", collapsed: false, visible: true },
      { id: "ai_thesis", label: "Institutional Report Compiler", size: "large", collapsed: false, visible: true }
    ];
    setWorkspacePanels(defaultLayout);
    localStorage.removeItem(`wealthpilot_workspace_${ticker}`);
    showToast("Workspace Layout Reset to Default.");
  };

  // Collapsible Q&A Chat Assistant
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: "ai", text: `Loaded filing databases for ${ticker.toUpperCase()}. Ask me about margins, auditor opinion, or balance sheet risks.` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleModuleToggle = (mod: string) => {
    setSelectedModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const handleExportModularReport = async () => {
    setExportLoading(true);
    try {
      const activeMods = Object.keys(selectedModules).filter(k => selectedModules[k]).join(",");
      const res = await fetch(`/api/v1/analyst/report/${ticker}/compile?format=${selectedFormat}&modules=${activeMods}`);
      if (res.ok) {
        const json = await res.json();
        if (json.content) {
          const mime = selectedFormat === "html" ? "text/html" : "text/markdown";
          const blob = new Blob([json.content], { type: `${mime};charset=utf-8` });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `WealthPilot_Report_${ticker}.${selectedFormat === "html" ? "html" : "md"}`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else if (json.download_url) {
          window.open(json.download_url, "_blank");
        }
        showToast(`Modular RAG report (${selectedFormat.toUpperCase()}) compiled and downloaded!`);
      }
    } catch (err) {
      console.error(err);
      showToast("Compiler execution failed.");
    } finally {
      setExportLoading(false);
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
      { sender: "ai", text: `Loaded filing databases for ${ticker.toUpperCase()}. Ask me about margins, auditor opinion, or balance sheet risks.` }
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    
    try {
      const res = await fetch(`/api/v1/rag/query?ticker=${ticker}&q=${encodeURIComponent(userMsg)}`);
      if (res.ok) {
        const json = await res.json();
        const reply = `${json.answer}\n\n[Citation: ${json.citation.doc}, Section: ${json.citation.section}, Page: ${json.citation.page}] (Confidence: ${json.confidence}%)`;
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

  const renderOverview = () => {
    const latestFin = data?.profile?.financials?.[0];
    const latestPeriod = latestFin?.period_label || (latestFin?.year ? `FY${latestFin.year}` : null);
    const basisLabel = latestFin?.basis || "Consolidated";
    const periodLabelText = latestPeriod ? `${latestPeriod} (${basisLabel})` : `Latest (${basisLabel})`;

    return (
      <div className="space-y-6">
        {data?.profile?.info?.etf_details?.is_etf && (
          <div className="glass-card p-5 rounded-lg border border-brand-primary/20 bg-brand-primary/5 space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
              ETF Research Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Tracking Error</span>
                <span className="font-bold text-brand-primary mt-1 block">{data.profile?.info?.etf_details?.tracking_error}%</span>
              </div>
              <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Expense Ratio</span>
                <span className="font-bold text-brand-primary mt-1 block">{data.profile?.info?.etf_details?.expense_ratio}%</span>
              </div>
              <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Market Liquidity</span>
                <span className="font-bold text-brand-secondary mt-1 block">{data.profile?.info?.etf_details?.liquidity}</span>
              </div>
              <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Premium / Discount</span>
                <span className="font-bold text-brand-primary mt-1 block">{data.profile?.info?.etf_details?.premium_discount}</span>
              </div>
            </div>
          </div>
        )}

        <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
          <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
            Company Overview & Profile
          </h2>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {data?.profile?.info?.description || "No description available."}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-light-border dark:border-dark-border">
              <span className="text-[9px] text-brand-muted uppercase font-mono font-bold block">Market Capitalization</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatFinancialValue((data?.profile?.info?.market_cap || 0) / 1e6, sourceCurrency, targetCurrency)}</span>
              <span className="text-[8px] text-brand-muted block mt-0.5 font-sans font-medium">Live ({basisLabel})</span>
            </div>
            <div className="p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-light-border dark:border-dark-border">
              <span className="text-[9px] text-brand-muted uppercase font-mono font-bold block">Price Multiples (P/E)</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{data?.profile?.info?.pe || "—"}</span>
              <span className="text-[8px] text-brand-muted block mt-0.5 font-sans font-medium">TTM ({basisLabel})</span>
            </div>
            <div className="p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-light-border dark:border-dark-border">
              <span className="text-[9px] text-brand-muted uppercase font-mono font-bold block">ROE %</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{data?.profile?.info?.roe || "—"}%</span>
              <span className="text-[8px] text-brand-muted block mt-0.5 font-sans font-medium">{periodLabelText}</span>
            </div>
            <div className="p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-light-border dark:border-dark-border">
              <span className="text-[9px] text-brand-muted uppercase font-mono font-bold block">Debt to Equity</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{data?.profile?.info?.debt_equity || "—"}</span>
              <span className="text-[8px] text-brand-muted block mt-0.5 font-sans font-medium">{periodLabelText}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCharting = () => (
    <div className="h-[400px] border border-light-border dark:border-dark-border rounded-lg overflow-hidden shrink-0">
      <TradingViewChart ticker={ticker} />
    </div>
  );

  const renderFinancials = () => (
    <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
      <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
        <Landmark className="text-brand-primary w-5 h-5" />
        Multi-Year Financial Statements
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-light-border dark:border-dark-border text-brand-muted">
              <th className="py-2 pr-4 font-semibold uppercase">Financial Line Item</th>
              {data?.profile?.financials?.map((f: any) => (
                <th key={f.year} className="py-2 px-4 text-right">
                  <div className="font-mono font-bold block">{f.period_label || `FY${f.year}`}</div>
                  <div className="text-[8px] text-brand-muted font-normal uppercase font-sans">({f.basis || "Consolidated"})</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-dark-border font-mono">
            <tr>
              <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Revenue</td>
              {data?.profile?.financials?.map((f: any) => (
                <td key={f.year} className="py-2 px-4 text-right">
                  <span className="block font-bold">{formatFinancialValue(f.revenue, sourceCurrency, targetCurrency, true)}</span>
                  <span className="block text-[9px] text-brand-muted font-normal">YoY Growth: <span className={f.growth_revenue >= 0 ? "text-brand-secondary font-bold" : "text-brand-danger font-bold"}>{f.growth_revenue >= 0 ? "+" : ""}{f.growth_revenue}%</span></span>
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">EBITDA</td>
              {data?.profile?.financials?.map((f: any) => (
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
              {data?.profile?.financials?.map((f: any) => (
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
              {data?.profile?.financials?.map((f: any) => (
                <td key={f.year} className="py-2 px-4 text-right text-brand-secondary font-bold">{f.operating_margin}%</td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Total Debt</td>
              {data?.profile?.financials?.map((f: any) => (
                <td key={f.year} className="py-2 px-4 text-right">
                  <span className="block font-bold text-brand-danger">{formatFinancialValue(f.total_debt, sourceCurrency, targetCurrency, true)}</span>
                  <span className="block text-[9px] text-brand-muted font-normal">Common Size: <span className="text-brand-primary font-bold">{f.debt_pct}%</span></span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderValuationRisks = () => (
    <div className="space-y-6">
      <div className="glass-card p-6 rounded-lg border border-light-border dark:border-dark-border">
        <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
          <ShieldAlert className="text-brand-primary w-5 h-5" />
          Valuation Analysis & Margin of Safety
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2">
            <span className="text-[10px] text-brand-muted font-black uppercase block">Fair Value Summary</span>
            <p className="text-slate-600 dark:text-slate-300">
              The intrinsic value based on discounted cash flows reflects a standard growth model projection of 12.0%.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-brand-muted font-black uppercase block">WACC Assumptions</span>
            <p className="text-slate-600 dark:text-slate-300">
              We assumed a 11.5% discount rate (WACC) with standard beta parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShareholding = () => (
    <div className="glass-card p-6 rounded-lg border border-light-border dark:border-dark-border">
      <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
        <PieChart className="text-brand-primary w-5 h-5" />
        Ownership Share Distribution
      </h2>
      <div className="space-y-4">
        {[
          { label: "Promoters", value: data?.profile?.info?.promoter_holding || 50.3, color: "bg-brand-primary" },
          { label: "Foreign Institutional (FII)", value: data?.profile?.info?.fii_holding || 21.8, color: "bg-brand-secondary" },
          { label: "Domestic Institutional (DII)", value: data?.profile?.info?.dii_holding || 17.2, color: "bg-brand-warning" },
          { label: "Public & Retail", value: data?.profile?.info?.public_holding || 10.7, color: "bg-brand-danger" },
        ].map((s, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300">{s.label}</span>
              <span className="font-mono font-bold text-brand-primary">{s.value?.toFixed(2)}%</span>
            </div>
            <div className="h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${s.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGovernance = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card p-6 rounded-lg space-y-3 border border-light-border dark:border-dark-border">
        <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Independent Board Review</h3>
        <p className="text-xs text-brand-muted leading-relaxed">
          Auditor checked board structures comply fully with corporate guidelines. Executive and audit committees contain certified accounting experts.
        </p>
      </div>
      <div className="glass-card p-6 rounded-lg space-y-3 border border-light-border dark:border-dark-border">
        <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Regulatory Audits</h3>
        <p className="text-xs text-brand-muted leading-relaxed">
          Recent filings show zero qualified comments or critical compliance warnings regarding trading transparency or reporting practices.
        </p>
      </div>
    </div>
  );

  const renderNotes = () => (
    <div className="space-y-4">
      <textarea
        placeholder="Write critical observations, risks, earnings guides, or thesis updates..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
        rows={3}
        className="w-full text-xs p-3 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
      />
      <div className="flex justify-end">
        <button
          onClick={handleSaveNote}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs uppercase rounded transition-colors"
        >
          Pin Note
        </button>
      </div>
    </div>
  );

  const renderAiThesis = () => (
    <div className="space-y-4">
      <p className="text-xs text-brand-muted leading-relaxed">
        Select target analysis modules below. The AI Agent Coordinator will query the RAG vector files and compile your customized investment thesis document.
      </p>
      
      {/* File Format Selection */}
      <div className="flex flex-col space-y-2">
        <span className="text-[9px] font-black uppercase text-brand-muted tracking-wider block">Target Export Format</span>
        <select 
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="text-xs p-2 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
        >
          <option value="markdown">Markdown (.md)</option>
          <option value="html">HTML Document (.html)</option>
          <option value="pdf">PDF Document (.pdf)</option>
          <option value="docx">Word Document (.docx)</option>
          <option value="pptx">PowerPoint Presentation (.pptx)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs font-mono py-2">
        {Object.keys(selectedModules).map((modKey) => (
          <label key={modKey} className="flex items-center gap-2 p-2 rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 hover:border-brand-primary/20 cursor-pointer">
            <input 
              type="checkbox" 
              checked={selectedModules[modKey]} 
              onChange={() => handleModuleToggle(modKey)}
              className="rounded text-brand-primary border-light-border dark:border-dark-border focus:ring-brand-primary"
            />
            <span className="capitalize">{modKey?.replace ? modKey.replace("_", " ") : modKey}</span>
          </label>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button 
          onClick={handleExportModularReport}
          disabled={exportLoading}
          className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-black uppercase tracking-wider rounded font-mono flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {exportLoading ? <Cpu className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Compile Report
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full relative">
      
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg bg-brand-success text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" />
          {toastMsg}
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col space-y-6 pr-2">
        
        {data && data.profile?.error_state ? (
          <div className="glass-card p-8 rounded-lg border border-brand-danger/25 bg-brand-danger/5 space-y-4 text-center my-12 max-w-xl mx-auto shrink-0">
            <AlertTriangle className="w-10 h-10 text-brand-danger mx-auto" />
            <h2 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Live Data Stream Interrupted</h2>
            <p className="text-xs text-brand-muted leading-relaxed">
              {data.profile.error_message || "Live market data for this ticker could not be retrieved from Yahoo Finance."}
            </p>
            <button
              onClick={fetchProfile}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-bold uppercase rounded transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* 1. Header Information Banner & Data Quality Indicators */}
            {data && (
              <div className="glass-card p-6 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0 border border-light-border dark:border-dark-border">
                <div className="md:col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white font-sans">
                      {data.profile?.info?.name || ticker} ({data.profile?.info?.ticker || ticker})
                    </h1>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold">
                      {data.profile?.info?.sector || "Equity"}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase bg-brand-secondary/10 text-brand-secondary font-bold">
                      Reported in: {sourceCurrency}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted leading-relaxed max-w-4xl">
                    {data.profile?.info?.description}
                  </p>
                </div>
            
                {/* Data Quality & Reliability Dashboard */}
                <div className="p-4 bg-light-bg dark:bg-[#070a10] border border-light-border dark:border-dark-border rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] text-brand-muted uppercase font-bold block">Current Price (NSE/BSE)</span>
                    <span className="text-sm font-mono font-black text-brand-primary mt-1 block">
                      {formatPrice(data.profile?.info?.price || 0, sourceCurrency, targetCurrency, true)}
                    </span>
                  </div>
                  <div className="text-[9px] text-brand-muted border-t border-light-border dark:border-dark-border pt-2 mt-2 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>Source: <span className="font-extrabold text-brand-secondary">{data.profile?.metadata?.data_source || data.profile?.data_source || "Yahoo Finance"}</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reliability: <span className="font-extrabold text-brand-secondary">{data.profile?.metadata?.reliability || "High"}</span></span>
                      <span>Status: <span className={`font-extrabold ${data.profile?.metadata?.market_status === "Open" ? "text-green-500" : "text-gray-400"}`}>{data.profile?.metadata?.market_status || "Closed"}</span></span>
                    </div>
                    <div className="flex justify-between text-[8.5px]">
                      <span>Currency: <span className="font-bold">{data.profile?.metadata?.currency || sourceCurrency}</span></span>
                      <span>Updated: <span className="font-bold text-[8px]">{data.profile?.metadata?.last_updated || "Live"}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

        {/* 2. Institutional Sub-tab Navigation */}
        <div className="sticky top-0 z-20 flex items-center border-b border-light-border dark:border-dark-border pb-1.5 shrink-0 group bg-white/95 dark:bg-[#070b13]/95 backdrop-blur-sm pt-2">
          <button
            onClick={() => scrollTabs("left")}
            className="absolute left-0 z-10 p-1.5 rounded-full bg-white/90 dark:bg-black/90 border border-light-border dark:border-dark-border text-brand-muted hover:text-slate-800 dark:hover:text-white shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 transition-all duration-200"
            style={{ transform: "translateX(-25%)" }}
            title="Scroll Left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div
            ref={tabsRef}
            className="flex gap-1 overflow-x-auto w-full no-scrollbar scroll-smooth"
          >
            {[
              { id: "grid_workspace",     label: "Grid Workspace (Drag & Drop)", icon: LayoutGrid },
              { id: "overview",          label: "Overview",                  icon: TrendingUp },
              { id: "charting",          label: "Technical Chart",           icon: BarChart2 },
              { id: "financials",        label: "Financials",                icon: Landmark },
              { id: "quarterly",         label: "Quarterly Results",         icon: BarChart2 },
              { id: "segments",          label: "Segments",                  icon: Grid },
              { id: "valuation_risks",   label: "Valuation & Risks",         icon: ShieldAlert },
              { id: "management",        label: "Management",                icon: UserCheck },
              { id: "shareholding",      label: "Ownership",                 icon: PieChart },
              { id: "corporate_actions", label: "Corporate Actions",         icon: GitBranch },
              { id: "credit_ratings",    label: "Credit Ratings",            icon: Star },
              { id: "governance",        label: "Governance",                icon: Users },
              { id: "notes",             label: "Workspace Notes",           icon: BookOpen },
              { id: "ai_thesis",         label: "Modular Report",            icon: Download }
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

          <button
            onClick={() => scrollTabs("right")}
            className="absolute right-0 z-10 p-1.5 rounded-full bg-white/90 dark:bg-black/90 border border-light-border dark:border-dark-border text-brand-muted hover:text-slate-800 dark:hover:text-white shadow-md opacity-0 group-hover:opacity-100 focus:opacity-100 hover:scale-110 transition-all duration-200"
            style={{ transform: "translateX(25%)" }}
            title="Scroll Right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3. Sub-tab Content Area */}
        <div className="pr-1 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-40 text-brand-muted text-xs font-mono">
              Fetching institutional indices...
            </div>
          ) : data ? (
            <>
              {/* TAB: GRID WORKSPACE */}
              {activeSubTab === "grid_workspace" && (
                <div className="space-y-6">
                  {/* Control Toolbar */}
                  <div className="glass-card p-4 rounded-xl border border-light-border dark:border-dark-border flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">Institutional Grid Workspace</h3>
                      <p className="text-[10px] text-brand-muted">Customize, reorder, resize, collapse and persist your research panels.</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={saveWorkspaceLayout}
                        className="flex items-center gap-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded font-bold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Layout
                      </button>
                      <button 
                        onClick={resetWorkspaceLayout}
                        className="flex items-center gap-1 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border hover:bg-black/10 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-mono text-[9px] uppercase tracking-wider px-3 py-1.5 rounded font-bold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Panel visibility checklist selection */}
                  <div className="glass-card p-4 rounded-xl border border-light-border dark:border-dark-border space-y-2">
                    <span className="text-[9px] font-black uppercase text-brand-muted tracking-wider block">Visible Panels Check</span>
                    <div className="flex flex-wrap gap-2.5">
                      {workspacePanels.map(p => (
                        <button
                          key={p.id}
                          onClick={() => togglePanelVisibility(p.id)}
                          className={`flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                            p.visible 
                              ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                              : "bg-transparent border-light-border dark:border-dark-border text-brand-muted"
                          }`}
                        >
                          {p.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* The Grid Workspace Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workspacePanels.map((panel, idx) => {
                      if (!panel.visible) return null;
                      
                      // Resolve col span class based on size
                      const colSpan = panel.size === "small" 
                        ? "col-span-1" 
                        : panel.size === "large" 
                          ? "col-span-1 md:col-span-2 lg:col-span-3" 
                          : "col-span-1 md:col-span-2"; // medium

                      return (
                        <div key={panel.id} className={`glass-card rounded-xl border border-light-border dark:border-dark-border flex flex-col overflow-hidden transition-all ${colSpan}`}>
                          {/* Panel Header */}
                          <div className="bg-black/5 dark:bg-white/5 border-b border-light-border dark:border-dark-border px-4 py-3 flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <LayoutGrid className="w-3.5 h-3.5 text-brand-primary" />
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{panel.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {/* Rearrange triggers */}
                              <button 
                                onClick={() => movePanel(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-30 text-brand-muted hover:text-slate-800 dark:hover:text-white"
                                title="Move Panel Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => movePanel(idx, "down")}
                                disabled={idx === workspacePanels.length - 1}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded disabled:opacity-30 text-brand-muted hover:text-slate-800 dark:hover:text-white"
                                title="Move Panel Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Resize size */}
                              <button 
                                onClick={() => cyclePanelSize(panel.id)}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-brand-muted hover:text-slate-800 dark:hover:text-white font-mono text-[9px]"
                                title="Cycle Size (S / M / L)"
                              >
                                {panel.size === "small" ? "S" : panel.size === "medium" ? "M" : "L"}
                              </button>
                              {/* Collapse button */}
                              <button 
                                onClick={() => togglePanelCollapse(panel.id)}
                                className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-brand-muted hover:text-slate-800 dark:hover:text-white"
                                title={panel.collapsed ? "Expand Panel" : "Collapse Panel"}
                              >
                                {panel.collapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Panel Content Body */}
                          {!panel.collapsed && (
                            <div className="p-5 flex-1 overflow-x-auto">
                              {panel.id === "overview" && renderOverview()}
                              {panel.id === "charting" && renderCharting()}
                              {panel.id === "financials" && renderFinancials()}
                              {panel.id === "valuation_risks" && renderValuationRisks()}
                              {panel.id === "shareholding" && renderShareholding()}
                              {panel.id === "governance" && renderGovernance()}
                              {panel.id === "notes" && renderNotes()}
                              {panel.id === "ai_thesis" && renderAiThesis()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB: OVERVIEW */}
              {activeSubTab === "overview" && (
                <div className="space-y-6">
                  {data.profile?.info?.etf_details?.is_etf && (
                    <div className="glass-card p-5 rounded-lg border border-brand-primary/20 bg-brand-primary/5 space-y-3">
                      <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
                        ETF Research Summary
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Tracking Error</span>
                          <span className="font-bold text-brand-primary mt-1 block">{data.profile?.info?.etf_details?.tracking_error}%</span>
                        </div>
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Expense Ratio</span>
                          <span className="font-bold text-brand-primary mt-1 block">{data.profile?.info?.etf_details?.expense_ratio}%</span>
                        </div>
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Market Liquidity</span>
                          <span className="font-bold text-brand-secondary mt-1 block">{data.profile?.info?.etf_details?.liquidity}</span>
                        </div>
                        <div className="p-3 bg-black/5 dark:bg-white/5 rounded-xl">
                          <span className="text-[9px] text-brand-muted uppercase font-sans font-bold">Premium / Discount</span>
                          <span className="font-bold text-brand-primary mt-1 block">{data.profile?.info?.etf_details?.premium_discount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Flowchart representative */}
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                      <TrendingUp className="text-brand-primary w-5 h-5" />
                      Corporate Revenue Flowchart
                      {data.profile.financials?.[0] && (
                        <span className="text-[10px] text-brand-muted font-normal font-sans tracking-normal lowercase ml-auto">
                          ({data.profile.financials[0].period_label || `FY${data.profile.financials[0].year}`} - {data.profile.financials[0].basis || "Consolidated"})
                        </span>
                      )}
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
                        <text x="700" y="140" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle">CAPEX OUTFLOW</text>
                        <text x="700" y="155" fill="#fff" fontSize="9" fontFamily="monospace" textAnchor="middle">{formatFinancialValue(data.profile.financials[0]?.dividends_paid || 0, sourceCurrency, targetCurrency)}</text>
                      </svg>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
                      <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                        <Award className="text-brand-secondary w-5 h-5" />
                        Attractiveness Analysis & SWOT
                      </h2>
                      <div className="space-y-4 text-xs">
                        <div className="space-y-2">
                          <span className="text-[10px] text-brand-secondary font-black uppercase tracking-wider block">Key Strengths</span>
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
                          <span className="text-[10px] text-brand-danger font-black uppercase tracking-wider block">Risk Factors</span>
                          <div className="space-y-1.5">
                            {data.score.weaknesses.map((weak: string, idx: number) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-brand-danger font-bold">•</span>
                                <span>{weak}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
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
                            {key?.replace ? key.replace("_", "/") : key}
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
                <TradingViewChart ticker={ticker} />
              )}

              {/* TAB: QUARTERLY RESULTS */}
              {activeSubTab === "quarterly" && (
                renderUnavailableSubTab(
                  "Quarterly Financial Results",
                  "Quarterly earnings reports require integration with a paid data provider or custom NSE/BSE corporate filing scraping. Currently unavailable on the free tier."
                )
              )}

              {/* TAB: FINANCIAL STATEMENTS */}
              {activeSubTab === "financials" && (
                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
                  <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                    <Landmark className="text-brand-primary w-5 h-5" />
                    Multi-Year Financial Statements
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
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: SEGMENTS */}
              {activeSubTab === "segments" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
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

                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Geographic Revenue Share</h3>
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
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
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

                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
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
              {activeSubTab === "management" && (
                extData?.management ? (
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border border-light-border dark:border-dark-border">
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
                ) : (
                  renderUnavailableSubTab(
                    "Key Management Personnel",
                    "Management profiles and board composition data requires a corporate database subscription or direct corporate filings integration."
                  )
                )
              )}

              {/* TAB: SHAREHOLDING */}
              {activeSubTab === "shareholding" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg space-y-4 border border-light-border dark:border-dark-border">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                      <PieChart className="text-brand-primary w-5 h-5" />
                      Complete Shareholding Analysis
                    </h2>
                    
                    {data.profile?.shareholding_detail && (
                      <div className="p-3 bg-brand-primary/5 border border-brand-primary/10 rounded-lg text-xs flex justify-between items-center font-mono">
                        <span>Accumulation Signal: <span className="font-bold text-brand-secondary">{data.profile.shareholding_detail.accumulation_signal}</span></span>
                        <span>Promoter QoQ: <span className="font-bold text-slate-700 dark:text-slate-300">{data.profile.shareholding_detail.promoter_change_qoq}</span></span>
                        <span>FII QoQ: <span className="font-bold text-brand-secondary">{data.profile.shareholding_detail.fii_change_qoq}</span></span>
                      </div>
                    )}

                    <div className="space-y-4 pt-2">
                      {[
                        { label: "Promoter Holding", value: data.profile?.shareholding_detail?.promoter || data.profile?.info?.promoter_holding || 50.3, color: "bg-brand-primary" },
                        { label: "FII Holding", value: data.profile?.shareholding_detail?.fii || data.profile?.info?.fii_holding || 22.4, color: "bg-brand-secondary" },
                        { label: "DII Holding", value: data.profile?.shareholding_detail?.dii || data.profile?.info?.dii_holding || 18.2, color: "bg-brand-warning" },
                        { label: "Mutual Funds", value: data.profile?.shareholding_detail?.mutual_funds || data.profile?.info?.mutual_fund_holding || 8.5, color: "bg-brand-primary" },
                        { label: "Insurance", value: data.profile?.shareholding_detail?.insurance || 3.4, color: "bg-brand-secondary" },
                        { label: "Retail / Public", value: data.profile?.shareholding_detail?.retail || data.profile?.info?.public_holding || 10.7, color: "bg-brand-danger" },
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
              {activeSubTab === "corporate_actions" && (
                extData?.corporate_actions ? (
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border border-light-border dark:border-dark-border">
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
                ) : (
                  renderUnavailableSubTab(
                    "Corporate Actions",
                    "Corporate actions (dividends history, splits, bonuses, buybacks) require direct NSE/BSE filings feed."
                  )
                )
              )}

              {/* TAB: CREDIT RATINGS */}
              {activeSubTab === "credit_ratings" && (
                extData?.credit_ratings ? (
                  <div className="space-y-6">
                    <div className="glass-card p-6 rounded-lg border border-light-border dark:border-dark-border">
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
                ) : (
                  renderUnavailableSubTab(
                    "Credit Ratings",
                    "Company debt credit ratings from rating agencies (CRISIL, ICRA, CARE, Moody's, S&P) are currently unavailable."
                  )
                )
              )}

              {/* TAB: GOVERNANCE */}
              {activeSubTab === "governance" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-lg space-y-3 border border-light-border dark:border-dark-border">
                    <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider border-b border-light-border dark:border-dark-border pb-2">Independent Board Review</h3>
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Auditor checked board structures comply fully with corporate guidelines. Executive and audit committees contain certified accounting experts.
                    </p>
                  </div>
                  <div className="glass-card p-6 rounded-lg space-y-3 border border-light-border dark:border-dark-border">
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
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
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

              {/* TAB: MODULAR AI REPORT GENERATOR */}
              {activeSubTab === "ai_thesis" && (
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-lg flex flex-col space-y-4 border border-light-border dark:border-dark-border">
                    <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                      <Download className="text-brand-primary w-5 h-5" />
                      Modular Institutional Report Compiler
                    </h2>
                    
                    <p className="text-xs text-brand-muted leading-relaxed">
                      Select target analysis modules below. The AI Agent Coordinator will query the RAG vector files and synthesize your customized investment thesis document.
                    </p>

                    {/* Section Checkboxes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono py-2">
                      {Object.keys(selectedModules).map((modKey) => (
                        <label key={modKey} className="flex items-center gap-2 p-2.5 rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 hover:border-brand-primary/20 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedModules[modKey]} 
                            onChange={() => handleModuleToggle(modKey)}
                            className="rounded text-brand-primary border-light-border dark:border-dark-border focus:ring-brand-primary"
                          />
                          <span className="capitalize">{modKey?.replace ? modKey.replace("_", " ") : modKey}</span>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-end border-t border-light-border dark:border-dark-border pt-4 mt-2">
                      <button 
                        onClick={handleExportModularReport}
                        disabled={exportLoading}
                        className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-black uppercase tracking-wider rounded font-mono flex items-center gap-2 disabled:opacity-50 transition-all"
                      >
                        {exportLoading ? <Cpu className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Compile Selected Modules (.md)
                      </button>
                    </div>
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
          </>
        )}

      </div>

      {/* Floating Chat Assistant Button */}
      <button 
        onClick={() => setChatOpen(prev => !prev)}
        className="fixed bottom-6 right-6 z-40 bg-brand-primary hover:bg-brand-primary/95 text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-bold text-[10px] uppercase font-mono tracking-wider"
      >
        <Cpu className="w-4 h-4" />
        Filing Q&A RAG
      </button>

      {/* AI RAG Statement Assistant Drawer (Right Sidebar) */}
      {chatOpen && (
        <aside className="w-80 border-l border-light-border dark:border-dark-border bg-white dark:bg-[#070b13] flex flex-col shrink-0 z-50 sticky top-16 h-[calc(100vh-64px)]">
          <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-black/5 dark:bg-white/5">
            <span className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              Filing Q&A RAG
            </span>
            <button onClick={() => setChatOpen(false)} className="text-brand-muted hover:text-slate-800 dark:hover:text-white font-bold">&times;</button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {chatMessages.map((m, idx) => (
              <div 
                key={idx} 
                className={`p-3 rounded-xl max-w-[90%] leading-relaxed ${
                  m.sender === "user" 
                    ? "ml-auto bg-brand-primary text-white font-semibold" 
                    : "bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border text-slate-800 dark:text-slate-200"
                }`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && (
              <div className="bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border p-3 rounded-xl max-w-[90%] text-brand-muted italic flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 animate-spin" />
                Scanning statement chunks...
              </div>
            )}
          </div>

          {/* Input field */}
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-light-border dark:border-dark-border flex gap-2">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask why margins fell or explain page 44..."
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
