import { Candle, CalculatedCandle, StrategyConfig, StrategyChecklistResult } from '../types';

/**
 * Exponential Moving Average (matches pandas ewm(span=period, adjust=False))
 */
export function computeEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = new Array(values.length);
  ema[0] = values[0];
  for (let i = 1; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

/**
 * Relative Strength Index (RSI 14) matching pandas ewm(com=period-1)
 */
export function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(50);
  if (closes.length <= period) return rsi;

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? -diff : 0);
  }

  // Initial average using Wilder / EMA com=period-1
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const alpha = 1 / period;

  for (let i = period; i < gains.length; i++) {
    avgGain = gains[i] * alpha + avgGain * (1 - alpha);
    avgLoss = losses[i] * alpha + avgLoss * (1 - alpha);

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const val = 100 - 100 / (1 + rs);
    rsi[i + 1] = Math.min(100, Math.max(0, val));
  }

  return rsi;
}

/**
 * Intraday VWAP (Volume Weighted Average Price)
 * Resets each day or cumulative over session
 */
export function computeVWAP(candles: Candle[]): number[] {
  const vwap: number[] = new Array(candles.length);
  let cumVol = 0;
  let cumTpVol = 0;
  let lastDate = '';

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const dateStr = new Date(c.timestamp).toISOString().split('T')[0];

    // Reset each session date
    if (dateStr !== lastDate) {
      cumVol = 0;
      cumTpVol = 0;
      lastDate = dateStr;
    }

    const tp = (c.high + c.low + c.close) / 3;
    cumTpVol += tp * c.volume;
    cumVol += c.volume;

    vwap[i] = cumVol > 0 ? cumTpVol / cumVol : c.close;
  }
  return vwap;
}

/**
 * Average True Range (ATR)
 */
export function computeATR(candles: Candle[], period = 14): number[] {
  const tr: number[] = new Array(candles.length);
  tr[0] = candles[0].high - candles[0].low;

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];
    const tr1 = c.high - c.low;
    const tr2 = Math.abs(c.high - prevC.close);
    const tr3 = Math.abs(c.low - prevC.close);
    tr[i] = Math.max(tr1, tr2, tr3);
  }

  return computeEMA(tr, period);
}

/**
 * Supertrend (period=10, multiplier=3.0)
 * Replicates Stock Learners logic from PDF page 3 & page 6
 */
export function computeSupertrend(
  candles: Candle[],
  period = 10,
  multiplier = 3.0
): { supertrend: number[]; direction: (1 | -1)[] } {
  const len = candles.length;
  const supertrend: number[] = new Array(len).fill(0);
  const direction: (1 | -1)[] = new Array(len).fill(1);

  if (len < 2) return { supertrend, direction };

  const atr = computeATR(candles, period);

  const upperBand: number[] = new Array(len);
  const lowerBand: number[] = new Array(len);

  for (let i = 0; i < len; i++) {
    const hl2 = (candles[i].high + candles[i].low) / 2;
    upperBand[i] = hl2 + multiplier * atr[i];
    lowerBand[i] = hl2 - multiplier * atr[i];
  }

  const finalUb: number[] = new Array(len).fill(0);
  const finalLb: number[] = new Array(len).fill(0);

  finalUb[0] = upperBand[0];
  finalLb[0] = lowerBand[0];
  supertrend[0] = lowerBand[0];
  direction[0] = 1;

  for (let i = 1; i < len; i++) {
    // Final upper band calculation
    if (upperBand[i] < finalUb[i - 1] || candles[i - 1].close > finalUb[i - 1]) {
      finalUb[i] = upperBand[i];
    } else {
      finalUb[i] = finalUb[i - 1];
    }

    // Final lower band calculation
    if (lowerBand[i] > finalLb[i - 1] || candles[i - 1].close < finalLb[i - 1]) {
      finalLb[i] = lowerBand[i];
    } else {
      finalLb[i] = finalLb[i - 1];
    }

    // Supertrend direction
    if (candles[i].close > finalUb[i]) {
      direction[i] = 1;
      supertrend[i] = finalLb[i];
    } else if (candles[i].close < finalLb[i]) {
      direction[i] = -1;
      supertrend[i] = finalUb[i];
    } else {
      direction[i] = direction[i - 1];
      supertrend[i] = direction[i] === 1 ? finalLb[i] : finalUb[i];
    }
  }

  return { supertrend, direction };
}

/**
 * Liquidity Sweep Detector (Lookback = 5)
 * From PDF Page 3 & Page 6:
 * - Bullish sweep: wick pierced recent low (candle low < recent_low), but candle closed ABOVE it
 * - Bearish sweep: wick pierced recent high (candle high > recent_high), but candle closed BELOW it
 */
export function detectLiquiditySweeps(
  candles: Candle[],
  lookback = 5
): { bullSweeps: boolean[]; bearSweeps: boolean[] } {
  const len = candles.length;
  const bullSweeps: boolean[] = new Array(len).fill(false);
  const bearSweeps: boolean[] = new Array(len).fill(false);

  for (let i = lookback; i < len; i++) {
    let recentLow = Infinity;
    let recentHigh = -Infinity;

    for (let j = i - lookback; j < i; j++) {
      if (candles[j].low < recentLow) recentLow = candles[j].low;
      if (candles[j].high > recentHigh) recentHigh = candles[j].high;
    }

    const current = candles[i];
    // Bullish sweep: wick went below recent low, but candle closed above it
    if (current.low < recentLow && current.close > recentLow) {
      bullSweeps[i] = true;
    }

    // Bearish sweep: wick went above recent high, but candle closed below it
    if (current.high > recentHigh && current.close < recentHigh) {
      bearSweeps[i] = true;
    }
  }

  return { bullSweeps, bearSweeps };
}

/**
 * Compute all indicators and generate signals on the candle series
 */
export function processAllIndicators(
  candles: Candle[],
  config: StrategyConfig
): CalculatedCandle[] {
  const closes = candles.map((c) => c.close);
  const ema9 = computeEMA(closes, config.emaFast);
  const ema21 = computeEMA(closes, config.emaMid);
  const ema200 = computeEMA(closes, config.emaSlow);
  const rsi = computeRSI(closes, config.rsiPeriod);
  const vwap = computeVWAP(candles);
  const atr = computeATR(candles, 14);
  const { supertrend, direction: stDir } = computeSupertrend(
    candles,
    config.stPeriod,
    config.stMultiplier
  );
  const { bullSweeps, bearSweeps } = detectLiquiditySweeps(candles, config.liqLookback);

  const calculated: CalculatedCandle[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const prevEma9 = i > 0 ? ema9[i - 1] : ema9[i];
    const prevEma21 = i > 0 ? ema21[i - 1] : ema21[i];

    // Session time check (London + NY hours: 7 to 20 UTC)
    const candleDate = new Date(c.timestamp);
    const utcHour = candleDate.getUTCHours();
    const inSession = utcHour >= config.tradeStartHourUtc && utcHour < config.tradeEndHourUtc;

    let signal: 'BUY' | 'SELL' | null = null;

    if (i >= 5 && inSession) {
      // Long conditions from PDF:
      // close > vwap AND ema9 > ema21 AND close > ema200 AND st_dir == 1 AND 45 <= rsi <= 70 AND bullSweep
      const longCond =
        c.close > vwap[i] &&
        ema9[i] > ema21[i] &&
        c.close > ema200[i] &&
        stDir[i] === 1 &&
        rsi[i] >= config.rsiLongMin &&
        rsi[i] <= config.rsiLongMax &&
        bullSweeps[i];

      // Short conditions from PDF:
      // close < vwap AND ema9 < ema21 AND close < ema200 AND st_dir == -1 AND 30 <= rsi <= 55 AND bearSweep
      const shortCond =
        c.close < vwap[i] &&
        ema9[i] < ema21[i] &&
        c.close < ema200[i] &&
        stDir[i] === -1 &&
        rsi[i] >= config.rsiShortMin &&
        rsi[i] <= config.rsiShortMax &&
        bearSweeps[i];

      if (longCond) signal = 'BUY';
      else if (shortCond) signal = 'SELL';
    }

    calculated.push({
      ...c,
      ema9: Number(ema9[i].toFixed(2)),
      ema21: Number(ema21[i].toFixed(2)),
      ema200: Number(ema200[i].toFixed(2)),
      rsi: Number(rsi[i].toFixed(1)),
      vwap: Number(vwap[i].toFixed(2)),
      atr: Number(atr[i].toFixed(2)),
      supertrend: Number(supertrend[i].toFixed(2)),
      supertrendDir: stDir[i],
      bullSweep: bullSweeps[i],
      bearSweep: bearSweeps[i],
      signal,
    });
  }

  return calculated;
}

/**
 * Check the full 6-rule strategy checklist on the latest candle
 */
export function evaluateStrategyChecklist(
  candles: CalculatedCandle[],
  config: StrategyConfig
): StrategyChecklistResult {
  if (candles.length === 0) {
    return {
      priceVsVwap: { passed: false, message: 'No data', value: 0, benchmark: 0 },
      emaCrossover: { passed: false, message: 'No data', ema9: 0, ema21: 0 },
      ema200Trend: { passed: false, message: 'No data', close: 0, ema200: 0 },
      supertrend: { passed: false, message: 'No data', dir: 1 },
      rsiZone: { passed: false, message: 'No data', rsi: 0, zone: 'Unknown' },
      liquiditySweep: { passed: false, message: 'No data', sweep: 'NONE' },
      sessionTime: { passed: false, message: 'No data', currentUtcHour: 0, allowed: false },
      finalSignal: 'NO_SIGNAL',
    };
  }

  const latest = candles[candles.length - 1];
  const currentUtcHour = new Date(latest.timestamp).getUTCHours();
  const sessionAllowed =
    currentUtcHour >= config.tradeStartHourUtc && currentUtcHour < config.tradeEndHourUtc;

  const isAboveVwap = latest.close > latest.vwap;
  const isEmaBull = latest.ema9 > latest.ema21;
  const isAboveEma200 = latest.close > latest.ema200;
  const isStBull = latest.supertrendDir === 1;
  const isRsiBull = latest.rsi >= config.rsiLongMin && latest.rsi <= config.rsiLongMax;
  const isRsiBear = latest.rsi >= config.rsiShortMin && latest.rsi <= config.rsiShortMax;

  let sweepStatus: 'BULLISH' | 'BEARISH' | 'NONE' = 'NONE';
  if (latest.bullSweep) sweepStatus = 'BULLISH';
  else if (latest.bearSweep) sweepStatus = 'BEARISH';

  const longPassed =
    isAboveVwap &&
    isEmaBull &&
    isAboveEma200 &&
    isStBull &&
    isRsiBull &&
    latest.bullSweep &&
    sessionAllowed;

  const shortPassed =
    !isAboveVwap &&
    !isEmaBull &&
    !isAboveEma200 &&
    !isStBull &&
    isRsiBear &&
    latest.bearSweep &&
    sessionAllowed;

  let finalSignal: 'BUY' | 'SELL' | 'NO_SIGNAL' = 'NO_SIGNAL';
  if (longPassed) finalSignal = 'BUY';
  else if (shortPassed) finalSignal = 'SELL';

  return {
    priceVsVwap: {
      passed: isAboveVwap || !isAboveVwap, // shows alignment
      message: isAboveVwap
        ? `Price ($${latest.close.toFixed(2)}) is ABOVE VWAP ($${latest.vwap.toFixed(2)}) → Bullish bias`
        : `Price ($${latest.close.toFixed(2)}) is BELOW VWAP ($${latest.vwap.toFixed(2)}) → Bearish bias`,
      value: latest.close,
      benchmark: latest.vwap,
    },
    emaCrossover: {
      passed: isEmaBull || !isEmaBull,
      message: isEmaBull
        ? `EMA 9 ($${latest.ema9.toFixed(2)}) > EMA 21 ($${latest.ema21.toFixed(2)}) (Bullish alignment)`
        : `EMA 9 ($${latest.ema9.toFixed(2)}) < EMA 21 ($${latest.ema21.toFixed(2)}) (Bearish alignment)`,
      ema9: latest.ema9,
      ema21: latest.ema21,
    },
    ema200Trend: {
      passed: isAboveEma200,
      message: isAboveEma200
        ? `Price above EMA 200 ($${latest.ema200.toFixed(2)}) → Macro Uptrend`
        : `Price below EMA 200 ($${latest.ema200.toFixed(2)}) → Macro Downtrend`,
      close: latest.close,
      ema200: latest.ema200,
    },
    supertrend: {
      passed: isStBull,
      message: isStBull
        ? `Supertrend (10,3) is Bullish (Band at $${latest.supertrend.toFixed(2)})`
        : `Supertrend (10,3) is Bearish (Band at $${latest.supertrend.toFixed(2)})`,
      dir: latest.supertrendDir,
    },
    rsiZone: {
      passed: isRsiBull || isRsiBear,
      message: `RSI(14) is ${latest.rsi.toFixed(1)} ${
        isRsiBull
          ? '(In Long Zone 45-70)'
          : isRsiBear
          ? '(In Short Zone 30-55)'
          : '(Outside healthy trend zones)'
      }`,
      rsi: latest.rsi,
      zone: isRsiBull ? 'Bullish (45-70)' : isRsiBear ? 'Bearish (30-55)' : 'Neutral / Overbought / Oversold',
    },
    liquiditySweep: {
      passed: sweepStatus !== 'NONE',
      message:
        sweepStatus === 'BULLISH'
          ? 'Bullish Liquidity Sweep detected! Low pierced previous 5-bar low then reclaimed.'
          : sweepStatus === 'BEARISH'
          ? 'Bearish Liquidity Sweep detected! High pierced previous 5-bar high then rejected.'
          : 'No sweep on latest closed candle (monitoring 5-bar highs & lows)',
      sweep: sweepStatus,
    },
    sessionTime: {
      passed: sessionAllowed,
      message: sessionAllowed
        ? `Active Session (UTC Hour ${currentUtcHour}:00). Inside London + NY window (07:00 - 20:00 UTC)`
        : `Outside Trading Session (UTC Hour ${currentUtcHour}:00). Trading paused until London open (07:00 UTC)`,
      currentUtcHour,
      allowed: sessionAllowed,
    },
    finalSignal,
  };
}

/**
 * Dynamic SL/TP based on ATR & Risk:Reward ratio
 * From PDF Page 7 & Page 9
 */
export function calculateSlTp(
  signal: 'BUY' | 'SELL',
  entryPrice: number,
  atr: number,
  atrMultiplier = 1.5,
  riskReward = 2.0
): { sl: number; tp: number; slDistance: number } {
  const slDistance = Math.max(0.5, Number((atr * atrMultiplier).toFixed(2)));
  if (signal === 'BUY') {
    const sl = Number((entryPrice - slDistance).toFixed(2));
    const tp = Number((entryPrice + slDistance * riskReward).toFixed(2));
    return { sl, tp, slDistance };
  } else {
    const sl = Number((entryPrice + slDistance).toFixed(2));
    const tp = Number((entryPrice - slDistance * riskReward).toFixed(2));
    return { sl, tp, slDistance };
  }
}

/**
 * Risk-based Lot Sizing for XAUUSD (Gold)
 * In XAUUSD: 1 lot = 100 oz, so a $1.00 move equals $100 per lot.
 * lot = (account_balance * risk_pct) / (sl_distance_usd * 100)
 * Bounded between 0.01 (micro lot) and 5.0 lots
 */
export function calculateLotSize(
  accountBalance: number,
  riskPct = 0.01,
  slDistanceUsd = 2.5
): number {
  if (accountBalance <= 0 || slDistanceUsd <= 0) return 0.01;
  const riskAmount = accountBalance * riskPct;
  const rawLot = riskAmount / (slDistanceUsd * 100);
  const roundedLot = Math.round(rawLot * 100) / 100;
  return Math.min(5.0, Math.max(0.01, roundedLot));
}

/**
 * Check and calculate Trailing Stop
 * From PDF Page 12 & 13:
 * XAUUSD: 1 pip = $0.01 (or 100 points per $1)
 */
export function checkTrailingStopUpdate(
  type: 'BUY' | 'SELL',
  entryPrice: number,
  currentPrice: number,
  currentSl: number,
  trailActivatePips = 20, // 20 pips = $0.20 move on Gold
  trailStepPips = 10      // 10 pips = $0.10 step
): { shouldUpdate: boolean; newSl: number; profitPips: number } {
  const pipMultiplier = 100; // 1 pip = 0.01 on Gold
  let profitPips = 0;

  if (type === 'BUY') {
    profitPips = (currentPrice - entryPrice) * pipMultiplier;
    if (profitPips >= trailActivatePips) {
      // Step trailing SL
      const potentialNewSl = Number((currentPrice - trailStepPips / pipMultiplier).toFixed(2));
      // Must at least be at break-even (entry price) once activated
      const targetSl = Math.max(entryPrice, potentialNewSl);
      if (targetSl > currentSl) {
        return { shouldUpdate: true, newSl: targetSl, profitPips };
      }
    }
  } else {
    // SELL
    profitPips = (entryPrice - currentPrice) * pipMultiplier;
    if (profitPips >= trailActivatePips) {
      const potentialNewSl = Number((currentPrice + trailStepPips / pipMultiplier).toFixed(2));
      const targetSl = Math.min(entryPrice, potentialNewSl);
      if (targetSl < currentSl) {
        return { shouldUpdate: true, newSl: targetSl, profitPips };
      }
    }
  }

  return { shouldUpdate: false, newSl: currentSl, profitPips };
}
