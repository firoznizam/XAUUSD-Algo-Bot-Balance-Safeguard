import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  XCircle,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  History,
} from 'lucide-react';
import { TradePosition } from '../types';

interface PositionManagerProps {
  openPositions: TradePosition[];
  closedTrades: TradePosition[];
  onClosePosition: (id: string, reason?: TradePosition['closeReason']) => void;
  onCloseAllPositions: () => void;
  onSimulateTrailingAdvance: (id: string) => void;
}

export const PositionManager: React.FC<PositionManagerProps> = ({
  openPositions,
  closedTrades,
  onClosePosition,
  onCloseAllPositions,
  onSimulateTrailingAdvance,
}) => {
  const totalFloatingPnl = openPositions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div id="position-manager-section" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">MT5 Position & Execution Manager</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono border border-slate-700">
              Auto Trailing Stop
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time trade telemetry with dynamic trailing stops, profit targets, and emergency override.
          </p>
        </div>

        {/* Actions & Floating Summary */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Total Floating PnL</span>
            <span
              className={`text-sm font-bold font-mono ${
                totalFloatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalFloatingPnl >= 0 ? `+` : ''}${totalFloatingPnl.toFixed(2)}
            </span>
          </div>

          {openPositions.length > 0 && (
            <button
              id="emergency-close-all-btn"
              onClick={onCloseAllPositions}
              className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Close all open MT5 positions immediately"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              Close All Positions
            </button>
          )}
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Active Open Trades ({openPositions.length})</span>
          <span className="text-[11px] text-slate-500">Max limit: 1 open trade</span>
        </div>

        {openPositions.length === 0 ? (
          <div className="p-6 text-center border border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
            No open trades currently active. Waiting for Stock Learners confluence trigger on next 5-min candle.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Ticket</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Lots</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3">Current</th>
                  <th className="py-2.5 px-3">Stop Loss</th>
                  <th className="py-2.5 px-3">Take Profit</th>
                  <th className="py-2.5 px-3">Trailing SL</th>
                  <th className="py-2.5 px-3 text-right">Profit ($)</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {openPositions.map((pos) => {
                  const isBuy = pos.type === 'BUY';
                  return (
                    <tr key={pos.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-3 text-slate-400">#{pos.ticket}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isBuy
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {pos.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-bold">{pos.lot}</td>
                      <td className="py-3 px-3 text-slate-200">${pos.entryPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-amber-300 font-bold">${pos.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-3 text-rose-400 font-semibold">${pos.sl.toFixed(2)}</td>
                      <td className="py-3 px-3 text-emerald-400 font-semibold">${pos.tp.toFixed(2)}</td>
                      <td className="py-3 px-3">
                        {pos.trailingActivated ? (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] border border-amber-500/30 font-sans font-medium flex items-center gap-1 w-max">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            Locked In ({pos.pips >= 0 ? '+' : ''}{pos.pips.toFixed(0)} pips)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-sans">
                            Arming at +20 pips
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-sm font-bold ${
                            pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {pos.pnl >= 0 ? `+` : ''}${pos.pnl.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          {/* Test Trailing SL Advance button */}
                          <button
                            id={`trail-advance-btn-${pos.id}`}
                            onClick={() => onSimulateTrailingAdvance(pos.id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] border border-slate-700 transition"
                            title="Simulate price spike and trail stop loss"
                          >
                            +10 Pips Trail
                          </button>
                          <button
                            id={`close-trade-btn-${pos.id}`}
                            onClick={() => onClosePosition(pos.id, 'MANUAL')}
                            className="px-2 py-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[11px] border border-rose-500/40 transition"
                          >
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Closed Trades Log */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Recent Closed Trades Log (CSV Output)
          </span>
          <span className="text-[11px] text-slate-500">Auto-logged to trade_log.csv</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-48 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 font-mono sticky top-0">
              <tr>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Symbol</th>
                <th className="py-2 px-3">Signal</th>
                <th className="py-2 px-3">Entry</th>
                <th className="py-2 px-3">Exit</th>
                <th className="py-2 px-3">Result</th>
                <th className="py-2 px-3 text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
              {closedTrades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30">
                  <td className="py-2 px-3 text-slate-400">{t.closeTime || t.openTime}</td>
                  <td className="py-2 px-3 text-slate-300">{t.symbol}</td>
                  <td className="py-2 px-3">
                    <span className={t.type === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-300">${t.entryPrice.toFixed(2)}</td>
                  <td className="py-2 px-3 text-slate-300">
                    ${(t.closePrice || t.currentPrice).toFixed(2)}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.closeReason === 'TP'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : t.closeReason === 'TRAILING_SL'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {t.closeReason || 'CLOSED'}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      t.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {t.pnl >= 0 ? `+` : ''}${t.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
