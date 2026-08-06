import React, { useState, useEffect } from "react";
import { ShieldCheck, FileText, Search, RefreshCw, AlertTriangle, BookOpen, ChevronRight } from "lucide-react";

interface AnnualReportViewProps {
  ticker: string;
  targetCurrency?: string;
}

export const AnnualReportView: React.FC<AnnualReportViewProps> = ({ ticker, targetCurrency = "INR" }) => {
  const [loading, setLoading] = useState(true);
  const [highlights, setHighlights] = useState<any>(null);
  
  // Interactive Document View states
  const [activeSection, setActiveSection] = useState<string>("biz");
  const [highlightsExpanded, setHighlightsExpanded] = useState<boolean>(true);

  // RAG Query states
  const [queryText, setQueryText] = useState("");
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);

  const fetchHighlights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports/highlights?ticker=${ticker}`);
      const json = await res.json();
      setHighlights(json);
      setQueryResults([]);
      setQueryText("");
    } catch (err) {
      console.error("Highlights load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHighlights();
  }, [ticker]);

  const handleQuerySearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;

    setQueryLoading(true);
    try {
      const res = await fetch(`/api/v1/reports/query?ticker=${ticker}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: queryText })
      });
      const json = await res.json();
      setQueryResults(json);
    } catch (err) {
      console.error("Filing query failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  // Static Table of Contents definitions matching database keys
  const sectionsList = [
    { id: "biz", label: "Item 1: Business Overview", page: 4 },
    { id: "risks", label: "Item 1A: Risk Factors", page: 12, flag: true },
    { id: "mda", label: "Item 7: MD&A Analysis", page: 28 },
    { id: "accounting", label: "Note 2: Accounting Policies", page: 48 }
  ];

  const getSectionContent = () => {
    if (ticker.toUpperCase() === "AAPL") {
      switch (activeSection) {
        case "biz":
          return "Apple Inc. designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories. Software and Services include Apple Music, Apple Pay, iCloud, and App Store licensing transactions.";
        case "risks":
          return "The Company's business and financial performance depend significantly on global supply chains and manufacturing locations in the Asia-Pacific region. Tariff updates or trade sanctions could disrupt component sourcing schedules. [CRITICAL ALERT: Regulatory scrutiny over App Store commission fee structures represents a key margins risk.]";
        case "mda":
          return "Net sales rose by 2% in FY24 compared to FY23. Operating margin improved by 50 basis points to 30.7%, primarily driven by a higher revenue mix of high-margin Services which grew at 9% year-over-year. [GREEN FLAG: Operating cash flows exceed net income targets.]";
        case "accounting":
          return "Accounting Policy Change: Capitalized software development useful spans adjusted from 3 to 5 years maximum limit, optimizing dynamic depreciation schedules. [NOTE: Depreciation expense was reduced as a result.]";
        default:
          return "";
      }
    } else {
      switch (activeSection) {
        case "biz":
          return "Reliance Industries operates energy, petroleum refining, petrochemicals, telecommunication networks, and organized retail storefront chains across India.";
        case "risks":
          return "Key operational risks relate to commodity feedstock costs fluctuations and foreign exchange volatility on crude oil imports. Geopolitical tensions across shipping lanes could impact shipping freight schedules. [CRITICAL ALERT: Logistics maritime corridor delays represent key input cost risks.]";
        case "mda":
          return "Our EBITDA rose to a record high of 154,740 Cr, led by consumer businesses (Jio and Retail) which now contribute over 50% of segment earnings. Oil-to-chemicals margins stabilized. [GREEN FLAG: Free cash flow conversion metrics remain strong.]";
        case "accounting":
          return "Accounting Policy Shift: Depreciation rates on oil drilling assets were recalibrated in accordance with Schedule II useful life limits, resulting in a minor reduction in current year non-cash write-offs and lower depreciation expense by 1,200 Cr.";
        default:
          return "";
      }
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full overflow-hidden">
      
      {/* 1. Interactive Table of Contents (TOC) Sidebar */}
      <div className="xl:col-span-1 glass-card p-4 rounded-lg flex flex-col space-y-4 h-full overflow-y-auto pr-1">
        <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5">
          <BookOpen className="w-4 h-4 text-brand-primary" />
          Interactive TOC Indices
        </h2>
        <div className="space-y-1.5">
          {sectionsList.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs transition-all border ${
                activeSection === sec.id 
                  ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20 font-bold" 
                  : "bg-black/5 dark:bg-white/5 border-transparent text-brand-muted hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSection === sec.id ? "rotate-90 text-brand-primary" : ""}`} />
                <span className="truncate max-w-[120px] text-left">{sec.label}</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px]">
                {sec.flag && <AlertTriangle className="w-3.5 h-3.5 text-brand-warning shrink-0" />}
                <span>p. {sec.page}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Document Text Reader Workspace */}
      <div className="xl:col-span-2 glass-card p-6 rounded-lg flex flex-col space-y-4 h-full overflow-y-auto pr-1">
        <div className="border-b border-light-border dark:border-dark-border pb-3 flex justify-between items-center">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <FileText className="text-brand-primary w-5 h-5" />
            AI Document Reader Canvas ({ticker.toUpperCase()})
          </h2>
          <span className="text-[10px] font-mono font-bold bg-brand-primary/10 text-brand-primary px-3 py-1 rounded">
            Section: {activeSection.toUpperCase()}
          </span>
        </div>

        {/* Section Text Reader Area with Highlight logic */}
        <div className="p-4 bg-light-bg dark:bg-[#070a10] border border-light-border dark:border-dark-border rounded-lg text-xs leading-relaxed text-slate-800 dark:text-slate-200 min-h-[140px]">
          {getSectionContent().split("[").map((chunk, cIdx) => {
            if (cIdx === 0) return chunk;
            const parts = chunk.split("]");
            const highlightText = parts[0];
            const rest = parts[1] || "";
            
            let colorClass = "bg-brand-warning/20 text-brand-warning border-l-2 border-brand-warning pl-2 py-0.5 my-1 block";
            if (highlightText.includes("GREEN FLAG")) {
              colorClass = "bg-brand-secondary/20 text-brand-secondary border-l-2 border-brand-secondary pl-2 py-0.5 my-1 block font-semibold";
            } else if (highlightText.includes("CRITICAL ALERT")) {
              colorClass = "bg-brand-danger/20 text-brand-danger border-l-2 border-brand-danger pl-2 py-0.5 my-1 block font-semibold";
            }

            return (
              <span key={cIdx}>
                <span className={colorClass}>
                  {highlightText}
                </span>
                {rest}
              </span>
            );
          })}
        </div>

        {/* Ask Questions Document Terminal */}
        <div className="pt-4 border-t border-light-border dark:border-dark-border flex flex-col space-y-3">
          <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
            <Search className="w-4 h-4 text-brand-primary" />
            Query RAG Citations Terminal
          </h3>
          <form onSubmit={handleQuerySearch} className="flex gap-2 text-xs">
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Ask about policy modifications, audit remarks, or operational risks..."
              className="flex-1 px-3 py-2 rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={queryLoading}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold uppercase rounded transition-colors disabled:opacity-50"
            >
              Query
            </button>
          </form>

          {queryLoading ? (
            <div className="text-xs text-brand-muted text-center py-6">Scanning index files...</div>
          ) : queryResults.length > 0 ? (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
              {queryResults.map((res: any, idx: number) => (
                <div key={idx} className="p-3 rounded bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-brand-muted">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{res.document}</span>
                    <span>{res.section} (Page {res.page_number})</span>
                  </div>
                  <p className="text-[11px] leading-relaxed italic text-slate-600 dark:text-slate-300">
                    "{res.evidence}"
                  </p>
                  <div className="text-[9px] font-mono text-brand-secondary text-right">
                    Match Confidence: {res.confidence_level} ({res.confidence_score})
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* 3. Audit Integrity Checklist Sidebar */}
      <div className="xl:col-span-1 glass-card p-4 rounded-lg flex flex-col space-y-6 h-full overflow-y-auto pr-1">
        <div>
          <h2 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5 border-b border-light-border dark:border-dark-border pb-2.5 mb-3">
            <ShieldCheck className="w-4 h-4 text-brand-secondary" />
            Audited Policy Checks
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[10px] text-brand-secondary font-black uppercase tracking-wider block mb-1">Green Flags Checklist</span>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-brand-secondary font-bold">•</span>
                  <span>Auditor issues unqualified (clean) review opinion on controls.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-brand-secondary font-bold">•</span>
                  <span>EBITDA conversion to operating cash flows is highly optimized.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-light-border dark:border-dark-border">
              <span className="text-[10px] text-brand-danger font-black uppercase tracking-wider block mb-1">Red Flags & Concerns</span>
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <span className="text-brand-danger font-bold">•</span>
                  <span>Mentions of contingent liability risks regarding tax rules.</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-brand-danger font-bold">•</span>
                  <span>Supply lane logistics represents structural cost concerns.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Management promise audits summary */}
        {highlights && (
          <div className="pt-4 border-t border-light-border dark:border-dark-border space-y-3">
            <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-brand-warning" />
              Promise Execution
            </h3>
            {highlights.management_promises?.map((promise: any, idx: number) => (
              <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border text-xs space-y-1">
                <div className="flex justify-between items-center text-[9px] font-mono text-brand-muted">
                  <span>Audit Target:</span>
                  <span className="font-bold text-brand-secondary">{promise.status}</span>
                </div>
                <p className="font-semibold">{promise.promise}</p>
                <p className="text-[11px] text-brand-muted">{promise.evidence} ({promise.page_reference})</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
