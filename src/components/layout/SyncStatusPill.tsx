import React from 'react';
import { CloudOff, RefreshCw, Check } from 'lucide-react';
import type { SyncState } from '../../types/manuscript';

interface SyncStatusPillProps {
  state: SyncState;
  onSyncNow: () => void;
}

export const SyncStatusPill: React.FC<SyncStatusPillProps> = ({ state, onSyncNow }) => {
  return (
    <button
      onClick={onSyncNow}
      title="Click to force manual save & sync"
      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
        state === 'synced'
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
          : state === 'saving'
          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-400 animate-pulse'
          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
      }`}
    >
      {state === 'synced' && (
        <>
          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>Synced</span>
        </>
      )}
      {state === 'saving' && (
        <>
          <RefreshCw className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>Saving...</span>
        </>
      )}
      {state === 'offline' && (
        <>
          <CloudOff className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          <span>Offline (Cached)</span>
        </>
      )}
    </button>
  );
};
