import React, { useState, useEffect } from "react";
import { 
  Cpu, LayoutDashboard, GraduationCap, BarChart3, FileText, Briefcase, 
  Activity, Code, LineChart, Landmark, Share2, Sun, Moon, Search, 
  MessageSquare, Bookmark, X, Terminal, Eye, BookOpen, Globe, HelpCircle, Coins,
  ChevronLeft, ChevronRight, Star, TrendingUp
} from "lucide-react";

// Views imports
import { DashboardView } from "./components/DashboardView";
import { InvestingTeacherView } from "./components/InvestingTeacherView";
import { FundamentalResearchView } from "./components/FundamentalResearchView";
import { AnnualReportView } from "./components/AnnualReportView";
import { PortfolioManagerView } from "./components/PortfolioManagerView";
import { TechnicalAnalystView } from "./components/TechnicalAnalystView";
import { StrategyBuilderView } from "./components/StrategyBuilderView";
import { ValuationEngineView } from "./components/ValuationEngineView";
import { CompareCompaniesView } from "./components/CompareCompaniesView";
import { KnowledgeGraphView } from "./components/KnowledgeGraphView";
import { WatchlistView } from "./components/WatchlistView";
import { ResearchJournalView } from "./components/ResearchJournalView";
import { MarketIntelView } from "./components/MarketIntelView";
import { MutualFundsView } from "./components/MutualFundsView";
import { EXCHANGE_RATES, CURRENCY_SYMBOLS } from "./utils/currency";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [ticker, setTicker] = useState<string>("AAPL");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  
  // Currency settings states - Default to India-First INR
  const [selectedSelector, setSelectedSelector] = useState<string>("INR");
  const [targetCurrency, setTargetCurrency] = useState<string>("INR");
  const [activeStockCurrency, setActiveStockCurrency] = useState<string>("USD");
  
  // Sidebar Collapse and Favorites Pinning States
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [pinnedFavorites, setPinnedFavorites] = useState<string[]>(["dashboard", "funds"]);

  // Search & Command Palette states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchIndex, setActiveSearchIndex] = useState<number>(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [paletteResults, setPaletteResults] = useState<any>({
    stocks: [],
    funds: [],
    reports: [],
    news: [],
    academy: []
  });
  const [showPalette, setShowPalette] = useState(false);
  const [systemHealth, setSystemHealth] = useState<"online" | "checking" | "offline">("checking");

  // AI Copilot panel states
  const [showCopilot, setShowCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; citations?: any[] }>>([
    { sender: "ai", text: "Hello! I am your AI Wealth Management Assistant. Ask me about portfolio reviews, mutual fund comparisons (e.g. 'Compare SBI Bluechip and HDFC Midcap'), or ELSS tax saving strategies." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Bookmarks state
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarksList, setBookmarksList] = useState<any[]>([]);
  const [showHelp, setShowHelp] = useState(false);

  // Load recent searches when palette opens
  useEffect(() => {
    if (showPalette) {
      const saved = localStorage.getItem("wealthpilot_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    }
  }, [showPalette]);

  // Keyboard shortcut listeners (Ctrl+K, Ctrl+B, Ctrl+D, Ctrl+/, ESC, Arrows, Enter)
  useEffect(() => {
    const getFlatResults = () => {
      const flat: Array<{ type: string; id: string; name: string; extra?: string }> = [];
      if (paletteResults.stocks) {
        paletteResults.stocks.forEach((s: any) => flat.push({ type: "stock", id: s.ticker, name: s.name, extra: s.sector }));
      }
      if (paletteResults.funds) {
        paletteResults.funds.forEach((f: any) => flat.push({ type: "fund", id: f.id, name: f.name, extra: f.category }));
      }
      if (paletteResults.reports) {
        paletteResults.reports.forEach((r: any) => flat.push({ type: "report", id: r.ticker, name: r.type }));
      }
      if (paletteResults.academy) {
        paletteResults.academy.forEach((l: any) => flat.push({ type: "lesson", id: l.slug, name: l.title }));
      }
      return flat;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowPalette(false);
        setShowCopilot(false);
        setShowHelp(false);
        return;
      }

      if (showPalette) {
        const flat = getFlatResults();
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setActiveSearchIndex(prev => (flat.length === 0 ? -1 : (prev + 1) % flat.length));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setActiveSearchIndex(prev => (flat.length === 0 ? -1 : (prev - 1 + flat.length) % flat.length));
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          if (activeSearchIndex >= 0 && activeSearchIndex < flat.length) {
            const selectedItem = flat[activeSearchIndex];
            handleSelectSearchResult(selectedItem.type as any, selectedItem.id);
          }
          return;
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === "k") {
          e.preventDefault();
          setShowPalette(prev => !prev);
        } else if (e.key.toLowerCase() === "b") {
          e.preventDefault();
          setShowCopilot(prev => !prev);
        } else if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          setTheme(prev => prev === "dark" ? "light" : "dark");
        } else if (e.key === "/") {
          e.preventDefault();
          setShowHelp(prev => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPalette, paletteResults, activeSearchIndex]);

  // System health polling check
  const checkHealth = async () => {
    try {
      const res = await fetch("/");
      if (res.ok) {
        setSystemHealth("online");
      } else {
        setSystemHealth("offline");
      }
    } catch {
      setSystemHealth("offline");
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Synchronize theme config
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Sync bookmarks list
  const syncBookmarks = async () => {
    try {
      const res = await fetch("/api/v1/bookmarks");
      const list = await res.json();
      setBookmarksList(list);
      setBookmarked(list.some((b: any) => b.ticker === ticker));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    syncBookmarks();
  }, [ticker]);

  // Dynamically resolve currency metadata of the active stock
  useEffect(() => {
    const fetchTickerCurrency = async () => {
      try {
        const res = await fetch(`/api/v1/analyst/price/${ticker}`);
        if (res.ok) {
          const data = await res.json();
          const curr = data.currency || (ticker.endsWith(".NS") ? "INR" : "USD");
          setActiveStockCurrency(curr);
          if (selectedSelector === "AUTO") {
            setTargetCurrency(curr);
          }
        }
      } catch (err) {
        console.error("Error resolving active stock currency:", err);
      }
    };
    if (ticker) {
      fetchTickerCurrency();
    }
  }, [ticker, selectedSelector]);

  const handleSelectorChange = (val: string) => {
    setSelectedSelector(val);
    if (val === "AUTO") {
      setTargetCurrency(activeStockCurrency);
    } else {
      setTargetCurrency(val);
    }
  };

  const handleToggleBookmark = async () => {
    if (bookmarked) {
      const match = bookmarksList.find(b => b.ticker === ticker);
      if (match) {
        try {
          await fetch(`/api/v1/bookmarks/${match.id}`, { method: "DELETE" });
          setBookmarked(false);
          syncBookmarks();
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      try {
        await fetch("/api/v1/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticker: ticker,
            type: "stock",
            title: `${ticker} Equity Workspace`
          })
        });
        setBookmarked(true);
        syncBookmarks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Unified Search Query spanning multiple categories
  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      try {
        // Query stock database
        const stockRes = await fetch(`/api/v1/analyst/search?q=${val}`);
        const stocks = stockRes.ok ? await stockRes.json() : [];

        // Query mutual funds registry
        const fundRes = await fetch(`/api/v1/funds/search?q=${val}`);
        const funds = fundRes.ok ? await fundRes.json() : [];

        // Simulated filtering for news and reports
        const allReports = [
          { ticker: "AAPL", type: "Annual Report Highlights" },
          { ticker: "RELIANCE.NS", type: "Chairman's Letter FY25" },
          { ticker: "TCS.NS", type: "Governance & ESG Overview" }
        ].filter(r => r.ticker.toLowerCase().includes(val.toLowerCase()) || r.type.toLowerCase().includes(val.toLowerCase()));

        const allNews = [
          { title: "Inflation Rate cools down to 4.2% in domestic markets", slug: "market-cooling" },
          { title: "AI hardware investments reach record scaling volumes", slug: "ai-scaling" }
        ].filter(n => n.title.toLowerCase().includes(val.toLowerCase()));

        const academyLessons = [
          { title: "Discounted Cash Flow (DCF) Valuation basics", slug: "dcf-valuation" },
          { title: "Understanding SIP Step-up schedules", slug: "sip-compounding" }
        ].filter(l => l.title.toLowerCase().includes(val.toLowerCase()));

        setPaletteResults({
          stocks: stocks.slice(0, 4),
          funds: funds.slice(0, 4),
          reports: allReports,
          news: allNews,
          academy: academyLessons
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setPaletteResults({ stocks: [], funds: [], reports: [], news: [], academy: [] });
    }
  };

  const handleSelectSearchResult = (type: "stock" | "fund" | "report" | "news" | "lesson", symbol: string) => {
    // Save to recent searches
    const existing = localStorage.getItem("wealthpilot_recent_searches");
    const arr = existing ? JSON.parse(existing) : [];
    const valToSave = symbol.toUpperCase();
    if (!arr.includes(valToSave)) {
      arr.unshift(valToSave);
      localStorage.setItem("wealthpilot_recent_searches", JSON.stringify(arr.slice(0, 6)));
    }
    
    if (type === "stock") {
      setTicker(symbol);
      setActiveTab("fundamentals");
    } else if (type === "fund") {
      setActiveTab("funds");
    } else if (type === "lesson") {
      setActiveTab("academy");
    } else if (type === "report") {
      setTicker(symbol);
      setActiveTab("reports");
    } else {
      setActiveTab("market");
    }
    setSearchQuery("");
    setShowPalette(false);
    setActiveSearchIndex(-1);
  };

  const toggleFavorite = (tabId: string) => {
    setPinnedFavorites(prev => {
      if (prev.includes(tabId)) {
        return prev.filter(f => f !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/v1/chat/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, ticker: ticker })
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { sender: "ai", text: json.response, citations: json.citations }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: "ai", text: "Error fetching response. Please verify the backend status." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Group items by category (Phase 4 Redesign requirement)
  const sidebarGroups = [
    {
      name: "Dashboard",
      items: [{ id: "dashboard", label: "Dashboard Hub", icon: LayoutDashboard }]
    },
    {
      name: "Markets",
      items: [{ id: "market", label: "Market Intel", icon: Globe }]
    },
    {
      name: "Companies",
      items: [
        { id: "fundamentals", label: "Fundamentals", icon: BarChart3 },
        { id: "technical", label: "Technical Analyst", icon: Activity },
        { id: "valuation", label: "Valuation Engine", icon: LineChart },
        { id: "reports", label: "Annual Report RAG", icon: FileText },
        { id: "graph", label: "Knowledge Graph", icon: Share2 }
      ]
    },
    {
      name: "Portfolio",
      items: [
        { id: "portfolio", label: "Asset Ledger", icon: Briefcase },
        { id: "watchlist", label: "Stock Watchlist", icon: Eye }
      ]
    },
    {
      name: "Mutual Funds",
      items: [
        { id: "funds", label: "Mutual Funds", icon: Coins }
      ]
    },
    {
      name: "Research",
      items: [
        { id: "journal", label: "Research Journal", icon: BookOpen },
        { id: "strategy", label: "Strategy Backtester", icon: Code },
        { id: "comparison", label: "Compare Companies", icon: Landmark }
      ]
    },
    {
      name: "Education",
      items: [
        { id: "academy", label: "Investing Academy", icon: GraduationCap }
      ]
    }
  ];

  // Flattened sidebar item lookup list for favorites rendering
  const allSidebarItems = sidebarGroups.flatMap(g => g.items);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-light-bg dark:bg-dark-bg select-none font-sans nav-transition">
      
      {/* 1. Sidebar Navigation - Upgraded modern minimal look */}
      <aside className={`bg-white dark:bg-[#070b13] border-r border-light-border dark:border-dark-border flex flex-col justify-between z-30 transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}>
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-light-border dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-8 w-8 bg-brand-primary rounded flex items-center justify-center shrink-0">
                <Cpu className="w-4.5 h-4.5 text-white" />
              </div>
              {!sidebarCollapsed && (
                <div className="transition-opacity duration-300">
                  <span className="text-xs font-black tracking-wider text-slate-800 dark:text-white block font-sans">WEALTHPILOT</span>
                  <span className="text-[9px] font-bold text-brand-primary tracking-widest uppercase block font-mono">Platform v1.0</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted"
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Sidebar Menu list */}
          <nav className="p-3 space-y-4 overflow-y-auto flex-1 max-h-[calc(100vh-120px)]">
            {/* Favorites group section */}
            {!sidebarCollapsed && pinnedFavorites.length > 0 && (
              <div className="space-y-1">
                <span className="text-[9px] font-black text-brand-primary tracking-widest uppercase block mb-1.5 px-2">Favorites</span>
                {allSidebarItems.filter(item => pinnedFavorites.includes(item.id)).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <div key={tab.id} className="group/fav flex items-center justify-between rounded px-2.5 py-1.5 text-xs text-brand-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 flex-1 ${isActive ? "text-brand-primary font-bold" : "text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                      <button onClick={() => toggleFavorite(tab.id)} className="opacity-0 group-hover/fav:opacity-100 text-brand-warning transition-opacity">
                        <Star className="w-3 h-3 fill-brand-warning" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main navigation groups */}
            {sidebarGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <span className="text-[8px] font-black text-brand-muted tracking-widest uppercase block mb-1.5 px-2">{group.name}</span>
                )}
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isFavorited = pinnedFavorites.includes(tab.id);
                  return (
                    <div key={tab.id} className="group/item flex items-center justify-between rounded py-1 px-2 text-xs transition-colors hover:bg-black/3 dark:hover:bg-white/3">
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2.5 flex-1 transition-all ${
                          isActive 
                            ? "text-brand-primary font-black" 
                            : "text-brand-muted hover:text-slate-800 dark:hover:text-white"
                        }`}
                        title={sidebarCollapsed ? tab.label : undefined}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!sidebarCollapsed && <span>{tab.label}</span>}
                      </button>
                      
                      {!sidebarCollapsed && (
                        <button
                          onClick={() => toggleFavorite(tab.id)}
                          className={`opacity-0 group-hover/item:opacity-100 transition-opacity ${
                            isFavorited ? "text-brand-warning" : "text-brand-muted hover:text-brand-warning"
                          }`}
                        >
                          <Star className={`w-3 h-3 ${isFavorited ? "fill-brand-warning" : ""}`} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info panel */}
        <div className="p-3 border-t border-light-border dark:border-dark-border text-[9px] text-brand-muted font-mono flex justify-between items-center select-none">
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  systemHealth === "online" ? "bg-brand-success" : "bg-brand-warning animate-pulse"
                }`} />
                <span>{systemHealth === "online" ? "ONLINE" : "SYNC..."}</span>
              </div>
              <Terminal className="w-3 h-3" />
            </>
          ) : (
            <Terminal className="w-4 h-4 mx-auto" />
          )}
        </div>
      </aside>

      {/* 2. Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Main top bar header */}
        <header className="h-16 border-b border-light-border dark:border-dark-border bg-white dark:bg-[#070b13] flex justify-between items-center px-6 z-20 shrink-0">
          {/* Left search picker */}
          <div className="relative w-80">
            <div 
              onClick={() => setShowPalette(true)}
              className="flex items-center gap-2 px-3 py-2 bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded cursor-pointer text-brand-muted hover:border-brand-primary/20 transition-all text-xs"
            >
              <Search className="w-4 h-4" />
              <span>Search stocks, mutual funds, reports (Ctrl+K)...</span>
            </div>
          </div>

          {/* Right Header Options */}
          <div className="flex items-center gap-4">
            {/* Active Ticker Context tag */}
            {activeTab !== "funds" && activeTab !== "portfolio" && activeTab !== "academy" && (
              <span className="text-xs font-mono font-bold bg-brand-primary/10 text-brand-primary px-3 py-1 rounded">
                STOCK: {ticker}
              </span>
            )}

            {/* Bookmark button */}
            {activeTab !== "funds" && activeTab !== "portfolio" && activeTab !== "academy" && (
              <button
                onClick={handleToggleBookmark}
                className={`p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                  bookmarked ? "text-brand-warning bg-brand-warning/5" : "text-brand-muted"
                }`}
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}

            {/* Currency Selector */}
            <div className="flex items-center gap-2 border border-light-border dark:border-dark-border rounded px-2.5 py-1 bg-black/5 dark:bg-white/5">
              <Coins className="w-3.5 h-3.5 text-brand-primary" />
              <select
                value={selectedSelector}
                onChange={(e) => handleSelectorChange(e.target.value)}
                className="text-[11px] font-bold bg-transparent border-none text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer uppercase font-sans"
              >
                <option value="AUTO" className="bg-white dark:bg-[#0c111d] text-slate-800 dark:text-white">Auto</option>
                <option value="INR" className="bg-white dark:bg-[#0c111d] text-slate-800 dark:text-white">INR (₹)</option>
                <option value="USD" className="bg-white dark:bg-[#0c111d] text-slate-800 dark:text-white">USD ($)</option>
                <option value="EUR" className="bg-white dark:bg-[#0c111d] text-slate-800 dark:text-white">EUR (€)</option>
                <option value="GBP" className="bg-white dark:bg-[#0c111d] text-slate-800 dark:text-white">GBP (£)</option>
                <option value="JPY" className="bg-white dark:bg-[#0c111d] text-slate-800 dark:text-white">JPY (¥)</option>
              </select>
            </div>

            {/* Currency Peg & Timestamp */}
            {targetCurrency !== "USD" && (
              <span className="text-[9px] font-mono text-brand-muted hidden lg:inline">
                Peg: 1 USD = {CURRENCY_SYMBOLS[targetCurrency] || targetCurrency}{EXCHANGE_RATES[targetCurrency]} (Live)
              </span>
            )}

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              className="p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* AI Copilot toggle button */}
            <button
              onClick={() => setShowCopilot(prev => !prev)}
              className={`p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
                showCopilot ? "text-brand-primary bg-brand-primary/5" : "text-brand-muted"
              }`}
              title="AI Copilot (Ctrl+B)"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* View render area */}
        <main className="flex-1 p-6 overflow-hidden relative">
          {activeTab === "dashboard"    && <DashboardView onSelectTicker={(t) => { setTicker(t); setActiveTab("fundamentals"); }} targetCurrency={targetCurrency} />}
          {activeTab === "market"       && <MarketIntelView onSelectTicker={(t) => { setTicker(t); setActiveTab("fundamentals"); }} targetCurrency={targetCurrency} />}
          {activeTab === "watchlist"    && <WatchlistView onSelectTicker={(t) => { setTicker(t); setActiveTab("fundamentals"); }} targetCurrency={targetCurrency} />}
          {activeTab === "journal"      && <ResearchJournalView onSelectTicker={(t) => { setTicker(t); setActiveTab("fundamentals"); }} targetCurrency={targetCurrency} />}
          {activeTab === "academy"      && <InvestingTeacherView />}
          {activeTab === "fundamentals" && <FundamentalResearchView ticker={ticker} targetCurrency={targetCurrency} />}
          {activeTab === "reports"      && <AnnualReportView ticker={ticker} targetCurrency={targetCurrency} />}
          {activeTab === "portfolio"    && <PortfolioManagerView targetCurrency={targetCurrency} />}
          {activeTab === "technical"    && <TechnicalAnalystView ticker={ticker} targetCurrency={targetCurrency} />}
          {activeTab === "strategy"     && <StrategyBuilderView targetCurrency={targetCurrency} />}
          {activeTab === "valuation"    && <ValuationEngineView ticker={ticker} targetCurrency={targetCurrency} />}
          {activeTab === "comparison"   && <CompareCompaniesView targetCurrency={targetCurrency} />}
          {activeTab === "graph"        && <KnowledgeGraphView ticker={ticker} targetCurrency={targetCurrency} />}
          {activeTab === "funds"        && <MutualFundsView targetCurrency={targetCurrency} />}
        </main>

        {/* Mobile Responsive Bottom tab navigation */}
        <div className="md:hidden border-t border-light-border dark:border-dark-border bg-white dark:bg-[#070b13] h-14 flex items-center justify-around z-20 shrink-0">
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Home" },
            { id: "portfolio", icon: Briefcase, label: "Portfolio" },
            { id: "funds", icon: Coins, label: "Funds" },
            { id: "fundamentals", icon: BarChart3, label: "Stocks" }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-col items-center gap-1 ${isActive ? "text-brand-primary" : "text-brand-muted"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sliding AI Copilot drawer sidebar */}
      {showCopilot && (
        <aside className="w-96 bg-white dark:bg-[#070b13] border-l border-light-border dark:border-dark-border flex flex-col justify-between z-30 relative shrink-0">
          {/* Header */}
          <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-primary" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white">AI Wealth Copilot</span>
            </div>
            <button onClick={() => setShowCopilot(false)} className="text-brand-muted hover:text-slate-800 dark:hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat history list */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`space-y-1 ${msg.sender === "user" ? "text-right" : "text-left"}`}>
                <span className="text-[9px] text-brand-muted uppercase font-mono block">
                  {msg.sender === "user" ? "Investor" : "Platform Copilot"}
                </span>
                <div className={`p-3 rounded text-xs leading-relaxed inline-block max-w-[90%] whitespace-pre-line ${
                  msg.sender === "user" 
                    ? "bg-brand-primary text-white text-left" 
                    : "bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border text-slate-800 dark:text-slate-200"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="text-[10px] text-brand-muted italic font-mono animate-pulse">Analyzing portfolio allocations...</div>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-light-border dark:border-dark-border flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Copilot (e.g., 'Compare HDFC Midcap and SBI Bluechip')..."
              className="flex-1 text-xs px-3 py-2 rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 focus:outline-none focus:border-brand-primary text-slate-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs uppercase rounded transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </aside>
      )}

      {/* 4. UPGRADED COMMAND PALETTE MODAL (Ctrl+K overlay) - categorized results */}
      {showPalette && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center pt-24 z-50">
          <div className="w-[600px] bg-white dark:bg-[#070b13] border border-light-border dark:border-dark-border rounded-lg shadow-xl flex flex-col overflow-hidden max-h-[500px]">
            {/* Header input */}
            <div className="p-3 border-b border-light-border dark:border-dark-border flex items-center gap-3 bg-black/5 dark:bg-white/5">
              <Search className="w-5 h-5 text-brand-primary" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search stocks, mutual funds, reports, learning topics..."
                className="flex-1 text-xs bg-transparent focus:outline-none text-slate-800 dark:text-white"
              />
              <button onClick={() => setShowPalette(false)} className="text-brand-muted hover:text-slate-800 dark:hover:text-white font-bold">&times;</button>
            </div>

            {/* Categorized Results list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searchQuery === "" ? (
                <div className="space-y-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-brand-muted tracking-widest uppercase block">Recent Searches</span>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSelectSearchResult("stock", s)}
                            className="px-2.5 py-1 text-[10px] font-mono font-bold bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded hover:border-brand-primary/20 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-black text-brand-muted tracking-widest uppercase block">Popular Searches</span>
                    <div className="flex flex-wrap gap-2">
                      {["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "SBI Bluechip", "Parag Parikh Flexi Cap", "AAPL"].map((s, idx) => {
                        const type = s.includes(".NS") || s === "AAPL" ? "stock" : "fund";
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectSearchResult(type, s)}
                            className="px-2.5 py-1 text-[10px] font-sans font-bold bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded hover:border-brand-primary/20 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {(() => {
                    let globalIdx = -1;
                    return (
                      <>
                        {/* Stocks Category */}
                        {paletteResults.stocks.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-brand-primary tracking-widest uppercase block">Stocks & Equity</span>
                            <div className="space-y-1">
                              {paletteResults.stocks.map((s: any, idx: number) => {
                                globalIdx++;
                                const isActive = activeSearchIndex === globalIdx;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleSelectSearchResult("stock", s.ticker)}
                                    className={`p-2 rounded text-xs cursor-pointer flex justify-between items-center transition-colors border ${
                                      isActive
                                        ? "bg-brand-primary/10 border-brand-primary/20 dark:bg-brand-primary/20 text-brand-primary font-bold"
                                        : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <Landmark className="w-3.5 h-3.5" />
                                      <div><strong className="font-mono mr-2">{s.ticker}</strong> {s.name}</div>
                                    </div>
                                    <span className="text-[9px] text-brand-muted uppercase font-mono">{s.sector}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Mutual Funds Category */}
                        {paletteResults.funds.length > 0 && (
                          <div className="space-y-1.5 mt-3">
                            <span className="text-[8px] font-black text-brand-secondary tracking-widest uppercase block">Mutual Funds</span>
                            <div className="space-y-1">
                              {paletteResults.funds.map((f: any, idx: number) => {
                                globalIdx++;
                                const isActive = activeSearchIndex === globalIdx;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleSelectSearchResult("fund", f.id)}
                                    className={`p-2 rounded text-xs cursor-pointer flex justify-between items-center transition-colors border ${
                                      isActive
                                        ? "bg-brand-secondary/10 border-brand-secondary/20 dark:bg-brand-secondary/20 text-brand-secondary font-bold"
                                        : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <TrendingUp className="w-3.5 h-3.5 text-brand-secondary" />
                                      <div><strong className="font-mono mr-2">MF</strong> {f.name}</div>
                                    </div>
                                    <span className="text-[9px] text-brand-muted uppercase font-mono">{f.category}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Reports RAG Category */}
                        {paletteResults.reports.length > 0 && (
                          <div className="space-y-1.5 mt-3">
                            <span className="text-[8px] font-black text-brand-info tracking-widest uppercase block">Filings & Reports</span>
                            <div className="space-y-1">
                              {paletteResults.reports.map((r: any, idx: number) => {
                                globalIdx++;
                                const isActive = activeSearchIndex === globalIdx;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleSelectSearchResult("report", r.ticker)}
                                    className={`p-2 rounded text-xs cursor-pointer flex justify-between items-center transition-colors border ${
                                      isActive
                                        ? "bg-brand-primary/10 border-brand-primary/20 dark:bg-brand-primary/20 text-brand-primary font-bold"
                                        : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <FileText className="w-3.5 h-3.5 text-brand-primary" />
                                      <div><strong className="font-mono mr-2">{r.ticker}</strong> {r.type}</div>
                                    </div>
                                    <span className="text-[9px] text-brand-muted uppercase font-mono">RAG Doc</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Academy Category */}
                        {paletteResults.academy.length > 0 && (
                          <div className="space-y-1.5 mt-3">
                            <span className="text-[8px] font-black text-brand-warning tracking-widest uppercase block">Investing Academy</span>
                            <div className="space-y-1">
                              {paletteResults.academy.map((l: any, idx: number) => {
                                globalIdx++;
                                const isActive = activeSearchIndex === globalIdx;
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleSelectSearchResult("lesson", l.slug)}
                                    className={`p-2 rounded text-xs cursor-pointer flex justify-between items-center transition-colors border ${
                                      isActive
                                        ? "bg-brand-warning/10 border-brand-warning/20 dark:bg-brand-warning/20 text-brand-warning font-bold"
                                        : "bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <BookOpen className="w-3.5 h-3.5 text-brand-warning" />
                                      <div><strong className="font-mono mr-2">ACADEMY</strong> {l.title}</div>
                                    </div>
                                    <span className="text-[9px] text-brand-muted uppercase font-mono">Education</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-[#101217] border border-light-border dark:border-dark-border rounded-xl w-full max-w-sm shadow-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-light-border dark:border-dark-border">
              <h2 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <HelpCircle className="w-4 h-4 text-brand-primary" />
                Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowHelp(false)} className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-4 h-4 text-brand-muted" />
              </button>
            </div>
            <div className="p-5 space-y-2.5">
              {[
                { keys: ["Ctrl", "K"], action: "Command Palette", desc: "Search stocks and navigate" },
                { keys: ["Ctrl", "B"], action: "AI Copilot", desc: "Toggle research assistant panel" },
                { keys: ["Ctrl", "D"], action: "Theme Toggle", desc: "Switch dark / light mode" },
                { keys: ["Ctrl", "/"], action: "Help", desc: "Show / hide this help panel" },
                { keys: ["Esc"],       action: "Close",  desc: "Close any open modal or panel" },
              ].map((sc, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">{sc.action}</p>
                    <p className="text-[10px] text-brand-muted">{sc.desc}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, j) => (
                      <kbd key={j} className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/5 dark:bg-white/10 border border-light-border dark:border-dark-border rounded shadow-sm">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="px-5 pb-4 text-[9px] text-brand-muted text-center font-mono">
              WealthPilot AI Terminal — Press ESC to dismiss
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
