import { Candle, CalculatedCandle, StrategyConfig, StrategyChecklistResult, BalanceSnapshot, BalanceLedgerEntry, Mt5Config } from '../types';

export interface MarketDataResponse {
  ok: boolean;
  source: string;
  symbol: string;
  currentPrice: number;
  bid: number;
  ask: number;
  spread: number;
  candles: Candle[];
}

export interface TelegramVerifyResponse {
  ok: boolean;
  bot?: {
    id: number;
    first_name: string;
    username: string;
  };
  error?: string;
  message?: string;
}

export interface TelegramAlertResponse {
  ok: boolean;
  deliveredToTelegram: boolean;
  messageId?: number;
  previewText?: string;
  error?: string;
  description?: string;
  note?: string;
}

export interface AiAnalysisResponse {
  ok: boolean;
  fallback?: boolean;
  analysis: {
    confluenceScore: number;
    verdict: 'STRONG_BUY' | 'SPECULATIVE_BUY' | 'NEUTRAL_WAIT' | 'SPECULATIVE_SELL' | 'STRONG_SELL';
    reasoning: string;
    keySupport: number;
    keyResistance: number;
    riskRecommendation: string;
  };
}

export const api = {
  // Check system health & available APIs
  async checkHealth() {
    try {
      const res = await fetch('/api/health');
      return await res.json();
    } catch (e: any) {
      return { status: 'offline', error: e.message };
    }
  },

  // Fetch real-time market data & candles
  async getMarketData(symbol: string = 'XAUUSD', limit: number = 100): Promise<MarketDataResponse | null> {
    try {
      const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('Market data API unreachable, using local fallback:', err);
      return null;
    }
  },

  // Verify Telegram Bot Token
  async verifyTelegram(botToken: string): Promise<TelegramVerifyResponse> {
    try {
      const res = await fetch('/api/telegram/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken }),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  // Send Trade Alert to Telegram
  async sendTelegramAlert(payload: {
    type: 'OPEN_TRADE' | 'CLOSE_TRADE' | 'TRAIL_UPDATE' | 'HEARTBEAT';
    symbol?: string;
    action?: 'BUY' | 'SELL';
    entry?: number;
    sl?: number;
    tp?: number;
    lot?: number;
    pnl?: number;
    pips?: number;
    reason?: string;
    botToken?: string;
    chatId?: string;
  }): Promise<TelegramAlertResponse> {
    try {
      const res = await fetch('/api/telegram/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, deliveredToTelegram: false, error: err.message };
    }
  },

  // MT5 Bridge Status
  async getMt5Status() {
    try {
      const res = await fetch('/api/mt5/status');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Execute Order via MT5 Bridge
  async executeMt5Order(order: {
    symbol: string;
    signal: 'BUY' | 'SELL';
    volume: number;
    sl: number;
    tp: number;
    price: number;
  }) {
    try {
      const res = await fetch('/api/mt5/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  // Close All MT5 Positions
  async closeAllPositions() {
    try {
      const res = await fetch('/api/mt5/close-all', { method: 'POST' });
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  async closeAllMt5Positions() {
    return this.closeAllPositions();
  },

  async closeMt5Position(ticket: number) {
    try {
      const res = await fetch('/api/mt5/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket }),
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  },

  // Server-side Balance & Vault synchronization
  async getBalanceStore() {
    try {
      const res = await fetch('/api/balance');
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async updateBalance(newBalance: number, reason: string) {
    try {
      const res = await fetch('/api/balance/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newBalance, reason }),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async saveSnapshot(snapshot: BalanceSnapshot) {
    try {
      const res = await fetch('/api/balance/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async restoreSnapshot(snapshotId: string) {
    try {
      const res = await fetch('/api/balance/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId }),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async importBalanceStore(data: {
    softwareBalance?: number;
    equity?: number;
    snapshots?: BalanceSnapshot[];
    ledger?: BalanceLedgerEntry[];
  }) {
    try {
      const res = await fetch('/api/balance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  // Gemini AI Analysis for current candle & strategy checklist
  async analyzeWithAi(payload: {
    candle: CalculatedCandle;
    checklist: StrategyChecklistResult;
    config: StrategyConfig;
    softwareBalance: number;
  }): Promise<AiAnalysisResponse> {
    try {
      const res = await fetch('/api/ai/analyze-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return {
        ok: false,
        fallback: true,
        analysis: {
          confluenceScore: 50,
          verdict: 'NEUTRAL_WAIT',
          reasoning: 'Waiting for market signal confirmation.',
          keySupport: 2650.0,
          keyResistance: 2660.0,
          riskRecommendation: 'Maintain standard 1% risk allocation.',
        },
      };
    }
  },

  // Bot Daemon state & logs
  async getBotState() {
    try {
      const res = await fetch('/api/bot/state');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async setBotState(isAutoTrading: boolean) {
    try {
      const res = await fetch('/api/bot/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAutoTrading }),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async getBotLogs() {
    try {
      const res = await fetch('/api/bot/logs');
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  async sendBotLog(level: string, message: string) {
    try {
      const res = await fetch('/api/bot/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, message }),
      });
      return await res.json();
    } catch (err) {
      return null;
    }
  },
};
