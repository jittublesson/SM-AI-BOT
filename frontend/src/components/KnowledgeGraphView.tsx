import React, { useState } from "react";
import { Share2, Info, Search, ZoomIn, ZoomOut, Maximize2, Filter } from "lucide-react";

interface KnowledgeGraphViewProps {
  ticker: string;
  targetCurrency?: string;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ ticker, targetCurrency = "INR" }) => {
  const [activeNode, setActiveNode] = useState<string>("center");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1.0);
  
  // Expanded nodes state: clicking certain nodes reveals new secondary nodes
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  // Seed node coordinates and descriptions
  const baseGraphData: Record<string, {
    center: { id: string; label: string; desc: string };
    nodes: Array<{ id: string; label: string; type: string; cx: number; cy: number; desc: string }>;
    expandedRelations: Record<string, Array<{ id: string; label: string; type: string; cx: number; cy: number; desc: string }>>;
  }> = {
    "AAPL": {
      "center": { id: "center", label: "Apple Inc.", desc: "Parent global consumer technology developer." },
      "nodes": [
        { id: "sub1", label: "Beats Electronics", type: "subsidiary", cx: 400, cy: 50, desc: "Acquired audio consumer hardware subsidiary." },
        { id: "sub2", label: "Braeburn Capital", type: "subsidiary", cx: 220, cy: 70, desc: "Apple's cash allocation asset management arm." },
        { id: "supp1", label: "TSMC", type: "supplier", cx: 120, cy: 150, desc: "Key micro-processor silicon foundry supplier." },
        { id: "supp2", label: "Foxconn", type: "supplier", cx: 220, cy: 230, desc: "Core hardware device assembly partner." },
        { id: "comp1", label: "Samsung", type: "competitor", cx: 680, cy: 150, desc: "Direct consumer smartphone competitor." },
        { id: "comp2", label: "Google", type: "competitor", cx: 580, cy: 230, desc: "OS platform search licensee rival." },
        { id: "holder1", label: "Vanguard Group", type: "holder", cx: 580, cy: 70, desc: "Major institutional equity shareholder (8.5%)." },
        { id: "holder2", label: "BlackRock", type: "holder", cx: 400, cy: 250, desc: "Institutional indexing stakeholder (6.8%)." }
      ],
      "expandedRelations": {
        "supp1": [ // Clicking TSMC expands its own relations
          { id: "asml", label: "ASML Holding", type: "supplier", cx: 60, cy: 90, desc: "Monopoly extreme ultraviolet (EUV) lithography supplier to TSMC." },
          { id: "nvidia", label: "NVIDIA Corp", type: "competitor", cx: 60, cy: 210, desc: "Silicon design customer sharing TSMC foundry slots." }
        ],
        "comp1": [ // Clicking Samsung expands its own relations
          { id: "sec_display", label: "Samsung Display", type: "subsidiary", cx: 740, cy: 80, desc: "Separate display panel subsidiary supplying screens to Apple." }
        ]
      }
    },
    "RELIANCE.NS": {
      "center": { id: "center", label: "Reliance Industries", desc: "Energy, retail, and telecom conglomerate parent." },
      "nodes": [
        { id: "sub1", label: "Jio Infocomm", type: "subsidiary", cx: 400, cy: 50, desc: "Digital communications and mobile services subsidiary." },
        { id: "sub2", label: "Reliance Retail", type: "subsidiary", cx: 220, cy: 70, desc: "E-commerce and grocery storefront chain." },
        { id: "supp1", label: "Saudi Aramco", type: "supplier", cx: 120, cy: 150, desc: "Feedstock crude oil supplier partner." },
        { id: "supp2", label: "BP Plc", type: "supplier", cx: 220, cy: 230, desc: "Deepwater gas extraction venture partner." },
        { id: "comp1", label: "Bharti Airtel", type: "competitor", cx: 680, cy: 150, desc: "Telecom peer service rival." },
        { id: "comp2", label: "Tata Trent", type: "competitor", cx: 580, cy: 230, desc: "Retail fashion storefront rival." },
        { id: "holder1", label: "Ambani Family", type: "holder", cx: 580, cy: 70, desc: "Promoter shareholding group (50.3%)." },
        { id: "holder2", label: "LIC India", type: "holder", cx: 400, cy: 250, desc: "Domestic institutional anchor (DII)." }
      ],
      "expandedRelations": {
        "sub1": [
          { id: "meta_jio", label: "Meta Platforms", type: "holder", cx: 480, cy: 30, desc: "Invested $5.7B for 9.9% stake in Jio Platforms." }
        ]
      }
    }
  };

  const activeGraph = baseGraphData[ticker.toUpperCase()] || baseGraphData["AAPL"];

  // Expand node toggle
  const handleNodeClick = (nodeId: string) => {
    setActiveNode(nodeId);
    if (activeGraph.expandedRelations[nodeId]) {
      if (expandedNodes.includes(nodeId)) {
        setExpandedNodes(prev => prev.filter(id => id !== nodeId));
      } else {
        setExpandedNodes(prev => [...prev, nodeId]);
      }
    }
  };

  // Compile active node lists including expanded children
  let allNodes = [...activeGraph.nodes];
  let allLinks: Array<{ from: string; to: string; active: boolean }> = activeGraph.nodes.map(n => ({
    from: "center",
    to: n.id,
    active: activeNode === n.id
  }));

  expandedNodes.forEach(expId => {
    const children = activeGraph.expandedRelations[expId] || [];
    allNodes = [...allNodes, ...children];
    children.forEach(c => {
      allLinks.push({
        from: expId,
        to: c.id,
        active: activeNode === c.id || activeNode === expId
      });
    });
  });

  // Filter nodes based on search and selected type
  const filteredNodes = allNodes.filter(node => {
    const matchesSearch = node.label.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || node.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getActiveNodeInfo = () => {
    if (activeNode === "center") {
      return { label: activeGraph.center.label, type: "Parent Company", desc: activeGraph.center.desc };
    }
    const match = allNodes.find(n => n.id === activeNode);
    return match ? { label: match.label, type: match.type, desc: match.desc } : null;
  };

  const activeInfo = getActiveNodeInfo();

  // Zoom parameters
  const viewWidth = 800 * zoomLevel;
  const viewHeight = 300 * zoomLevel;
  const viewX = (800 - viewWidth) / 2;
  const viewY = (300 - viewHeight) / 2;
  const viewBounds = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`;

  return (
    <div className="space-y-6 pb-6">
      {/* Search & Filter Top Bar */}
      <div className="glass-card p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 items-center shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-brand-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 rounded focus:outline-none focus:border-brand-primary text-slate-800 dark:text-slate-200"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Nodes" },
            { id: "subsidiary", label: "Subsidiaries" },
            { id: "supplier", label: "Suppliers" },
            { id: "competitor", label: "Competitors" },
            { id: "holder", label: "Stakeholders" }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterType(opt.id)}
              className={`px-3 py-1 rounded text-[10px] font-bold font-sans uppercase shrink-0 transition-colors ${
                filterType === opt.id 
                  ? "bg-brand-primary/10 text-brand-primary border border-brand-primary/20" 
                  : "text-brand-muted hover:bg-black/5 dark:hover:bg-white/5 border border-transparent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex justify-end gap-2 items-center">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 1.5))}
            className="p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.6))}
            className="p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1.0)}
            className="p-2 rounded border border-light-border dark:border-dark-border hover:bg-black/5 dark:hover:bg-white/5 text-brand-muted"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* SVG Network Graph Canvas */}
        <div className="lg:col-span-3 glass-card p-6 rounded-lg flex flex-col space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
            <Share2 className="text-brand-primary w-5 h-5" />
            Corporate Connection Knowledge Graph ({ticker.toUpperCase()})
          </h2>

          <div className="w-full overflow-x-auto py-2">
            <svg className="w-[800px] h-[300px] mx-auto bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border rounded-lg" viewBox={viewBounds}>
              {/* Connector lines */}
              {allLinks.map((link, idx) => {
                const fromNode = link.from === "center" 
                  ? { cx: 400, cy: 150 } 
                  : allNodes.find(n => n.id === link.from);
                const toNode = allNodes.find(n => n.id === link.to);

                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={idx}
                    x1={fromNode.cx}
                    y1={fromNode.cy}
                    x2={toNode.cx}
                    y2={toNode.cy}
                    stroke={link.active ? "#0062ff" : "rgba(100, 116, 139, 0.2)"}
                    strokeWidth={link.active ? "2.5" : "1.2"}
                  />
                );
              })}

              {/* Central node (400, 150) */}
              <circle
                cx="400"
                cy="150"
                r="35"
                fill="#0062ff"
                className="cursor-pointer"
                onClick={() => handleNodeClick("center")}
              />
              <text x="400" y="153" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" className="pointer-events-none select-none">
                {ticker.toUpperCase()}
              </text>

              {/* Surrounding Nodes */}
              {filteredNodes.map((node) => {
                let fill = "#64748b"; // default
                if (node.type === "subsidiary") fill = "#10b981";
                if (node.type === "supplier") fill = "#f59e0b";
                if (node.type === "competitor") fill = "#ef4444";
                if (node.type === "holder") fill = "#a855f7";

                const isSelected = activeNode === node.id;
                const hasChildren = !!activeGraph.expandedRelations[node.id];

                return (
                  <g key={node.id} className="cursor-pointer" onClick={() => handleNodeClick(node.id)}>
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={isSelected ? "25" : "20"}
                      fill={fill}
                      stroke={isSelected ? "#0062ff" : hasChildren ? "rgba(16, 185, 129, 0.5)" : "transparent"}
                      strokeWidth="2.5"
                    />
                    <text x={node.cx} y={node.cy + 30} fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <span className="text-[10px] text-brand-muted block italic text-center">
            Double-ringed nodes (e.g. TSMC or Jio) contain secondary connections. Click them to expand.
          </span>
        </div>

        {/* Selected node relationship info panel */}
        <div className="glass-card p-6 rounded-lg flex flex-col space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
            <Info className="text-brand-warning w-5 h-5" />
            Operational Link Details
          </h2>
          {activeInfo ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] text-brand-muted uppercase font-mono block">Node label</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white mt-1 block">
                  {activeInfo.label}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-brand-muted uppercase font-mono block">Relationship</span>
                <span className="text-xs px-2 py-0.5 rounded font-mono uppercase bg-brand-primary/10 text-brand-primary font-bold mt-1 inline-block">
                  {activeInfo.type}
                </span>
              </div>

              <div className="border-t border-light-border dark:border-dark-border pt-3">
                <span className="text-[10px] text-brand-muted uppercase font-mono block mb-1">Operational notes</span>
                <p className="text-brand-muted leading-relaxed">
                  {activeInfo.desc}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-brand-muted text-xs text-center">
              Click a graph node bubble to query connection details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
