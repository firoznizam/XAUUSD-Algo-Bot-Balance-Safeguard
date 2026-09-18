import { Candle, StrategyConfig, TradePosition, BalanceSnapshot, BalanceLedgerEntry } from '../types';

export const DEFAULT_CONFIG: StrategyConfig = {
  symbol: 'XAUUSD',
  timeframe: 'M5',
  bars: 500,
  emaFast: 9,
  emaMid: 21,
  emaSlow: 200,
  rsiPeriod: 14,
  rsiLongMin: 45,
  rsiLongMax: 70,
  rsiShortMin: 30,
  rsiShortMax: 55,
  stPeriod: 10,
  stMultiplier: 3.0,
  liqLookback: 5,
  riskPct: 0.01,
  riskReward: 2.0,
  atrMultiplierSl: 1.5,
  trailEnabled: true,
  trailActivatePips: 20,
  trailStepPips: 10,
  tradeStartHourUtc: 7,
  tradeEndHourUtc: 20,
  maxTrades: 1,
  magicNumber: 20240801,
  tradeComment: 'StockLearners_XAUUSD',
};

// Generate realistic XAUUSD M5 candles (~$2,640 - $2,680)
export function generateInitialCandles(count = 100): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const fiveMinMs = 5 * 60 * 1000;
  let currentPrice = 2652.5;

  // Set start time 100 bars ago (roughly 8.3 hours ago)
  const startTime = now - count * fiveMinMs;

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + i * fiveMinMs;
    const date = new Date(timestamp);
    const timeStr = `${String(date.getUTCHours()).padStart(2, '0')}:${String(
      date.getUTCMinutes()
    ).padStart(2, '0')}`;

    // Create realistic market waves with trending and consolidation
    const cycle = Math.sin(i / 12) * 4.5 + Math.cos(i / 20) * 8.0;
    const microNoise = (Math.random() - 0.48) * 1.8;
    const open = Number((currentPrice).toFixed(2));
    
    // Inject a couple deliberate liquidity sweep candles
    let lowDelta = Math.random() * 2.2 + 0.3;
    let highDelta = Math.random() * 2.4 + 0.3;
    let close = Number((open + microNoise + (cycle > 0 ? 0.4 : -0.3)).toFixed(2));

    if (i === count - 15) {
      // Bullish liquidity sweep setup: deep wick down, strong reclaim close
      const sweepLow = open - 3.8;
      close = open + 1.2;
      candles.push({
        time: timeStr,
        timestamp,
        open,
        high: Number((open + 1.8).toFixed(2)),
        low: Number(sweepLow.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 800) + 1200,
      });
      currentPrice = close;
      continue;
    }

    if (i === count - 35) {
      // Bearish sweep setup: spike high, close down
      const sweepHigh = open + 4.2;
      close = open - 1.5;
      candles.push({
        time: timeStr,
        timestamp,
        open,
        high: Number(sweepHigh.toFixed(2)),
        low: Number((open - 1.2).toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: Math.floor(Math.random() * 900) + 1100,
      });
      currentPrice = close;
      continue;
    }

    const high = Number((Math.max(open, close) + highDelta).toFixed(2));
    const low = Number((Math.min(open, close) - lowDelta).toFixed(2));
    const volume = Math.floor(Math.random() * 600) + 300;

    candles.push({
      time: timeStr,
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export const INITIAL_SNAPSHOTS: BalanceSnapshot[] = [
  {
    id: 'snap-genesis',
    timestamp: '2026-09-17 08:00:00 UTC',
    createdAt: Date.now() - 3600 * 1000 * 5,
    title: 'Pre-London Session Baseline',
    softwareBalance: 10000.0,
    equity: 10000.0,
    margin: 0,
    freeMargin: 10000.0,
    currency: 'USD',
    openTradesCount: 0,
    floatingPnl: 0,
    realizedPnl: 0,
    notes: 'Initial account verification before activating Stock Learners XAUUSD bot.',
    type: 'MANUAL_BACKUP',
  },
  {
    id: 'snap-profit-milestone',
    timestamp: '2026-09-17 14:30:00 UTC',
    createdAt: Date.now() - 3600 * 1000 * 2,
    title: 'Post-NY Open Profit Milestone',
    softwareBalance: 10480.5,
    equity: 10525.2,
    margin: 180.0,
    freeMargin: 10345.2,
    currency: 'USD',
    openTradesCount: 1,
    floatingPnl: 44.7,
    realizedPnl: 480.5,
    notes: 'Backed up after 2 winning Gold liquidity sweep trades (+320 pips total).',
    type: 'MILESTONE_BACKUP',
  },
];

export const INITIAL_LEDGER: BalanceLedgerEntry[] = [
  {
    id: 'led-1',
    timestamp: '2026-09-17 08:00:00',
    type: 'INITIAL',
    amount: 10000.0,
    previousBalance: 0,
    newBalance: 10000.0,
    description: 'Initial software balance registered for MT5 bot engine',
  },
  {
    id: 'led-2',
    timestamp: '2026-09-17 10:15:00',
    type: 'TRADE_PROFIT',
    amount: 285.5,
    previousBalance: 10000.0,
    newBalance: 10285.5,
    description: 'Long XAUUSD TARGET reached (2R risk reward on London low sweep)',
  },
  {
    id: 'led-3',
    timestamp: '2026-09-17 12:45:00',
    type: 'TRADE_PROFIT',
    amount: 195.0,
    previousBalance: 10285.5,
    newBalance: 10480.5,
    description: 'Short XAUUSD Trailing Stop closed with locked profit',
  },
];

export const SAMPLE_HISTORICAL_TRADES: TradePosition[] = [
  {
    id: 'trade-past-1',
    ticket: 10849201,
    symbol: 'XAUUSD',
    type: 'BUY',
    entryPrice: 2648.2,
    currentPrice: 2655.4,
    sl: 2645.7,
    tp: 2655.4,
    originalSl: 2645.7,
    lot: 0.12,
    pnl: 285.5,
    pips: 72,
    openTime: '2026-09-17 09:30:00',
    closeTime: '2026-09-17 10:15:00',
    closePrice: 2655.4,
    status: 'CLOSED',
    closeReason: 'TP',
    magic: 20240801,
    comment: 'StockLearners_XAUUSD',
    trailingActivated: true,
  },
  {
    id: 'trade-past-2',
    ticket: 10849450,
    symbol: 'XAUUSD',
    type: 'SELL',
    entryPrice: 2662.8,
    currentPrice: 2657.9,
    sl: 2659.5,
    tp: 2650.0,
    originalSl: 2665.3,
    lot: 0.15,
    pnl: 195.0,
    pips: 49,
    openTime: '2026-09-17 11:20:00',
    closeTime: '2026-09-17 12:45:00',
    closePrice: 2657.9,
    status: 'CLOSED',
    closeReason: 'TRAILING_SL',
    magic: 20240801,
    comment: 'StockLearners_XAUUSD',
    trailingActivated: true,
  },
];

// Complete Python files as provided in the PDF
export const BOT_PYTHON_FILES: Record<string, { filename: string; description: string; code: string }> = {
  'config.py': {
    filename: 'config.py',
    description: 'MT5 credentials, indicator settings, and risk parameters',
    code: `import os

# ============================================================
# CONFIG — XAUUSD Stock Learners Algo for MT5
# ============================================================

MT5_CONFIG = {
    "login": 123456789,                          # Your MT5 account number
    "password": os.getenv("MT5_PASSWORD", "your_password"),
    "server": os.getenv("MT5_SERVER", "ICMarkets-Live"),
    "path": r"C:\\Program Files\\MetaTrader 5\\terminal64.exe"
}

TELEGRAM_CONFIG = {
    "bot_token": os.getenv("TELEGRAM_BOT_TOKEN", "your_bot_token"),
    "chat_id": os.getenv("TELEGRAM_CHAT_ID", "your_chat_id"),
    "enabled": True
}

# Trading Settings
SYMBOL = "XAUUSD"
TIMEFRAME = "M5"           # 5-minute candles
BARS = 500                 # Number of candles to fetch

# Indicator Settings
EMA_FAST = 9
EMA_MID = 21
EMA_SLOW = 200
RSI_PERIOD = 14
ST_PERIOD = 10
ST_MULT = 3.0
LIQ_LOOKBACK = 5           # Candles to look back for liquidity sweep

# Risk Management
INITIAL_LOT = 0.01         # Start small — 0.01 = 1 micro lot
RISK_REWARD = 2.0          # 1:2 RR
SL_PIPS = 150              # 150 pips SL for XAUUSD ($1.50 per 0.01 lot)
TP_PIPS = 300              # 300 pips TP (2x SL)
MAX_TRADES = 1             # Max 1 open trade at a time
MAGIC_NUMBER = 20240801    # Unique ID for this bot's trades
TRADE_COMMENT = "StockLearners_XAUUSD"

# Trailing Stop Settings
TRAIL_ENABLED = True
TRAIL_ACTIVATE = 20        # Activate after 20 pips profit
TRAIL_STEP = 10            # Trail every 10 pips above ATL

# Session Filter (UTC times)
TRADE_START_HOUR = 7       # 7:00 AM UTC (London open)
TRADE_END_HOUR = 20        # 8:00 PM UTC (NY close)
`,
  },
  'indicators.py': {
    filename: 'indicators.py',
    description: 'Calculates EMA, RSI, VWAP, ATR, Supertrend, and Liquidity Sweeps',
    code: `import pandas as pd
import numpy as np

def compute_ema(series, period):
    return series.ewm(span=period, adjust=False).mean()

def compute_rsi(series, period=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def compute_vwap(df):
    """Session VWAP — resets each day"""
    tp = (df['high'] + df['low'] + df['close']) / 3
    df = df.copy()
    df['tp'] = tp
    df['date'] = df.index.date
    df['cum_tpvol'] = df.groupby('date').apply(
        lambda x: (x['tp'] * x['tick_volume']).cumsum()
    ).reset_index(level=0, drop=True)
    df['cum_vol'] = df.groupby('date')['tick_volume'].cumsum()
    return df['cum_tpvol'] / df['cum_vol']

def compute_atr(df, period=14):
    tr1 = df['high'] - df['low']
    tr2 = abs(df['high'] - df['close'].shift(1))
    tr3 = abs(df['low'] - df['close'].shift(1))
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return tr.ewm(span=period, adjust=False).mean()

def compute_supertrend(df, period=10, multiplier=3):
    hl2 = (df['high'] + df['low']) / 2
    atr = compute_atr(df, period)
    upper = hl2 + (multiplier * atr)
    lower = hl2 - (multiplier * atr)
    st = pd.Series(np.nan, index=df.index)
    direction = pd.Series(0, index=df.index)

    for i in range(1, len(df)):
        fub = upper.iloc[i] if (upper.iloc[i] < upper.iloc[i-1] or df['close'].iloc[i-1] > upper.iloc[i-1]) else upper.iloc[i-1]
        flb = lower.iloc[i] if (lower.iloc[i] > lower.iloc[i-1] or df['close'].iloc[i-1] < lower.iloc[i-1]) else lower.iloc[i-1]

        if df['close'].iloc[i] > fub:
            direction.iloc[i] = 1   # Bullish
            st.iloc[i] = flb
        elif df['close'].iloc[i] < flb:
            direction.iloc[i] = -1  # Bearish
            st.iloc[i] = fub
        else:
            direction.iloc[i] = direction.iloc[i-1]
            st.iloc[i] = st.iloc[i-1]

    return st, direction

def detect_liquidity_sweep(df, lookback=5):
    """
    Bullish sweep: wick pierces recent low but candle closes ABOVE it
    Bearish sweep: wick pierces recent high but candle closes BELOW it
    """
    bull = pd.Series(False, index=df.index)
    bear = pd.Series(False, index=df.index)
    for i in range(lookback, len(df)):
        recent_low = df['low'].iloc[i-lookback:i].min()
        recent_high = df['high'].iloc[i-lookback:i].max()
        if df['low'].iloc[i] < recent_low and df['close'].iloc[i] > recent_low:
            bull.iloc[i] = True
        if df['high'].iloc[i] > recent_high and df['close'].iloc[i] < recent_high:
            bear.iloc[i] = True
    return bull, bear

def add_all_indicators(df):
    df = df.copy()
    df['ema9'] = compute_ema(df['close'], 9)
    df['ema21'] = compute_ema(df['close'], 21)
    df['ema200'] = compute_ema(df['close'], 200)
    df['rsi'] = compute_rsi(df['close'], 14)
    df['vwap'] = compute_vwap(df)
    df['atr'] = compute_atr(df, 14)
    df['st'], df['st_dir'] = compute_supertrend(df, 10, 3)
    df['bull_sweep'], df['bear_sweep'] = detect_liquidity_sweep(df, 5)
    return df.dropna()
`,
  },
  'signals.py': {
    filename: 'signals.py',
    description: 'Generates BUY and SELL trade signals based on Stock Learners logic',
    code: `def get_signal(df):
    """
    Checks the LAST completed candle for a trade signal.
    Returns: 'BUY', 'SELL', or None
    """
    row = df.iloc[-1]        # Latest closed candle
    prev = df.iloc[-2]       # Previous candle for crossover check

    close = row['close']
    ema9 = row['ema9']
    ema21 = row['ema21']
    ema200 = row['ema200']
    rsi = row['rsi']
    vwap = row['vwap']
    st_dir = row['st_dir']

    # EMA crossover (confirmed on close)
    ema_bull_cross = (prev['ema9'] <= prev['ema21']) and (ema9 > ema21)
    ema_bear_cross = (prev['ema9'] >= prev['ema21']) and (ema9 < ema21)

    # ── BUY CONDITIONS ──────────────────────────────────────
    buy = (
        close > vwap and           # Above VWAP
        ema9 > ema21 and           # Fast EMA above slow EMA
        close > ema200 and         # Above long-term trend
        st_dir == 1 and            # Supertrend bullish
        45 <= rsi <= 70 and        # RSI healthy bull zone
        row['bull_sweep']          # Liquidity sweep triggered
    )

    # ── SELL CONDITIONS ─────────────────────────────────────
    sell = (
        close < vwap and           # Below VWAP
        ema9 < ema21 and           # Fast EMA below slow EMA
        close < ema200 and         # Below long-term trend
        st_dir == -1 and           # Supertrend bearish
        30 <= rsi <= 55 and        # RSI healthy bear zone
        row['bear_sweep']          # Liquidity sweep triggered
    )

    if buy:
        return "BUY"
    elif sell:
        return "SELL"
    return None
`,
  },
  'risk_manager.py': {
    filename: 'risk_manager.py',
    description: 'Risk management, ATR-based SL/TP, risk-based lot sizing & trailing stop',
    code: `import MetaTrader5 as mt5
from telegram_bot import telegram

class RiskManager:
    def __init__(self, symbol):
        self.symbol = symbol

    def calculate_sl_tp(self, signal, entry_price, atr, atr_multiplier=1.5, rr=2.0):
        """Dynamic SL/TP based on ATR"""
        sl_distance = atr * atr_multiplier
        if signal == "BUY":
            sl = round(entry_price - sl_distance, 2)
            tp = round(entry_price + (sl_distance * rr), 2)
        elif signal == "SELL":
            sl = round(entry_price + sl_distance, 2)
            tp = round(entry_price - (sl_distance * rr), 2)
        else:
            return None, None
        return sl, tp

    def calculate_lot_size(self, account_balance, risk_pct, sl_distance_usd):
        """Risk-based lot sizing (1% risk by default). 1 lot on XAUUSD = $100 per $1 move"""
        risk_amount = account_balance * risk_pct
        lot = round(risk_amount / (sl_distance_usd * 100), 2)
        return max(0.01, min(lot, 5.0))

    def check_and_trail(self, position, trail_activate=20, trail_step=10):
        """
        Check if trailing stop should be updated
        Returns: (should_update, new_sl) or (False, None)
        """
        if not position:
            return False, None
        
        symbol = position.symbol
        tick = mt5.symbol_info_tick(symbol)
        if not tick:
            return False, None
            
        current_price = tick.bid
        
        if position.type == 0:  # BUY position
            entry = position.price_open
            current_sl = position.sl
            profit_pips = (current_price - entry) * 100

            if profit_pips >= trail_activate:
                new_sl = current_sl
                if current_sl < entry:
                    new_sl = entry
                potential_new_sl = current_price - (trail_step / 100)
                if potential_new_sl > new_sl:
                    new_sl = round(potential_new_sl, 2)
                if new_sl > current_sl:
                    telegram.alert_trail_update(symbol, current_sl, new_sl, current_price, profit_pips)
                    return True, new_sl

        elif position.type == 1:  # SELL position
            entry = position.price_open
            current_sl = position.sl
            profit_pips = (entry - current_price) * 100

            if profit_pips >= trail_activate:
                new_sl = current_sl
                if current_sl > entry:
                    new_sl = entry
                potential_new_sl = current_price + (trail_step / 100)
                if potential_new_sl < new_sl:
                    new_sl = round(potential_new_sl, 2)
                if new_sl < current_sl:
                    telegram.alert_trail_update(symbol, current_sl, new_sl, current_price, profit_pips)
                    return True, new_sl

        return False, None

    def update_trailing_sl(self, position, new_sl):
        request = {
            "action": mt5.TRADE_ACTION_SLTP,
            "position": position.ticket,
            "sl": new_sl,
            "tp": position.tp,
            "symbol": position.symbol,
            "magic": position.magic,
        }
        result = mt5.order_send(request)
        if result.retcode == mt5.TRADE_RETCODE_DONE:
            print(f"🤖 Trailing SL updated: {position.symbol} SL {new_sl}")
            return True
        else:
            print(f"🤖 Failed to update trailing SL: {result.comment}")
            return False

risk_manager = RiskManager("XAUUSD")
`,
  },
  'mt5_connector.py': {
    filename: 'mt5_connector.py',
    description: 'Connects to MetaTrader 5, fetches candle rates, and executes orders',
    code: `import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime
from config import MT5_CONFIG, SYMBOL, MAGIC_NUMBER, TRADE_COMMENT

TF_MAP = {
    "M1" : mt5.TIMEFRAME_M1,
    "M5" : mt5.TIMEFRAME_M5,
    "M15": mt5.TIMEFRAME_M15,
    "M30": mt5.TIMEFRAME_M30,
    "H1" : mt5.TIMEFRAME_H1,
    "H4" : mt5.TIMEFRAME_H4,
    "D1" : mt5.TIMEFRAME_D1,
}

def connect():
    if not mt5.initialize(
        path=MT5_CONFIG["path"],
        login=MT5_CONFIG["login"],
        password=MT5_CONFIG["password"],
        server=MT5_CONFIG["server"]
    ):
        print(f"🤖 MT5 Init Failed: {mt5.last_error()}")
        mt5.shutdown()
        return False
    info = mt5.account_info()
    print(f"🤖 Connected | Account: {info.login} | Balance: \${info.balance:.2f}")
    return True

def disconnect():
    mt5.shutdown()
    print("🤖 MT5 Disconnected.")

def get_rates(symbol, timeframe_str, n_bars=500):
    tf = TF_MAP.get(timeframe_str, mt5.TIMEFRAME_M5)
    rates = mt5.copy_rates_from_pos(symbol, tf, 0, n_bars)
    if rates is None or len(rates) == 0:
        print(f"🤖 No data for {symbol}")
        return None
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')
    df.set_index('time', inplace=True)
    return df

def get_open_positions(symbol):
    positions = mt5.positions_get(symbol=symbol)
    return positions if positions else []

def place_order(signal, symbol, lot, sl, tp):
    tick = mt5.symbol_info_tick(symbol)
    if not tick:
        print(f"🤖 Cannot get tick for {symbol}")
        return None
    if signal == "BUY":
        order_type = mt5.ORDER_TYPE_BUY
        price = tick.ask
    else:
        order_type = mt5.ORDER_TYPE_SELL
        price = tick.bid

    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot,
        "type": order_type,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": 20,
        "magic": MAGIC_NUMBER,
        "comment": TRADE_COMMENT,
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    result = mt5.order_send(request)
    if result.retcode != mt5.TRADE_RETCODE_DONE:
        print(f"🤖 Order Failed | Code: {result.retcode} | {result.comment}")
        return None
    print(f"🤖 {signal} Order Placed | Ticket: {result.order} | Price: {price} | SL: {sl} | TP: {tp} | Lot: {lot}")
    return result

def close_all_positions(symbol):
    positions = get_open_positions(symbol)
    for pos in positions:
        tick = mt5.symbol_info_tick(symbol)
        close_type = mt5.ORDER_TYPE_SELL if pos.type == 0 else mt5.ORDER_TYPE_BUY
        close_price = tick.bid if pos.type == 0 else tick.ask
        request = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": symbol,
            "volume": pos.volume,
            "type": close_type,
            "position": pos.ticket,
            "price": close_price,
            "deviation": 20,
            "magic": MAGIC_NUMBER,
            "comment": "Close by Bot",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        mt5.order_send(request)
        print(f"🤖 Closed Position Ticket: {pos.ticket}")
`,
  },
  'telegram_bot.py': {
    filename: 'telegram_bot.py',
    description: 'Instant Telegram notifications for trades, exits, and trailing updates',
    code: `import requests
import json
from datetime import datetime
from config import TELEGRAM_CONFIG

class TelegramBot:
    def __init__(self):
        self.token = TELEGRAM_CONFIG["bot_token"]
        self.chat_id = TELEGRAM_CONFIG["chat_id"]
        self.enabled = TELEGRAM_CONFIG["enabled"]

    def send_message(self, message):
        """Send a message to Telegram"""
        if not self.enabled or not self.token or not self.chat_id:
            print(f"⚠ Telegram disabled | {message[:50]}...")
            return False
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        try:
            response = requests.post(url, json=payload, timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"Telegram send failed: {e}")
            return False

    def alert_open_trade(self, symbol, signal, entry, sl, tp, lot, open_positions=0):
        emoji = "🟢" if signal == "BUY" else "🔴"
        message = f"""
<b>{emoji} NEW TRADE OPENED</b>
─────────────────────
<b>Symbol:</b> {symbol}
<b>Action:</b> {signal}
<b>Entry:</b> {entry:.2f}
<b>Stop Loss:</b> {sl:.2f}
<b>Take Profit:</b> {tp:.2f}
<b>Lot Size:</b> {lot:.2f}
<b>Open Trades:</b> {open_positions + 1}
<b>Time:</b> {datetime.now().strftime('%H:%M:%S')}
"""
        return self.send_message(message)

    def alert_close_trade(self, symbol, position_type, entry, exit_price, pnl, pips, reason):
        pnl_emoji = "💰" if pnl >= 0 else "🛑"
        message = f"""
<b>🤖 TRADE CLOSED</b>
─────────────────────
<b>Symbol:</b> {symbol}
<b>Type:</b> {'LONG' if position_type == 0 else 'SHORT'}
<b>Entry:</b> {entry:.2f}
<b>Exit:</b> {exit_price:.2f}
<b>Reason:</b> {reason}
<b>P&L:</b> {pnl_emoji} \${pnl:.2f}
<b>Pips:</b> {abs(pips):.0f} {'profit' if pips > 0 else 'loss'}
<b>Time:</b> {datetime.now().strftime('%H:%M:%S')}
"""
        return self.send_message(message)

    def alert_trail_update(self, symbol, old_sl, new_sl, current_price, profit_pips):
        message = f"""
<b>📈 TRAILING STOP UPDATED</b>
─────────────────────
<b>Symbol:</b> {symbol}
<b>Old SL:</b> {old_sl:.2f}
<b>New SL:</b> {new_sl:.2f}
<b>Current Price:</b> {current_price:.2f}
<b>Locked Profit:</b> {profit_pips:.1f} pips
<b>Time:</b> {datetime.now().strftime('%H:%M:%S')}
"""
        return self.send_message(message)

    def alert_heartbeat(self, open_trades, balance, equity):
        message = f"""
<b>💓 BOT STATUS</b>
─────────────────────
<b>Open Trades:</b> {open_trades}
<b>Balance:</b> \${balance:.2f}
<b>Equity:</b> \${equity:.2f}
<b>Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        return self.send_message(message)

telegram = TelegramBot()
`,
  },
  'main.py': {
    filename: 'main.py',
    description: 'Main automated loop: session filter, candle rates, signal check, execution',
    code: `import time
import pytz
from datetime import datetime, timedelta
import MetaTrader5 as mt5
from config import *
from mt5_connector import (
    connect, disconnect, get_rates, get_open_positions, place_order, close_all_positions
)
from indicators import add_all_indicators
from signals import get_signal
from risk_manager import risk_manager
from telegram_bot import telegram
from logger import log_trade

def is_trading_session():
    """Allow trades only during London + NY sessions (UTC)"""
    now_utc = datetime.now(pytz.utc)
    return TRADE_START_HOUR <= now_utc.hour < TRADE_END_HOUR

def check_trailing_stops():
    """Check and update trailing stops for all open positions"""
    positions = get_open_positions(SYMBOL)
    for pos in positions:
        should_update, new_sl = risk_manager.check_and_trail(
            pos,
            trail_activate=TRAIL_ACTIVATE,
            trail_step=TRAIL_STEP
        )
        if should_update:
            risk_manager.update_trailing_sl(pos, new_sl)
    return len(positions)

def run_bot():
    print("=" * 60)
    print(" 🤖 XAUUSD — Stock Learners Algo Bot (MT5)")
    print("=" * 60)
    if not connect():
        telegram.alert_error("Failed to connect to MT5")
        return

    print(f"🤖 Monitoring: {SYMBOL} | TF: {TIMEFRAME}")
    print("🤖 Bot is running... Press Ctrl+C to stop.\\n")

    last_heartbeat = datetime.now()

    while True:
        try:
            if not is_trading_session():
                print("⏸ Outside trading session (07:00-20:00 UTC). Waiting...")
                time.sleep(60)
                continue

            open_positions = check_trailing_stops()

            if (datetime.now() - last_heartbeat) > timedelta(minutes=15):
                account = mt5.account_info()
                if account:
                    telegram.alert_heartbeat(open_positions, account.balance, account.equity)
                last_heartbeat = datetime.now()

            df = get_rates(SYMBOL, TIMEFRAME, BARS)
            if df is None:
                time.sleep(30)
                continue

            df = add_all_indicators(df)

            if open_positions >= MAX_TRADES:
                print(f"⏳ {open_positions} trade(s) open. Waiting...")
                time.sleep(30)
                continue

            signal = get_signal(df)
            timestamp = datetime.now().strftime('%H:%M:%S')
            print(f"[{timestamp}] Signal: {signal if signal else '— No signal —'}")

            if signal:
                tick = mt5.symbol_info_tick(SYMBOL)
                if not tick:
                    time.sleep(10)
                    continue

                entry = tick.ask if signal == "BUY" else tick.bid
                atr = df['atr'].iloc[-1]
                sl, tp = risk_manager.calculate_sl_tp(signal, entry, atr, atr_multiplier=1.5, rr=RISK_REWARD)

                account = mt5.account_info()
                sl_distance_usd = abs(entry - sl)
                lot = risk_manager.calculate_lot_size(account.balance, risk_pct=0.01, sl_distance_usd=sl_distance_usd)

                result = place_order(signal, SYMBOL, lot, sl, tp)
                if result:
                    telegram.alert_open_trade(SYMBOL, signal, entry, sl, tp, lot, open_positions)
                    log_trade(signal, SYMBOL, entry, sl, tp, lot)

            time.sleep(300) # Wait for next 5-min candle

        except KeyboardInterrupt:
            print("\\n🛑 Bot stopped by user.")
            break
        except Exception as e:
            print(f"⚠ Error: {e}")
            time.sleep(30)

    disconnect()

if __name__ == "__main__":
    run_bot()
`,
  },
  'dashboard.py': {
    filename: 'dashboard.py',
    description: 'Streamlit Web Dashboard for monitoring live MT5 positions & charts',
    code: `import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import MetaTrader5 as mt5
from config import SYMBOL
from mt5_connector import connect, disconnect, get_rates

st.set_page_config(page_title="XAUUSD Trading Dashboard", page_icon="📈", layout="wide")

def main():
    st.title("📈 XAUUSD Trading Dashboard")
    st.subheader("Stock Learners Strategy - Live Monitoring")

    if not connect():
        st.error("Failed to connect to MT5")
        return

    account = mt5.account_info()
    positions = mt5.positions_get(symbol=SYMBOL) or []

    col1, col2, col3 = st.columns(3)
    col1.metric("💰 Balance", f"\${account.balance:,.2f}")
    col1.metric("📈 Equity", f"\${account.equity:,.2f}")
    col2.metric("🛡 Free Margin", f"\${account.margin_free:,.2f}")
    col2.metric("⚖ Margin Used", f"\${account.margin:,.2f}")
    col3.metric("📊 Open Trades", len(positions))
    col3.metric("⚡ Leverage", f"1:{account.leverage}")

    st.divider()

    rates = mt5.copy_rates_from_pos(SYMBOL, mt5.TIMEFRAME_M5, 0, 100)
    if rates is not None:
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        fig = go.Figure(data=[go.Candlestick(
            x=df['time'], open=df['open'], high=df['high'], low=df['low'], close=df['close'], name=SYMBOL
        )])
        fig.update_layout(title="XAUUSD M5 Price Action", template="plotly_dark", height=450)
        st.plotly_chart(fig, use_container_width=True)

if __name__ == "__main__":
    main()
`,
  },
  'logger.py': {
    filename: 'logger.py',
    description: 'CSV trade logging module',
    code: `import csv
import os
from datetime import datetime

LOG_FILE = "trade_log.csv"

def log_trade(signal, symbol, entry, sl, tp, lot, result="OPEN"):
    file_exists = os.path.isfile(LOG_FILE)
    with open(LOG_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Time", "Symbol", "Signal", "Entry", "SL", "TP", "Lot", "Result"])
        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            symbol, signal, entry, sl, tp, lot, result
        ])
`,
  },
  'requirements.txt': {
    filename: 'requirements.txt',
    description: 'Python package dependencies for MT5, pandas, streamlit, telegram',
    code: `MetaTrader5>=5.0.37
pandas>=1.5.0
numpy>=1.23.0
pytz>=2024.1
python-telegram-bot>=20.7
streamlit>=1.28.0
plotly>=5.18.0
requests>=2.31.0
`,
  },
  'setup_telegram.md': {
    filename: 'setup_telegram.md',
    description: 'Step-by-step setup guide for creating Telegram Bot and obtaining Chat ID',
    code: `# 🤖 Telegram Bot Setup Guide

## Step 1: Create Your Bot
1. Open Telegram and search for **@BotFather**
2. Send \`/newbot\` and follow instructions
3. Save the **bot token** you receive (e.g. \`1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ\`)
4. Send \`/start\` to your new bot

## Step 2: Get Your Chat ID
1. Open your bot in Telegram and send any message (like "hello")
2. Open in browser: \`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates\`
3. Locate \`"chat":{"id":123456789}\` — copy this number as your \`chat_id\`

## Step 3: Set Environment Variables
\`\`\`bash
# Windows CMD
set TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ
set TELEGRAM_CHAT_ID=123456789

# Or add directly in config.py
\`\`\`
`,
  },
  'save_all.py': {
    filename: 'save_all.py',
    description: 'Automated 1-command installer script that creates all bot files on your computer',
    code: `import os

files = {
    "requirements.txt": """MetaTrader5>=5.0.37
pandas>=1.5.0
numpy>=1.23.0
pytz>=2024.1
python-telegram-bot>=20.7
streamlit>=1.28.0
plotly>=5.18.0
requests>=2.31.0
""",
    "README.md": """# XAUUSD Trading Bot - Stock Learners Strategy
Includes MT5 auto-execution, Telegram alerts, trailing stop loss, and balance management.
"""
}

os.makedirs("xauusd_trading_bot", exist_ok=True)
print("🚀 Creating all files in xauusd_trading_bot/...")
for name, content in files.items():
    with open(os.path.join("xauusd_trading_bot", name), "w", encoding="utf-8") as f:
        f.write(content)
print("✅ Done! Enter xauusd_trading_bot and run: pip install -r requirements.txt")
`,
  },
};
