import React, { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, RotateCw, Search, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface HealthReport {
  ticker: string;
  name: string;
  status: "PASS" | "FAIL";
  price: number | null;
  fetched_mcap_cr: number | null;
  ground_truth_mcap_cr: number | null;
  mcap_variance_pct: number | null;
  fetched_promoter: number | null;
  ground_truth_promoter: number | null;
  promoter_variance: number | null;
  last_price_fetch: string | null;
  last_financials_period: string | null;
  basis: string | null;
  error_message: string | null;
  checked_at: string;
}

export function DataHealthView() {
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [search, setSearch] = useState("");

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/data-health");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Error fetching data health metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const handleTriggerAudit = async () => {
    setTriggering(true);
    try {
      const res = await fetch("/api/v1/admin/data-health/trigger", { method: "POST" });
      if (res.ok) {
        await fetchHealthData();
      }
    } catch (err) {
      console.error("Error triggering data health audit:", err);
    } finally {
      setTriggering(false);
    }
  };

  const filtered = reports.filter(
    (r) =>
      r.ticker.toLowerCase().includes(search.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(search.toLowerCase()))
  );

  const passes = reports.filter((r) => r.status === "PASS").length;
  const fails = reports.filter((r) => r.status === "FAIL").length;

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <h1 className="text-xl font-black uppercase text-brand-primary tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-secondary" />
            System Data Health Monitor
          </h1>
          <p className="text-xs text-brand-muted mt-1 max-w-xl">
            Real-time verification of yfinance metrics against independent ground-truth data scraped directly from Finology. Checked daily on startup/scheduler.
          </p>
        </div>
        
        <button
          onClick={handleTriggerAudit}
          disabled={triggering || loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${triggering ? "animate-spin" : ""}`} />
          {triggering ? "Running Audit..." : "Trigger Live Audit"}
        </button>
      </div>

      {/* Summary Widgets Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted uppercase font-mono font-bold block">Tracked Tickers</span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">{reports.length}</span>
          </div>
          <Clock className="w-8 h-8 text-brand-muted opacity-60" />
        </div>
        <div className="glass-card p-4 rounded-2xl border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted uppercase font-mono font-bold block">Pipeline Passed</span>
            <span className="text-xl font-black text-green-500 mt-1 block">{passes}</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-green-500 opacity-60" />
        </div>
        <div className="glass-card p-4 rounded-2xl border border-light-border dark:border-dark-border flex items-center justify-between">
          <div>
            <span className="text-[10px] text-brand-muted uppercase font-mono font-bold block">Divergence Alerts</span>
            <span className="text-xl font-black text-brand-danger mt-1 block">{fails}</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-brand-danger opacity-60" />
        </div>
      </div>

      {/* Main List and Filter bar */}
      <div className="glass-card rounded-2xl border border-light-border dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-light-border dark:border-dark-border flex flex-col sm:flex-row gap-3 justify-between items-center bg-black/5 dark:bg-white/5">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ticker or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-primary"
            />
          </div>
          <span className="text-[10px] font-mono text-brand-muted">
            Showing {filtered.length} of {reports.length} tracked stocks
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RotateCw className="w-8 h-8 text-brand-primary animate-spin" />
            <span className="text-xs text-brand-muted font-mono">Loading data health reports...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-light-border dark:border-dark-border bg-black/10 dark:bg-white/5 font-mono uppercase text-[9px] text-brand-muted font-bold">
                  <th className="p-4">Ticker & Name</th>
                  <th className="p-4">Audit Status</th>
                  <th className="p-4">Current Price</th>
                  <th className="p-4">Market Cap (Fetched vs GT)</th>
                  <th className="p-4">Promoter % (Fetched vs GT)</th>
                  <th className="p-4">Last Checked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-light-border dark:divide-dark-border">
                {filtered.map((r) => (
                  <tr key={r.ticker} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-black text-brand-primary">{r.ticker}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{r.name || "—"}</div>
                    </td>
                    <td className="p-4">
                      {r.status === "PASS" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 className="w-3 h-3" /> PASS
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-brand-danger/10 text-brand-danger border border-brand-danger/20">
                            <AlertTriangle className="w-3 h-3" /> FAIL
                          </span>
                          {r.error_message && (
                            <span className="block text-[8px] text-brand-danger font-sans max-w-xs leading-relaxed">
                              {r.error_message}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      {r.price ? `₹${r.price.toFixed(2)}` : "—"}
                      {r.last_price_fetch && (
                        <span className="block text-[8px] text-brand-muted mt-0.5">{r.last_price_fetch}</span>
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      {r.fetched_mcap_cr ? (
                        <>
                          <div>Fetched: {r.fetched_mcap_cr} Cr</div>
                          <div className="text-[10px] text-brand-muted">Ground Truth: {r.ground_truth_mcap_cr || "—"} Cr</div>
                          {r.mcap_variance_pct !== null && (
                            <span className={`block text-[9px] mt-0.5 font-bold ${r.mcap_variance_pct > 5.0 ? "text-brand-danger" : "text-brand-muted"}`}>
                              Var: {r.mcap_variance_pct.toFixed(4)}%
                            </span>
                          )}
                        </>
                      ) : (
                        "Data Unavailable"
                      )}
                    </td>
                    <td className="p-4 font-mono">
                      {r.fetched_promoter !== null ? (
                        <>
                          <div>Fetched: {r.fetched_promoter}%</div>
                          <div className="text-[10px] text-brand-muted">Ground Truth: {r.ground_truth_promoter || "—"}%</div>
                          {r.promoter_variance !== null && (
                            <span className={`block text-[9px] mt-0.5 font-bold ${r.promoter_variance > 2.0 ? "text-brand-danger" : "text-brand-muted"}`}>
                              Var: {r.promoter_variance.toFixed(4)}%
                            </span>
                          )}
                        </>
                      ) : (
                        "Data Unavailable"
                      )}
                    </td>
                    <td className="p-4 font-mono text-brand-muted text-[10px]">
                      {r.checked_at ? new Date(r.checked_at).toLocaleString() : "—"}
                      {r.last_financials_period && (
                        <span className="block text-[9px] font-bold text-brand-secondary mt-0.5">
                          {r.last_financials_period} ({r.basis})
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-brand-muted text-xs font-mono">
                No health reports match current query.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
