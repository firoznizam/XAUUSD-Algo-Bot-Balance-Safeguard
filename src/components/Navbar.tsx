import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  Download,
  Send,
  SlidersHorizontal,
  Activity,
  Clock,
  CircleDollarSign,
  Cpu,
  Server,
} from 'lucide-react';
import { Mt5Config } from '../types';

interface NavbarProps {
  currentPrice: number;
  bidPrice: number;
  askPrice: number;
  softwareBalance: number;
  equity: number;
  openTradesCount: number;
  mt5Config: Mt5Config;
  isSessionActive: boolean;
  onOpenVault: () => void;
  onOpenCodeModal: () => void;
  onOpenTelegramModal: () => void;
  onOpenConfigModal: () => void;
  onOpenApiHub: () => void;
  isAutoTrading: boolean;
  onToggleAutoTrading: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPrice,
  bidPrice,
  askPrice,
  softwareBalance,
  equity,
  openTradesCount,
  mt5Config,
  isSessionActive,
  onOpenVault,
  onOpenCodeModal,
  onOpenTelegramModal,
  onOpenConfigModal,
  onOpenApiHub,
  isAutoTrading,
  onToggleAutoTrading,
}) => {
  const spread = Math.max(0.01, Number((askPrice - bidPrice).toFixed(2)));

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Algorithm Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-100 tracking-tight flex items-center gap-1.5">
                XAUUSD Stock Learners Bot
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold font-mono">
                Algo v2.4 (MT5)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Liquidity Sweep + EMA + Supertrend + VWAP</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-amber-400/90">M5 Gold</span>
            </div>
          </div>
        </div>

        {/* Center: Live Gold Ticker & Market Session */}
        <div className="hidden md:flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-1.5 rounded-xl">
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">XAU/USD:</span>
            <span className="text-sm font-bold font-mono text-amber-300">
              ${currentPrice.toFixed(2)}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Bid / Ask */}
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span>Bid: <strong className="text-slate-200">{bidPrice.toFixed(2)}</strong></span>
            <span>Ask: <strong className="text-slate-200">{askPrice.toFixed(2)}</strong></span>
            <span className="text-slate-500">Spread: {spread.toFixed(2)}</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Session Indicator */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                isSessionActive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSessionActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              {isSessionActive ? 'London+NY Active' : 'Session Paused'}
            </span>
          </div>
        </div>

        {/* Right: Balance Safeguard, Actions & MT5 Status */}
        <div className="flex items-center gap-2.5">
          {/* Software Balance Quick Badge & Backup trigger */}
          <button
            id="open-vault-navbar-btn"
            onClick={onOpenVault}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 transition cursor-pointer text-left group"
            title="Click to tell balance, backup, or restore"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition">
              <CircleDollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                <span>Software Balance</span>
                <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold">
                  Backup
                </span>
              </div>
              <div className="text-xs font-bold font-mono text-slate-100">
                ${softwareBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </button>

          {/* Auto-Pilot Bot Switch */}
          <button
            id="navbar-autopilot-btn"
            onClick={onToggleAutoTrading}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isAutoTrading
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Auto-Pilot: Automatically executes confirmed 6-rule confluence signals via MT5 & Telegram"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAutoTrading ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="hidden sm:inline">Bot:</span>
            <span>{isAutoTrading ? 'AUTO-PILOT ON' : 'PAUSED'}</span>
          </button>

          {/* Code Download Button */}
          <button
            id="open-code-modal-btn"
            onClick={onOpenCodeModal}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5"
            title="View & Download Complete Bot Code (Python / MT5)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export Bot Code</span>
          </button>

          {/* Telegram Preview */}
          <button
            id="open-telegram-modal-btn"
            onClick={onOpenTelegramModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
            title="Telegram Alert Configuration & Simulator"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
          </button>

          {/* API Hub Button */}
          <button
            id="open-api-hub-btn"
            onClick={onOpenApiHub}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
            title="API Integration Hub (Telegram, MT5 Gateway, Market Data, Gemini AI)"
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">APIs</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Settings / Config */}
          <button
            id="open-config-modal-btn"
            onClick={onOpenConfigModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
            title="Bot Parameters & Indicators"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
          </button>

          {/* MT5 Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>MT5: ICMarkets</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>
    </header>
  );
};
