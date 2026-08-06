import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, PlusCircle, Edit3, Trash2, ChevronDown, ChevronUp, Search,
  TrendingUp, TrendingDown, AlertTriangle, Zap, Target, Clock, Star,
  CheckCircle, XCircle, Archive, RefreshCw, Filter, Download, X, Save
} from "lucide-react";

interface JournalEntry {
  id: number;
  ticker: string;
  company_name?: string;
  idea_date?: string;
  status?: string;
  investment_thesis?: string;
  bull_case?: string;
  base_case?: string;
  bear_case?: string;
  expected_cagr?: number;
  entry_price?: number;
  target_price?: number;
  stop_loss?: number;
  risks?: string;
  catalysts?: string;
  conviction_score?: number;
  holding_period?: string;
  actual_outcome?: string;
  lessons_learned?: string;
  last_updated?: string;
}

interface ResearchJournalViewProps {
  onSelectTicker?: (ticker: string) => void;
  targetCurrency?: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.FC<any>; label: string }> = {
  Active:   { color: "text-brand-secondary bg-brand-secondary/10 border-brand-secondary/20", icon: CheckCircle, label: "Active" },
  Watching: { color: "text-brand-warning bg-brand-warning/10 border-brand-warning/20",       icon: Star,        label: "Watching" },
  Exited:   { color: "text-brand-info bg-brand-info/10 border-brand-info/20",               icon: Archive,     label: "Exited" },
  Closed:   { color: "text-brand-danger bg-brand-danger/10 border-brand-danger/20",         icon: XCircle,     label: "Closed" },
};

const HOLDING_OPTIONS = ["< 3 months", "3-6 months", "6-12 months", "12-18 months", "18-24 months", "2-3 years", "3-5 years", "5+ years"];

const EMPTY_FORM: Partial<JournalEntry> = {
  ticker: "", company_name: "", status: "Active",
  investment_thesis: "", bull_case: "", base_case: "", bear_case: "",
  expected_cagr: undefined, entry_price: undefined, target_price: undefined,
  stop_loss: undefined, risks: "", catalysts: "", conviction_score: 5,
  holding_period: "12-18 months", actual_outcome: "", lessons_learned: ""
};

export const ResearchJournalView: React.FC<ResearchJournalViewProps> = ({ onSelectTicker, targetCurrency = "INR" }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<JournalEntry>>(EMPTY_FORM);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"thesis" | "cases" | "metrics" | "review">("thesis");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/journal");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error("Journal fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleOpenNew = () => {
    setForm(EMPTY_FORM);
    setEditEntry(null);
    setShowForm(true);
    setActiveTab("thesis");
  };

  const handleOpenEdit = (entry: JournalEntry) => {
    setForm({ ...entry });
    setEditEntry(entry);
    setShowForm(true);
    setActiveTab("thesis");
  };

  const handleSave = async () => {
    if (!form.ticker?.trim()) { showToast("Ticker is required"); return; }
    
    // Numeric validations
    if (form.expected_cagr !== undefined && form.expected_cagr !== null && String(form.expected_cagr).trim() !== "") {
      const cagr = Number(form.expected_cagr);
      if (isNaN(cagr) || cagr < -100 || cagr > 1000) {
        showToast("Expected CAGR must be between -100% and 1000%");
        return;
      }
    }
    
    if (form.entry_price !== undefined && form.entry_price !== null && String(form.entry_price).trim() !== "") {
      const price = Number(form.entry_price);
      if (isNaN(price) || price <= 0) {
        showToast("Entry price must be a positive number");
        return;
      }
    }
    
    if (form.target_price !== undefined && form.target_price !== null && String(form.target_price).trim() !== "") {
      const price = Number(form.target_price);
      if (isNaN(price) || price <= 0) {
        showToast("Target price must be a positive number");
        return;
      }
    }
    
    if (form.stop_loss !== undefined && form.stop_loss !== null && String(form.stop_loss).trim() !== "") {
      const price = Number(form.stop_loss);
      if (isNaN(price) || price <= 0) {
        showToast("Stop loss must be a positive number");
        return;
      }
    }

    if (form.conviction_score !== undefined && form.conviction_score !== null && String(form.conviction_score).trim() !== "") {
      const score = Number(form.conviction_score);
      if (isNaN(score) || score < 1 || score > 10) {
        showToast("Conviction score must be between 1 and 10");
        return;
      }
    }

    setSaving(true);
    try {
      const url = editEntry ? `/api/v1/journal/${editEntry.id}` : "/api/v1/journal";
      const method = editEntry ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        showToast(editEntry ? "Journal entry updated" : "New investment idea saved");
        setShowForm(false);
        fetchEntries();
      }
    } catch (e) {
      showToast("Save failed — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/journal/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Entry deleted");
        setEntries(prev => prev.filter(e => e.id !== id));
        setDeleteConfirm(null);
      }
    } catch (e) {
      showToast("Delete failed");
    }
  };

  const handleExportMarkdown = (entry: JournalEntry) => {
    const md = `# Investment Research Note: ${entry.company_name || entry.ticker} (${entry.ticker})

**Status**: ${entry.status} | **Conviction**: ${entry.conviction_score}/10 | **Date**: ${entry.idea_date} | **Updated**: ${entry.last_updated}

## Investment Thesis
${entry.investment_thesis || "—"}

## Bull Case 🟢
${entry.bull_case || "—"}

## Base Case 🟡
${entry.base_case || "—"}

## Bear Case 🔴
${entry.bear_case || "—"}

## Key Metrics
- **Entry Price**: ${entry.entry_price ? `$${entry.entry_price}` : "—"}
- **Target Price**: ${entry.target_price ? `$${entry.target_price}` : "—"}
- **Stop Loss**: ${entry.stop_loss ? `$${entry.stop_loss}` : "—"}
- **Expected CAGR**: ${entry.expected_cagr ? `${entry.expected_cagr}%` : "—"}
- **Holding Period**: ${entry.holding_period || "—"}

## Risks
${entry.risks || "—"}

## Catalysts
${entry.catalysts || "—"}

## Actual Outcome
${entry.actual_outcome || "Pending"}

## Lessons Learned
${entry.lessons_learned || "—"}

---
*Generated by WealthPilot AI Research Journal*
`;
    const link = document.createElement("a");
    link.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    link.download = `WealthPilot_Journal_${entry.ticker}_${entry.idea_date}.md`;
    link.click();
  };

  const filtered = entries.filter(e => {
    const matchStatus = filterStatus === "All" || e.status === filterStatus;
    const matchSearch = !search || e.ticker.toLowerCase().includes(search.toLowerCase()) ||
      (e.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.investment_thesis || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: entries.length,
    active: entries.filter(e => e.status === "Active").length,
    watching: entries.filter(e => e.status === "Watching").length,
    avgConviction: entries.length > 0 ? (entries.reduce((s, e) => s + (e.conviction_score || 5), 0) / entries.length).toFixed(1) : "—",
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4 relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg bg-brand-success text-white text-xs font-bold shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-primary" />
            Research Journal
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">Track investment ideas with full thesis documentation — Bull, Base, Bear cases per company</p>
        </div>
        <button onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-bold rounded-lg transition-colors">
          <PlusCircle className="w-4 h-4" /> New Idea
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        {[
          { label: "Total Ideas", value: stats.total, icon: BookOpen, color: "text-brand-primary" },
          { label: "Active Ideas", value: stats.active, icon: TrendingUp, color: "text-brand-secondary" },
          { label: "Watching", value: stats.watching, icon: Star, color: "text-brand-warning" },
          { label: "Avg Conviction", value: `${stats.avgConviction}/10`, icon: Target, color: "text-brand-info" },
        ].map((s, i) => (
          <div key={i} className="glass-card p-3 rounded-lg flex items-center gap-3">
            <s.icon className={`w-4 h-4 ${s.color} shrink-0`} />
            <div>
              <div className={`text-base font-black font-mono ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-brand-muted">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ticker or thesis..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg focus:outline-none focus:border-brand-primary" />
        </div>
        <div className="flex gap-1">
          {["All", "Active", "Watching", "Exited", "Closed"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors ${filterStatus === s ? "bg-brand-primary text-white" : "bg-black/5 dark:bg-white/5 text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-brand-muted text-xs">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading journal entries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-12 flex flex-col items-center text-center space-y-4">
            <BookOpen className="w-10 h-10 text-brand-muted opacity-40" />
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                {entries.length === 0 ? "Your investment journal is empty" : "No entries match your filter"}
              </p>
              <p className="text-xs text-brand-muted mt-1 max-w-xs mx-auto">
                {entries.length === 0
                  ? "Start documenting your investment ideas with full thesis, bull/base/bear cases, and conviction scores."
                  : "Try adjusting your search or status filter."}
              </p>
            </div>
            {entries.length === 0 && (
              <button onClick={handleOpenNew}
                className="mt-2 px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-lg">
                Add First Idea
              </button>
            )}
          </div>
        ) : (
          filtered.map(entry => {
            const cfg = STATUS_CONFIG[entry.status || "Active"] || STATUS_CONFIG.Active;
            const StatusIcon = cfg.icon;
            const isExpanded = expandedId === entry.id;
            const marginOfSafety = entry.entry_price && entry.target_price
              ? (((entry.target_price - entry.entry_price) / entry.entry_price) * 100).toFixed(1)
              : null;

            return (
              <div key={entry.id} className="glass-card rounded-xl overflow-hidden">
                {/* Card header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Conviction orb */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                      (entry.conviction_score || 5) >= 8 ? "bg-brand-secondary/20 text-brand-secondary" :
                      (entry.conviction_score || 5) >= 6 ? "bg-brand-warning/20 text-brand-warning" :
                      "bg-brand-danger/20 text-brand-danger"}`}>
                      {entry.conviction_score || 5}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black font-mono text-slate-800 dark:text-white text-sm">{entry.ticker}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase flex items-center gap-0.5 ${cfg.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />{entry.status}
                        </span>
                      </div>
                      <p className="text-xs text-brand-muted truncate">{entry.company_name || entry.ticker}</p>
                    </div>
                    {entry.investment_thesis && (
                      <p className="text-xs text-brand-muted hidden md:block truncate max-w-[300px] ml-2 italic">
                        "{entry.investment_thesis.slice(0, 100)}{entry.investment_thesis.length > 100 ? "..." : ""}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {marginOfSafety && (
                      <div className="text-right">
                        <span className={`text-xs font-black font-mono ${parseFloat(marginOfSafety) > 0 ? "text-brand-secondary" : "text-brand-danger"}`}>
                          {parseFloat(marginOfSafety) > 0 ? "+" : ""}{marginOfSafety}%
                        </span>
                        <span className="block text-[9px] text-brand-muted">Upside</span>
                      </div>
                    )}
                    {entry.expected_cagr && (
                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-brand-primary">{entry.expected_cagr}%</span>
                        <span className="block text-[9px] text-brand-muted">CAGR</span>
                      </div>
                    )}
                    <div className="text-right hidden md:block">
                      <span className="text-xs text-brand-muted font-mono">{entry.holding_period || "—"}</span>
                      <span className="block text-[9px] text-brand-muted">Hold Period</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={e => { e.stopPropagation(); handleOpenEdit(entry); }}
                        className="p-1.5 rounded hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleExportMarkdown(entry); }}
                        className="p-1.5 rounded hover:bg-brand-secondary/10 text-brand-muted hover:text-brand-secondary transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {onSelectTicker && (
                        <button onClick={e => { e.stopPropagation(); onSelectTicker(entry.ticker); }}
                          className="p-1.5 rounded hover:bg-brand-info/10 text-brand-muted hover:text-brand-info transition-colors">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {deleteConfirm === entry.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}
                            className="px-2 py-1 text-[10px] font-bold bg-brand-danger text-white rounded">Confirm</button>
                          <button onClick={e => { e.stopPropagation(); setDeleteConfirm(null); }}
                            className="px-2 py-1 text-[10px] font-bold bg-black/10 dark:bg-white/10 rounded">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setDeleteConfirm(entry.id); }}
                          className="p-1.5 rounded hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-muted" /> : <ChevronDown className="w-4 h-4 text-brand-muted" />}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-light-border dark:border-dark-border p-4 space-y-4">
                    {/* Metrics row */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: "Entry Price", value: entry.entry_price ? `$${entry.entry_price}` : "—" },
                        { label: "Target Price", value: entry.target_price ? `$${entry.target_price}` : "—" },
                        { label: "Stop Loss",    value: entry.stop_loss ? `$${entry.stop_loss}` : "—" },
                        { label: "Exp. CAGR",   value: entry.expected_cagr ? `${entry.expected_cagr}%` : "—" },
                        { label: "Updated",      value: entry.last_updated || "—" },
                      ].map((m, i) => (
                        <div key={i} className="bg-black/5 dark:bg-white/5 rounded-lg p-2.5 text-center">
                          <div className="text-xs font-bold font-mono text-slate-800 dark:text-white">{m.value}</div>
                          <div className="text-[9px] text-brand-muted mt-0.5">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Cases */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { label: "🟢 Bull Case", value: entry.bull_case, color: "border-brand-secondary/20 bg-brand-secondary/5" },
                        { label: "🟡 Base Case", value: entry.base_case, color: "border-brand-warning/20 bg-brand-warning/5" },
                        { label: "🔴 Bear Case", value: entry.bear_case, color: "border-brand-danger/20 bg-brand-danger/5" },
                      ].map((c, i) => (
                        <div key={i} className={`rounded-lg border p-3 text-xs ${c.color}`}>
                          <p className="font-bold mb-1 text-[10px] uppercase tracking-wider">{c.label}</p>
                          <p className="text-brand-muted leading-relaxed">{c.value || "Not documented yet"}</p>
                        </div>
                      ))}
                    </div>

                    {/* Thesis, Risks, Catalysts */}
                    {entry.investment_thesis && (
                      <div className="text-xs">
                        <p className="font-bold text-[10px] uppercase tracking-wider text-brand-muted mb-1">Investment Thesis</p>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{entry.investment_thesis}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {entry.risks && (
                        <div className="text-xs">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-brand-danger mb-1">⚠ Risks</p>
                          <p className="text-brand-muted leading-relaxed">{entry.risks}</p>
                        </div>
                      )}
                      {entry.catalysts && (
                        <div className="text-xs">
                          <p className="font-bold text-[10px] uppercase tracking-wider text-brand-secondary mb-1">⚡ Catalysts</p>
                          <p className="text-brand-muted leading-relaxed">{entry.catalysts}</p>
                        </div>
                      )}
                    </div>
                    {(entry.actual_outcome || entry.lessons_learned) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-light-border dark:border-dark-border pt-3">
                        {entry.actual_outcome && (
                          <div className="text-xs">
                            <p className="font-bold text-[10px] uppercase tracking-wider text-brand-info mb-1">📋 Actual Outcome</p>
                            <p className="text-brand-muted leading-relaxed">{entry.actual_outcome}</p>
                          </div>
                        )}
                        {entry.lessons_learned && (
                          <div className="text-xs">
                            <p className="font-bold text-[10px] uppercase tracking-wider text-brand-primary mb-1">💡 Lessons Learned</p>
                            <p className="text-brand-muted leading-relaxed">{entry.lessons_learned}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border shrink-0">
              <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-primary" />
                {editEntry ? `Edit: ${editEntry.ticker}` : "New Investment Idea"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core fields + sub-tabs */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Top row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Ticker *</label>
                  <input value={form.ticker || ""} onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                    placeholder="e.g. AAPL"
                    className="w-full px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Company Name</label>
                  <input value={form.company_name || ""} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                    placeholder="Apple Inc."
                    className="w-full px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Status</label>
                  <select value={form.status || "Active"} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary">
                    {["Active", "Watching", "Exited", "Closed"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Conviction (1-10)</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={1} max={10} step={1} value={form.conviction_score || 5}
                      onChange={e => setForm(p => ({ ...p, conviction_score: parseInt(e.target.value) }))}
                      className="flex-1 accent-brand-primary" />
                    <span className="text-xs font-black font-mono text-brand-primary w-4">{form.conviction_score}</span>
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div className="flex gap-1 border-b border-light-border dark:border-dark-border pb-0">
                {(["thesis", "cases", "metrics", "review"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-t transition-colors capitalize ${activeTab === tab ? "text-brand-primary border-b-2 border-brand-primary" : "text-brand-muted hover:text-slate-700 dark:hover:text-white"}`}>
                    {tab === "thesis" ? "Investment Thesis" : tab === "cases" ? "Bull / Bear / Base" : tab === "metrics" ? "Price Metrics" : "Review & Outcome"}
                  </button>
                ))}
              </div>

              {activeTab === "thesis" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Investment Thesis</label>
                    <textarea rows={5} value={form.investment_thesis || ""} onChange={e => setForm(p => ({ ...p, investment_thesis: e.target.value }))}
                      placeholder="Why is this an attractive investment? What is the core value proposition? What competitive moat exists?"
                      className="w-full px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">⚠ Risks</label>
                      <textarea rows={4} value={form.risks || ""} onChange={e => setForm(p => ({ ...p, risks: e.target.value }))}
                        placeholder="Key risks to this thesis — regulatory, competitive, execution..."
                        className="w-full px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary resize-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">⚡ Catalysts</label>
                      <textarea rows={4} value={form.catalysts || ""} onChange={e => setForm(p => ({ ...p, catalysts: e.target.value }))}
                        placeholder="What upcoming events could unlock value? Earnings, product launch, regulatory approval..."
                        className="w-full px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "cases" && (
                <div className="space-y-3">
                  {[
                    { label: "🟢 Bull Case", key: "bull_case" as const, ph: "Best case outcome — what happens if everything goes right?", rows: 4 },
                    { label: "🟡 Base Case", key: "base_case" as const, ph: "Most likely outcome — realistic expectations from core thesis.", rows: 4 },
                    { label: "🔴 Bear Case", key: "bear_case" as const, ph: "Worst case — what if your thesis is wrong? What is the downside?", rows: 4 },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">{f.label}</label>
                      <textarea rows={f.rows} value={(form as any)[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.ph}
                        className="w-full px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary resize-none" />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "metrics" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Entry Price ($)", key: "entry_price", ph: "e.g. 150.00" },
                    { label: "Target Price ($)", key: "target_price", ph: "e.g. 220.00" },
                    { label: "Stop Loss ($)", key: "stop_loss", ph: "e.g. 130.00" },
                    { label: "Expected CAGR (%)", key: "expected_cagr", ph: "e.g. 18.5" },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">{f.label}</label>
                      <input type="number" step="0.01" value={(form as any)[f.key] || ""} onChange={e => setForm(p => ({ ...p, [f.key]: parseFloat(e.target.value) || undefined }))}
                        placeholder={f.ph}
                        className="w-full px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary font-mono" />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">Holding Period</label>
                    <select value={form.holding_period || "12-18 months"} onChange={e => setForm(p => ({ ...p, holding_period: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary">
                      {HOLDING_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "review" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">📋 Actual Outcome</label>
                    <textarea rows={4} value={form.actual_outcome || ""} onChange={e => setForm(p => ({ ...p, actual_outcome: e.target.value }))}
                      placeholder="What actually happened? Did the thesis play out? What was the actual return?"
                      className="w-full px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary resize-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-brand-muted block mb-1">💡 Lessons Learned</label>
                    <textarea rows={4} value={form.lessons_learned || ""} onChange={e => setForm(p => ({ ...p, lessons_learned: e.target.value }))}
                      placeholder="What did you learn from this investment? What would you do differently next time?"
                      className="w-full px-3 py-2 text-xs border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary resize-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-light-border dark:border-dark-border shrink-0">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-brand-muted hover:text-slate-800 dark:hover:text-white">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60">
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving..." : editEntry ? "Update Entry" : "Save Idea"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
