export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CalculatedCandle extends Candle {
  ema9: number;
  ema21: number;
  ema200: number;
  rsi: number;
  vwap: number;
  atr: number;
  supertrend: number;
  supertrendDir: 1 | -1; // 1 = bullish, -1 = bearish
  bullSweep: boolean;
  bearSweep: boolean;
  signal: 'BUY' | 'SELL' | null;
}

export interface TradePosition {
  id: string;
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  sl: number;
  tp: number;
  originalSl: number;
  lot: number;
  pnl: number;
  pips: number;
  openTime: string;
  status: 'OPEN' | 'CLOSED';
  closePrice?: number;
  closeTime?: string;
  closeReason?: 'TP' | 'SL' | 'TRAILING_SL' | 'MANUAL' | 'SESSION_CLOSE';
  magic: number;
  comment: string;
  trailingActivated: boolean;
}

export interface StrategyConfig {
  symbol: string;
  timeframe: string;
  bars: number;
  emaFast: number;
  emaMid: number;
  emaSlow: number;
  rsiPeriod: number;
  rsiLongMin: number;
  rsiLongMax: number;
  rsiShortMin: number;
  rsiShortMax: number;
  stPeriod: number;
  stMultiplier: number;
  liqLookback: number;
  riskPct: number;
  riskReward: number;
  atrMultiplierSl: number;
  trailEnabled: boolean;
  trailActivatePips: number;
  trailStepPips: number;
  tradeStartHourUtc: number;
  tradeEndHourUtc: number;
  maxTrades: number;
  magicNumber: number;
  tradeComment: string;
}

export interface Mt5Config {
  login: number;
  server: string;
  passwordMasked: string;
  terminalPath: string;
  isConnected: boolean;
  pingMs: number;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface BalanceSnapshot {
  id: string;
  timestamp: string;
  createdAt: number;
  title: string;
  softwareBalance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  openTradesCount: number;
  floatingPnl: number;
  realizedPnl: number;
  notes: string;
  type: 'MANUAL_BACKUP' | 'AUTO_SESSION_BACKUP' | 'MILESTONE_BACKUP' | 'PRE_TRADE_BACKUP';
}

export interface BalanceLedgerEntry {
  id: string;
  timestamp: string;
  type: 'INITIAL' | 'USER_ADJUSTMENT' | 'TRADE_PROFIT' | 'TRADE_LOSS' | 'BACKUP_RESTORE' | 'DEPOSIT_SIM';
  amount: number;
  previousBalance: number;
  newBalance: number;
  description: string;
}

export interface StrategyChecklistResult {
  priceVsVwap: { passed: boolean; message: string; value: number; benchmark: number };
  emaCrossover: { passed: boolean; message: string; ema9: number; ema21: number };
  ema200Trend: { passed: boolean; message: string; close: number; ema200: number };
  supertrend: { passed: boolean; message: string; dir: 1 | -1 };
  rsiZone: { passed: boolean; message: string; rsi: number; zone: string };
  liquiditySweep: { passed: boolean; message: string; sweep: 'BULLISH' | 'BEARISH' | 'NONE' };
  sessionTime: { passed: boolean; message: string; currentUtcHour: number; allowed: boolean };
  finalSignal: 'BUY' | 'SELL' | 'NO_SIGNAL';
}

export interface BotLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SIGNAL' | 'TRADE' | 'TRAIL' | 'WARN' | 'SUCCESS';
  message: string;
}
