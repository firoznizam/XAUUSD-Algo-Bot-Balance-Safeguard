import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  DollarSign,
  Lock,
  PlusCircle,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { BalanceSnapshot, BalanceLedgerEntry } from '../types';

interface BalanceVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  openTradesCount: number;
  floatingPnl: number;
  snapshots: BalanceSnapshot[];
  ledger: BalanceLedgerEntry[];
  onSetBalance: (newBalance: number, reason: string) => void;
  onCreateSnapshot: (title: string, notes: string, type?: BalanceSnapshot['type']) => void;
  onRestoreSnapshot: (snapshot: BalanceSnapshot) => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportJson: (file: File) => void;
}

export const BalanceVaultModal: React.FC<BalanceVaultModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  equity,
  margin,
  freeMargin,
  openTradesCount,
  floatingPnl,
  snapshots,
  ledger,
  onSetBalance,
  onCreateSnapshot,
  onRestoreSnapshot,
  onExportJson,
  onExportCsv,
  onImportJson,
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'snapshots' | 'ledger' | 'safeguard'>('vault');
  const [inputBalance, setInputBalance] = useState<string>(currentBalance.toString());
  const [balanceReason, setBalanceReason] = useState<string>('Software Balance update specified by user');
  const [snapshotTitle, setSnapshotTitle] = useState<string>('Pre-Session Capital Safeguard');
  const [snapshotNotes, setSnapshotNotes] = useState<string>('Secured software balance before algo execution');
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputBalance);
    if (!isNaN(val) && val >= 0) {
      onSetBalance(val, balanceReason || 'Software Balance told by user');
      setRestoreNotice(`Software balance successfully updated to $${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}!`);
      setTimeout(() => setRestoreNotice(null), 4000);
    }
  };

  const handleQuickPreset = (amount: number) => {
    setInputBalance(amount.toString());
  };

  const handleCreateNewBackup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotTitle.trim()) return;
    onCreateSnapshot(snapshotTitle, snapshotNotes, 'MANUAL_BACKUP');
    setRestoreNotice(`Backup "${snapshotTitle}" created and saved!`);
    setTimeout(() => setRestoreNotice(null), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
      setRestoreNotice(`Backup file "${file.name}" loaded successfully!`);
      setTimeout(() => setRestoreNotice(null), 4000);
    }
  };

  return (
    <div id="balance-vault-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Software Balance Vault & Backup Safeguard
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Active Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Register software balance, create encrypted snapshots, export offline backups, and restore balances safely.
              </p>
            </div>
          </div>
          <button
            id="close-vault-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Restore / Success Notification */}
        {restoreNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{restoreNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 gap-2 pt-2 bg-slate-900/50">
          <button
            id="tab-vault-overview"
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'vault'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Tell Software Balance
          </button>
          <button
            id="tab-vault-snapshots"
            onClick={() => setActiveTab('snapshots')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'snapshots'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            Saved Backups ({snapshots.length})
          </button>
          <button
            id="tab-vault-ledger"
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Balance Ledger ({ledger.length})
          </button>
          <button
            id="tab-vault-safeguard"
            onClick={() => setActiveTab('safeguard')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'safeguard'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Drawdown Safeguard
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-6">
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Software Balance</div>
                  <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                    ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Base capital for 1% risk lot sizing</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Floating Equity</div>
                  <div className={`text-2xl font-bold font-mono mt-1 ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {floatingPnl >= 0 ? `+` : ''}${floatingPnl.toFixed(2)} floating PnL
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Free Margin</div>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">
                    ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Margin Used: ${margin.toFixed(2)}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Active Trades</div>
                  <div className="text-2xl font-bold font-mono text-slate-200 mt-1">
                    {openTradesCount} <span className="text-xs text-slate-400 font-normal">/ 1 Max</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Gold XAUUSD M5</div>
                </div>
              </div>

              {/* Set / Tell Software Balance Form */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      Specify / Tell Software Balance
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Input the current software or broker account balance you want the bot to manage.
                    </p>
                  </div>
                  {/* Quick presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-slate-500 mr-1">Presets:</span>
                    {[1000, 5000, 10000, 25000, 50000, 100000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleQuickPreset(preset)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-slate-700 transition"
                      >
                        ${preset >= 1000 ? `${preset / 1000}k` : preset}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleUpdateBalance} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1 md:col-span-1">
                      <label className="text-xs text-slate-300 font-medium">Balance Amount ($ USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-500 font-mono">$</span>
                        <input
                          id="software-balance-input"
                          type="number"
                          step="0.01"
                          min="1"
                          value={inputBalance}
                          onChange={(e) => setInputBalance(e.target.value)}
                          placeholder="e.g. 10000.00"
                          className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs text-slate-300 font-medium">Notes / Ledger Reason</label>
                      <input
                        id="balance-reason-input"
                        type="text"
                        value={balanceReason}
                        onChange={(e) => setBalanceReason(e.target.value)}
                        placeholder="e.g. Initial balance from MT5 ICMarkets account"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Calculates standard lot sizing: <code className="text-amber-300 font-mono">Lot = (Balance × 1%) / (SL_USD × 100)</code>
                    </span>
                    <button
                      id="save-software-balance-btn"
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 transition flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Save Software Balance
                    </button>
                  </div>
                </form>
              </div>

              {/* Instant Backup Creation */}
              <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      Create Software Balance Backup Snapshot
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Freeze and safely back up current balance, equity, and open trade states.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateNewBackup} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Backup Label / Title</label>
                      <input
                        id="backup-title-input"
                        type="text"
                        value={snapshotTitle}
                        onChange={(e) => setSnapshotTitle(e.target.value)}
                        placeholder="e.g. Pre-London Session Lock"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-300 font-medium">Remarks / Context</label>
                      <input
                        id="backup-notes-input"
                        type="text"
                        value={snapshotNotes}
                        onChange={(e) => setSnapshotNotes(e.target.value)}
                        placeholder="e.g. Safeguarded balance before trading high impact CPI news"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <button
                        id="export-json-btn"
                        type="button"
                        onClick={onExportJson}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        Download Backup (JSON)
                      </button>
                      <button
                        id="export-csv-btn"
                        type="button"
                        onClick={onExportCsv}
                        className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                        Download Ledger (CSV)
                      </button>
                    </div>

                    <button
                      id="create-backup-btn"
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Create Backup Snapshot
                    </button>
                  </div>
                </form>
              </div>

              {/* Offline Import & Restore */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Import Offline Balance Backup File</div>
                    <div className="text-[11px] text-slate-400">Restore your saved JSON snapshots and trade ledger at any time.</div>
                  </div>
                </div>
                <label className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 cursor-pointer transition flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5" />
                  Select Backup JSON
                  <input
                    id="file-upload-backup"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Software Balance Snapshots</h3>
                  <p className="text-xs text-slate-400">
                    Point-in-time balance checkpoints. Click "Restore" to revert software balance to that milestone.
                  </p>
                </div>
                <button
                  id="snapshot-export-all-btn"
                  onClick={onExportJson}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export All Snapshots
                </button>
              </div>

              {snapshots.length === 0 ? (
                <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
                  No balance backups saved yet. Create one from the "Tell Software Balance" tab.
                </div>
              ) : (
                <div className="space-y-3">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/80 hover:border-slate-600 transition flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">{snap.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                            {snap.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{snap.notes || 'No description provided.'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 font-mono">
                          <span>{snap.timestamp}</span>
                          <span>•</span>
                          <span>Equity: ${snap.equity.toFixed(2)}</span>
                          <span>•</span>
                          <span>Trades: {snap.openTradesCount}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-lg font-bold font-mono text-amber-300">
                            ${snap.softwareBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">Backed-up Balance</div>
                        </div>

                        <button
                          id={`restore-snap-${snap.id}`}
                          onClick={() => {
                            onRestoreSnapshot(snap);
                            setRestoreNotice(`Restored software balance from "${snap.title}" ($${snap.softwareBalance.toFixed(2)})!`);
                            setTimeout(() => setRestoreNotice(null), 4000);
                          }}
                          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ledger' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Balance Audit Ledger</h3>
                  <p className="text-xs text-slate-400">Complete chronological transaction and adjustment record.</p>
                </div>
                <button
                  id="ledger-export-csv-btn"
                  onClick={onExportCsv}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Export CSV
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Time</th>
                      <th className="py-2.5 px-4 font-semibold">Type</th>
                      <th className="py-2.5 px-4 font-semibold">Description</th>
                      <th className="py-2.5 px-4 font-semibold text-right">Change</th>
                      <th className="py-2.5 px-4 font-semibold text-right">New Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {ledger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-4 font-mono text-slate-400">{entry.timestamp}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                              entry.type === 'TRADE_PROFIT'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : entry.type === 'TRADE_LOSS'
                                ? 'bg-rose-500/20 text-rose-400'
                                : entry.type === 'BACKUP_RESTORE'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{entry.description}</td>
                        <td
                          className={`py-2.5 px-4 font-mono text-right font-semibold ${
                            entry.amount > 0 ? 'text-emerald-400' : entry.amount < 0 ? 'text-rose-400' : 'text-slate-400'
                          }`}
                        >
                          {entry.amount > 0 ? `+$${entry.amount.toFixed(2)}` : entry.amount < 0 ? `-$${Math.abs(entry.amount).toFixed(2)}` : '$0.00'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-right text-slate-200 font-bold">
                          ${entry.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'safeguard' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200 space-y-1">
                  <div className="font-bold">Software Balance Safeguard Rules</div>
                  <div>
                    The Stock Learners bot is configured with hard mathematical stop-guards:
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 pt-1">
                    <li><strong className="text-slate-100">1% Max Risk per Trade:</strong> Lot sizing dynamically restricts risk to 1% of the software balance.</li>
                    <li><strong className="text-slate-100">Session Window Guard:</strong> No trades initiated after 20:00 UTC (or after 2:45 PM for Indian equity sessions).</li>
                    <li><strong className="text-slate-100">Single Position Constraint:</strong> Maximum 1 open trade at a time prevents over-leveraging Gold swings.</li>
                    <li><strong className="text-slate-100">Trailing Stop Profit Lock:</strong> Activates after 20 pips ($0.20 on Gold) and moves SL to break-even or higher.</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-3">
                <div className="text-xs font-bold text-slate-200">Recommended Backup Schedule</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-amber-400 font-bold">Daily Pre-London (07:00 UTC)</div>
                    <div className="text-slate-400">Take a snapshot before the European trading volume surge.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-cyan-400 font-bold">Weekly Milestone Lock</div>
                    <div className="text-slate-400">Export JSON backup every Friday after market close.</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-emerald-400 font-bold">Post-Win Reserve</div>
                    <div className="text-slate-400">Snapshot software balance immediately after 2R targets are hit.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Software Balance: <strong className="text-amber-300 font-mono">${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </div>
          <button
            id="modal-done-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
