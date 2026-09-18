import React, { useState } from 'react';
import { SlidersHorizontal, Check, RotateCcw, X, Info } from 'lucide-react';
import { StrategyConfig } from '../types';
import { DEFAULT_CONFIG } from '../data/defaultData';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StrategyConfig;
  onSaveConfig: (cfg: StrategyConfig) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<StrategyConfig>({ ...config });
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 1000);
  };

  const handleResetDefaults = () => {
    setFormData({ ...DEFAULT_CONFIG });
  };

  return (
    <div id="config-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Algorithm & Parameter Tuning
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono border border-slate-700">
                  config.py
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Adjust indicator lengths, trailing stop triggers, and session timings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Indicators */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Moving Averages & Supertrend
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">EMA Fast</label>
                <input
                  type="number"
                  value={formData.emaFast}
                  onChange={(e) => setFormData({ ...formData, emaFast: parseInt(e.target.value) || 9 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">EMA Mid</label>
                <input
                  type="number"
                  value={formData.emaMid}
                  onChange={(e) => setFormData({ ...formData, emaMid: parseInt(e.target.value) || 21 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">EMA Slow (Trend)</label>
                <input
                  type="number"
                  value={formData.emaSlow}
                  onChange={(e) => setFormData({ ...formData, emaSlow: parseInt(e.target.value) || 200 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Supertrend Mult</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.stMultiplier}
                  onChange={(e) => setFormData({ ...formData, stMultiplier: parseFloat(e.target.value) || 3.0 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: RSI & Liquidity Sweep */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              RSI & Liquidity Sweep Filters
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">RSI Period</label>
                <input
                  type="number"
                  value={formData.rsiPeriod}
                  onChange={(e) => setFormData({ ...formData, rsiPeriod: parseInt(e.target.value) || 14 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">RSI Long Range</label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    value={formData.rsiLongMin}
                    onChange={(e) => setFormData({ ...formData, rsiLongMin: parseInt(e.target.value) || 45 })}
                    className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={formData.rsiLongMax}
                    onChange={(e) => setFormData({ ...formData, rsiLongMax: parseInt(e.target.value) || 70 })}
                    className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">RSI Short Range</label>
                <div className="flex items-center gap-1 font-mono">
                  <input
                    type="number"
                    value={formData.rsiShortMin}
                    onChange={(e) => setFormData({ ...formData, rsiShortMin: parseInt(e.target.value) || 30 })}
                    className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={formData.rsiShortMax}
                    onChange={(e) => setFormData({ ...formData, rsiShortMax: parseInt(e.target.value) || 55 })}
                    className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Sweep Lookback</label>
                <input
                  type="number"
                  value={formData.liqLookback}
                  onChange={(e) => setFormData({ ...formData, liqLookback: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Risk & Trailing Stop */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Risk Management & Trailing Stop
            </span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Risk per Trade %</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.riskPct * 100}
                  onChange={(e) => setFormData({ ...formData, riskPct: (parseFloat(e.target.value) || 1.0) / 100 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Risk:Reward (RR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.riskReward}
                  onChange={(e) => setFormData({ ...formData, riskReward: parseFloat(e.target.value) || 2.0 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Trail Activate (Pips)</label>
                <input
                  type="number"
                  value={formData.trailActivatePips}
                  onChange={(e) => setFormData({ ...formData, trailActivatePips: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Trail Step (Pips)</label>
                <input
                  type="number"
                  value={formData.trailStepPips}
                  onChange={(e) => setFormData({ ...formData, trailStepPips: parseInt(e.target.value) || 10 })}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Trading Session Window */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
              Trading Session Filter (UTC)
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Session Start (London Open)</label>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.tradeStartHourUtc}
                    onChange={(e) => setFormData({ ...formData, tradeStartHourUtc: parseInt(e.target.value) || 7 })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                  <span className="text-slate-400">:00 UTC</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-slate-400">Session End (NY Close)</label>
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.tradeEndHourUtc}
                    onChange={(e) => setFormData({ ...formData, tradeEndHourUtc: parseInt(e.target.value) || 20 })}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100"
                  />
                  <span className="text-slate-400">:00 UTC</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to PDF Defaults
            </button>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {savedNotice ? 'Saved!' : 'Apply Parameters'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
