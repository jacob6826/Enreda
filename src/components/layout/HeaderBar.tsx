import React, { useState, useRef, useEffect } from 'react';
import {
  Save,
  Search,
  Menu,
  Moon,
  Sun,
  Camera,
  Download,
  User as UserIcon,
  CloudOff,
  RefreshCw,
  BookOpen,
  Laptop,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import type { Story, ThemeMode, SyncState } from '../../types/manuscript';
import type { User } from 'firebase/auth';

interface HeaderBarProps {
  story: Story | null;
  syncState: SyncState;
  theme: ThemeMode;
  user?: User | null;
  onOpenAuth: () => void;
  onToggleTheme: () => void;
  onSyncNow: () => void;
  onManualSave: () => void;
  onOpenDashboard: () => void;
  onOpenSearch: () => void;
  onOpenSnapshot: () => void;
  onOpenExport: () => void;
  onOpenDownloadApp?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  story,
  syncState,
  theme,
  user,
  onOpenAuth,
  onToggleTheme,
  onManualSave,
  onOpenDashboard,
  onOpenSearch,
  onOpenSnapshot,
  onOpenExport,
  onOpenDownloadApp,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 bg-white/95 dark:bg-zinc-900/90 light:bg-white border-b border-zinc-200 dark:border-zinc-800/80 px-4 flex items-center justify-between select-none relative z-30 shrink-0 backdrop-blur-md">
      {/* Left Group: Active Story Dropdown Selector */}
      <div className="flex items-center gap-2 z-10">
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/50 transition-colors group max-w-[240px] sm:max-w-xs"
          title="Switch or Manage Manuscripts"
        >
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
            {story ? story.title : 'Select Story'}
          </span>
          <span className="text-[10px] text-zinc-400 font-mono shrink-0 group-hover:text-indigo-500 transition-colors">
            ▼
          </span>
        </button>
      </div>

      {/* Center Branding */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-wider text-sm bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
            ENREDA
          </span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
            manuscript studio
          </span>
        </div>
      </div>

      {/* Right Group: Action Bar & Account Status */}
      <div className="flex items-center gap-2 z-10">
        {/* Account / Cloud Sync Badge Button */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
            user
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
          }`}
          title={user ? `Signed in as ${user.email}. Click for Account Settings.` : 'Guest Mode (Click to Sign In & Sync Cloud)'}
        >
          {user ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline truncate max-w-[110px]">
                {user.email?.split('@')[0]}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Sign In</span>
            </>
          )}
        </button>

        {/* Save Icon Button + Micro Sync Indicator */}
        <div className="relative">
          <button
            onClick={onManualSave}
            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors relative"
            title={
              syncState === 'synced'
                ? 'Saved & Synced (Click or press Ctrl+S to force save)'
                : syncState === 'saving'
                ? 'Saving changes...'
                : 'Offline (Click to force save)'
            }
          >
            {syncState === 'saving' ? (
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            ) : syncState === 'offline' ? (
              <CloudOff className="w-4 h-4 text-amber-500" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {/* Micro Dot Status */}
            <span
              className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${
                syncState === 'synced'
                  ? 'bg-emerald-500'
                  : syncState === 'saving'
                  ? 'bg-indigo-500 animate-ping'
                  : 'bg-amber-500'
              }`}
            />
          </button>
        </div>

        {/* Find & Replace Search Icon Button */}
        <button
          onClick={onOpenSearch}
          className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors"
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Hamburger Options Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-2 rounded-lg transition-colors ${
              menuOpen
                ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
            }`}
            title="Studio Options"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Options Dropdown Panel */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 text-xs text-zinc-700 dark:text-zinc-200 z-50 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 font-semibold text-[10px] text-zinc-400 uppercase tracking-wider">
                Studio Actions
              </div>

              <button
                onClick={() => {
                  onToggleTheme();
                  setMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-600" />
                  )}
                  <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>

              <button
                onClick={() => {
                  onOpenSnapshot();
                  setMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
              >
                <Camera className="w-4 h-4 text-indigo-500" />
                <span>Snapshots & History</span>
              </button>

              <button
                onClick={() => {
                  onOpenExport();
                  setMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-500" />
                <span>Export Manuscript (.md, .docx, .pdf)</span>
              </button>

              {onOpenDownloadApp && (
                <button
                  onClick={() => {
                    onOpenDownloadApp();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors font-medium text-indigo-600 dark:text-indigo-400"
                >
                  <Laptop className="w-4 h-4 text-indigo-500" />
                  <span>Download Desktop App (Win / Mac)</span>
                </button>
              )}

              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800/80" />

              <button
                onClick={() => {
                  onOpenAuth();
                  setMenuOpen(false);
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-indigo-500" />
                <span>{user ? 'Account Settings' : 'Sign In / Account'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
