import React, { useState } from 'react';
import {
  Send,
  Bell,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Heart,
  X,
  ExternalLink,
  Loader2,
  Globe,
  Radio,
} from 'lucide-react';
import { TelegramConfig } from '../types';
import { api, TelegramAlertResponse, TelegramVerifyResponse } from '../utils/api';

interface TelegramTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TelegramConfig;
  onSaveConfig: (cfg: TelegramConfig) => void;
  currentBalance: number;
  equity: number;
}

export const TelegramTesterModal: React.FC<TelegramTesterModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  currentBalance,
  equity,
}) => {
  const [token, setToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [enabled, setEnabled] = useState(config.enabled);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedBot, setVerifiedBot] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<TelegramAlertResponse | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      botToken: token,
      chatId: chatId,
      enabled: enabled,
    });
    setStatusType('success');
    setStatusMessage('Telegram API credentials & settings saved!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleVerifyToken = async () => {
    if (!token.trim()) {
      setStatusType('error');
      setStatusMessage('Please enter a TELEGRAM_BOT_TOKEN first.');
      return;
    }

    setIsVerifying(true);
    setStatusMessage(null);
    try {
      const res: TelegramVerifyResponse = await api.verifyTelegram(token);
      if (res.ok && res.bot) {
        setVerifiedBot(`@${res.bot.username} (${res.bot.first_name})`);
        setStatusType('success');
        setStatusMessage(`Telegram API Verified: Connected to bot @${res.bot.username} (ID: ${res.bot.id})`);
      } else {
        setVerifiedBot(null);
        setStatusType('error');
        setStatusMessage(res.error || 'Telegram API verification failed. Please check your token.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`Verification error: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerAlert = async (type: 'OPEN_TRADE' | 'TRAIL_UPDATE' | 'CLOSE_TRADE' | 'HEARTBEAT') => {
    setIsSending(type);
    setStatusMessage(null);

    const payload = {
      type,
      botToken: token,
      chatId: chatId,
      symbol: 'XAUUSD',
      action: 'BUY' as const,
      entry: 2652.5,
      sl: 2648.75,
      tp: 2660.0,
      lot: 0.25,
      pnl: 187.5,
      pips: 75,
      reason: '2R Target Reached',
    };

    try {
      const res = await api.sendTelegramAlert(payload);
      setLastResponse(res);

      if (res.deliveredToTelegram) {
        setStatusType('success');
        setStatusMessage(`Message delivered live to Telegram Chat ID ${chatId}! (Message ID: ${res.messageId})`);
      } else if (res.ok) {
        setStatusType('info');
        setStatusMessage('Rendered HTML signal alert in preview stream. (Connect bot token & chat ID to transmit to your mobile Telegram)');
      } else {
        setStatusType('error');
        setStatusMessage(res.error || 'Failed to dispatch alert via Telegram API.');
      }
    } catch (err: any) {
      setStatusType('error');
      setStatusMessage(`Dispatch failed: ${err.message}`);
    } finally {
      setIsSending(null);
    }
  };

  const nowTime = new Date().toLocaleTimeString();

  return (
    <div id="telegram-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Telegram Bot API Connector & Live Dispatcher
                <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-medium">
                  telegram_bot.py API
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct integration with Telegram Bot API (<code className="text-sky-400">https://api.telegram.org</code>) for real-time mobile trade signals.
              </p>
            </div>
          </div>
          <button
            id="close-telegram-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              statusType === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : statusType === 'error'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                : 'bg-sky-500/15 border border-sky-500/30 text-sky-300'
            }`}
          >
            {statusType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : statusType === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <Radio className="w-4 h-4 shrink-0 text-sky-400 animate-pulse" />
            )}
            <span className="flex-1 font-medium">{statusMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Credentials Form */}
          <form onSubmit={handleSave} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200">Telegram Bot API Credentials</span>
                {verifiedBot && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    Verified: {verifiedBot}
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500"
                />
                Auto-Dispatch Signals
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-400 font-medium">TELEGRAM_BOT_TOKEN</label>
                  <button
                    type="button"
                    onClick={handleVerifyToken}
                    disabled={isVerifying || !token}
                    className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Test Token Connection
                  </button>
                </div>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 7123456789:AAHfkj_example_token_here"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">TELEGRAM_CHAT_ID (User ID or Channel @channelname)</label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="e.g. 987654321 or @MyForexChannel"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs focus:outline-none focus:border-sky-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">@BotFather</a> to get your API token.
              </span>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition cursor-pointer"
              >
                Save Credentials
              </button>
            </div>
          </form>

          {/* Alert Templates from Python bot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">Stock Learners HTML Notification Templates</span>
                <p className="text-[11px] text-slate-400">Click &quot;Send Live to Telegram&quot; to test real delivery.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Template 1: Trade Opened */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold font-mono">🟢 NEW TRADE OPENED</span>
                  <button
                    onClick={() => triggerAlert('OPEN_TRADE')}
                    disabled={isSending === 'OPEN_TRADE'}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSending === 'OPEN_TRADE' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Send Live
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-0.5 border-t border-slate-800 pt-2">
                  <div><strong>Symbol:</strong> XAUUSD</div>
                  <div><strong>Action:</strong> BUY</div>
                  <div><strong>Entry:</strong> 2652.50</div>
                  <div><strong>Stop Loss:</strong> 2648.75</div>
                  <div><strong>Take Profit:</strong> 2660.00</div>
                  <div><strong>Lot Size:</strong> 0.25 lots</div>
                  <div><strong>Time:</strong> {nowTime}</div>
                </div>
              </div>

              {/* Template 2: Trailing Stop Updated */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-bold font-mono">📈 TRAILING STOP UPDATED</span>
                  <button
                    onClick={() => triggerAlert('TRAIL_UPDATE')}
                    disabled={isSending === 'TRAIL_UPDATE'}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSending === 'TRAIL_UPDATE' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Send Live
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-0.5 border-t border-slate-800 pt-2">
                  <div><strong>Symbol:</strong> XAUUSD</div>
                  <div><strong>Old SL:</strong> 2648.75</div>
                  <div><strong>New SL:</strong> 2654.50 (Locked in profit)</div>
                  <div><strong>Current Price:</strong> 2656.80</div>
                  <div><strong>Locked Profit:</strong> +20.0 pips</div>
                  <div><strong>Time:</strong> {nowTime}</div>
                </div>
              </div>

              {/* Template 3: Trade Closed */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold font-mono">💰 TRADE CLOSED (TARGET)</span>
                  <button
                    onClick={() => triggerAlert('CLOSE_TRADE')}
                    disabled={isSending === 'CLOSE_TRADE'}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSending === 'CLOSE_TRADE' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Send Live
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-0.5 border-t border-slate-800 pt-2">
                  <div><strong>Symbol:</strong> XAUUSD</div>
                  <div><strong>Type:</strong> LONG</div>
                  <div><strong>Entry:</strong> 2652.50 | <strong>Exit:</strong> 2660.00</div>
                  <div><strong>Reason:</strong> 2R Target Reached</div>
                  <div><strong>P&L:</strong> <strong className="text-emerald-400">+$187.50</strong></div>
                  <div><strong>Pips:</strong> 75 pips profit</div>
                  <div><strong>Time:</strong> {nowTime}</div>
                </div>
              </div>

              {/* Template 4: Heartbeat */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-purple-400 font-bold font-mono">💓 BOT STATUS HEARTBEAT</span>
                  <button
                    onClick={() => triggerAlert('HEARTBEAT')}
                    disabled={isSending === 'HEARTBEAT'}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSending === 'HEARTBEAT' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Send Live
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-0.5 border-t border-slate-800 pt-2">
                  <div><strong>Open Trades:</strong> 1</div>
                  <div><strong>Balance:</strong> ${currentBalance.toFixed(2)}</div>
                  <div><strong>Equity:</strong> ${equity.toFixed(2)}</div>
                  <div><strong>Time:</strong> {nowTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Powered by Telegram HTTP API endpoint: <code className="text-slate-300">/sendMessage</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
