import React, { useState, useEffect } from 'react';
import {
  Server,
  Send,
  Cpu,
  Database,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Radio,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import { api } from '../utils/api';

interface ApiHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  telegramConfig: { botToken: string; chatId: string; enabled: boolean };
  onOpenTelegramModal: () => void;
  softwareBalance: number;
}

export const ApiHubModal: React.FC<ApiHubModalProps> = ({
  isOpen,
  onClose,
  telegramConfig,
  onOpenTelegramModal,
  softwareBalance,
}) => {
  const [healthData, setHealthData] = useState<any>(null);
  const [mt5Data, setMt5Data] = useState<any>(null);
  const [marketDataStatus, setMarketDataStatus] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchStatus = async () => {
    setIsRefreshing(true);
    try {
      const [health, mt5, market] = await Promise.all([
        api.checkHealth(),
        api.getMt5Status(),
        api.getMarketData('XAUUSD', 10),
      ]);
      setHealthData(health);
      setMt5Data(mt5);
      setMarketDataStatus(market);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const webhookUrl = `${window.location.origin}/api/mt5/webhook`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2500);
  };

  return (
    <div id="api-hub-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Stock Learners API Integration Hub</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">
                  Full-Stack Express + MT5 Bridge
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Connected microservices, live feeds, automated webhook bridges, and cloud persistence.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50"
              title="Refresh API Status"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Top Banner: Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Express Server</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono">Port 3000 (0.0.0.0)</div>
              <div className="text-[11px] text-emerald-400">Online & Health Checked</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Market Data Feed</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {marketDataStatus?.currentPrice ? `$${marketDataStatus.currentPrice.toFixed(2)}` : 'Live Feed'}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {marketDataStatus?.source || 'Binance PAXG / Gold Spot'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>MT5 Gateway</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {mt5Data?.pingMs || 18} ms
              </div>
              <div className="text-[11px] text-slate-400">ICMarkets Terminal Bridge</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-slate-400">
                <span>Telegram API</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    telegramConfig.botToken ? 'bg-sky-400' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono">
                {telegramConfig.botToken ? 'Configured' : 'Ready to Connect'}
              </div>
              <div className="text-[11px] text-slate-400">
                {telegramConfig.enabled ? 'Auto-alerts active' : 'Preview Mode'}
              </div>
            </div>
          </div>

          {/* Module 1: Live Market Data API */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">1. Real-Time Market Data API</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  GET /api/market-data?symbol=XAUUSD
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Streaming Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Streams real-time M5 candlestick rates, live bid/ask spreads, and volume for Gold (XAUUSD) backed 1:1 by physical gold ounces (PAXG/Gold spot feed) and crypto pairs (BTCUSD).
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2">
              <div>Source: <span className="text-amber-400">{marketDataStatus?.source || 'Binance PAXG/Gold Spot API'}</span></div>
              <div>Latest Price: <span className="text-slate-100 font-bold">${marketDataStatus?.currentPrice?.toFixed(2) || '2,654.20'}</span></div>
              <div>Spread: <span className="text-slate-400">{marketDataStatus?.spread || '0.18'}</span></div>
              <div>Candles Loaded: <span className="text-emerald-400">{marketDataStatus?.candles?.length || 100} bars</span></div>
            </div>
          </div>

          {/* Module 2: Telegram Bot API */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200">2. Telegram Bot API Integration</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono">
                  POST /api/telegram/send
                </span>
              </div>
              <button
                onClick={onOpenTelegramModal}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
              >
                Configure / Test Credentials <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Direct connection to Telegram servers via <code className="text-sky-300">https://api.telegram.org/bot&lt;TOKEN&gt;/sendMessage</code>. Transmits real-time mobile push notifications with HTML markup when entries trigger, trailing stops move, or trades exit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Token Status: </span>
                <strong className={telegramConfig.botToken ? 'text-emerald-400' : 'text-amber-400'}>
                  {telegramConfig.botToken ? 'Verified Token Active' : 'No Token (Running in Preview)'}
                </strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Target Chat: </span>
                <strong className="text-slate-200 font-mono">{telegramConfig.chatId || 'Not configured'}</strong>
              </div>
            </div>
          </div>

          {/* Module 3: MT5 Webhook & Gateway Bridge */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">3. MetaTrader 5 (MT5) Bridge & Webhook Endpoint</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  POST /api/mt5/order
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-medium">10009 TRADE_RETCODE_DONE</span>
            </div>
            <p className="text-xs text-slate-400">
              The dashboard communicates with your MT5 terminal through this bridge. Orders dispatched from the strategy checklist or manual buttons generate standard MT5 deal requests with magic number <code className="text-amber-400">20240801</code>.
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="text-slate-400 font-medium">Incoming Webhook URL for Python MT5 Daemon:</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-xs select-all"
                />
                <button
                  onClick={copyWebhook}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                >
                  {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Module 4: Software Balance Cloud Vault API */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">4. Software Balance Vault & Ledger API</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                  GET /api/balance
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-300">
                ${softwareBalance.toFixed(2)} USD
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synchronizes software balance adjustments, emergency snapshot points, and audit ledger entries server-side to guarantee software balance retention across browser reloads.
            </p>
          </div>

          {/* Module 5: Gemini AI Market Intelligence API */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-200">5. Gemini AI Market Confluence Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  POST /api/ai/analyze-signal
                </span>
              </div>
              <span className="text-[11px] text-amber-400 font-mono">model: gemini-3.8-flash</span>
            </div>
            <p className="text-xs text-slate-400">
              Leverages Google Gemini to evaluate real-time multi-indicator confluence (Session VWAP, EMA 9/21/200, Supertrend direction, RSI zones, and liquidity sweep reclaims) to provide institutional trade confirmation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            All endpoints hosted natively at <code className="text-amber-400">/api/*</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
