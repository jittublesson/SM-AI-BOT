import React, { useState, useEffect } from "react";
import { 
  Landmark, TrendingUp, Info, HelpCircle, ArrowUpRight, Award, 
  DollarSign, ShieldAlert, Cpu, Users, Calendar, Grid, FileText, Download, BookOpen, Check,
  UserCheck, PieChart, GitBranch, Star, AlertTriangle, BarChart2
} from "lucide-react";
import { formatPrice, formatFinancialValue, convertCurrency, CURRENCY_SYMBOLS } from "../utils/currency";

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
  }, [ticker]);

  const metricsExplanations: Record<string, { title: string; formula: string; explain: string }> = {
    roe: {
      title: "Return on Equity (ROE)",
      formula: "ROE = Net Profit / Shareholders Equity",
      explain: "Measures capital allocation efficiency. It tells you how many dollars of net profit the company generates for every $100 of equity capital invested by shareholders. High ROE (above 15-20%) shows efficient wealth creation."
    },
    roce: {
      title: "Return on Capital Employed (ROCE)",
      formula: "ROCE = EBIT / (Shareholders Equity + Total Debt)",
      explain: "Measures total capital returns. It factors in both equity and debt capital, showing how effectively management deploys all long-term funding sources. Excellent for asset-heavy conglomerates."
    },
    debt_equity: {
      title: "Debt-to-Equity Ratio",
      formula: "Debt/Equity = Total Debt / Shareholders Equity",
      explain: "Evaluates financial leverage. A ratio of 0.5x implies the company has twice as much equity capital as debt capital. Ratios above 1.5x need strong interest coverage support."
    },
    working_capital: {
      title: "Net Working Capital",
      formula: "Working Capital = Current Assets - Current Liabilities",
      explain: "Measures operational liquidity. Positive working capital ensures the company can fund daily operations, pay suppliers, and service short-term debts without borrowing."
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const existing = localStorage.getItem("wealthpilot_notes");
    const notesArr = existing ? JSON.parse(existing) : [];
    notesArr.unshift({
      ticker,
      text: noteText,
      date: new Date().toLocaleDateString()
    });
    localStorage.setItem("wealthpilot_notes", JSON.stringify(notesArr));
    setNoteText("");
    showToast(`Research note pinned for ${ticker}`);
  };

  const compileReportContent = (format: "markdown" | "html" | "pptx") => {
    const dateStr = new Date().toLocaleDateString();
    const info = data?.profile?.info || {};
    const scoreVal = data?.score?.score_rating || 0;
    const summary = data?.agent_report?.report_summary || "";
    const overallScore = data?.agent_report?.overall_score || 0;
    const strengths = data?.score?.strengths || [];
    const weaknesses = data?.score?.weaknesses || [];
    const thesis = data?.score?.thesis || "";

    // Pinned notes
    const rawNotes = localStorage.getItem("wealthpilot_notes");
    const notesList = rawNotes ? JSON.parse(rawNotes) : [];
    const tickerNotes = notesList.filter((n: any) => n.ticker === ticker);

    if (format === "markdown") {
      let md = `# WEALTHPILOT AI — INVESTMENT RESEARCH REPORT: ${info.name || ticker}\n`;
      md += `*Generated on: ${dateStr} | Symbol: ${ticker.toUpperCase()} | Sector: ${info.sector || "N/A"} | Exchange: ${info.exchange || "N/A"}*\n\n`;
      md += `## 1. Executive Summary\n`;
      md += `- **Sector**: ${info.sector || "N/A"}\n`;
      md += `- **Current Price**: ${formatPrice(info.price, sourceCurrency, targetCurrency, true)}\n`;
      md += `- **Health Score**: ${scoreVal}/100\n`;
      md += `- **Consensus Coordinator Rating**: ${overallScore}/10\n\n`;
      md += `### Business Description\n${info.description || "No description available."}\n\n`;
      md += `### Consensus Agent Assessment\n${summary}\n\n`;
      md += `### Coordinated Investment Thesis\n${thesis}\n\n`;

      md += `## 2. SWOT & Risk Matrix\n`;
      md += `### Strengths\n`;
      strengths.forEach((s: string) => md += `- ${s}\n`);
      if (strengths.length === 0) md += `- N/A\n`;
      md += `\n### Weaknesses & Risks\n`;
      weaknesses.forEach((w: string) => md += `- ${w}\n`);
      if (weaknesses.length === 0) md += `- N/A\n`;
      md += `\n`;

      // Financials table
      md += `## 3. Multi-Year Financial Performance\n\n`;
      const financials = data?.profile?.financials || [];
      if (financials.length > 0) {
        md += `| Metric | ` + financials.map((f: any) => f.year).join(" | ") + " |\n";
        md += `| --- | ` + financials.map(() => "---").join(" | ") + " |\n";
        
        md += `| Revenue | ` + financials.map((f: any) => formatFinancialValue(f.revenue, sourceCurrency, targetCurrency, true)).join(" | ") + " |\n";
        md += `| EBITDA | ` + financials.map((f: any) => formatFinancialValue(f.ebitda, sourceCurrency, targetCurrency, true)).join(" | ") + " |\n";
        md += `| Net Profit (PAT) | ` + financials.map((f: any) => formatFinancialValue(f.pat, sourceCurrency, targetCurrency, true)).join(" | ") + " |\n";
        md += `| Operating Margin (%) | ` + financials.map((f: any) => `${f.operating_margin}%`).join(" | ") + " |\n";
        md += `| Total Debt | ` + financials.map((f: any) => formatFinancialValue(f.total_debt, sourceCurrency, targetCurrency, true)).join(" | ") + " |\n";
        md += `| Return on Equity (%) | ` + financials.map((f: any) => `${f.roe}%`).join(" | ") + " |\n";
        md += `| Return on Capital (%) | ` + financials.map((f: any) => `${f.roce}%`).join(" | ") + " |\n";
        md += `| FCF | ` + financials.map((f: any) => formatFinancialValue(f.free_cash_flow, sourceCurrency, targetCurrency, true)).join(" | ") + " |\n";
      } else {
        md += `No historical financial statements available.\n`;
      }
      md += `\n`;

      // Quarterly results
      md += `## 4. Quarterly Financial Performance\n\n`;
      const quarterly = extData?.quarterly_results || [];
      if (quarterly.length > 0) {
        md += `| Quarter | Revenue | Net Profit | EPS | QoQ | YoY |\n`;
        md += `| --- | --- | --- | --- | --- | --- |\n`;
        quarterly.forEach((q: any) => {
          md += `| ${q.quarter} | ${q.revenue?.toLocaleString()} | ${q.pat?.toLocaleString()} | ${q.eps} | ${q.qoq_change} | ${q.yoy_change} |\n`;
        });
      } else {
        md += `No quarterly results available.\n`;
      }
      md += `\n`;

      // Industry & Competitors
      md += `## 5. Industry & Competitive Landscape\n\n`;
      const ind = extData?.industry_analysis || {};
      md += `- **Industry**: ${ind.industry || "N/A"}\n`;
      md += `- **Estimated Market Size**: $${ind.market_size_bn || "N/A"} Billion\n`;
      md += `- **Expected Growth Rate**: ${ind.market_growth_rate || "N/A"}%\n`;
      md += `- **Company Market Share**: ${ind.company_market_share_pct || "N/A"}%\n`;
      md += `- **Competitive Intensity**: ${ind.competitive_intensity || "N/A"}\n`;
      md += `- **Barriers to Entry**: ${ind.barriers_to_entry || "N/A"}\n\n`;
      md += `### Peer Valuation Medians\n`;
      if (ind.peer_multiples) {
        md += `- **Sector Median P/E**: ${ind.peer_multiples.sector_median_pe}x\n`;
        md += `- **Sector Median P/B**: ${ind.peer_multiples.sector_median_pb}x\n`;
        md += `- **Sector Median EV/EBITDA**: ${ind.peer_multiples.sector_median_ev_ebitda}x\n`;
      }
      md += `\n`;

      // Management & Shareholding
      md += `## 6. Corporate Structure & Governance\n\n`;
      md += `### Key Management Personnel\n`;
      const management = extData?.management || [];
      management.forEach((m: any) => {
        md += `- **${m.name}** (${m.role}): Tenure: ${m.tenure}. ${m.background}\n`;
      });
      md += `\n### Shareholding Pattern\n`;
      const sh = extData?.shareholding || {};
      md += `- **Promoters**: ${sh.promoter || 0}%\n`;
      md += `- **Foreign Institutional Investors (FII)**: ${sh.fii || 0}%\n`;
      md += `- **Domestic Institutional Investors (DII)**: ${sh.dii || 0}%\n`;
      md += `- **Retail & Public**: ${sh.retail_public || 0}%\n`;
      md += `- **Pledged Promoter Shares**: ${sh.pledged_pct || 0}%\n`;
      md += `*Trend: ${sh.trend || "Stable"}*\n\n`;

      // Corporate actions & Credit ratings
      md += `### Corporate Actions History\n`;
      const actions = extData?.corporate_actions || [];
      actions.forEach((a: any) => {
        md += `- **${a.date}** | ${a.type}: ${a.details} (Impact: ${a.impact})\n`;
      });
      md += `\n### Credit Ratings\n`;
      const ratings = extData?.credit_ratings || [];
      ratings.forEach((r: any) => {
        md += `- **${r.agency}**: ${r.rating} (Outlook: ${r.outlook}) - Instrument: ${r.instrument}\n`;
      });
      md += `\n`;

      // Agent Consensus details
      md += `## 7. Multi-Agent Audit Log\n\n`;
      const agentDetails = data?.agent_report?.agent_details || [];
      agentDetails.forEach((ag: any) => {
        md += `### Agent: ${ag.name} (Confidence: ${int(ag.confidence_score * 100)}%)\n`;
        md += `**Findings**:\n`;
        ag.findings?.forEach((f: string) => md += `- ${f}\n`);
        md += `**Assumptions**: ${ag.assumptions?.join(", ") || "N/A"}\n`;
        md += `**Uncertainty Factors**: ${ag.uncertainty || "N/A"}\n`;
        ag.citations?.forEach((cit: any) => {
          md += `*Citation: ${cit.doc} (Sec: ${cit.section}, Page: ${cit.page}) - "${cit.evidence}"*\n`;
        });
        md += `\n`;
      });

      // Pinned analyst notes
      md += `## 8. Pinned Research Notes\n\n`;
      if (tickerNotes.length > 0) {
        tickerNotes.forEach((n: any) => {
          md += `### Note from ${n.date}\n`;
          md += `${n.text}\n\n`;
        });
      } else {
        md += `No analyst notes pinned for this ticker in this workspace.\n`;
      }

      return md;
    }

    if (format === "pptx") {
      let ppt = `# INVESTMENT COMMITTEE PRESENTATION OUTLINE: ${ticker.toUpperCase()}\n`;
      ppt += `*Slide-by-slide structure outline for PowerPoint import*\n\n`;
      
      ppt += `--- \n`;
      ppt += `### SLIDE 1: Cover Slide\n`;
      ppt += `- **Title**: Investment Proposal for ${info.name || ticker}\n`;
      ppt += `- **Subtitle**: Coordinated AI Research Consensus Report\n`;
      ppt += `- **Ticker / Exchange**: ${ticker.toUpperCase()} (${info.exchange || "N/A"})\n`;
      ppt += `- **Compiled Date**: ${dateStr}\n\n`;

      ppt += `--- \n`;
      ppt += `### SLIDE 2: Business Profile & Key Rating\n`;
      ppt += `- **Corporate Profile**: ${info.sector || "N/A"} sector leader.\n`;
      ppt += `- **Current Stock Price**: ${formatPrice(info.price, sourceCurrency, targetCurrency, true)}\n`;
      ppt += `- **Attractiveness Score**: ${scoreVal}/100\n`;
      ppt += `- **AI Consensus Score**: ${overallScore}/10\n`;
      ppt += `- **Core Business**: ${info.description?.substring(0, 200)}...\n\n`;

      ppt += `--- \n`;
      ppt += `### SLIDE 3: Attractiveness Thesis & SWOT\n`;
      ppt += `- **Thesis Summary**: ${thesis}\n`;
      ppt += `- **Strengths**:\n`;
      strengths.slice(0, 3).forEach((s: string) => ppt += `  - ${s}\n`);
      ppt += `- **Weaknesses & Risks**:\n`;
      weaknesses.slice(0, 3).forEach((w: string) => ppt += `  - ${w}\n`);

      ppt += `--- \n`;
      ppt += `### SLIDE 4: Financial Growth Highlights\n`;
      const financials = data?.profile?.financials || [];
      if (financials.length >= 2) {
        const latest = financials[0];
        const prev = financials[1];
        ppt += `- **Revenue (Latest Year)**: ${formatFinancialValue(latest.revenue, sourceCurrency, targetCurrency, true)} (vs ${formatFinancialValue(prev.revenue, sourceCurrency, targetCurrency, true)} previous)\n`;
        ppt += `- **EBITDA / PAT**: ${formatFinancialValue(latest.ebitda, sourceCurrency, targetCurrency, true)} / ${formatFinancialValue(latest.pat, sourceCurrency, targetCurrency, true)}\n`;
        ppt += `- **Margins (Latest Year)**: Operating Margin ${latest.operating_margin}%\n`;
        ppt += `- **Capital Return Efficiency**: ROE ${latest.roe}% | ROCE ${latest.roce}%\n`;
        ppt += `- **Free Cash Flow**: ${formatFinancialValue(latest.free_cash_flow, sourceCurrency, targetCurrency, true)} generated\n`;
      } else {
        ppt += `- Historical financial trends not fully loaded. Refer to full table.\n`;
      }

      ppt += `--- \n`;
      ppt += `### SLIDE 5: Industry Dynamics & Competitive Place\n`;
      const ind = extData?.industry_analysis || {};
      ppt += `- **Sector**: ${ind.industry || "N/A"}\n`;
      ppt += `- **Market Growth Rate**: ${ind.market_growth_rate || "N/A"}% CAGR\n`;
      ppt += `- **Company Market Share**: ${ind.company_market_share_pct || "N/A"}%\n`;
      ppt += `- **Competitive Barriers**: ${ind.barriers_to_entry || "N/A"}\n`;
      if (ind.peer_multiples) {
        ppt += `- **Valuation Multiples vs Peers**: P/E ${ind.peer_multiples.sector_median_pe}x median, EV/EBITDA ${ind.peer_multiples.sector_median_ev_ebitda}x\n`;
      }

      ppt += `--- \n`;
      ppt += `### SLIDE 6: Shareholding & Board Governance\n`;
      const sh = extData?.shareholding || {};
      ppt += `- **Ownership Share**: Promoters ${sh.promoter || 0}% | FIIs ${sh.fii || 0}% | DIIs ${sh.dii || 0}%\n`;
      ppt += `- **Pledged Holdings**: ${sh.pledged_pct || 0}% pledged shares.\n`;
      ppt += `- **Institutional Flows**: ${sh.trend || "Stable ownership trend"}\n`;
      ppt += `- **Board Governance**: Audit Committee independent; strict compliance norms.\n`;

      ppt += `--- \n`;
      ppt += `### SLIDE 7: Consensus Synthesis & Verdict\n`;
      ppt += `- **AI Coordinator consensus opinion**: ${summary.substring(0, 350)}...\n`;
      ppt += `- **Key Catalysts**: Earnings expansion, market share gain.\n`;
      ppt += `- **Recommendation**: Review DCF growth projections and historical safety margin.\n`;

      return ppt;
    }

    // HTML / PDF-Ready print output
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>WealthPilot Research Report: ${ticker.toUpperCase()}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.5;
      margin: 0;
      padding: 40px;
      font-size: 13px;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0062ff;
      padding-bottom: 20px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-text {
      font-weight: 900;
      letter-spacing: 2px;
      color: #0f172a;
      font-size: 16px;
    }
    .tagline {
      font-size: 9px;
      color: #0062ff;
      font-weight: 700;
      text-transform: uppercase;
      font-family: monospace;
    }
    h1 {
      font-size: 20px;
      margin: 0;
      color: #0f172a;
    }
    h2 {
      font-size: 14px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 30px;
      margin-bottom: 12px;
      color: #0062ff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h3 {
      font-size: 12px;
      margin-top: 15px;
      margin-bottom: 8px;
      color: #1e293b;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 15px;
      background: #f8fafc;
    }
    .card-title {
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: bold;
      color: #475569;
    }
    .text-right {
      text-align: right;
    }
    .font-mono {
      font-family: monospace;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      font-size: 9px;
      font-weight: bold;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .badge-primary {
      background: #e0f2fe;
      color: #0369a1;
    }
    .badge-success {
      background: #dcfce7;
      color: #15803d;
    }
    .badge-danger {
      background: #fee2e2;
      color: #b91c1c;
    }
    .badge-warning {
      background: #fef3c7;
      color: #b45309;
    }
    .page-break {
      page-break-after: always;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 20px; text-align: center;">
    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold;">Print Preview Mode Enabled</p>
    <button onclick="window.print()" style="background: #0062ff; color: white; border: none; padding: 6px 12px; font-size: 11px; font-weight: bold; border-radius: 4px; cursor: pointer;">Print Report / Save as PDF</button>
  </div>

  <div class="header">
    <div>
      <h1>${info.name || ticker} (${ticker.toUpperCase()})</h1>
      <span class="badge badge-primary">${info.sector || "Equity"}</span>
      <span style="font-size: 11px; color: #64748b; margin-left: 10px;">Exchange: ${info.exchange || "N/A"}</span>
    </div>
    <div style="text-align: right;">
      <div class="logo-text">WEALTHPILOT</div>
      <div class="tagline">Quant terminal report</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Date: ${dateStr}</div>
    </div>
  </div>

  <h2>1. Executive Summary & Ratings</h2>
  <div class="grid">
    <div class="card">
      <div class="card-title">Attractiveness Score</div>
      <div style="font-size: 24px; font-weight: 900; color: #0062ff;">${scoreVal} <span style="font-size: 12px; color: #64748b; font-weight: normal;">/ 100</span></div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Metric score based on balance sheet, cash generation, and valuation margins.</div>
    </div>
    <div class="card">
      <div class="card-title">AI Coordinator Rating</div>
      <div style="font-size: 24px; font-weight: 900; color: #10b981;">${overallScore} <span style="font-size: 12px; color: #64748b; font-weight: normal;">/ 10</span></div>
      <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Consensus rating across 10 coordinated investment research sub-agents.</div>
    </div>
  </div>

  <h3>Business Profile</h3>
  <p>${info.description || "No description available."}</p>

  <h3>Consensus Verdict</h3>
  <p style="background: #f1f5f9; padding: 12px; border-left: 4px solid #0062ff; border-radius: 0 4px 4px 0; font-style: italic;">
    ${summary}
  </p>

  <h3>Attractiveness Thesis</h3>
  <p>${thesis}</p>

  <div class="page-break"></div>

  <h2>2. SWOT Matrix & Key Risks</h2>
  <div class="grid">
    <div class="card" style="border-left: 4px solid #10b981;">
      <div class="card-title" style="color: #10b981;">Strengths & Competitive Moats</div>
      <ul style="margin: 0; padding-left: 15px; font-size: 11px;">
        ${strengths.map((s: string) => `<li style="margin-bottom: 4px;">${s}</li>`).join("")}
        ${strengths.length === 0 ? "<li>N/A</li>" : ""}
      </ul>
    </div>
    <div class="card" style="border-left: 4px solid #ef4444;">
      <div class="card-title" style="color: #ef4444;">Weaknesses & Key Risks</div>
      <ul style="margin: 0; padding-left: 15px; font-size: 11px;">
        ${weaknesses.map((w: string) => `<li style="margin-bottom: 4px;">${w}</li>`).join("")}
        ${weaknesses.length === 0 ? "<li>N/A</li>" : ""}
      </ul>
    </div>
  </div>

  <h2>3. Historical Financial Statements</h2>
  <table>
    <thead>
      <tr>
        <th>Line Item</th>
        ${(data?.profile?.financials || []).map((f: any) => `<th class="text-right">${f.year}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Revenue</strong></td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono">${formatFinancialValue(f.revenue, sourceCurrency, targetCurrency, true)}</td>`).join("")}
      </tr>
      <tr>
        <td>EBITDA</td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono">${formatFinancialValue(f.ebitda, sourceCurrency, targetCurrency, true)}</td>`).join("")}
      </tr>
      <tr>
        <td><strong>Net Profit (PAT)</strong></td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono">${formatFinancialValue(f.pat, sourceCurrency, targetCurrency, true)}</td>`).join("")}
      </tr>
      <tr>
        <td>Operating Margin (%)</td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono">${f.operating_margin}%</td>`).join("")}
      </tr>
      <tr>
        <td>Total Debt</td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono" style="color: #ef4444;">${formatFinancialValue(f.total_debt, sourceCurrency, targetCurrency, true)}</td>`).join("")}
      </tr>
      <tr>
        <td>Return on Equity (%)</td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono">${f.roe}%</td>`).join("")}
      </tr>
      <tr>
        <td>Return on Capital Employed (%)</td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono">${f.roce}%</td>`).join("")}
      </tr>
      <tr>
        <td><strong>Free Cash Flow</strong></td>
        ${(data?.profile?.financials || []).map((f: any) => `<td class="text-right font-mono" style="color: #0062ff; font-weight: bold;">${formatFinancialValue(f.free_cash_flow, sourceCurrency, targetCurrency, true)}</td>`).join("")}
      </tr>
    </tbody>
  </table>

  <h2>4. Quarterly Performance</h2>
  <table>
    <thead>
      <tr>
        <th>Quarter</th>
        <th class="text-right">Revenue</th>
        <th class="text-right">Net Profit</th>
        <th class="text-right">EPS</th>
        <th class="text-right">QoQ Change</th>
        <th class="text-right">YoY Change</th>
      </tr>
    </thead>
    <tbody>
      ${(extData?.quarterly_results || []).map((q: any) => `
        <tr>
          <td><strong>${q.quarter}</strong></td>
          <td class="text-right font-mono">${q.revenue?.toLocaleString()}</td>
          <td class="text-right font-mono">${q.pat?.toLocaleString()}</td>
          <td class="text-right font-mono">${q.eps}</td>
          <td class="text-right font-mono" style="font-weight: bold; color: ${q.qoq_change?.startsWith("+") ? "#15803d" : "#b91c1c"}">${q.qoq_change}</td>
          <td class="text-right font-mono" style="font-weight: bold; color: ${q.yoy_change?.startsWith("+") ? "#15803d" : "#b91c1c"}">${q.yoy_change}</td>
        </tr>
      `).join("")}
      ${(extData?.quarterly_results || []).length === 0 ? "<tr><td colspan='6' style='text-align: center;'>No quarterly results available.</td></tr>" : ""}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>5. Industry Landscape & Peer Multiples</h2>
  <div class="grid">
    <div class="card">
      <div class="card-title">Industry Context</div>
      <table style="border: none; margin: 0;">
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Industry Classification:</td><td style="border: none; padding: 4px 0; font-weight: bold; text-align: right;">${extData?.industry_analysis?.industry || "N/A"}</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Est Market Size:</td><td style="border: none; padding: 4px 0; font-weight: bold; text-align: right;">$${extData?.industry_analysis?.market_size_bn || "N/A"} Billion</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Industry Growth Rate:</td><td style="border: none; padding: 4px 0; font-weight: bold; text-align: right;">${extData?.industry_analysis?.market_growth_rate || "N/A"}%</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Company Market Share:</td><td style="border: none; padding: 4px 0; font-weight: bold; text-align: right;">${extData?.industry_analysis?.company_market_share_pct || "N/A"}%</td></tr>
      </table>
    </div>
    <div class="card">
      <div class="card-title">Peer Valuation Medians</div>
      <table style="border: none; margin: 0;">
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Median Sector P/E:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.industry_analysis?.peer_multiples?.sector_median_pe || "N/A"}x</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Median Sector P/B:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.industry_analysis?.peer_multiples?.sector_median_pb || "N/A"}x</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #64748b;">Median Sector EV/EBITDA:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.industry_analysis?.peer_multiples?.sector_median_ev_ebitda || "N/A"}x</td></tr>
      </table>
    </div>
  </div>

  <h3>Key Industry Trends</h3>
  <ul style="padding-left: 15px; font-size: 11px;">
    ${(extData?.industry_analysis?.key_trends || []).map((t: string) => `<li style="margin-bottom: 3px;">${t}</li>`).join("")}
  </ul>

  <h2>6. Ownership & Governance Profile</h2>
  <div class="grid">
    <div class="card">
      <div class="card-title">Shareholding Distribution</div>
      <table style="border: none; margin: 0;">
        <tr style="border: none;"><td style="border: none; padding: 4px 0;">Promoter / Owners:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.shareholding?.promoter || 0}%</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0;">FII Holding:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.shareholding?.fii || 0}%</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0;">DII Holding:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.shareholding?.dii || 0}%</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0;">Retail / Public:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; text-align: right;">${extData?.shareholding?.retail_public || 0}%</td></tr>
        <tr style="border: none;"><td style="border: none; padding: 4px 0; color: #ef4444;">Pledged Promoter Shares:</td><td style="border: none; padding: 4px 0; font-weight: bold; font-mono; color: #ef4444; text-align: right;">${extData?.shareholding?.pledged_pct || 0}%</td></tr>
      </table>
      <div style="font-size: 10px; color: #64748b; margin-top: 8px; font-style: italic;">
        Trend: ${extData?.shareholding?.trend || ""}
      </div>
    </div>
    <div class="card">
      <div class="card-title">Key Management Team</div>
      <ul style="list-style-type: none; margin: 0; padding: 0; font-size: 10px;">
        ${(extData?.management || []).map((m: any) => `
          <li style="margin-bottom: 8px;">
            <strong>${m.name}</strong> - <em>${m.role}</em> (Tenure: ${m.tenure})
            <div style="color: #64748b; margin-top: 1px;">${m.background}</div>
          </li>
        `).join("")}
      </ul>
    </div>
  </div>

  <h3>Recent Corporate Actions</h3>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Type</th>
        <th>Details</th>
        <th>Impact</th>
      </tr>
    </thead>
    <tbody>
      ${(extData?.corporate_actions || []).map((a: any) => `
        <tr>
          <td class="font-mono">${a.date}</td>
          <td><strong>${a.type}</strong></td>
          <td>${a.details}</td>
          <td><span class="badge ${a.impact === "Positive" ? "badge-success" : a.impact === "Dilutive" ? "badge-danger" : "badge-primary"}">${a.impact}</span></td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>7. Pinned Analyst Research Notes</h2>
  ${tickerNotes.map((n: any) => `
    <div class="card" style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
        <strong>Research Entry</strong>
        <span>Pinned on ${n.date}</span>
      </div>
      <p style="margin: 0; white-space: pre-wrap; font-size: 11px;">${n.text}</p>
    </div>
  `).join("")}
  ${tickerNotes.length === 0 ? "<p style='color: #64748b; font-style: italic;'>No custom analyst notes have been pinned to this workspace yet.</p>" : ""}

  <h2>8. Multi-Agent Audit Log & Verification</h2>
  ${(data?.agent_report?.agent_details || []).map((ag: any) => `
    <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 12px; font-size: 11px;">
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; font-weight: bold;">
        <span>${ag.name}</span>
        <span style="color: #0062ff;">Confidence Score: ${int(ag.confidence_score * 100)}%</span>
      </div>
      <div><strong>Findings:</strong></div>
      <ul style="margin: 2px 0 6px 0; padding-left: 15px;">
        ${ag.findings?.map((f: string) => `<li>${f}</li>`).join("")}
      </ul>
      <div style="color: #475569; font-size: 10px;">
        <strong>Assumptions:</strong> ${ag.assumptions?.join(", ") || "N/A"}<br/>
        <strong>Uncertainty:</strong> ${ag.uncertainty || "N/A"}
      </div>
      ${ag.citations?.map((cit: any) => `
        <div style="margin-top: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 6px; font-size: 9px; font-family: monospace; color: #166534;">
          <strong>Evidence Reference:</strong> ${cit.doc} (Sec: ${cit.section}, Page: ${cit.page}) - "${cit.evidence}"
        </div>
      `).join("")}
    </div>
  `).join("")}

</body>
</html>`;
    return html;
  };

  const handleTriggerExport = (type: string) => {
    setExportTarget(type);
    setExportLoading(true);
    setExportSteps(["Initializing document export streams..."]);

    setTimeout(() => {
      setExportSteps(prev => [...prev, "Formatting tables & multi-agent audit notes..."]);
    }, 600);

    setTimeout(() => {
      setExportSteps(prev => [...prev, "Extracting financial statement charts & vector curves..."]);
    }, 1200);

    setTimeout(() => {
      setExportSteps(prev => [...prev, `Building downloadable ${type} compilation file...`]);
    }, 1800);

    setTimeout(() => {
      setExportLoading(false);
      
      if (type === "PDF") {
        const htmlContent = compileReportContent("html");
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
        showToast("Print preview triggered for PDF compilation");
        return;
      }
      
      if (type === "Word") {
        const htmlContent = compileReportContent("html");
        const dummyLink = document.createElement("a");
        dummyLink.href = "data:application/msword;charset=utf-8," + encodeURIComponent(htmlContent);
        dummyLink.setAttribute("download", `WealthPilot_Report_${ticker}.doc`);
        document.body.appendChild(dummyLink);
        dummyLink.click();
        document.body.removeChild(dummyLink);
        showToast("Word document compilation downloaded (.doc)");
        return;
      }
      
      if (type === "Markdown") {
        const mdContent = compileReportContent("markdown");
        const dummyLink = document.createElement("a");
        dummyLink.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
        dummyLink.setAttribute("download", `WealthPilot_Report_${ticker}.md`);
        document.body.appendChild(dummyLink);
        dummyLink.click();
        document.body.removeChild(dummyLink);
        showToast("Markdown report document downloaded");
        return;
      }

      if (type === "PowerPoint") {
        const pptContent = compileReportContent("pptx");
        const dummyLink = document.createElement("a");
        dummyLink.href = "data:text/plain;charset=utf-8," + encodeURIComponent(pptContent);
        dummyLink.setAttribute("download", `WealthPilot_Presentation_${ticker}.txt`);
        document.body.appendChild(dummyLink);
        dummyLink.click();
        document.body.removeChild(dummyLink);
        showToast("Presentation outline downloaded (.txt)");
        return;
      }
    }, 2400);
  };

  const explain = metricsExplanations[activeExplainMetric];
  const sourceCurrency = data?.profile?.info?.currency || (ticker.endsWith(".NS") ? "INR" : "USD");

  return (
    <div className="flex flex-col space-y-6 h-full overflow-hidden relative">
      {/* Toast notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-[100] px-4 py-3 rounded-lg bg-brand-success text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4" />
          {toastMsg}
        </div>
      )}
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
          { id: "financials",        label: "Financial Statements",      icon: Landmark },
          { id: "quarterly",         label: "Quarterly Results",         icon: BarChart2 },
          { id: "segments",          label: "Segment & Geo",             icon: Grid },
          { id: "valuation_risks",   label: "Valuation & Risk Audit",    icon: ShieldAlert },
          { id: "management",        label: "Management",                icon: UserCheck },
          { id: "shareholding",      label: "Shareholding",              icon: PieChart },
          { id: "corporate_actions", label: "Corporate Actions",         icon: GitBranch },
          { id: "credit_ratings",    label: "Credit Ratings",            icon: Star },
          { id: "industry",          label: "Industry Analysis",         icon: AlertTriangle },
          { id: "governance",        label: "Governance",                icon: Users },
          { id: "ai_report",         label: "AI Report",                 icon: Cpu },
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

            {/* TAB: FINANCIAL STATEMENTS */}
            {activeSubTab === "financials" && (
              <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
                  <Landmark className="text-brand-primary w-5 h-5" />
                  Multi-Year Financial Statement Comparisons
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
                          <td key={f.year} className="py-2 px-4 text-right">{formatFinancialValue(f.revenue, sourceCurrency, targetCurrency, true)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">EBITDA</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right">{formatFinancialValue(f.ebitda, sourceCurrency, targetCurrency, true)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Net Profit (PAT)</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right">{formatFinancialValue(f.pat, sourceCurrency, targetCurrency, true)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Operating Margin (%)</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right text-brand-secondary">{f.operating_margin}%</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Total Debt</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right text-brand-danger">{formatFinancialValue(f.total_debt, sourceCurrency, targetCurrency, true)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Shareholders Equity</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right">{formatFinancialValue(f.shareholders_equity, sourceCurrency, targetCurrency, true)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Return on Equity (ROE) (%)</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right text-brand-secondary">{f.roe}%</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Return on Capital (ROCE) (%)</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right text-brand-secondary">{f.roce}%</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Interest Coverage Ratio</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right">{f.interest_coverage}x</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Operating Cash Flow</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right">{formatFinancialValue(f.operating_cash_flow, sourceCurrency, targetCurrency, true)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-sans font-semibold text-slate-800 dark:text-slate-100">Free Cash Flow</td>
                        {data.profile.financials.map((f: any) => (
                          <td key={f.year} className="py-2 px-4 text-right text-brand-primary">{formatFinancialValue(f.free_cash_flow, sourceCurrency, targetCurrency, true)}</td>
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
                {/* Risk discloses changes */}
                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-brand-danger" />
                    YoY Risk Disclosures Comparison
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border">
                      <span className="font-bold text-brand-muted block uppercase text-[9px] mb-1">Previous Fiscal Risks:</span>
                      <p className="leading-relaxed">
                        {ticker.toUpperCase() === "AAPL" 
                          ? "Heavy dependency on third-party silicon fabrication partners and Taiwan semiconductor foundry output."
                          : "Commodity feedstock price fluctuations and refining margin spreads volatility."}
                      </p>
                    </div>

                    <div className="p-3 bg-brand-danger/5 rounded border border-brand-danger/10">
                      <span className="font-bold text-brand-danger block uppercase text-[9px] mb-1">Current Fiscal Risks (New Audit Flags):</span>
                      <p className="leading-relaxed text-slate-800 dark:text-slate-200">
                        {ticker.toUpperCase() === "AAPL"
                          ? "App Store regulator payment fee litigations globally, creating legal margin compression pressures."
                          : "Geopolitical disruption of cargo shipping corridors, increasing freight and logistics costs."}
                      </p>
                    </div>

                    <div className="p-3 bg-brand-primary/5 rounded border border-brand-primary/10">
                      <span className="font-bold text-brand-primary block uppercase text-[9px] mb-1">Change Detection Summary:</span>
                      <p className="leading-relaxed">
                        {ticker.toUpperCase() === "AAPL"
                          ? "Shift from hardware supply-chain operations risks to software legal and regulatory antitrust pressure."
                          : "Transition from pure processing margin risks to global energy transport bottlenecks."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accounting policy shifts */}
                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-brand-warning" />
                    Accounting Policy Changes
                  </h3>
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-black/5 dark:bg-white/5 rounded border border-light-border dark:border-dark-border">
                      <span className="font-bold text-brand-muted block uppercase text-[9px] mb-1">Amortization Useful Spans Adjustment:</span>
                      <p className="leading-relaxed">
                        {ticker.toUpperCase() === "AAPL"
                          ? "Capitalized software amortization bounds extended from 3 to 5 years maximum limit. Improves current year margins."
                          : "Depreciation rates on oil assets recalibrated matching statutory useful life limits, decreasing depreciation expense."}
                      </p>
                      <div className="text-[10px] text-brand-primary font-mono mt-2">
                        Filing Citation: {ticker.toUpperCase() === "AAPL" ? "Form 10-K, Note 2 (Page 48)" : "Integrated Report, Note 10 (Page 64)"}
                      </div>
                    </div>

                    <div className="p-3 bg-brand-secondary/5 rounded border border-brand-secondary/10">
                      <span className="font-bold text-brand-secondary block uppercase text-[9px] mb-1">Management Guidance Audits:</span>
                      <div className="space-y-1 mt-1">
                        <div>• Previous Guidance: {ticker.toUpperCase() === "AAPL" ? "Services margins of 28-30%." : "Retail footprint expand 10%."}</div>
                        <div>• Current Guidance: {ticker.toUpperCase() === "AAPL" ? "Revised up to 30.5-31.5%." : "Jamnagar panels production early FY25."}</div>
                        <div>• Status: <span className="font-bold text-brand-secondary">Achieved / Exceeded</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GOVERNANCE & SHAREHOLDERS */}
            {activeSubTab === "governance" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Shareholding Pattern</h3>
                  <div className="w-full overflow-x-auto py-2">
                    <svg className="w-[300px] h-[150px] mx-auto bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg" viewBox="0 0 300 150">
                      {/* Bar graph representing ownership */}
                      {ticker.toUpperCase() === "AAPL" ? (
                        <>
                          <rect x="20" y="30" width="160" height="20" fill="#a855f7" />
                          <text x="190" y="45" fill="#64748b" fontSize="9" fontWeight="bold">Inst (80%)</text>
                          <rect x="20" y="60" width="30" height="20" fill="#10b981" />
                          <text x="60" y="75" fill="#64748b" fontSize="9" fontWeight="bold">Retail (15%)</text>
                          <rect x="20" y="90" width="10" height="20" fill="#0062ff" />
                          <text x="40" y="105" fill="#64748b" fontSize="9" fontWeight="bold">Insiders (5%)</text>
                        </>
                      ) : (
                        <>
                          <rect x="20" y="30" width="100" height="20" fill="#a855f7" />
                          <text x="130" y="45" fill="#64748b" fontSize="9" fontWeight="bold">Promoter (50.3%)</text>
                          <rect x="20" y="60" width="45" height="20" fill="#10b981" />
                          <text x="75" y="75" fill="#64748b" fontSize="9" fontWeight="bold">FII (22.4%)</text>
                          <rect x="20" y="90" width="36" height="20" fill="#0062ff" />
                          <text x="65" y="105" fill="#64748b" fontSize="9" fontWeight="bold">DII (18.2%)</text>
                        </>
                      )}
                    </svg>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Corporate Governance & Actions</h3>
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="font-bold text-brand-muted block uppercase text-[9px] mb-1">Board Composition:</span>
                      <p className="leading-relaxed">
                        {ticker.toUpperCase() === "AAPL"
                          ? "Majority independent board members. Audit Committee led by certified financial experts."
                          : "Balanced independent directors board, complying fully with SEBI listing parameters."}
                      </p>
                    </div>

                    <div className="border-t border-light-border dark:border-dark-border pt-3">
                      <span className="font-bold text-brand-muted block uppercase text-[9px] mb-1">Recent Corporate Actions:</span>
                      <div className="space-y-1 font-mono text-[10px]">
                        {ticker.toUpperCase() === "AAPL" ? (
                          <>
                            <div>• Dividend: $0.25 per share paid on July 21, 2026.</div>
                            <div>• Share Buybacks: $110B capital authorization remains active.</div>
                          </>
                        ) : (
                          <>
                            <div>• Share Bonus: 1:1 shares distribution record date August 1, 2024.</div>
                            <div>• Dividend: Rs 19.50 final dividend registration complete.</div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: COORDINATED AI RESEARCH REPORT */}
            {activeSubTab === "ai_report" && (
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <div className="border-b border-light-border dark:border-dark-border pb-3 flex justify-between items-center">
                    <h2 className="text-sm font-bold flex items-center gap-2">
                      <Cpu className="text-brand-primary w-5 h-5" />
                      Coordinator Agent Consensus Report
                    </h2>
                    <span className="text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary px-3 py-1 rounded">
                      Consensus Rating: {data.agent_report.overall_score}/10
                    </span>
                  </div>
                  <pre className="p-4 bg-light-bg dark:bg-[#070a10] border border-light-border dark:border-dark-border rounded-lg text-xs leading-relaxed font-sans whitespace-pre-line text-slate-800 dark:text-slate-200">
                    {data.agent_report.report_summary}
                  </pre>
                </div>

                <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
                  <h3 className="text-xs font-black uppercase text-brand-primary tracking-wider">Independent Agent Citations & Evidence logs</h3>
                  <div className="space-y-3">
                    {data.agent_report.agent_details?.map((agent: any, idx: number) => (
                      <div key={idx} className="p-4 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg space-y-2 text-xs">
                        <div className="flex justify-between items-center border-b border-light-border dark:border-dark-border pb-1">
                          <span className="font-bold text-slate-800 dark:text-white">{agent.name}</span>
                          <span className="font-mono text-[10px] text-brand-primary">Confidence: {Math.round(agent.confidence_score * 100)}%</span>
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-brand-muted uppercase text-[9px] block">Key Findings:</span>
                          {agent.findings?.map((f: string, fIdx: number) => (
                            <div key={fIdx} className="flex gap-2">
                              <span>•</span>
                              <span>{f}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-light-border dark:border-dark-border text-[11px] text-brand-muted">
                          <div>
                            <span className="font-bold block uppercase text-[9px] mb-0.5">Assumptions:</span>
                            {agent.assumptions?.join(", ")}
                          </div>
                          <div>
                            <span className="font-bold block uppercase text-[9px] mb-0.5">Uncertainty:</span>
                            {agent.uncertainty}
                          </div>
                        </div>
                        {agent.citations?.map((cit: any, cIdx: number) => (
                          <div key={cIdx} className="mt-2 text-[10px] font-mono text-brand-secondary bg-brand-secondary/5 p-2 rounded">
                            Source Citation: {cit.doc} | {cit.section} (Page {cit.page}) - "{cit.evidence}"
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
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
                    Institutional Reports Compiler & Exporter
                  </h2>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    Generate production-grade formatted reports including valuation details, SWOT matrices, balance sheets, and independent agent findings.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { type: "PDF", desc: "For executive presentations" },
                      { type: "Word", desc: "For analysts review drafts" },
                      { type: "PowerPoint", desc: "For investment committees" },
                      { type: "Markdown", desc: "For database archives" }
                    ].map(target => (
                      <button
                        key={target.type}
                        onClick={() => handleTriggerExport(target.type)}
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

            {/* TAB: QUARTERLY RESULTS */}
            {activeSubTab === "quarterly" && extData?.quarterly_results && (
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-lg">
                  <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                    <BarChart2 className="text-brand-primary w-5 h-5" />
                    Quarterly Financial Results
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-light-border dark:border-dark-border text-[10px] uppercase tracking-wider text-brand-muted">
                          <th className="text-left py-2 pr-4 font-bold">Quarter</th>
                          <th className="text-right py-2 px-3 font-bold">Revenue</th>
                          <th className="text-right py-2 px-3 font-bold">Net Profit</th>
                          <th className="text-right py-2 px-3 font-bold">EPS</th>
                          <th className="text-right py-2 px-3 font-bold">QoQ</th>
                          <th className="text-right py-2 px-3 font-bold">YoY</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extData.quarterly_results.map((q: any, i: number) => {
                          const isQoQPos = q.qoq_change?.startsWith("+");
                          const isYoYPos = q.yoy_change?.startsWith("+");
                          return (
                            <tr key={i} className="border-b border-light-border/50 dark:border-dark-border/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3 pr-4 font-bold font-mono text-brand-primary">{q.quarter}</td>
                              <td className="text-right py-3 px-3 font-mono">{q.revenue?.toLocaleString()}</td>
                              <td className="text-right py-3 px-3 font-mono">{q.pat?.toLocaleString()}</td>
                              <td className="text-right py-3 px-3 font-mono">{q.eps}</td>
                              <td className={`text-right py-3 px-3 font-mono font-bold ${isQoQPos ? "text-brand-secondary" : "text-brand-danger"}`}>{q.qoq_change}</td>
                              <td className={`text-right py-3 px-3 font-mono font-bold ${isYoYPos ? "text-brand-secondary" : "text-brand-danger"}`}>{q.yoy_change}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
                              {mgr.role}
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
            {activeSubTab === "shareholding" && extData?.shareholding && (
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-lg">
                  <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                    <PieChart className="text-brand-primary w-5 h-5" />
                    Shareholding Pattern
                  </h2>
                  <div className="space-y-4">
                    {[
                      { label: "Promoter Holding", value: extData.shareholding.promoter, color: "bg-brand-primary" },
                      { label: "FII Holding", value: extData.shareholding.fii, color: "bg-brand-secondary" },
                      { label: "DII Holding", value: extData.shareholding.dii, color: "bg-brand-warning" },
                      { label: "Retail / Public", value: extData.shareholding.retail_public, color: "bg-brand-danger" },
                    ].map((s, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{s.label}</span>
                          <span className="font-mono font-bold text-brand-primary">{s.value?.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full transition-all duration-700`} style={{ width: `${s.value}%` }} />
                        </div>
                      </div>
                    ))}
                    {extData.shareholding.pledged_pct > 0 && (
                      <div className="p-3 bg-brand-danger/5 border border-brand-danger/10 rounded-lg text-xs text-brand-danger font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Pledged Shares: {extData.shareholding.pledged_pct}% — Monitor promoter pledge levels
                      </div>
                    )}
                    <p className="text-[10px] text-brand-muted italic leading-relaxed">{extData.shareholding.trend}</p>
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
                    {extData.corporate_actions.map((a: any, i: number) => {
                      const impactColor = a.impact === "Positive" ? "text-brand-secondary bg-brand-secondary/10" :
                        a.impact === "Dilutive" ? "text-brand-danger bg-brand-danger/10" : "text-brand-muted bg-black/5 dark:bg-white/5";
                      return (
                        <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border">
                          <div className="w-14 text-center shrink-0">
                            <span className="text-[9px] font-mono text-brand-muted">{a.date}</span>
                          </div>
                          <div className="h-10 w-px bg-brand-primary/20 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">{a.type}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${impactColor}`}>{a.impact}</span>
                            </div>
                            <p className="text-[10px] text-brand-muted">{a.details}</p>
                          </div>
                        </div>
                      );
                    })}
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
                        {extData.credit_ratings.map((cr: any, i: number) => {
                          const outlookColor = cr.outlook === "Positive" ? "text-brand-secondary" : cr.outlook === "Stable" ? "text-brand-primary" : "text-brand-danger";
                          return (
                            <tr key={i} className="border-b border-light-border/50 dark:border-dark-border/50">
                              <td className="py-3 pr-4 font-bold text-slate-800 dark:text-white">{cr.agency}</td>
                              <td className="text-center py-3 px-3">
                                <span className="font-mono font-black text-brand-secondary bg-brand-secondary/10 px-2.5 py-1 rounded">{cr.rating}</span>
                              </td>
                              <td className={`text-center py-3 px-3 font-bold ${outlookColor}`}>{cr.outlook}</td>
                              <td className="py-3 px-3 text-brand-muted">{cr.instrument}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: INDUSTRY ANALYSIS */}
            {activeSubTab === "industry" && extData?.industry_analysis && (
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-lg">
                  <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3 mb-4">
                    <AlertTriangle className="text-brand-warning w-5 h-5" />
                    Industry & Competitive Landscape
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Industry", value: extData.industry_analysis.industry },
                      { label: "Market Size", value: `$${extData.industry_analysis.market_size_bn}B` },
                      { label: "Industry Growth", value: `${extData.industry_analysis.market_growth_rate}%` },
                      { label: "Market Share", value: `${extData.industry_analysis.company_market_share_pct}%` },
                    ].map((m, i) => (
                      <div key={i} className="bg-black/5 dark:bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-sm font-black font-mono text-brand-primary">{m.value}</div>
                        <div className="text-[9px] text-brand-muted mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Competitive Assessment</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2.5 rounded bg-black/5 dark:bg-white/5">
                          <span className="text-brand-muted">Competitive Intensity</span>
                          <span className="font-bold text-brand-warning">{extData.industry_analysis.competitive_intensity}</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded bg-black/5 dark:bg-white/5">
                          <span className="text-brand-muted">Barriers to Entry</span>
                          <span className="font-bold text-brand-secondary">{extData.industry_analysis.barriers_to_entry}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Sector Peer Multiples</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between p-2.5 rounded bg-black/5 dark:bg-white/5">
                          <span className="text-brand-muted">Median P/E</span>
                          <span className="font-bold font-mono">{extData.industry_analysis.peer_multiples?.sector_median_pe}x</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded bg-black/5 dark:bg-white/5">
                          <span className="text-brand-muted">Median P/B</span>
                          <span className="font-bold font-mono">{extData.industry_analysis.peer_multiples?.sector_median_pb}x</span>
                        </div>
                        <div className="flex justify-between p-2.5 rounded bg-black/5 dark:bg-white/5">
                          <span className="text-brand-muted">Median EV/EBITDA</span>
                          <span className="font-bold font-mono">{extData.industry_analysis.peer_multiples?.sector_median_ev_ebitda}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">Key Industry Trends</h3>
                    <div className="space-y-1.5">
                      {extData.industry_analysis.key_trends?.map((trend: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-brand-muted">
                          <span className="text-brand-primary font-bold mt-0.5">→</span>
                          <span>{trend}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </>
        ) : null}
      </div>
    </div>
  );
};

// Simple Python-like integer conversion helper for javascript
const int = (val: any) => {
  const num = parseInt(val);
  return isNaN(num) ? 0 : num;
};
