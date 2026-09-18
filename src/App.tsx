import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Download,
  Send,
  SlidersHorizontal,
  History,
  Activity,
  Layers,
  Zap,
  BarChart2,
  DollarSign,
  Lock,
  PlusCircle,
  FileCheck,
  RotateCcw,
} from 'lucide-react';
import {
  Candle,
  CalculatedCandle,
  StrategyConfig,
  TradePosition,
  BalanceSnapshot,
  BalanceLedgerEntry,
  Mt5Config,
  TelegramConfig,
  BotLogEntry,
} from './types';
import {
  DEFAULT_CONFIG,
  generateInitialCandles,
  INITIAL_SNAPSHOTS,
  INITIAL_LEDGER,
  SAMPLE_HISTORICAL_TRADES,
} from './data/defaultData';
import {
  processAllIndicators,
  evaluateStrategyChecklist,
  calculateSlTp,
  calculateLotSize,
  checkTrailingStopUpdate,
} from './utils/indicators';
import { Navbar } from './components/Navbar';
import { ChartSection } from './components/ChartSection';
import { SignalChecklist } from './components/SignalChecklist';
import { PositionManager } from './components/PositionManager';
import { BacktestPanel } from './components/BacktestPanel';
import { BalanceVaultModal } from './components/BalanceVaultModal';
import { CodeExporterModal } from './components/CodeExporterModal';
import { TelegramTesterModal } from './components/TelegramTesterModal';
import { ConfigModal } from './components/ConfigModal';
import { ApiHubModal } from './components/ApiHubModal';
import { BotEngineConsole } from './components/BotEngineConsole';
import { api } from './utils/api';

export default function App() {
  // Strategy Configuration
  const [config, setConfig] = useState<StrategyConfig>(() => {
    try {
      const saved = localStorage.getItem('xauusd_strategy_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  // Current Symbol
  const [currentSymbol, setCurrentSymbol] = useState<string>('XAUUSD');

  // Raw Candles
  const [rawCandles, setRawCandles] = useState<Candle[]>(() => generateInitialCandles(100));

  // Software Balance & Capital Vault State
  const [softwareBalance, setSoftwareBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('xauusd_software_balance');
      return saved ? parseFloat(saved) : 10000.0;
    } catch {
      return 10000.0;
    }
  });

  const [snapshots, setSnapshots] = useState<BalanceSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem('xauusd_balance_snapshots');
      return saved ? JSON.parse(saved) : INITIAL_SNAPSHOTS;
    } catch {
      return INITIAL_SNAPSHOTS;
    }
  });

  const [ledger, setLedger] = useState<BalanceLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('xauusd_balance_ledger');
      return saved ? JSON.parse(saved) : INITIAL_LEDGER;
    } catch {
      return INITIAL_LEDGER;
    }
  });

  // Trade Positions
  const [openPositions, setOpenPositions] = useState<TradePosition[]>([]);
  const [closedTrades, setClosedTrades] = useState<TradePosition[]>(() => SAMPLE_HISTORICAL_TRADES);

  // Live simulation tick state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Modal open states
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isApiHubOpen, setIsApiHubOpen] = useState<boolean>(false);

  // Active view tab (Monitoring & Execution / Backtest Analytics)
  const [mainView, setMainView] = useState<'live' | 'backtest'>('live');

  // MT5 and Telegram configs
  const [mt5Config] = useState<Mt5Config>({
    login: 123456789,
    server: 'ICMarkets-Live',
    passwordMasked: '••••••••••••',
    terminalPath: 'C:\\Program Files\\MetaTrader 5\\terminal64.exe',
    isConnected: true,
    pingMs: 18,
  });

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({
    botToken: '1234567890:ABCdefGHIjklMNOpqrSTUvwxYZ',
    chatId: '123456789',
    enabled: true,
  });

  // Bot Engine Auto-Pilot State & Daemon Console Logs
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(true);
  const [botLogs, setBotLogs] = useState<BotLogEntry[]>([
    {
      id: 'log-boot-1',
      timestamp: new Date().toTimeString().substring(0, 8),
      level: 'INFO',
      message: '🚀 Stock Learners Algo Bot (MT5 Daemon) initialized',
    },
    {
      id: 'log-boot-2',
      timestamp: new Date().toTimeString().substring(0, 8),
      level: 'INFO',
      message: '🤖 MetaTrader 5 Gateway connected: ICMarkets-Live (Login: 123456789)',
    },
    {
      id: 'log-boot-3',
      timestamp: new Date().toTimeString().substring(0, 8),
      level: 'INFO',
      message: '🛡️ Software Balance Vault active: $10,000.00 • 1% Dynamic Risk sizing rule engaged',
    },
    {
      id: 'log-boot-4',
      timestamp: new Date().toTimeString().substring(0, 8),
      level: 'INFO',
      message: '📱 Telegram alert dispatcher linked to bot token',
    },
    {
      id: 'log-boot-5',
      timestamp: new Date().toTimeString().substring(0, 8),
      level: 'INFO',
      message: '🟢 Autonomous Auto-Pilot active: Scanning M5 candles for 6-rule confluence...',
    },
  ]);
  const lastAutoTradedCandleRef = useRef<number | null>(null);

  // Append a log entry to local state and remote backend
  const addLog = useCallback((level: BotLogEntry['level'], message: string) => {
    const timestamp = new Date().toTimeString().substring(0, 8);
    const newLog: BotLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      level,
      message,
    };
    setBotLogs((prev) => [...prev.slice(-150), newLog]);
    api.sendBotLog(level, message).catch(() => {});
  }, []);

  // Toggle Auto-Trading mode
  const handleToggleAutoTrading = useCallback(() => {
    setIsAutoTrading((prev) => {
      const next = !prev;
      api.setBotState(next).catch(() => {});
      addLog(
        'INFO',
        next
          ? '🟢 Auto-Pilot Activated — Bot will automatically execute orders and trail SL on verified confluence'
          : '⏸ Auto-Pilot Paused — Manual confirmation mode only'
      );
      return next;
    });
  }, [addLog]);

  // Force signal candle generator to demonstrate the exact bot in action
  const handleForceSignal = useCallback(
    (type: 'BUY' | 'SELL') => {
      setRawCandles((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const now = last ? last.timestamp + 5 * 60 * 1000 : Date.now();
        const date = new Date(now);
        const timeStr = `${String(date.getUTCHours()).padStart(2, '0')}:${String(
          date.getUTCMinutes()
        ).padStart(2, '0')}`;

        const recent5 = prev.slice(-5);
        const minLow = Math.min(...recent5.map((c) => c.low));
        const maxHigh = Math.max(...recent5.map((c) => c.high));

        let open = last.close;
        let high = open;
        let low = open;
        let close = open;

        if (type === 'BUY') {
          // Sharp wick down sweeping past 5-candle low, strong bullish reclaim above open & VWAP
          low = Number((minLow - 2.80).toFixed(2));
          close = Number((open + 2.60).toFixed(2));
          high = Number((close + 0.80).toFixed(2));
          addLog(
            'SIGNAL',
            `⚡ [Signal Test] Injected Bullish Liquidity Sweep: Low spiked to $${low} (swept 5-bar low $${minLow.toFixed(2)}) and reclaimed to $${close}`
          );
        } else {
          // Sharp wick up sweeping past 5-candle high, strong bearish rejection below open & VWAP
          high = Number((maxHigh + 2.80).toFixed(2));
          close = Number((open - 2.60).toFixed(2));
          low = Number((close - 0.80).toFixed(2));
          addLog(
            'SIGNAL',
            `⚡ [Signal Test] Injected Bearish Liquidity Sweep: High spiked to $${high} (swept 5-bar high $${maxHigh.toFixed(2)}) and rejected to $${close}`
          );
        }

        const forceCandle: Candle = {
          time: timeStr,
          timestamp: now,
          open,
          high,
          low,
          close,
          volume: 2400,
        };

        return [...prev.slice(1), forceCandle];
      });
    },
    [addLog]
  );

  // Load real-time market data from backend API
  const loadMarketData = useCallback(async (symbol: string) => {
    try {
      const res = await api.getMarketData(symbol, 100);
      if (res && res.candles && res.candles.length > 0) {
        setRawCandles(res.candles);
      }
    } catch (err) {
      console.warn('API market data fallback to local generator', err);
    }
  }, []);

  // Fetch live market data on startup and sync server balance
  useEffect(() => {
    loadMarketData('XAUUSD');
    api.getBalanceStore().then((res) => {
      if (res && typeof res.softwareBalance === 'number' && res.softwareBalance !== 10000) {
        setSoftwareBalance(res.softwareBalance);
        if (res.snapshots && res.snapshots.length > 0) {
          setSnapshots(res.snapshots);
        }
        if (res.ledger && res.ledger.length > 0) {
          setLedger(res.ledger);
        }
      }
    }).catch(() => {});
  }, [loadMarketData]);

  // Process technical indicators across candles
  const calculatedCandles = useMemo(() => {
    return processAllIndicators(rawCandles, config);
  }, [rawCandles, config]);

  const latestCandle = calculatedCandles[calculatedCandles.length - 1];
  const currentPrice = latestCandle ? latestCandle.close : 2652.5;
  const bidPrice = currentPrice;
  const askPrice = Number((currentPrice + 0.18).toFixed(2));

  // Floating PnL calculation
  const floatingPnl = useMemo(() => {
    return openPositions.reduce((acc, pos) => {
      const priceDiff = pos.type === 'BUY' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
      const posPnl = priceDiff * pos.lot * 100; // 1 lot on XAUUSD = $100 per $1
      return acc + posPnl;
    }, 0);
  }, [openPositions, currentPrice]);

  const equity = Number((softwareBalance + floatingPnl).toFixed(2));
  const marginUsed = openPositions.reduce((acc, p) => acc + p.lot * 150, 0); // approx $150 margin per lot on 1:500
  const freeMargin = Math.max(0, Number((equity - marginUsed).toFixed(2)));

  // Strategy checklist evaluation on latest candle
  const checklist = useMemo(() => {
    return evaluateStrategyChecklist(calculatedCandles, config);
  }, [calculatedCandles, config]);

  // Dynamic SL, TP & Lot Sizing based on 1% Software Balance Risk
  const dynamicRisk = useMemo(() => {
    const atr = latestCandle ? latestCandle.atr : 2.5;
    const { sl, tp, slDistance } = calculateSlTp('BUY', currentPrice, atr, config.atrMultiplierSl, config.riskReward);
    const lot = calculateLotSize(softwareBalance, config.riskPct, slDistance);
    return { sl, tp, lot, slDistance };
  }, [latestCandle, currentPrice, config, softwareBalance]);

  // Session hours check (07:00 to 20:00 UTC)
  const isSessionActive = useMemo(() => {
    const currentUtcHour = new Date().getUTCHours();
    return currentUtcHour >= config.tradeStartHourUtc && currentUtcHour < config.tradeEndHourUtc;
  }, [config.tradeStartHourUtc, config.tradeEndHourUtc]);

  // Persist balance changes
  useEffect(() => {
    try {
      localStorage.setItem('xauusd_software_balance', softwareBalance.toString());
    } catch (e) {
      console.warn(e);
    }
  }, [softwareBalance]);

  useEffect(() => {
    try {
      localStorage.setItem('xauusd_balance_snapshots', JSON.stringify(snapshots));
    } catch (e) {
      console.warn(e);
    }
  }, [snapshots]);

  useEffect(() => {
    try {
      localStorage.setItem('xauusd_balance_ledger', JSON.stringify(ledger));
    } catch (e) {
      console.warn(e);
    }
  }, [ledger]);

  // Update software balance specified by user
  const handleSetBalance = useCallback((newBalance: number, reason: string) => {
    api.updateBalance(newBalance, reason).catch(() => {});
    setSoftwareBalance((prev) => {
      const change = newBalance - prev;
      const newEntry: BalanceLedgerEntry = {
        id: `led-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'USER_ADJUSTMENT',
        amount: change,
        previousBalance: prev,
        newBalance: newBalance,
        description: reason || 'Software balance updated by user',
      };
      setLedger((l) => [newEntry, ...l]);
      return newBalance;
    });
  }, []);

  // Create balance snapshot backup
  const handleCreateSnapshot = useCallback(
    (title: string, notes: string, type: BalanceSnapshot['type'] = 'MANUAL_BACKUP') => {
      const newSnap: BalanceSnapshot = {
        id: `snap-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
        createdAt: Date.now(),
        title: title || 'Software Balance Backup',
        softwareBalance: softwareBalance,
        equity: equity,
        margin: marginUsed,
        freeMargin: freeMargin,
        currency: 'USD',
        openTradesCount: openPositions.length,
        floatingPnl: floatingPnl,
        realizedPnl: softwareBalance - 10000,
        notes: notes || 'Secured balance checkpoint',
        type,
      };
      api.saveSnapshot(newSnap).catch(() => {});
      setSnapshots((prev) => [newSnap, ...prev]);
    },
    [softwareBalance, equity, marginUsed, freeMargin, openPositions.length, floatingPnl]
  );

  // Restore snapshot
  const handleRestoreSnapshot = useCallback((snap: BalanceSnapshot) => {
    api.restoreSnapshot(snap.id).catch(() => {});
    setSoftwareBalance((prev) => {
      const newEntry: BalanceLedgerEntry = {
        id: `led-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        type: 'BACKUP_RESTORE',
        amount: snap.softwareBalance - prev,
        previousBalance: prev,
        newBalance: snap.softwareBalance,
        description: `Restored software balance from backup "${snap.title}"`,
      };
      setLedger((l) => [newEntry, ...l]);
      return snap.softwareBalance;
    });
  }, []);

  // Export JSON backup file
  const handleExportJson = useCallback(() => {
    const backupData = {
      exportTimestamp: new Date().toISOString(),
      softwareBalance,
      equity,
      marginUsed,
      freeMargin,
      currency: 'USD',
      symbol: currentSymbol,
      snapshots,
      ledger,
      config,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `software_balance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [softwareBalance, equity, marginUsed, freeMargin, currentSymbol, snapshots, ledger, config]);

  // Export CSV ledger
  const handleExportCsv = useCallback(() => {
    const headers = 'ID,Timestamp,Type,Amount,PreviousBalance,NewBalance,Description\n';
    const rows = ledger
      .map(
        (e) =>
          `"${e.id}","${e.timestamp}","${e.type}",${e.amount},${e.previousBalance},${e.newBalance},"${e.description.replace(/"/g, '""')}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `software_balance_ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [ledger]);

  // Import JSON backup file
  const handleImportJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (typeof parsed.softwareBalance === 'number') {
          setSoftwareBalance(parsed.softwareBalance);
        }
        if (Array.isArray(parsed.snapshots)) {
          setSnapshots(parsed.snapshots);
        }
        if (Array.isArray(parsed.ledger)) {
          setLedger(parsed.ledger);
        }
        if (parsed.config) {
          setConfig(parsed.config);
        }
        api.importBalanceStore({
          softwareBalance: parsed.softwareBalance,
          equity: parsed.equity ?? parsed.softwareBalance,
          snapshots: parsed.snapshots,
          ledger: parsed.ledger,
        }).catch(() => {});
      } catch (err) {
        console.error('Failed to import backup file', err);
      }
    };
    reader.readAsText(file);
  }, []);

  // Execute a trade (simulated or manual)
  const handleExecuteTrade = useCallback(
    (type: 'BUY' | 'SELL') => {
      if (openPositions.length >= config.maxTrades) {
        alert('Maximum open trades reached (1 max position allowed by Risk Manager)');
        return;
      }

      const atr = latestCandle ? latestCandle.atr : 2.5;
      const { sl, tp, slDistance } = calculateSlTp(type, currentPrice, atr, config.atrMultiplierSl, config.riskReward);
      const lot = calculateLotSize(softwareBalance, config.riskPct, slDistance);

      const newTrade: TradePosition = {
        id: `trade-${Date.now()}`,
        ticket: Math.floor(Math.random() * 800000) + 1000000,
        symbol: currentSymbol,
        type,
        entryPrice: currentPrice,
        currentPrice: currentPrice,
        sl,
        tp,
        originalSl: sl,
        lot,
        pnl: 0,
        pips: 0,
        openTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: 'OPEN',
        magic: config.magicNumber,
        comment: config.tradeComment,
        trailingActivated: false,
      };

      setOpenPositions([newTrade]);

      // Execute on MT5 Bridge API
      api.executeMt5Order({
        symbol: currentSymbol,
        signal: type,
        volume: lot,
        sl,
        tp,
        price: currentPrice,
      }).catch((e) => console.warn('MT5 bridge notify error:', e));

      addLog(
        'TRADE',
        `🤖 ${type} Order Placed on MT5 | Ticket: #${newTrade.ticket} | Lots: ${lot} | Price: $${currentPrice.toFixed(2)} | SL: $${sl.toFixed(2)} | TP: $${tp.toFixed(2)}`
      );

      // Auto-dispatch Telegram alert if enabled
      if (telegramConfig.enabled) {
        api.sendTelegramAlert({
          type: 'OPEN_TRADE',
          symbol: currentSymbol,
          action: type,
          entry: currentPrice,
          sl,
          tp,
          lot,
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
        }).then(() => {
          addLog('SUCCESS', `📱 Telegram Trade Alert delivered to chat ID ${telegramConfig.chatId}`);
        }).catch((e) => console.warn('Telegram notify error:', e));
      }
    },
    [openPositions.length, config, latestCandle, currentPrice, softwareBalance, currentSymbol, telegramConfig, addLog]
  );

  // Close trade handler
  const handleClosePosition = useCallback(
    (id: string, reason: TradePosition['closeReason'] = 'MANUAL') => {
      const pos = openPositions.find((p) => p.id === id);
      if (!pos) return;

      const priceDiff = pos.type === 'BUY' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
      const finalPnl = Number((priceDiff * pos.lot * 100).toFixed(2));
      const finalPips = Number(((currentPrice - pos.entryPrice) * 100).toFixed(0));

      const closedPos: TradePosition = {
        ...pos,
        status: 'CLOSED',
        closePrice: currentPrice,
        closeTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        closeReason: reason,
        pnl: finalPnl,
        pips: finalPips,
      };

      setClosedTrades((prev) => [closedPos, ...prev]);
      setOpenPositions((prev) => prev.filter((p) => p.id !== id));

      // Close on MT5 Bridge
      api.closeMt5Position(pos.ticket).catch(() => {});

      if (reason === 'TP') {
        addLog('SUCCESS', `💰 [Take Profit Reached] Closed ${pos.type} #${pos.ticket} @ $${currentPrice.toFixed(2)} | Realized: +$${finalPnl} (+${finalPips} pips)`);
      } else if (reason === 'SL') {
        addLog('WARN', `🛑 [Stop Loss Hit] Closed ${pos.type} #${pos.ticket} @ $${currentPrice.toFixed(2)} | Realized: -$${Math.abs(finalPnl)}`);
      } else {
        addLog('INFO', `Manual override close on ${pos.type} #${pos.ticket} @ $${currentPrice.toFixed(2)} | PnL: $${finalPnl}`);
      }

      // Dispatch Telegram alert if enabled
      if (telegramConfig.enabled) {
        api.sendTelegramAlert({
          type: 'CLOSE_TRADE',
          symbol: pos.symbol,
          action: pos.type,
          entry: pos.entryPrice,
          tp: currentPrice,
          pnl: finalPnl,
          pips: finalPips,
          reason: reason,
          botToken: telegramConfig.botToken,
          chatId: telegramConfig.chatId,
        }).catch((e) => console.warn('Telegram close notify error:', e));
      }

      // Update software balance with trade PnL
      setSoftwareBalance((prevBal) => {
        const newBal = Number((prevBal + finalPnl).toFixed(2));
        api.updateBalance(newBal, `Trade closed: ${pos.type} #${pos.ticket} PnL $${finalPnl}`).catch(() => {});
        const newEntry: BalanceLedgerEntry = {
          id: `led-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
          type: finalPnl >= 0 ? 'TRADE_PROFIT' : 'TRADE_LOSS',
          amount: finalPnl,
          previousBalance: prevBal,
          newBalance: newBal,
          description: `Closed ${pos.type} #${pos.ticket} on ${pos.symbol} (${reason})`,
        };
        setLedger((l) => [newEntry, ...l]);
        return newBal;
      });
    },
    [openPositions, currentPrice, telegramConfig, addLog]
  );

  // Close all positions
  const handleCloseAllPositions = useCallback(() => {
    api.closeAllMt5Positions().catch(() => {});
    openPositions.forEach((pos) => {
      handleClosePosition(pos.id, 'MANUAL');
    });
  }, [openPositions, handleClosePosition]);

  // Autonomous Bot Execution Engine (Replicating main.py loop)
  useEffect(() => {
    if (!isAutoTrading) return;
    if (openPositions.length >= config.maxTrades) return;
    if (!checklist.sessionTime.allowed) return;

    const signal = checklist.finalSignal;
    if (signal !== 'BUY' && signal !== 'SELL') return;

    const candleTimestamp = latestCandle?.timestamp;
    if (!candleTimestamp) return;

    if (lastAutoTradedCandleRef.current === candleTimestamp) {
      return;
    }

    lastAutoTradedCandleRef.current = candleTimestamp;

    addLog(
      'SIGNAL',
      `🟢 6-Rule Confluence CONFIRMED: ${signal} on ${currentSymbol} at $${currentPrice.toFixed(2)}`
    );
    addLog(
      'INFO',
      `Dynamic Risk Math: Software Balance $${softwareBalance.toFixed(2)} | 1% Risk = $${(
        softwareBalance * config.riskPct
      ).toFixed(2)} | Target Lot = ${dynamicRisk.lot}`
    );

    handleExecuteTrade(signal);
  }, [
    isAutoTrading,
    checklist.finalSignal,
    checklist.sessionTime.allowed,
    openPositions.length,
    config.maxTrades,
    config.riskPct,
    latestCandle?.timestamp,
    currentSymbol,
    currentPrice,
    softwareBalance,
    dynamicRisk.lot,
    handleExecuteTrade,
    addLog,
  ]);

  // Simulate advancing trailing stop loss
  const handleSimulateTrailingAdvance = useCallback(
    (id: string) => {
      setOpenPositions((prev) =>
        prev.map((pos) => {
          if (pos.id !== id) return pos;
          // Step price 15 pips in trade direction
          const deltaPrice = pos.type === 'BUY' ? 0.35 : -0.35;
          const simPrice = Number((pos.currentPrice + deltaPrice).toFixed(2));
          const { shouldUpdate, newSl, profitPips } = checkTrailingStopUpdate(
            pos.type,
            pos.entryPrice,
            simPrice,
            pos.sl,
            config.trailActivatePips,
            config.trailStepPips
          );

          if (shouldUpdate && telegramConfig.enabled) {
            api.sendTelegramAlert({
              type: 'TRAIL_UPDATE',
              symbol: pos.symbol,
              action: pos.type,
              entry: pos.entryPrice,
              sl: newSl,
              pips: profitPips,
              botToken: telegramConfig.botToken,
              chatId: telegramConfig.chatId,
            }).catch(() => {});
          }

          const newPnl = (pos.type === 'BUY' ? simPrice - pos.entryPrice : pos.entryPrice - simPrice) * pos.lot * 100;

          return {
            ...pos,
            currentPrice: simPrice,
            sl: shouldUpdate ? newSl : pos.sl,
            trailingActivated: shouldUpdate || pos.trailingActivated,
            pnl: Number(newPnl.toFixed(2)),
            pips: profitPips,
          };
        })
      );
    },
    [config.trailActivatePips, config.trailStepPips, telegramConfig]
  );

  // Step 1 new 5M candle
  const handleNextCandle = useCallback(() => {
    setRawCandles((prev) => {
      const last = prev[prev.length - 1];
      const now = last ? last.timestamp + 5 * 60 * 1000 : Date.now();
      const date = new Date(now);
      const timeStr = `${String(date.getUTCHours()).padStart(2, '0')}:${String(
        date.getUTCMinutes()
      ).padStart(2, '0')}`;

      const delta = (Math.random() - 0.47) * 2.2;
      const open = last ? last.close : 2650;
      const close = Number((open + delta).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * 1.5).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * 1.5).toFixed(2));
      const volume = Math.floor(Math.random() * 600) + 400;

      const newCandle: Candle = {
        time: timeStr,
        timestamp: now,
        open,
        high,
        low,
        close,
        volume,
      };

      return [...prev.slice(1), newCandle];
    });
  }, []);

  // Reset to initial candles
  const handleResetCandles = useCallback(() => {
    setRawCandles(generateInitialCandles(100));
  }, []);

  // Switch symbol
  const handleSymbolChange = useCallback((sym: string) => {
    setCurrentSymbol(sym);
    loadMarketData(sym);
  }, [loadMarketData]);

  // Tick simulation loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      handleNextCandle();

      // Check open trade TP / SL hits or trailing stop updates
      setOpenPositions((prev) => {
        return prev.map((pos) => {
          const simPrice = currentPrice;
          const priceDiff = pos.type === 'BUY' ? simPrice - pos.entryPrice : pos.entryPrice - simPrice;
          const pnl = priceDiff * pos.lot * 100;
          const pips = (simPrice - pos.entryPrice) * 100;

          // Trailing stop automatic check (equivalent to risk_manager.check_and_trail in Python bot)
          let currentSl = pos.sl;
          let isTrailingUpdated = false;
          if (config.trailEnabled) {
            const trailCheck = checkTrailingStopUpdate(
              pos.type,
              pos.entryPrice,
              simPrice,
              pos.sl,
              config.trailActivatePips,
              config.trailStepPips
            );
            if (trailCheck.shouldUpdate) {
              currentSl = trailCheck.newSl;
              isTrailingUpdated = true;
              addLog('TRAIL', `📈 [Auto-Trailing] SL stepped to $${currentSl.toFixed(2)} (+${trailCheck.profitPips.toFixed(1)} pips profit locked)`);
              if (telegramConfig.enabled) {
                api.sendTelegramAlert({
                  type: 'TRAIL_UPDATE',
                  symbol: pos.symbol,
                  action: pos.type,
                  entry: pos.entryPrice,
                  sl: currentSl,
                  pips: trailCheck.profitPips,
                  botToken: telegramConfig.botToken,
                  chatId: telegramConfig.chatId,
                }).catch(() => {});
              }
            }
          }

          // Check TP
          if (pos.type === 'BUY' && simPrice >= pos.tp) {
            setTimeout(() => handleClosePosition(pos.id, 'TP'), 50);
          } else if (pos.type === 'SELL' && simPrice <= pos.tp) {
            setTimeout(() => handleClosePosition(pos.id, 'TP'), 50);
          }

          // Check SL
          if (pos.type === 'BUY' && simPrice <= currentSl) {
            setTimeout(() => handleClosePosition(pos.id, 'SL'), 50);
          } else if (pos.type === 'SELL' && simPrice >= currentSl) {
            setTimeout(() => handleClosePosition(pos.id, 'SL'), 50);
          }

          return {
            ...pos,
            currentPrice: simPrice,
            sl: currentSl,
            trailingActivated: isTrailingUpdated || pos.trailingActivated,
            pnl: Number(pnl.toFixed(2)),
            pips: Number(pips.toFixed(0)),
          };
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [
    isSimulating,
    handleNextCandle,
    currentPrice,
    handleClosePosition,
    config.trailEnabled,
    config.trailActivatePips,
    config.trailStepPips,
    telegramConfig,
    addLog,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentPrice={currentPrice}
        bidPrice={bidPrice}
        askPrice={askPrice}
        softwareBalance={softwareBalance}
        equity={equity}
        openTradesCount={openPositions.length}
        mt5Config={mt5Config}
        isSessionActive={isSessionActive}
        onOpenVault={() => setIsVaultOpen(true)}
        onOpenCodeModal={() => setIsCodeModalOpen(true)}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenApiHub={() => setIsApiHubOpen(true)}
        isAutoTrading={isAutoTrading}
        onToggleAutoTrading={handleToggleAutoTrading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-5 space-y-5">
        {/* Prominent Balance Safeguard & Tell Balance Banner */}
        <section
          id="software-balance-safeguard-banner"
          className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 p-5 shadow-2xl overflow-hidden"
        >
          {/* Subtle glow accent */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            {/* Balance Overview */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Software Balance Safeguard & Capital Vault
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  {snapshots.length} Backups Saved
                </span>
              </div>

              <div className="flex items-baseline gap-4 flex-wrap">
                <div>
                  <span className="text-xs text-slate-400 block">Current Software Balance:</span>
                  <div className="text-3xl font-extrabold font-mono text-amber-300 tracking-tight">
                    ${softwareBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                <div>
                  <span className="text-xs text-slate-400 block">Account Equity:</span>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    ${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                <div>
                  <span className="text-xs text-slate-400 block">1% Risk per Trade:</span>
                  <div className="text-xl font-bold font-mono text-cyan-300">
                    ${(softwareBalance * config.riskPct).toFixed(2)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-2xl">
                The bot dynamically sizes XAUUSD positions so risk never exceeds 1% of your software balance. Click below to tell your custom balance or take an instant offline backup.
              </p>
            </div>

            {/* Quick Balance Actions */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                id="tell-software-balance-banner-btn"
                onClick={() => setIsVaultOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Tell / Update Balance</span>
              </button>

              <button
                id="instant-backup-banner-btn"
                onClick={() => {
                  handleCreateSnapshot(
                    `Manual Backup @ $${softwareBalance.toFixed(0)}`,
                    'Instant snapshot from top safeguard banner'
                  );
                  alert(`Software balance of $${softwareBalance.toFixed(2)} backed up successfully!`);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Quick Backup</span>
              </button>

              <button
                id="export-offline-json-btn"
                onClick={handleExportJson}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 transition"
                title="Download Offline JSON Backup"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* View Switcher Tabs (Live Monitoring vs Backtest Analytics) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              id="view-tab-live"
              onClick={() => setMainView('live')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                mainView === 'live'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4" />
              Live Telemetry & Signal Scanner
            </button>

            <button
              id="view-tab-backtest"
              onClick={() => setMainView('backtest')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                mainView === 'backtest'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              Historical Backtester (PDF Spec)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="hidden sm:inline">Engine:</span>
            <span className="font-mono text-slate-200">ICMarkets MT5 Gateway</span>
          </div>
        </div>

        {/* Main Content Area */}
        {mainView === 'live' ? (
          <div className="space-y-5">
            {/* Chart Section */}
            <ChartSection
              candles={calculatedCandles}
              config={config}
              onNextCandle={handleNextCandle}
              onResetCandles={handleResetCandles}
              isSimulating={isSimulating}
              onToggleSimulating={() => setIsSimulating(!isSimulating)}
              onSymbolChange={handleSymbolChange}
              currentSymbol={currentSymbol}
            />

            {/* Split Grid: Real-Time Confluence Checklist & Active Positions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Algorithm Verification Checklist */}
              <SignalChecklist
                checklist={checklist}
                latestCandle={latestCandle}
                config={config}
                calculatedLot={dynamicRisk.lot}
                calculatedSl={dynamicRisk.sl}
                calculatedTp={dynamicRisk.tp}
                slDistanceUsd={dynamicRisk.slDistance}
                softwareBalance={softwareBalance}
                onExecuteSimulatedTrade={handleExecuteTrade}
                isAutoTrading={isAutoTrading}
                onForceSignal={handleForceSignal}
              />

              {/* Active Positions & Execution Manager */}
              <PositionManager
                openPositions={openPositions}
                closedTrades={closedTrades}
                onClosePosition={handleClosePosition}
                onCloseAllPositions={handleCloseAllPositions}
                onSimulateTrailingAdvance={handleSimulateTrailingAdvance}
              />
            </div>

            {/* Autonomous Bot Engine Console & Daemon Log Stream */}
            <BotEngineConsole
              logs={botLogs}
              isAutoTrading={isAutoTrading}
              onToggleAutoTrading={handleToggleAutoTrading}
              onClearLogs={() => setBotLogs([])}
              onForceSignal={handleForceSignal}
              openTradesCount={openPositions.length}
              currentSymbol={currentSymbol}
              timeframe={config.timeframe}
            />
          </div>
        ) : (
          <div className="space-y-5">
            <BacktestPanel
              candles={calculatedCandles}
              config={config}
              initialCapital={softwareBalance}
            />
            {/* Closed Trades Summary Table */}
            <PositionManager
              openPositions={openPositions}
              closedTrades={closedTrades}
              onClosePosition={handleClosePosition}
              onCloseAllPositions={handleCloseAllPositions}
              onSimulateTrailingAdvance={handleSimulateTrailingAdvance}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            XAUUSD Stock Learners Trading Algorithm • MT5 API + Telegram + Streamlit Architecture
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsVaultOpen(true)} className="hover:text-amber-400 transition">
              Balance Vault
            </button>
            <span>•</span>
            <button onClick={() => setIsApiHubOpen(true)} className="hover:text-emerald-400 transition">
              API Integration Hub
            </button>
            <span>•</span>
            <button onClick={() => setIsCodeModalOpen(true)} className="hover:text-cyan-400 transition">
              Export Bot Files (.zip)
            </button>
            <span>•</span>
            <button onClick={() => setIsTelegramModalOpen(true)} className="hover:text-sky-400 transition">
              Telegram Alerts
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ApiHubModal
        isOpen={isApiHubOpen}
        onClose={() => setIsApiHubOpen(false)}
        telegramConfig={telegramConfig}
        onOpenTelegramModal={() => {
          setIsApiHubOpen(false);
          setIsTelegramModalOpen(true);
        }}
        softwareBalance={softwareBalance}
      />

      <BalanceVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        currentBalance={softwareBalance}
        equity={equity}
        margin={marginUsed}
        freeMargin={freeMargin}
        openTradesCount={openPositions.length}
        floatingPnl={floatingPnl}
        snapshots={snapshots}
        ledger={ledger}
        onSetBalance={handleSetBalance}
        onCreateSnapshot={handleCreateSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onImportJson={handleImportJson}
      />

      <CodeExporterModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      <TelegramTesterModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        config={telegramConfig}
        onSaveConfig={setTelegramConfig}
        currentBalance={softwareBalance}
        equity={equity}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
          localStorage.setItem('xauusd_strategy_config', JSON.stringify(newCfg));
        }}
      />
    </div>
  );
}
