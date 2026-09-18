import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Play,
  Pause,
  Zap,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  Send,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { BotLogEntry } from '../types';

interface BotEngineConsoleProps {
  logs: BotLogEntry[];
  isAutoTrading: boolean;
  onToggleAutoTrading: () => void;
  onClearLogs: () => void;
  onForceSignal: (type: 'BUY' | 'SELL') => void;
  openTradesCount: number;
  currentSymbol: string;
  timeframe: string;
}

export const BotEngineConsole: React.FC<BotEngineConsoleProps> = ({
  logs,
  isAutoTrading,
  onToggleAutoTrading,
  onClearLogs,
  onForceSignal,
  openTradesCount,
  currentSymbol,
  timeframe,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isExpanded) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const copyAllLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: BotLogEntry['level']) => {
    switch (level) {
      case 'SIGNAL':
        return 'text-amber-400 font-bold';
      case 'TRADE':
        return 'text-emerald-400 font-bold';
      case 'TRAIL':
        return 'text-cyan-400 font-semibold';
      case 'WARN':
        return 'text-rose-400 font-semibold';
      case 'SUCCESS':
        return 'text-emerald-300';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div
      id="bot-engine-console"
      className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all"
    >
      {/* Console Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono text-slate-100">
                  Stock Learners Bot Engine (main.py Daemon)
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1.5 ${
                    isAutoTrading
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAutoTrading ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  {isAutoTrading ? 'AUTO-PILOT ACTIVE' : 'MANUAL / STANDBY'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentSymbol} • {timeframe} • Open Trades: {openTradesCount}/1 • Trailing: 20/10 Pips
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Auto-Pilot Toggle */}
          <button
            id="bot-toggle-autopilot-btn"
            onClick={onToggleAutoTrading}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md ${
              isAutoTrading
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            title="Toggle autonomous trade execution on verified confluence"
          >
            {isAutoTrading ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isAutoTrading ? 'Pause Auto-Pilot' : 'Activate Auto-Pilot'}</span>
          </button>

          {/* Force Signal Demo Triggers */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs font-mono">
            <button
              onClick={() => onForceSignal('BUY')}
              className="px-2 py-1 rounded-lg text-[11px] text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer flex items-center gap-1"
              title="Inject Bullish Liquidity Sweep & EMA/VWAP confluence"
            >
              <Zap className="w-3 h-3" />
              <span>Force BUY</span>
            </button>
            <div className="w-px h-3.5 bg-slate-800" />
            <button
              onClick={() => onForceSignal('SELL')}
              className="px-2 py-1 rounded-lg text-[11px] text-rose-400 hover:bg-rose-500/10 transition cursor-pointer flex items-center gap-1"
              title="Inject Bearish Liquidity Sweep & EMA/VWAP rejection"
            >
              <Zap className="w-3 h-3" />
              <span>Force SELL</span>
            </button>
          </div>

          {/* Copy logs */}
          <button
            onClick={copyAllLogs}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title="Copy terminal logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear logs */}
          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition cursor-pointer"
            title="Clear console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Collapse / Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {isExpanded && (
        <div className="p-4 bg-slate-950 font-mono text-xs max-h-64 overflow-y-auto space-y-1.5 select-text border-t border-slate-800/80">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-2">
              Waiting for bot engine activity... Activate Auto-Pilot or step candles to begin stream.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
                <span className={`shrink-0 select-none ${getLevelColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className={getLevelColor(log.level)}>{log.message}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
};
