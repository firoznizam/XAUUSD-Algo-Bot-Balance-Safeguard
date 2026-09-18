import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Eye,
  Layers,
  Crosshair,
  TrendingUp,
  TrendingDown,
  Info,
  Maximize2,
} from 'lucide-react';
import { CalculatedCandle, StrategyConfig } from '../types';

interface ChartSectionProps {
  candles: CalculatedCandle[];
  config: StrategyConfig;
  onNextCandle: () => void;
  onResetCandles: () => void;
  isSimulating: boolean;
  onToggleSimulating: () => void;
  onSymbolChange: (symbol: string) => void;
  currentSymbol: string;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  candles,
  config,
  onNextCandle,
  onResetCandles,
  isSimulating,
  onToggleSimulating,
  onSymbolChange,
  currentSymbol,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [visibleOverlays, setVisibleOverlays] = useState({
    ema9: true,
    ema21: true,
    ema200: true,
    vwap: true,
    supertrend: true,
    sweeps: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 420 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 420,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Display the last 45-60 candles for crisp readability
  const displayCandles = candles.slice(-50);
  const hoverCandle =
    hoverIndex !== null && displayCandles[hoverIndex]
      ? displayCandles[hoverIndex]
      : displayCandles[displayCandles.length - 1];

  // Calculate scales
  let minPrice = Infinity;
  let maxPrice = -Infinity;

  displayCandles.forEach((c) => {
    if (c.low < minPrice) minPrice = c.low;
    if (c.high > maxPrice) maxPrice = c.high;
    if (visibleOverlays.ema9 && c.ema9 && c.ema9 < minPrice) minPrice = c.ema9;
    if (visibleOverlays.ema9 && c.ema9 && c.ema9 > maxPrice) maxPrice = c.ema9;
    if (visibleOverlays.ema200 && c.ema200 && c.ema200 < minPrice) minPrice = c.ema200;
    if (visibleOverlays.ema200 && c.ema200 && c.ema200 > maxPrice) maxPrice = c.ema200;
    if (visibleOverlays.vwap && c.vwap && c.vwap < minPrice) minPrice = c.vwap;
    if (visibleOverlays.vwap && c.vwap && c.vwap > maxPrice) maxPrice = c.vwap;
  });

  // Margin buffer
  const pricePadding = (maxPrice - minPrice) * 0.08 || 2.0;
  const chartMin = minPrice - pricePadding;
  const chartMax = maxPrice + pricePadding;
  const priceRange = chartMax - chartMin || 1;

  const chartWidth = Math.max(300, dimensions.width - 70); // 70px right price axis
  const chartHeight = dimensions.height - 40; // 40px bottom time axis

  const getY = (val: number) => {
    return chartHeight - ((val - chartMin) / priceRange) * chartHeight;
  };

  const candleCount = displayCandles.length;
  const candleSpacing = chartWidth / candleCount;
  const candleBodyWidth = Math.max(3, candleSpacing * 0.65);

  const getX = (idx: number) => {
    return idx * candleSpacing + candleSpacing / 2;
  };

  // Generate SVG path for a line
  const makeLinePath = (getValue: (c: CalculatedCandle) => number | undefined) => {
    let d = '';
    for (let i = 0; i < displayCandles.length; i++) {
      const val = getValue(displayCandles[i]);
      if (val === undefined || isNaN(val)) continue;
      const x = getX(i);
      const y = getY(val);
      if (d === '') d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      else d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return d;
  };

  const ema9Path = visibleOverlays.ema9 ? makeLinePath((c) => c.ema9) : '';
  const ema21Path = visibleOverlays.ema21 ? makeLinePath((c) => c.ema21) : '';
  const ema200Path = visibleOverlays.ema200 ? makeLinePath((c) => c.ema200) : '';
  const vwapPath = visibleOverlays.vwap ? makeLinePath((c) => c.vwap) : '';

  // Generate Price Axis Labels (5 levels)
  const priceLabels: number[] = [];
  const labelCount = 5;
  for (let i = 0; i < labelCount; i++) {
    priceLabels.push(chartMin + (priceRange / (labelCount - 1)) * i);
  }

  return (
    <div id="chart-section" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 space-y-3.5 shadow-xl">
      {/* Top Bar: Symbol Selector, Controls, Overlay Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Symbol Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl p-1">
            {['XAUUSD', 'RELIANCE.NS', 'EURUSD', 'BTCUSD'].map((sym) => (
              <button
                key={sym}
                id={`symbol-select-${sym}`}
                onClick={() => onSymbolChange(sym)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg transition ${
                  currentSymbol === sym
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono font-semibold border border-slate-700">
            {config.timeframe} (5-Min Candles)
          </span>

          <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-400 font-mono">
            {candles.length} bars loaded
          </span>
        </div>

        {/* Simulator controls */}
        <div className="flex items-center gap-2">
          <button
            id="chart-toggle-sim-btn"
            onClick={onToggleSimulating}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              isSimulating
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title="Auto-simulate live tick stream"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Pause Live Ticks' : 'Stream Live Ticks'}</span>
          </button>

          <button
            id="chart-step-next-btn"
            onClick={onNextCandle}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1"
            title="Simulate 1 new 5M candle"
          >
            <StepForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Step Candle</span>
          </button>

          <button
            id="chart-reset-btn"
            onClick={onResetCandles}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            title="Reset to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Layer Visibility Pills */}
      <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
        <span className="text-slate-500 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Overlays:
        </span>

        <button
          onClick={() => setVisibleOverlays((p) => ({ ...p, ema9: !p.ema9 }))}
          className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
            visibleOverlays.ema9
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
              : 'bg-slate-800/40 text-slate-500 border-slate-700'
          }`}
        >
          <span className="w-2 h-0.5 bg-cyan-400 rounded-full" />
          EMA 9 (Fast)
        </button>

        <button
          onClick={() => setVisibleOverlays((p) => ({ ...p, ema21: !p.ema21 }))}
          className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
            visibleOverlays.ema21
              ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
              : 'bg-slate-800/40 text-slate-500 border-slate-700'
          }`}
        >
          <span className="w-2 h-0.5 bg-orange-400 rounded-full" />
          EMA 21 (Mid)
        </button>

        <button
          onClick={() => setVisibleOverlays((p) => ({ ...p, ema200: !p.ema200 }))}
          className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
            visibleOverlays.ema200
              ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
              : 'bg-slate-800/40 text-slate-500 border-slate-700'
          }`}
        >
          <span className="w-2 h-0.5 bg-purple-400 rounded-full" />
          EMA 200 (Macro)
        </button>

        <button
          onClick={() => setVisibleOverlays((p) => ({ ...p, vwap: !p.vwap }))}
          className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
            visibleOverlays.vwap
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-800/40 text-slate-500 border-slate-700'
          }`}
        >
          <span className="w-2 h-0.5 border-t border-dashed border-amber-400" />
          VWAP
        </button>

        <button
          onClick={() => setVisibleOverlays((p) => ({ ...p, supertrend: !p.supertrend }))}
          className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
            visibleOverlays.supertrend
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-800/40 text-slate-500 border-slate-700'
          }`}
        >
          <span className="w-2 h-1 bg-emerald-500 rounded-sm" />
          Supertrend (10,3)
        </button>

        <button
          onClick={() => setVisibleOverlays((p) => ({ ...p, sweeps: !p.sweeps }))}
          className={`px-2 py-0.5 rounded border transition flex items-center gap-1.5 ${
            visibleOverlays.sweeps
              ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30'
              : 'bg-slate-800/40 text-slate-500 border-slate-700'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
          Liquidity Sweeps
        </button>
      </div>

      {/* Hover Readout Bar */}
      {hoverCandle && (
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs font-mono overflow-x-auto">
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-400">Time: <strong className="text-slate-200">{hoverCandle.time}</strong></span>
            <span>O: <strong className="text-slate-200">{hoverCandle.open.toFixed(2)}</strong></span>
            <span>H: <strong className="text-slate-200">{hoverCandle.high.toFixed(2)}</strong></span>
            <span>L: <strong className="text-slate-200">{hoverCandle.low.toFixed(2)}</strong></span>
            <span>C: <strong className={hoverCandle.close >= hoverCandle.open ? 'text-emerald-400' : 'text-rose-400'}>{hoverCandle.close.toFixed(2)}</strong></span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            <span className="text-cyan-400">EMA9: {hoverCandle.ema9}</span>
            <span className="text-orange-400">EMA21: {hoverCandle.ema21}</span>
            <span className="text-purple-400">EMA200: {hoverCandle.ema200}</span>
            <span className="text-amber-400">VWAP: {hoverCandle.vwap}</span>
            <span className="text-sky-300">RSI: {hoverCandle.rsi}</span>
            <span className={hoverCandle.supertrendDir === 1 ? 'text-emerald-400' : 'text-rose-400'}>
              ST: {hoverCandle.supertrend} ({hoverCandle.supertrendDir === 1 ? 'Bull' : 'Bear'})
            </span>
            {hoverCandle.bullSweep && (
              <span className="text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
                BULL SWEEP
              </span>
            )}
            {hoverCandle.bearSweep && (
              <span className="text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded font-bold">
                BEAR SWEEP
              </span>
            )}
            {hoverCandle.signal && (
              <span className={`px-2 py-0.5 rounded font-bold ${hoverCandle.signal === 'BUY' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}`}>
                {hoverCandle.signal} SIGNAL
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main SVG Candlestick Chart Stage */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden cursor-crosshair select-none"
        style={{ height: `${dimensions.height}px` }}
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const idx = Math.floor(mouseX / candleSpacing);
          if (idx >= 0 && idx < displayCandles.length) {
            setHoverIndex(idx);
          }
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg width="100%" height={dimensions.height} className="overflow-visible">
          {/* Horizontal gridlines and price labels */}
          {priceLabels.map((price, idx) => {
            const y = getY(price);
            return (
              <g key={idx}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={chartWidth + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Time axis marks (every 5 candles) */}
          {displayCandles.map((c, idx) => {
            if (idx % 6 !== 0) return null;
            const x = getX(idx);
            return (
              <g key={`time-${idx}`}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartHeight}
                  stroke="#0f172a"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={chartHeight + 22}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {c.time}
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {displayCandles.map((c, idx) => {
            const x = getX(idx);
            const isGreen = c.close >= c.open;
            const candleColor = isGreen ? '#10b981' : '#f43f5e';
            const bodyTop = getY(Math.max(c.open, c.close));
            const bodyBottom = getY(Math.min(c.open, c.close));
            const bodyHeight = Math.max(2, bodyBottom - bodyTop);
            const highY = getY(c.high);
            const lowY = getY(c.low);

            return (
              <g key={`candle-${idx}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />
                {/* Body */}
                <rect
                  x={x - candleBodyWidth / 2}
                  y={bodyTop}
                  width={candleBodyWidth}
                  height={bodyHeight}
                  fill={isGreen ? '#059669' : '#e11d48'}
                  stroke={candleColor}
                  strokeWidth="1"
                  rx="1"
                />

                {/* Bullish Liquidity Sweep Marker */}
                {visibleOverlays.sweeps && c.bullSweep && (
                  <g>
                    <circle cx={x} cy={lowY + 10} r="4" fill="#10b981" />
                    <text
                      x={x}
                      y={lowY + 22}
                      fill="#34d399"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      ▲SWEEP
                    </text>
                  </g>
                )}

                {/* Bearish Liquidity Sweep Marker */}
                {visibleOverlays.sweeps && c.bearSweep && (
                  <g>
                    <circle cx={x} cy={highY - 10} r="4" fill="#f43f5e" />
                    <text
                      x={x}
                      y={highY - 16}
                      fill="#fb7185"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      ▼SWEEP
                    </text>
                  </g>
                )}

                {/* Buy / Sell Signal Labels */}
                {c.signal === 'BUY' && (
                  <g>
                    <polygon
                      points={`${x},${lowY + 26} ${x - 6},${lowY + 36} ${x + 6},${lowY + 36}`}
                      fill="#10b981"
                    />
                    <rect
                      x={x - 22}
                      y={lowY + 38}
                      width="44"
                      height="16"
                      rx="3"
                      fill="#064e3b"
                      stroke="#10b981"
                    />
                    <text
                      x={x}
                      y={lowY + 50}
                      fill="#a7f3d0"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      BUY 2R
                    </text>
                  </g>
                )}

                {c.signal === 'SELL' && (
                  <g>
                    <polygon
                      points={`${x},${highY - 26} ${x - 6},${highY - 36} ${x + 6},${highY - 36}`}
                      fill="#f43f5e"
                    />
                    <rect
                      x={x - 24}
                      y={highY - 54}
                      width="48"
                      height="16"
                      rx="3"
                      fill="#881337"
                      stroke="#f43f5e"
                    />
                    <text
                      x={x}
                      y={highY - 42}
                      fill="#fecdd3"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      SELL 2R
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Indicator Lines */}
          {visibleOverlays.ema9 && ema9Path && (
            <path d={ema9Path} fill="none" stroke="#22d3ee" strokeWidth="1.8" />
          )}

          {visibleOverlays.ema21 && ema21Path && (
            <path d={ema21Path} fill="none" stroke="#fb923c" strokeWidth="1.8" />
          )}

          {visibleOverlays.ema200 && ema200Path && (
            <path d={ema200Path} fill="none" stroke="#a855f7" strokeWidth="2.2" />
          )}

          {visibleOverlays.vwap && vwapPath && (
            <path
              d={vwapPath}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.0"
              strokeDasharray="4 2"
            />
          )}

          {/* Supertrend Band Line */}
          {visibleOverlays.supertrend && (
            <g>
              {displayCandles.map((c, idx) => {
                if (idx === 0) return null;
                const prev = displayCandles[idx - 1];
                const x1 = getX(idx - 1);
                const y1 = getY(prev.supertrend);
                const x2 = getX(idx);
                const y2 = getY(c.supertrend);
                const isBull = c.supertrendDir === 1;
                return (
                  <line
                    key={`st-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isBull ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          )}

          {/* Crosshair when hovering */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1="0"
                x2={getX(hoverIndex)}
                y2={chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1="0"
                y1={getY(displayCandles[hoverIndex].close)}
                x2={chartWidth}
                y2={getY(displayCandles[hoverIndex].close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>

        {/* Live Candle Indicator in right gutter */}
        <div
          className="absolute right-0 top-3 px-2 py-1 bg-amber-500 text-slate-950 font-bold font-mono text-[10px] rounded-l shadow"
        >
          ${displayCandles[displayCandles.length - 1]?.close.toFixed(2)}
        </div>
      </div>
    </div>
  );
};
