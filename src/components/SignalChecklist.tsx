import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Zap,
  HelpCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { StrategyChecklistResult, CalculatedCandle, StrategyConfig } from '../types';
import { api, AiAnalysisResponse } from '../utils/api';

interface SignalChecklistProps {
  checklist: StrategyChecklistResult;
  latestCandle: CalculatedCandle | undefined;
  config: StrategyConfig;
  calculatedLot: number;
  calculatedSl: number;
  calculatedTp: number;
  slDistanceUsd: number;
  softwareBalance: number;
  onExecuteSimulatedTrade: (type: 'BUY' | 'SELL') => void;
  isAutoTrading?: boolean;
  onForceSignal?: (type: 'BUY' | 'SELL') => void;
}

export const SignalChecklist: React.FC<SignalChecklistProps> = ({
  checklist,
  latestCandle,
  config,
  calculatedLot,
  calculatedSl,
  calculatedTp,
  slDistanceUsd,
  softwareBalance,
  onExecuteSimulatedTrade,
  isAutoTrading = true,
  onForceSignal,
}) => {
  const isBuy = checklist.finalSignal === 'BUY';
  const isSell = checklist.finalSignal === 'SELL';

  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResponse['analysis'] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiCard, setShowAiCard] = useState(false);

  const runAiConfluence = async () => {
    if (!latestCandle) return;
    setIsAnalyzing(true);
    setShowAiCard(true);
    try {
      const res = await api.analyzeWithAi({
        candle: latestCandle,
        checklist,
        config,
        softwareBalance,
      });
      if (res.analysis) {
        setAiAnalysis(res.analysis);
      }
    } catch (err) {
      console.error('AI analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="signal-checklist-card" className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Top Banner: Algorithm Verification Verdict */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">
              Stock Learners Algorithm Verification
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono border border-slate-700">
              MT5 Rule Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-confluence validator from the YouTube Bot specification.
          </p>
        </div>

        {/* Status Badge & AI Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={runAiConfluence}
            disabled={isAnalyzing}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Evaluate setup using Gemini AI model"
          >
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span>Gemini AI Confluence</span>
          </button>

          {isBuy ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs animate-pulse">
              <Zap className="w-4 h-4 text-emerald-400" />
              🟢 BUY SIGNAL CONFIRMED
            </div>
          ) : isSell ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs animate-pulse">
              <Zap className="w-4 h-4 text-rose-400" />
              🔴 SELL SIGNAL CONFIRMED
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 font-medium text-xs">
              <Clock className="w-3.5 h-3.5" />
              Scanning (Monitoring Confluences)
            </div>
          )}
        </div>
      </div>

      {/* AI Confluence Breakdown (if opened) */}
      {showAiCard && (
        <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2.5 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-100">Gemini Institutional Market Analysis</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                gemini-3.8-flash
              </span>
            </div>
            <button
              onClick={() => setShowAiCard(false)}
              className="text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            >
              Hide
            </button>
          </div>

          {isAnalyzing ? (
            <div className="py-4 flex items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Analyzing liquidity sweeps, VWAP, and EMAs via Gemini API...</span>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Verdict:</span>
                  <strong
                    className={`font-mono font-bold ${
                      aiAnalysis.verdict.includes('BUY')
                        ? 'text-emerald-400'
                        : aiAnalysis.verdict.includes('SELL')
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {aiAnalysis.verdict}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Confluence Score:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
                    {aiAnalysis.confluenceScore}/100
                  </span>
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed">{aiAnalysis.reasoning}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Key Support: </span>
                  <span className="text-emerald-400">${aiAnalysis.keySupport}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400">Key Resistance: </span>
                  <span className="text-rose-400">${aiAnalysis.keyResistance}</span>
                </div>
              </div>

              <div className="text-[11px] text-amber-400/90 pt-1">
                <strong>Risk Protocol:</strong> {aiAnalysis.riskRecommendation}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* The 7 Core Algorithmic Checklist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Rule 1: VWAP Benchmark */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {latestCandle && latestCandle.close > latestCandle.vwap ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>1. VWAP Intraday Bias</span>
              <span className="text-[10px] font-mono text-amber-400">
                ${latestCandle?.vwap.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{checklist.priceVsVwap.message}</div>
          </div>
        </div>

        {/* Rule 2: EMA 9 / 21 Cross & Alignment */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {latestCandle && latestCandle.ema9 > latestCandle.ema21 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>2. EMA 9 vs EMA 21 Alignment</span>
              <span className="text-[10px] font-mono text-cyan-400">
                {latestCandle?.ema9} / {latestCandle?.ema21}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{checklist.emaCrossover.message}</div>
          </div>
        </div>

        {/* Rule 3: Macro EMA 200 Trend */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {checklist.ema200Trend.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>3. Macro Trend (EMA 200)</span>
              <span className="text-[10px] font-mono text-purple-400">
                ${latestCandle?.ema200.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{checklist.ema200Trend.message}</div>
          </div>
        </div>

        {/* Rule 4: Supertrend (10, 3) */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {checklist.supertrend.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>4. Supertrend (10, 3)</span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  latestCandle?.supertrendDir === 1 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {latestCandle?.supertrendDir === 1 ? 'BULLISH' : 'BEARISH'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{checklist.supertrend.message}</div>
          </div>
        </div>

        {/* Rule 5: RSI Range Filter */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {checklist.rsiZone.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>5. RSI(14) Healthy Zone</span>
              <span className="text-[10px] font-mono text-sky-300">
                {latestCandle?.rsi}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{checklist.rsiZone.message}</div>
          </div>
        </div>

        {/* Rule 6: Liquidity Sweep Trigger */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            {checklist.liquiditySweep.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <HelpCircle className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>6. Liquidity Sweep (5-Bar)</span>
              <span
                className={`text-[10px] font-mono font-bold ${
                  checklist.liquiditySweep.sweep === 'BULLISH'
                    ? 'text-emerald-400'
                    : checklist.liquiditySweep.sweep === 'BEARISH'
                    ? 'text-rose-400'
                    : 'text-slate-500'
                }`}
              >
                {checklist.liquiditySweep.sweep}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">{checklist.liquiditySweep.message}</div>
          </div>
        </div>
      </div>

      {/* Session Filter Bar */}
      <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-slate-300 font-medium">Session Filter:</span>
          <span className="text-slate-400">{checklist.sessionTime.message}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
            checklist.sessionTime.allowed
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}
        >
          {checklist.sessionTime.allowed ? 'TRADE PERMITTED' : 'NO TRADING'}
        </span>
      </div>

      {/* Calculated Risk Parameters Bar & Execution */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 to-slate-900 border border-amber-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-2 font-medium">
            <span>Dynamic Risk Sizing (1% Software Balance Risk: ${(softwareBalance * 0.01).toFixed(2)})</span>
            {isAutoTrading && (
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Auto-Pilot Active
              </span>
            )}
          </div>
          <div className="text-xs text-slate-300 flex items-center gap-4 font-mono">
            <span>
              Target Lot: <strong className="text-amber-300 font-bold">{calculatedLot} lots</strong>
            </span>
            <span>•</span>
            <span>
              Stop Loss: <strong className="text-rose-400">${calculatedSl.toFixed(2)}</strong> (ATR × {config.atrMultiplierSl})
            </span>
            <span>•</span>
            <span>
              Take Profit (2R): <strong className="text-emerald-400">${calculatedTp.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons to execute via MT5 Gateway & Force Test Signals */}
        <div className="flex items-center gap-2 flex-wrap">
          {onForceSignal && (
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-0.5 text-xs font-mono mr-1">
              <button
                onClick={() => onForceSignal('BUY')}
                className="px-2 py-1 text-[11px] text-emerald-400 hover:bg-emerald-500/10 rounded transition cursor-pointer flex items-center gap-1"
                title="Force Bullish Liquidity Sweep setup"
              >
                <Zap className="w-3 h-3" />
                <span>Test BUY Setup</span>
              </button>
              <div className="w-px h-3 bg-slate-800" />
              <button
                onClick={() => onForceSignal('SELL')}
                className="px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-500/10 rounded transition cursor-pointer flex items-center gap-1"
                title="Force Bearish Liquidity Sweep setup"
              >
                <Zap className="w-3 h-3" />
                <span>Test SELL Setup</span>
              </button>
            </div>
          )}

          <button
            id="checklist-test-buy-btn"
            onClick={() => onExecuteSimulatedTrade('BUY')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Execute BUY</span>
          </button>
          <button
            id="checklist-test-sell-btn"
            onClick={() => onExecuteSimulatedTrade('SELL')}
            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/30"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Execute SELL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
