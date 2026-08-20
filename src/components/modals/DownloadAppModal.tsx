import React from 'react';
import { X, Laptop, Download, Apple, Monitor, CheckCircle, ExternalLink } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  macDownloadUrl?: string;
  winDownloadUrl?: string;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  macDownloadUrl = 'https://github.com/jacob6826/Enreda/releases/latest/download/Enreda.dmg',
  winDownloadUrl = 'https://github.com/jacob6826/Enreda/releases/latest/download/Enreda.exe',
}) => {
  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && /Mac|Macintosh/i.test(navigator.userAgent);
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in select-none">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Get Desktop App
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Work offline & stay synced across all your devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isElectron ? (
          <div className="my-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold block">You are running the Native Desktop App!</span>
              Your work auto-syncs with your cloud account & browser version.
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 my-5">
            {/* macOS Option */}
            <a
              href={macDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                isMac
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Apple className="w-6 h-6 text-zinc-800 dark:text-zinc-100 shrink-0" />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    Download for macOS (.dmg)
                    {isMac && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                        Recommended for your Mac
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Apple Silicon (M1/M2/M3/M4) & Intel
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </a>

            {/* Windows Option */}
            <a
              href={winDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                !isMac
                  ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-100 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5">
                    Download for Windows (.exe)
                    {!isMac && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white font-medium">
                        Recommended for Windows
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Windows 10 / 11 64-bit Installer
                  </span>
                </div>
              </div>
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <a
            href="https://github.com/jacob6826/Enreda/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <span>All releases</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
