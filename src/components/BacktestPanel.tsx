import React, { useState } from 'react';
import {
  BarChart3,
  Play,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Award,
  Zap,
} from 'lucide-react';
import { CalculatedCandle, StrategyConfig } from '../types';

interface BacktestPanelProps {
  candles: CalculatedCandle[];
  config: StrategyConfig;
  initialCapital?: number;
}

interface BacktestResult {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  netReturnPct: number;
  finalCapital: number;
  profitFactor: number;
  maxDrawdownPct: number;
  trades: Array<{
    type: 'LONG' | 'SHORT';
    entry: number;
    exit: number;
    pnl: number;
    result: 'TARGET' | 'SL';
    time: string;
  }>;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({
  candles,
  config,
  initialCapital = 10000,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BacktestResult | null>(() => {
    return runEngine(candles, config, initialCapital);
  });

  function runEngine(
    data: CalculatedCandle[],
    cfg: StrategyConfig,
    capital: number
  ): BacktestResult {
    let currentCap = capital;
    let position: 0 | 1 | -1 = 0;
    let entryPrice = 0;
    let sl = 0;
    let target = 0;
    let wins = 0;
    let losses = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let peakCapital = capital;
    let maxDrawdown = 0;

    const trades: BacktestResult['trades'] = [];
    const slPct = 0.005; // 0.5% stop loss from PDF
    const rr = cfg.riskReward;

    for (let i = 5; i < data.length; i++) {
      const c = data[i];
      const close = c.close;

      // Check exit for active position
      if (position === 1) {
        if (close <= sl) {
          const pnl = (sl - entryPrice) * 10;
          currentCap += pnl;
          losses++;
          grossLoss += Math.abs(pnl);
          trades.push({
            type: 'LONG',
            entry: entryPrice,
            exit: sl,
            pnl,
            result: 'SL',
            time: c.time,
          });
          position = 0;
        } else if (close >= target) {
          const pnl = (target - entryPrice) * 10;
          currentCap += pnl;
          wins++;
          grossProfit += pnl;
          trades.push({
            type: 'LONG',
            entry: entryPrice,
            exit: target,
            pnl,
            result: 'TARGET',
            time: c.time,
          });
          position = 0;
        }
      } else if (position === -1) {
        if (close >= sl) {
          const pnl = (entryPrice - sl) * 10;
          currentCap += pnl;
          losses++;
          grossLoss += Math.abs(pnl);
          trades.push({
            type: 'SHORT',
            entry: entryPrice,
            exit: sl,
            pnl,
            result: 'SL',
            time: c.time,
          });
          position = 0;
        } else if (close <= target) {
          const pnl = (entryPrice - target) * 10;
          currentCap += pnl;
          wins++;
          grossProfit += pnl;
          trades.push({
            type: 'SHORT',
            entry: entryPrice,
            exit: target,
            pnl,
            result: 'TARGET',
            time: c.time,
          });
          position = 0;
        }
      }

      // Track max drawdown
      if (currentCap > peakCapital) peakCapital = currentCap;
      const dd = ((peakCapital - currentCap) / peakCapital) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;

      // Check entry if flat
      if (position === 0) {
        if (c.signal === 'BUY') {
          position = 1;
          entryPrice = close;
          sl = entryPrice * (1 - slPct);
          target = entryPrice * (1 + slPct * rr);
        } else if (c.signal === 'SELL') {
          position = -1;
          entryPrice = close;
          sl = entryPrice * (1 + slPct);
          target = entryPrice * (1 - slPct * rr);
        }
      }
    }

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalPnl = currentCap - capital;
    const netReturnPct = (totalPnl / capital) * 100;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 1.0;

    return {
      totalTrades,
      wins,
      losses,
      winRate: Number(winRate.toFixed(1)),
      totalPnl: Number(totalPnl.toFixed(2)),
      netReturnPct: Number(netReturnPct.toFixed(2)),
      finalCapital: Number(currentCap.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      maxDrawdownPct: Number(maxDrawdown.toFixed(1)),
      trades,
    };
  }

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runEngine(candles, config, initialCapital);
      setResults(res);
      setIsRunning(false);
    }, 300);
  };

  return (
    <div id="backtest-panel" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            Stock Learners Historical Backtest Engine (PDF Spec)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluates 2R Risk:Reward, 0.5% SL, and all 6 confluence rules across {candles.length} bars.
          </p>
        </div>

        <button
          id="run-backtest-btn"
          onClick={handleRunBacktest}
          disabled={isRunning}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          {isRunning ? 'Computing...' : 'Run Backtest'}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Win Rate</span>
              <span className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                {results.winRate}%
              </span>
              <span className="text-[10px] text-slate-500">
                {results.wins}W / {results.losses}L
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Total Trades</span>
              <span className="text-lg font-bold font-mono text-slate-200 mt-0.5">
                {results.totalTrades}
              </span>
              <span className="text-[10px] text-slate-500">Completed trades</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Total PnL</span>
              <span
                className={`text-lg font-bold font-mono mt-0.5 ${
                  results.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {results.totalPnl >= 0 ? '+' : ''}${results.totalPnl}
              </span>
              <span className="text-[10px] text-slate-500">Realized return</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Net Return</span>
              <span
                className={`text-lg font-bold font-mono mt-0.5 ${
                  results.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {results.netReturnPct >= 0 ? '+' : ''}{results.netReturnPct}%
              </span>
              <span className="text-[10px] text-slate-500">On software balance</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Profit Factor</span>
              <span className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                {results.profitFactor}
              </span>
              <span className="text-[10px] text-slate-500">Gross W / Gross L</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-mono">Max Drawdown</span>
              <span className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                {results.maxDrawdownPct}%
              </span>
              <span className="text-[10px] text-slate-500">Peak-to-trough</span>
            </div>
          </div>

          {/* Strategy Summary Table from PDF page 5 */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 mb-2">Stock Learners Rules Reference</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Timeframe</span>
                <span className="text-slate-200 font-mono font-semibold">5-Minute Intraday (M5)</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Entry Filters 1-3</span>
                <span className="text-slate-200 font-mono font-semibold">VWAP + EMA9/21 + EMA200</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Entry Filters 4-5</span>
                <span className="text-slate-200 font-mono font-semibold">Supertrend (10,3) + RSI</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Trigger & Target</span>
                <span className="text-amber-300 font-mono font-semibold">Liquidity Sweep + 2R TP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
