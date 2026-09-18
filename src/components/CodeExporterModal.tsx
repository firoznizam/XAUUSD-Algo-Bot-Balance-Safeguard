import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FolderArchive,
  Terminal,
  ExternalLink,
  X,
  FileText,
} from 'lucide-react';
import JSZip from 'jszip';
import { BOT_PYTHON_FILES } from '../data/defaultData';

interface CodeExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CodeExporterModal: React.FC<CodeExporterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const fileKeys = Object.keys(BOT_PYTHON_FILES);
  const [selectedFile, setSelectedFile] = useState<string>(fileKeys[0] || 'config.py');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const currentFile = BOT_PYTHON_FILES[selectedFile];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingle = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFile.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('xauusd_trading_bot');

      Object.values(BOT_PYTHON_FILES).forEach((file) => {
        folder?.file(file.filename, file.code);
      });

      // Add a quickstart run.bat for Windows MT5 users
      folder?.file(
        'run_bot.bat',
        `@echo off
echo Starting XAUUSD Stock Learners Bot...
call venv\\Scripts\\activate
python main.py
pause
`
      );

      folder?.file(
        'run_dashboard.bat',
        `@echo off
echo Starting Streamlit Live Monitoring Dashboard...
call venv\\Scripts\\activate
streamlit run dashboard.py
pause
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'xauusd_stocklearners_mt5_bot.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div id="code-exporter-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Downloadable Bot Package (Python + MT5 + Telegram)
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium">
                  11 Files Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete, production-grade Python scripts extracted from the Stock Learners algorithm specification.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="download-full-zip-btn"
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isZipping ? 'Generating ZIP...' : 'Download Full ZIP Archive'}
            </button>
            <button
              id="close-code-modal-btn"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Setup Quick-Command Banner */}
        <div className="bg-slate-950 px-6 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 text-slate-400">
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
            <span>Install & Run:</span>
            <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              pip install -r requirements.txt && python main.py
            </code>
          </div>
          <span className="text-slate-500 text-[11px]">Works with MetaTrader 5 on Windows</span>
        </div>

        {/* Main Content: File list sidebar + Code viewer */}
        <div className="flex flex-1 overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-900/60 p-3 overflow-y-auto space-y-1 shrink-0">
            <div className="text-[11px] font-bold text-slate-500 px-2 py-1 uppercase tracking-wider">
              Project Files
            </div>
            {fileKeys.map((key) => {
              const file = BOT_PYTHON_FILES[key];
              const isSelected = selectedFile === key;
              return (
                <button
                  key={key}
                  id={`code-file-tab-${key}`}
                  onClick={() => setSelectedFile(key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition ${
                    isSelected
                      ? 'bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="truncate font-mono">{file.filename}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer Panel */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Action Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs shrink-0">
              <div className="space-y-0.5">
                <span className="font-mono font-bold text-slate-200">{currentFile?.filename}</span>
                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                  — {currentFile?.description}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="copy-code-btn"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  id="download-single-file-btn"
                  onClick={handleDownloadSingle}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition flex items-center gap-1.5 border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre selection:bg-amber-500/20">
                {currentFile?.code}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
