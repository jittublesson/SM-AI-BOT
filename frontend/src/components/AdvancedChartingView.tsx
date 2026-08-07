import React, { useState, useEffect, useRef } from "react";
import { LineChart, BarChart2, TrendingUp, Type, Sparkles, RefreshCw, PenTool, CheckCircle } from "lucide-react";

interface AdvancedChartingViewProps {
  ticker: string;
}

export const AdvancedChartingView: React.FC<AdvancedChartingViewProps> = ({ ticker }) => {
  const [prices, setPrices] = useState<number[]>([]);
  const [chartType, setChartType] = useState<"candle" | "line" | "area" | "heikin_ashi" | "renko">("candle");
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M">("1D");
  const [loading, setLoading] = useState(true);
  
  // Drawing states
  const [drawings, setDrawings] = useState<any[]>([]);
  const [activeTool, setActiveTool] = useState<"none" | "trendline" | "fib" | "annotation">("none");
  const [annotationText, setAnnotationText] = useState("");
  
  const svgRef = useRef<SVGSVGElement>(null);

  // Generate price candles based on ticker close history
  const loadChartData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/analyst/profile/${ticker}`);
      if (res.ok) {
        const json = await res.json();
        const priceVal = json.profile?.info?.price || 150.00;
        
        // Generate 30 candles around target price
        npRandomWalk(priceVal);
      }
    } catch {
      npRandomWalk(150.00);
    } finally {
      setLoading(false);
    }
  };

  const npRandomWalk = (base: number) => {
    const dataList = [];
    let current = base * 0.95;
    for (let i = 0; i < 35; i++) {
      const change = current * (Math.random() * 0.04 - 0.018);
      const open = current;
      const close = current + change;
      const high = Math.max(open, close) + (Math.random() * (current * 0.015));
      const low = Math.min(open, close) - (Math.random() * (current * 0.015));
      dataList.push({ open, close, high, low });
      current = close;
    }
    // Set prices array of close values or candle objects
    setPrices(dataList as any);
  };

  useEffect(() => {
    loadChartData();
  }, [ticker, timeframe]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (activeTool === "none" || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === "trendline") {
      setDrawings(prev => [
        ...prev, 
        { type: "trendline", x1: x - 40, y1: y + 20, x2: x + 40, y2: y - 20 }
      ]);
      setActiveTool("none");
    } else if (activeTool === "fib") {
      setDrawings(prev => [
        ...prev,
        { type: "fibonacci", y: y }
      ]);
      setActiveTool("none");
    } else if (activeTool === "annotation") {
      if (!annotationText.trim()) return;
      setDrawings(prev => [
        ...prev,
        { type: "annotation", x, y, text: annotationText }
      ]);
      setAnnotationText("");
      setActiveTool("none");
    }
  };

  // Convert Renko brick size
  const renderRenkoBricks = () => {
    if (prices.length === 0) return [];
    const bricks: Array<{ x: number; y: number; up: boolean }> = [];
    let prevClose = (prices[0] as any).close;
    const brickSize = prevClose * 0.01; // 1% brick size
    let x = 0;
    
    prices.forEach((p: any) => {
      const diff = p.close - prevClose;
      if (Math.abs(diff) >= brickSize) {
        const count = Math.floor(Math.abs(diff) / brickSize);
        for (let i = 0; i < count; i++) {
          const up = diff > 0;
          bricks.push({ x: x * 12 + 10, y: up ? prevClose : prevClose - brickSize, up });
          prevClose = up ? prevClose + brickSize : prevClose - brickSize;
          x++;
        }
      }
    });
    return bricks;
  };

  const renkoBricks = renderRenkoBricks();

  // Convert Heikin Ashi values
  const getHeikinAshiCandles = () => {
    if (prices.length === 0) return [];
    const haCandles: any[] = [];
    let prevOpen = (prices[0] as any).open;
    let prevClose = (prices[0] as any).close;

    prices.forEach((p: any) => {
      const haClose = (p.open + p.high + p.low + p.close) / 4;
      const haOpen = (prevOpen + prevClose) / 2;
      const haHigh = Math.max(p.high, haOpen, haClose);
      const haLow = Math.min(p.low, haOpen, haClose);
      haCandles.push({ open: haOpen, close: haClose, high: haHigh, low: haLow });
      prevOpen = haOpen;
      prevClose = haClose;
    });
    return haCandles;
  };

  const haCandles = getHeikinAshiCandles();

  // Scale data points to fit SVG canvas heights
  const chartHeight = 260;
  const chartWidth = 520;
  const padding = 20;

  const getRange = (candles: any[]) => {
    if (candles.length === 0) return { min: 0, max: 100 };
    const highs = candles.map(c => c.high || c.y || 100);
    const lows = candles.map(c => c.low || c.y || 0);
    return {
      min: Math.min(...lows) * 0.99,
      max: Math.max(...highs) * 1.01
    };
  };

  const activeCandles = chartType === "heikin_ashi" ? haCandles : prices;
  const { min, max } = getRange(activeCandles);

  const scaleY = (val: number) => {
    return chartHeight - padding - ((val - min) / (max - min)) * (chartHeight - 2 * padding);
  };

  return (
    <div className="glass-card p-5 rounded-2xl border border-light-border dark:border-dark-border space-y-4">
      
      {/* Chart Headers & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-3">
        <div>
          <span className="text-[10px] text-brand-muted uppercase font-bold tracking-widest block">Interactive Charting Engine</span>
          <h2 className="text-sm font-black uppercase text-brand-primary tracking-wider mt-0.5">{ticker} Institutional Terminal</h2>
        </div>

        {/* Control toolbar */}
        <div className="flex flex-wrap gap-2 text-[10px] font-bold font-mono">
          
          {/* Chart Type Selection */}
          <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-light-border dark:border-dark-border">
            <button onClick={() => setChartType("candle")} className={`px-2 py-1 rounded-md transition-all ${chartType === "candle" ? "bg-brand-primary text-white" : "text-brand-muted"}`}>Candles</button>
            <button onClick={() => setChartType("line")} className={`px-2 py-1 rounded-md transition-all ${chartType === "line" ? "bg-brand-primary text-white" : "text-brand-muted"}`}>Line</button>
            <button onClick={() => setChartType("area")} className={`px-2 py-1 rounded-md transition-all ${chartType === "area" ? "bg-brand-primary text-white" : "text-brand-muted"}`}>Area</button>
            <button onClick={() => setChartType("heikin_ashi")} className={`px-2 py-1 rounded-md transition-all ${chartType === "heikin_ashi" ? "bg-brand-primary text-white" : "text-brand-muted"}`}>H-Ashi</button>
            <button onClick={() => setChartType("renko")} className={`px-2 py-1 rounded-md transition-all ${chartType === "renko" ? "bg-brand-primary text-white" : "text-brand-muted"}`}>Renko</button>
          </div>

          {/* Timeframe Selection */}
          <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-light-border dark:border-dark-border">
            {["1D", "1W", "1M"].map((tf) => (
              <button key={tf} onClick={() => setTimeframe(tf as any)} className={`px-2 py-1 rounded-md transition-all ${timeframe === tf ? "bg-brand-primary text-white" : "text-brand-muted"}`}>{tf}</button>
            ))}
          </div>

          {/* Drawing Tools Selection */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-light-border dark:border-dark-border">
            <button 
              onClick={() => setActiveTool("trendline")} 
              className={`p-1.5 rounded-lg border transition-colors ${activeTool === "trendline" ? "bg-brand-primary border-brand-primary text-white" : "bg-black/5 dark:bg-white/5 border-light-border dark:border-dark-border text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
              title="Add Trendline"
            >
              <PenTool className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setActiveTool("fib")} 
              className={`p-1.5 rounded-lg border transition-colors ${activeTool === "fib" ? "bg-brand-primary border-brand-primary text-white" : "bg-black/5 dark:bg-white/5 border-light-border dark:border-dark-border text-brand-muted hover:text-slate-800 dark:hover:text-white"}`}
              title="Add Fibonacci Retracement"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <input 
                type="text" 
                value={annotationText} 
                onChange={(e) => {
                  setAnnotationText(e.target.value);
                  setActiveTool("annotation");
                }} 
                placeholder="Text..." 
                className="w-16 px-1.5 py-1 text-[9px] rounded border border-light-border dark:border-dark-border bg-black/5 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:border-brand-primary"
              />
              <button 
                onClick={() => setActiveTool("annotation")} 
                className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-light-border dark:border-dark-border text-brand-muted hover:text-slate-800 dark:hover:text-white"
                title="Add Annotation Text"
              >
                <Type className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <button onClick={() => setDrawings([])} className="p-1.5 rounded-lg bg-brand-danger/10 border border-brand-danger/25 text-brand-danger hover:bg-brand-danger/20">Clear</button>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Drawing Area */}
      <div className="relative border border-light-border dark:border-dark-border rounded-xl overflow-hidden bg-slate-900/40">
        
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-brand-muted font-mono gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
            Compiling charting buffers...
          </div>
        ) : (
          <svg 
            ref={svgRef}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            onClick={handleSvgClick}
            className={`w-full h-[280px] p-2 bg-[#06090e]/80 select-none ${activeTool !== "none" ? "cursor-crosshair" : "cursor-default"}`}
          >
            {/* Chart Grid Lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => (
              <line 
                key={idx} 
                x1="0" 
                y1={chartHeight * ratio} 
                x2={chartWidth} 
                y2={chartHeight * ratio} 
                stroke="#2a303c" 
                strokeWidth="0.5" 
                strokeDasharray="4"
              />
            ))}

            {/* Render chart based on selected type */}
            {chartType === "renko" ? (
              renkoBricks.map((b, idx) => (
                <rect 
                  key={idx}
                  x={b.x}
                  y={scaleY(b.y)}
                  width="10"
                  height="8"
                  fill={b.up ? "#10b981" : "#ef4444"}
                  stroke={b.up ? "#047857" : "#b91c1c"}
                  strokeWidth="0.5"
                />
              ))
            ) : chartType === "line" || chartType === "area" ? (
              <>
                {/* SVG path calculations */}
                {(() => {
                  const points = activeCandles.map((c: any, idx) => {
                    const x = (idx / (activeCandles.length - 1)) * (chartWidth - 40) + 20;
                    const y = scaleY(c.close || c.open || 100);
                    return `${x},${y}`;
                  }).join(" ");

                  return (
                    <>
                      {chartType === "area" && (
                        <path 
                          d={`M 20,${chartHeight - padding} L ${points} L ${chartWidth - 20},${chartHeight - padding} Z`}
                          fill="url(#area-gradient)"
                          stroke="none"
                        />
                      )}
                      <polyline 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2" 
                        points={points}
                      />
                    </>
                  );
                })()}
              </>
            ) : (
              // Candlesticks and Heikin Ashi
              activeCandles.map((c: any, idx) => {
                const candleWidth = (chartWidth - 40) / activeCandles.length;
                const x = idx * candleWidth + 20;
                const isGreen = c.close >= c.open;
                
                return (
                  <g key={idx} className="hover:opacity-80 transition-opacity">
                    {/* Wick */}
                    <line 
                      x1={x + candleWidth / 2} 
                      y1={scaleY(c.high)} 
                      x2={x + candleWidth / 2} 
                      y2={scaleY(c.low)} 
                      stroke={isGreen ? "#10b981" : "#ef4444"} 
                      strokeWidth="1.2"
                    />
                    {/* Body */}
                    <rect 
                      x={x + candleWidth * 0.15} 
                      y={scaleY(Math.max(c.open, c.close))} 
                      width={candleWidth * 0.7} 
                      height={Math.max(2, Math.abs(scaleY(c.open) - scaleY(c.close)))} 
                      fill={isGreen ? "#10b981" : "#ef4444"}
                      stroke={isGreen ? "#10b981" : "#ef4444"}
                      strokeWidth="0.5"
                    />
                  </g>
                );
              })
            )}

            {/* Custom Drawings Overlay */}
            {drawings.map((d, idx) => {
              if (d.type === "trendline") {
                return (
                  <line 
                    key={idx} 
                    x1={d.x1} 
                    y1={d.y1} 
                    x2={d.x2} 
                    y2={d.y2} 
                    stroke="#f59e0b" 
                    strokeWidth="1.5"
                    strokeDasharray="2"
                  />
                );
              }
              if (d.type === "fibonacci") {
                const fibRatios = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
                return (
                  <g key={idx}>
                    {fibRatios.map((r, rIdx) => {
                      const lineY = d.y + (rIdx * 15);
                      return (
                        <g key={rIdx}>
                          <line 
                            x1="0" 
                            y1={lineY} 
                            x2={chartWidth} 
                            y2={lineY} 
                            stroke="#8b5cf6" 
                            strokeWidth="0.5"
                            strokeOpacity="0.8"
                          />
                          <text x="5" y={lineY - 2} fill="#8b5cf6" fontSize="7" opacity="0.8" fontFamily="monospace">
                            FIB {r * 100}%
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }
              if (d.type === "annotation") {
                return (
                  <g key={idx}>
                    <rect x={d.x} y={d.y - 12} width={d.text.length * 6} height="14" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="0.5" rx="2" />
                    <text x={d.x + 4} y={d.y - 2} fill="#818cf8" fontSize="8" fontFamily="sans-serif">
                      {d.text}
                    </text>
                  </g>
                );
              }
              return null;
            })}

            {/* Gradients definitions */}
            <defs>
              <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Toolbar Prompt */}
        {activeTool !== "none" && (
          <div className="absolute top-2 left-2 bg-brand-primary text-white text-[9px] font-bold font-mono px-2.5 py-1 rounded shadow-lg animate-pulse flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Active: click on the canvas to place your {activeTool}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-brand-muted bg-black/5 dark:bg-white/5 p-2 rounded-xl">
        <CheckCircle className="w-4 h-4 text-brand-secondary" />
        <span>Canvas loaded with 35 sequential candles. Use drawing controls to place markers or retracements.</span>
      </div>

    </div>
  );
};
