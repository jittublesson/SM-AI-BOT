import React, { useState, useEffect } from "react";
import {
  Eye, Plus, Trash2, Target, Bell, Edit3, Check, X,
  TrendingUp, TrendingDown, BarChart2, RefreshCw, Search,
  Star, AlertTriangle, Bookmark, ArrowUpRight
} from "lucide-react";

import { formatPrice } from "../utils/currency";

interface WatchlistViewProps {
  onSelectTicker: (ticker: string) => void;
  targetCurrency?: string;
}

interface WatchlistItem {
  id: number;
  ticker: string;
  name: string | null;
  sector: string | null;
  target_price: number | null;
  alert_threshold_pct: number | null;
  notes: string | null;
  added_at: string | null;
}

interface PriceData {
  price: number;
  market_cap: number;
  pe_ratio: number | null;
  roe: number | null;
  net_margin: number | null;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({ onSelectTicker, targetCurrency = "INR" }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [priceLoading, setPriceLoading] = useState(false);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newTargetPrice, setNewTargetPrice] = useState("");
  const [newAlertPct, setNewAlertPct] = useState("");
  const [newNote, setNewNote] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState("");
  const [editAlert, setEditAlert] = useState("");
  const [editNote, setEditNote] = useState("");

  const fetchWatchlist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/watchlist");
      if (res.ok) {
        const data = await res.json();
        setWatchlist(data);
      }
    } catch (err) {
      console.error("Watchlist load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async (items: WatchlistItem[]) => {
    if (!items.length) return;
    setPriceLoading(true);
    const map: Record<string, PriceData> = {};
    await Promise.allSettled(
      items.map(async (item) => {
        try {
          const res = await fetch(`/api/v1/analyst/price/${item.ticker}`);
          if (res.ok) {
            const d = await res.json();
            map[item.ticker] = d;
          }
        } catch { /* silent fail per ticker */ }
      })
    );
    setPriceMap(map);
    setPriceLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (watchlist.length > 0) fetchPrices(watchlist);
  }, [watchlist]);

  const handleTickerSearch = async (val: string) => {
    setNewTicker(val);
    if (val.trim().length >= 1) {
      try {
        const res = await fetch(`/api/v1/analyst/search?q=${val}`);
        const list = await res.json();
        setSearchResults(list.slice(0, 6));
      } catch { setSearchResults([]); }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddToWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker.trim()) return;

    // Form input validation
    const target = newTargetPrice ? parseFloat(newTargetPrice) : null;
    if (newTargetPrice && (isNaN(target!) || target! <= 0)) {
      setAddError("Target Price must be a positive number.");
      return;
    }
    const alertVal = newAlertPct ? parseFloat(newAlertPct) : null;
    if (newAlertPct && (isNaN(alertVal!) || alertVal! < 0 || alertVal! > 100)) {
      setAddError("Alert Threshold must be a percentage between 0 and 100.");
      return;
    }

    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/v1/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: newTicker.trim().toUpperCase(),
          target_price: target,
          alert_threshold_pct: alertVal,
          notes: newNote.trim() || null
        })
      });
      if (res.status === 409) {
        setAddError(`${newTicker.toUpperCase()} is already in your watchlist.`);
        return;
      }
      if (!res.ok) {
        setAddError("Failed to add ticker. Please verify the symbol.");
        return;
      }
      setNewTicker(""); setNewTargetPrice(""); setNewAlertPct(""); setNewNote("");
      setShowAddForm(false); setSearchResults([]);
      fetchWatchlist();
    } catch {
      setAddError("Network error — please check the backend.");
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (id: number, ticker: string) => {
    if (!window.confirm(`Remove ${ticker} from watchlist?`)) return;
    try {
      await fetch(`/api/v1/watchlist/${id}`, { method: "DELETE" });
      fetchWatchlist();
    } catch { console.error("Remove failed"); }
  };

  const startEdit = (item: WatchlistItem) => {
    setEditingId(item.id);
    setEditTarget(item.target_price ? String(item.target_price) : "");
    setEditAlert(item.alert_threshold_pct ? String(item.alert_threshold_pct) : "");
    setEditNote(item.notes || "");
  };

  const handleSaveEdit = async (id: number) => {
    // Form input validation for edit state
    const target = editTarget ? parseFloat(editTarget) : null;
    if (editTarget && (isNaN(target!) || target! <= 0)) {
      alert("Target Price must be a positive number.");
      return;
    }
    const alertVal = editAlert ? parseFloat(editAlert) : null;
    if (editAlert && (isNaN(alertVal!) || alertVal! < 0 || alertVal! > 100)) {
      alert("Alert Threshold must be a percentage between 0 and 100.");
      return;
    }

    try {
      await fetch(`/api/v1/watchlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_price: target,
          alert_threshold_pct: alertVal,
          notes: editNote.trim() || null
        })
      });
      setEditingId(null);
      fetchWatchlist();
    } catch { console.error("Save failed"); }
  };

  const getMOS = (item: WatchlistItem): { pct: number; label: string; color: string } | null => {
    const price = priceMap[item.ticker]?.price;
    if (!price || !item.target_price) return null;
    const pct = ((item.target_price - price) / price) * 100;
    if (pct > 20) return { pct, label: "Strong Upside", color: "text-brand-success" };
    if (pct > 5) return { pct, label: "Upside", color: "text-brand-success" };
    if (pct > -5) return { pct, label: "Fair Value", color: "text-brand-warning" };
    return { pct, label: "Overvalued", color: "text-brand-danger" };
  };

  const getSectors = () => {
    const sectors = new Set(watchlist.map(i => i.sector || "Equity"));
    return Array.from(sectors);
  };

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-2">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-black flex items-center gap-2 text-slate-800 dark:text-white">
            <Eye className="w-5 h-5 text-brand-primary" />
            Investment Watchlist
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Track your conviction positions • Set target prices • Monitor alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchWatchlist(); }}
            className="p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted transition-colors"
            title="Refresh prices"
          >
            <RefreshCw className={`w-4 h-4 ${priceLoading ? "animate-spin text-brand-primary" : ""}`} />
          </button>
          <button
            onClick={() => { setShowAddForm(true); setAddError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs uppercase rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add to Watchlist
          </button>
        </div>
      </div>

      {/* Add Form Overlay */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-[480px] glass-card rounded-xl shadow-2xl p-6 border border-light-border dark:border-dark-border relative">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-primary" />
                Add Stock to Watchlist
              </h2>
              <button onClick={() => { setShowAddForm(false); setSearchResults([]); setAddError(""); }} className="text-brand-muted hover:text-slate-800 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddToWatchlist} className="space-y-4 text-xs">
              {/* Ticker search */}
              <div className="relative">
                <label className="font-semibold text-brand-muted block mb-1">Stock Ticker / Company Name *</label>
                <div className="flex items-center gap-2 border border-light-border dark:border-dark-border rounded bg-black/5 dark:bg-white/5 px-2">
                  <Search className="w-3.5 h-3.5 text-brand-muted shrink-0" />
                  <input
                    type="text"
                    value={newTicker}
                    onChange={(e) => handleTickerSearch(e.target.value)}
                    placeholder="e.g. AAPL, RELIANCE.NS, NVDA..."
                    className="flex-1 py-2 bg-transparent focus:outline-none text-slate-800 dark:text-white uppercase"
                    required
                    autoFocus
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-[#0d1117] border border-light-border dark:border-dark-border rounded shadow-xl z-10">
                    {searchResults.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => { setNewTicker(r.ticker); setSearchResults([]); }}
                        className="flex justify-between items-center px-3 py-2 hover:bg-brand-primary/5 cursor-pointer transition-colors border-b border-light-border dark:border-dark-border last:border-0"
                      >
                        <div>
                          <span className="font-bold font-mono text-brand-primary mr-2">{r.ticker}</span>
                          <span className="text-slate-700 dark:text-slate-300">{r.name}</span>
                        </div>
                        <span className="text-[9px] font-mono bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">{r.sector}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-brand-muted block mb-1">Target Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newTargetPrice}
                    onChange={(e) => setNewTargetPrice(e.target.value)}
                    placeholder="e.g. 250.00"
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-brand-muted block mb-1">Alert Threshold (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newAlertPct}
                    onChange={(e) => setNewAlertPct(e.target.value)}
                    placeholder="e.g. 5.0"
                    className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-brand-muted block mb-1">Research Thesis / Note</label>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Why do you have conviction in this position?"
                  rows={2}
                  className="w-full p-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary resize-none"
                />
              </div>

              {addError && (
                <div className="p-2 rounded bg-brand-danger/10 text-brand-danger border border-brand-danger/20 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddForm(false); setSearchResults([]); setAddError(""); }} className="px-4 py-2 text-brand-muted hover:text-slate-800 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !newTicker.trim()}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold uppercase rounded transition-colors disabled:opacity-50"
                >
                  {addLoading ? "Adding..." : "Add to Watchlist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {!loading && watchlist.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Positions", value: watchlist.length, icon: <Eye className="w-4 h-4" /> },
            { label: "Sectors Covered", value: getSectors().length, icon: <BarChart2 className="w-4 h-4" /> },
            { label: "With Target Prices", value: watchlist.filter(i => i.target_price).length, icon: <Target className="w-4 h-4" /> },
            { label: "With Alerts Set", value: watchlist.filter(i => i.alert_threshold_pct).length, icon: <Bell className="w-4 h-4" /> }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-brand-primary/10 rounded text-brand-primary">{stat.icon}</div>
              <div>
                <div className="text-lg font-black font-mono text-slate-800 dark:text-white">{stat.value}</div>
                <div className="text-[10px] text-brand-muted uppercase tracking-wide">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 text-brand-muted gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-primary" />
          <span className="text-xs">Loading watchlist...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && watchlist.length === 0 && (
        <div className="glass-card rounded-xl p-16 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-5 bg-brand-primary/10 rounded-full">
            <Star className="w-8 h-8 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">Your watchlist is empty</h2>
            <p className="text-xs text-brand-muted mt-1">Add stocks to track your conviction positions with target prices and alerts.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs uppercase rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Stock
          </button>
        </div>
      )}

      {/* Watchlist Table */}
      {!loading && watchlist.length > 0 && (
        <div className="glass-card rounded-xl overflow-hidden border border-light-border dark:border-dark-border">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-black/3 dark:bg-white/3">
                  <th className="text-left px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Stock</th>
                  <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Live Price</th>
                  <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Target</th>
                  <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Margin of Safety</th>
                  <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">P/E</th>
                  <th className="text-right px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">ROE%</th>
                  <th className="text-left px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Thesis Note</th>
                  <th className="text-center px-4 py-3 font-bold text-brand-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((item) => {
                  const pd = priceMap[item.ticker];
                  const mos = getMOS(item);
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-light-border dark:border-dark-border hover:bg-black/2 dark:hover:bg-white/2 transition-colors group">
                      {/* Stock name */}
                      <td className="px-4 py-3">
                        <div>
                          <button
                            onClick={() => onSelectTicker(item.ticker)}
                            className="font-bold font-mono text-brand-primary hover:underline flex items-center gap-1"
                          >
                            {item.ticker}
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <div className="text-[10px] text-brand-muted mt-0.5">{item.name || "—"}</div>
                          <div className="text-[9px] font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded mt-0.5 inline-block">{item.sector || "Equity"}</div>
                        </div>
                      </td>

                      {/* Live price */}
                      <td className="px-4 py-3 text-right">
                        {pd ? (
                          <span className="font-bold font-mono text-slate-800 dark:text-white">
                            {formatPrice(pd.price, item.ticker.endsWith(".NS") ? "INR" : "USD", targetCurrency, true)}
                          </span>
                        ) : (
                          <span className="text-brand-muted italic">Loading...</span>
                        )}
                      </td>

                      {/* Target price */}
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input
                            type="number" step="0.01"
                            value={editTarget}
                            onChange={(e) => setEditTarget(e.target.value)}
                            className="w-20 p-1 text-right border border-brand-primary/40 rounded bg-black/5 dark:bg-white/5 focus:outline-none"
                            placeholder="Target"
                          />
                        ) : item.target_price ? (
                          <span className="font-mono text-brand-success">
                            {formatPrice(item.target_price, item.ticker.endsWith(".NS") ? "INR" : "USD", targetCurrency, true)}
                          </span>
                        ) : (
                          <span className="text-brand-muted">—</span>
                        )}
                      </td>

                      {/* Margin of Safety */}
                      <td className="px-4 py-3 text-right">
                        {mos ? (
                          <div className={`font-bold font-mono ${mos.color}`}>
                            {mos.pct > 0 ? "+" : ""}{mos.pct.toFixed(1)}%
                            <div className="text-[9px] font-sans font-normal opacity-70">{mos.label}</div>
                          </div>
                        ) : <span className="text-brand-muted">—</span>}
                      </td>

                      {/* P/E */}
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {pd?.pe_ratio != null ? pd.pe_ratio.toFixed(1) + "x" : "—"}
                      </td>

                      {/* ROE */}
                      <td className="px-4 py-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {pd?.roe != null ? pd.roe.toFixed(1) + "%" : "—"}
                      </td>

                      {/* Notes */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            className="w-full p-1 border border-brand-primary/40 rounded bg-black/5 dark:bg-white/5 focus:outline-none text-xs"
                            placeholder="Research note..."
                          />
                        ) : (
                          <span className="text-[10px] text-brand-muted truncate block" title={item.notes || ""}>
                            {item.notes || "—"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleSaveEdit(item.id)} className="p-1.5 rounded hover:bg-brand-success/10 text-brand-success transition-colors" title="Save">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 rounded hover:bg-brand-danger/10 text-brand-danger transition-colors" title="Cancel">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(item)} className="p-1.5 rounded hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-colors" title="Edit target & note">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => { onSelectTicker(item.ticker); }} className="p-1.5 rounded hover:bg-brand-primary/10 text-brand-muted hover:text-brand-primary transition-colors" title="Open research workspace">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleRemove(item.id, item.ticker)} className="p-1.5 rounded hover:bg-brand-danger/10 text-brand-muted hover:text-brand-danger transition-colors" title="Remove from watchlist">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sector breakdown */}
      {!loading && watchlist.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-4 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-brand-primary" />
            Watchlist Sector Distribution
          </h3>
          <div className="space-y-2">
            {getSectors().map((sector) => {
              const count = watchlist.filter(i => (i.sector || "Equity") === sector).length;
              const pct = (count / watchlist.length) * 100;
              return (
                <div key={sector} className="flex items-center gap-3">
                  <div className="w-28 text-[10px] text-brand-muted truncate font-mono">{sector}</div>
                  <div className="flex-1 h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-[10px] text-brand-muted font-mono">{count} / {watchlist.length}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="text-[10px] text-brand-muted text-center pb-4 font-mono">
        Added {new Date().toLocaleDateString()} · Prices refreshed on demand · Targets are investor estimates only, not financial advice.
      </div>
    </div>
  );
};
