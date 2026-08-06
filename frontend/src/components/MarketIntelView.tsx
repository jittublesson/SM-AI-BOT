import React, { useState, useEffect } from "react";
import {
  Globe, TrendingUp, TrendingDown, BarChart2, Zap, DollarSign,
  Calendar, RefreshCw, ArrowUpRight, ArrowDownRight, Activity,
  AlertTriangle, Cpu, Flame, Building2, Briefcase, Landmark
} from "lucide-react";

interface MarketIntelViewProps {
  onSelectTicker?: (ticker: string) => void;
  targetCurrency?: string;
}

export const MarketIntelView: React.FC<MarketIntelViewProps> = ({ onSelectTicker, targetCurrency = "INR" }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sectors" | "flows" | "calendar" | "commodities">("overview");
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/market/intelligence");
      if (res.ok) {
        setData(await res.json());
        setLastRefresh(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Market intel fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-2">
        <RefreshCw className="w-6 h-6 text-brand-primary animate-spin mx-auto" />
        <p className="text-xs text-brand-muted">Loading market intelligence feed...</p>
      </div>
    </div>
  );

  const vix = data?.volatility;
  const breadth = data?.market_breadth;

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-primary" />
            Market Intelligence Center
          </h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Global markets · Sector rotation · FII/DII flows · Economic calendar
            {lastRefresh && <span className="ml-2 text-brand-primary">· Updated {lastRefresh}</span>}
          </p>
        </div>
        <button onClick={fetchData}
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted hover:text-slate-800 dark:hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3.5 h-3.5 text-brand-primary" />
            <span className="text-[10px] font-bold uppercase text-brand-muted">VIX</span>
          </div>
          <div className={`text-xl font-black font-mono ${vix?.vix < 20 ? "text-brand-secondary" : vix?.vix < 30 ? "text-brand-warning" : "text-brand-danger"}`}>
            {vix?.vix}
          </div>
          <div className="text-[9px] text-brand-muted">{vix?.vix_label}</div>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-brand-warning" />
            <span className="text-[10px] font-bold uppercase text-brand-muted">Fear & Greed</span>
          </div>
          <div className={`text-xl font-black font-mono ${vix?.fear_greed_score >= 70 ? "text-brand-warning" : vix?.fear_greed_score >= 50 ? "text-brand-secondary" : "text-brand-danger"}`}>
            {vix?.fear_greed_score}/100
          </div>
          <div className="text-[9px] text-brand-muted">{vix?.fear_greed_label}</div>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-brand-secondary" />
            <span className="text-[10px] font-bold uppercase text-brand-muted">A/D Ratio</span>
          </div>
          <div className="text-xl font-black font-mono text-brand-secondary">{breadth?.advance_decline_ratio}</div>
          <div className="text-[9px] text-brand-muted">{breadth?.advances}↑ / {breadth?.declines}↓</div>
        </div>
        <div className="glass-card p-3 rounded-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <Cpu className="w-3.5 h-3.5 text-brand-info" />
            <span className="text-[10px] font-bold uppercase text-brand-muted">India VIX</span>
          </div>
          <div className={`text-xl font-black font-mono ${vix?.india_vix < 15 ? "text-brand-secondary" : vix?.india_vix < 20 ? "text-brand-warning" : "text-brand-danger"}`}>
            {vix?.india_vix}
          </div>
          <div className="text-[9px] text-brand-muted">Low Vol — Risk On</div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 shrink-0 border-b border-light-border dark:border-dark-border">
        {[
          { id: "overview", label: "Global Markets", icon: Globe },
          { id: "sectors", label: "Sector Rotation", icon: BarChart2 },
          { id: "flows", label: "FII / DII Flows", icon: TrendingUp },
          { id: "calendar", label: "Economic Calendar", icon: Calendar },
          { id: "commodities", label: "Commodities & Rates", icon: DollarSign },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}>
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ---- OVERVIEW TAB ---- */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* AI Summary Card */}
            <div className="glass-card p-4 rounded-xl border-l-4 border-brand-primary">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-black uppercase text-brand-primary tracking-wider">AI Market Summary</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{data?.ai_market_summary}</p>
            </div>

            {/* Global Indices Grid */}
            <div>
              <h3 className="text-xs font-black uppercase text-brand-muted tracking-wider mb-2">Global Indices</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data?.global_indices?.map((idx: any, i: number) => {
                  const isUp = idx.trend === "up";
                  return (
                    <div key={i} className={`glass-card p-3 rounded-lg border ${isUp ? "border-brand-secondary/10" : "border-brand-danger/10"}`}>
                      <div className="text-[9px] font-bold uppercase text-brand-muted tracking-wider mb-1">{idx.name}</div>
                      <div className="text-sm font-black font-mono text-slate-800 dark:text-white">{idx.value}</div>
                      <div className={`text-[10px] font-bold font-mono mt-0.5 flex items-center gap-0.5 ${isUp ? "text-brand-secondary" : "text-brand-danger"}`}>
                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {idx.change}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breadth Indicator */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-xs font-black uppercase text-brand-muted tracking-wider mb-3 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-brand-secondary" /> Market Breadth
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-brand-secondary font-bold">{breadth?.advances} Advances</span>
                  <span className="text-brand-muted">{breadth?.unchanged} Unchanged</span>
                  <span className="text-brand-danger font-bold">{breadth?.declines} Declines</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex bg-black/5 dark:bg-white/5">
                  <div className="h-full bg-brand-secondary rounded-l-full" style={{ width: `${(breadth?.advances / (breadth?.advances + breadth?.declines + breadth?.unchanged)) * 100}%` }} />
                  <div className="h-full bg-slate-400/30" style={{ width: `${(breadth?.unchanged / (breadth?.advances + breadth?.declines + breadth?.unchanged)) * 100}%` }} />
                  <div className="h-full bg-brand-danger rounded-r-full" style={{ width: `${(breadth?.declines / (breadth?.advances + breadth?.declines + breadth?.unchanged)) * 100}%` }} />
                </div>
                <div className="flex gap-4 text-[10px] text-brand-muted font-mono">
                  <span>52W Highs: <strong className="text-brand-secondary">{breadth?.new_highs_52w}</strong></span>
                  <span>52W Lows: <strong className="text-brand-danger">{breadth?.new_lows_52w}</strong></span>
                  <span className="text-brand-primary italic ml-auto">{breadth?.breadth_signal}</span>
                </div>
              </div>
            </div>

            {/* IPO Calendar */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-xs font-black uppercase text-brand-muted tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-warning" /> IPO Calendar
              </h3>
              <div className="space-y-2">
                {data?.ipo_calendar?.map((ipo: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border text-xs">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{ipo.company}</span>
                      <span className="text-[10px] text-brand-muted block">{ipo.date} · Size: Rs {ipo.size_cr} Cr</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-brand-primary text-[10px] font-bold block">{ipo.price_band}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${ipo.status === "Open" ? "bg-brand-secondary/15 text-brand-secondary" : "bg-brand-warning/15 text-brand-warning"}`}>
                        {ipo.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---- SECTORS TAB ---- */}
        {activeTab === "sectors" && (
          <div className="space-y-3">
            <div className="glass-card p-4 rounded-xl border-l-4 border-brand-info">
              <p className="text-xs text-brand-muted">
                <strong className="text-brand-info">Sector Rotation Signal:</strong> Technology and Communication Services leading — risk-on positioning.
                Energy and Real Estate lagging — defensive rotation underway.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data?.sector_performance?.map((s: any, i: number) => {
                const isUp = s.trend === "up";
                const pct = parseFloat(s.change.replace("%", "").replace("+", ""));
                const barWidth = Math.min(Math.abs(pct) * 15, 100);
                const signalColor = s.signal === "Accumulate" || s.signal === "Overweight" ? "text-brand-secondary bg-brand-secondary/10" :
                  s.signal === "Underweight" || s.signal === "Reduce" ? "text-brand-danger bg-brand-danger/10" : "text-brand-muted bg-black/5 dark:bg-white/5";

                return (
                  <div key={i} className="glass-card p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{s.sector}</span>
                        <span className={`ml-2 text-[8px] font-bold px-1.5 py-0.5 rounded ${signalColor}`}>{s.signal}</span>
                      </div>
                      <span className={`text-xs font-black font-mono ${isUp ? "text-brand-secondary" : "text-brand-danger"}`}>
                        {s.change}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${isUp ? "bg-brand-secondary" : "bg-brand-danger"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- FII/DII FLOWS TAB ---- */}
        {activeTab === "flows" && (
          <div className="space-y-4">
            {(() => {
              const flows = data?.fii_dii_flows;
              return (
                <>
                  <div className="glass-card p-4 rounded-xl border-l-4 border-brand-warning">
                    <p className="text-xs text-slate-700 dark:text-slate-300">{flows?.summary}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "FII Net Today", value: flows?.fii_net_today_cr, suffix: "Cr" },
                      { label: "DII Net Today", value: flows?.dii_net_today_cr, suffix: "Cr" },
                      { label: "Net Today", value: (flows?.fii_net_today_cr || 0) + (flows?.dii_net_today_cr || 0), suffix: "Cr" },
                      { label: "FII MTD", value: flows?.fii_net_month_cr, suffix: "Cr" },
                      { label: "DII MTD", value: flows?.dii_net_month_cr, suffix: "Cr" },
                      { label: "Net MTD", value: (flows?.fii_net_month_cr || 0) + (flows?.dii_net_month_cr || 0), suffix: "Cr" },
                      { label: "FII YTD", value: flows?.fii_ytd_cr, suffix: "Cr" },
                      { label: "DII YTD", value: flows?.dii_ytd_cr, suffix: "Cr" },
                      { label: "Net YTD", value: (flows?.fii_ytd_cr || 0) + (flows?.dii_ytd_cr || 0), suffix: "Cr" },
                    ].map((f, i) => {
                      const isPos = (f.value || 0) >= 0;
                      return (
                        <div key={i} className="glass-card p-3 rounded-lg text-center">
                          <div className={`text-sm font-black font-mono ${isPos ? "text-brand-secondary" : "text-brand-danger"}`}>
                            {isPos ? "+" : ""}{(f.value || 0).toLocaleString()} {f.suffix}
                          </div>
                          <div className="text-[9px] text-brand-muted mt-0.5">{f.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* FII vs DII flow bar */}
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-xs font-black uppercase text-brand-muted tracking-wider mb-3">YTD Flow Balance</h3>
                    <div className="space-y-3">
                      {[
                        { label: "FII (Selling)", value: Math.abs(flows?.fii_ytd_cr || 0), max: Math.abs(flows?.dii_ytd_cr || 1), color: "bg-brand-danger" },
                        { label: "DII (Buying)", value: flows?.dii_ytd_cr || 0, max: Math.abs(flows?.dii_ytd_cr || 1), color: "bg-brand-secondary" },
                      ].map((f, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{f.label}</span>
                            <span className="font-mono text-brand-muted">Rs {f.value.toLocaleString()} Cr</span>
                          </div>
                          <div className="h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full ${f.color} rounded-full transition-all duration-1000`} style={{ width: `${(f.value / f.max) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ---- ECONOMIC CALENDAR TAB ---- */}
        {activeTab === "calendar" && (
          <div className="space-y-3">
            <div className="glass-card p-4 rounded-xl border-l-4 border-brand-danger">
              <p className="text-xs text-brand-muted">
                <strong className="text-brand-danger">⚠ Key Risk Event:</strong> US Federal Reserve FOMC meeting on July 28.
                Any unexpected hawkish signal could trigger significant market volatility across equities and bonds.
              </p>
            </div>
            <div className="space-y-2">
              {data?.economic_calendar?.map((ev: any, i: number) => {
                const impactColor = ev.impact === "Critical" ? "text-brand-danger bg-brand-danger/10" :
                  ev.impact === "High" ? "text-brand-warning bg-brand-warning/10" : "text-brand-muted bg-black/5 dark:bg-white/5";
                return (
                  <div key={i} className="glass-card p-3.5 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center w-14 shrink-0">
                        <span className="text-[9px] font-mono text-brand-muted block">{ev.date}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{ev.event}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-brand-muted">Forecast: <strong className="text-slate-700 dark:text-slate-300">{ev.forecast}</strong></span>
                          <span className="text-[9px] text-brand-muted">Prior: <strong>{ev.prior}</strong></span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${impactColor}`}>
                      {ev.impact}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- COMMODITIES & RATES TAB ---- */}
        {activeTab === "commodities" && (
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-brand-muted tracking-wider mb-3">Commodities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data?.commodities?.map((c: any, i: number) => {
                  const isUp = c.trend === "up";
                  return (
                    <div key={i} className={`glass-card p-3.5 rounded-xl border ${isUp ? "border-brand-secondary/10" : "border-brand-danger/10"}`}>
                      <div className="text-[9px] font-bold uppercase text-brand-muted tracking-wider mb-1">{c.name}</div>
                      <div className="text-base font-black font-mono text-slate-800 dark:text-white">{c.value}</div>
                      <div className={`text-[10px] font-bold font-mono mt-0.5 flex items-center gap-0.5 ${isUp ? "text-brand-secondary" : "text-brand-danger"}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {c.change}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-brand-muted tracking-wider mb-3">Fixed Income & Currency</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {data?.fixed_income?.map((fi: any, i: number) => {
                  const isUp = fi.trend === "up";
                  return (
                    <div key={i} className="glass-card p-3.5 rounded-xl">
                      <div className="text-[9px] font-bold uppercase text-brand-muted tracking-wider mb-1">{fi.name}</div>
                      <div className="text-base font-black font-mono text-slate-800 dark:text-white">{fi.value}</div>
                      <div className={`text-[10px] font-bold font-mono mt-0.5 ${isUp ? "text-brand-secondary" : "text-brand-danger"}`}>
                        {fi.change}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
