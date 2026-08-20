import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Camera,
  Download,
  BookOpen,
  Save,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  RefreshCw,
  CloudOff,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Story, SyncState, ThemeMode } from '../../types/manuscript';

interface HeaderBarProps {
  story: Story | null;
  syncState: SyncState;
  theme: ThemeMode;
  user: User | null;
  onOpenAuth: () => void;
  onToggleTheme: () => void;
  onSyncNow: () => void;
  onManualSave: () => void;
  onOpenDashboard: () => void;
  onOpenSearch: () => void;
  onOpenSnapshot: () => void;
  onOpenExport: () => void;
  onOpenCodex?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  story,
  syncState,
  theme,
  user,
  onOpenAuth,
  onToggleTheme,
  onSyncNow,
  onManualSave,
  onOpenDashboard,
  onOpenSearch,
  onOpenSnapshot,
  onOpenExport,
  onOpenCodex,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close hamburger menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[60px] bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/90 px-5 flex items-center justify-between select-none z-30 shrink-0 shadow-sm dark:shadow-none transition-colors relative">
      {/* Left Group: Manuscript Selector Pill */}
      <div className="flex items-center gap-2.5 z-10">
        <button
          onClick={onOpenDashboard}
          className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs font-semibold transition-all max-w-[200px] sm:max-w-xs group shadow-2xs"
          title="Switch Manuscripts"
        >
          {story?.coverImage ? (
            <img src={story.coverImage} alt="Cover" className="w-4 h-5 rounded object-cover border border-zinc-300 dark:border-zinc-600 shrink-0" />
          ) : (
            <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
          )}
          <span className="truncate">{story ? story.title : 'Select Story'}</span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 shrink-0 ml-0.5 transition-colors" />
        </button>
      </div>

      {/* Absolute Centered Branding (Clean Single-Line) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto flex items-center gap-2 cursor-pointer group px-3 py-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
          onClick={onOpenDashboard}
          title="Enreda Manuscript Studio"
        >
          <span className="text-base font-extrabold tracking-widest text-zinc-900 dark:text-white font-sans group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            ENREDA
          </span>
          <span className="text-xs font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500 font-semibold">
            manuscript studio
          </span>
        </div>
      </div>

      {/* Right Group: Ultra-Clean Icon Action Bar */}
      <div className="flex items-center gap-1.5 z-10">
        {/* Codex Button */}
        {onOpenCodex && (
          <button
            onClick={onOpenCodex}
            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Character & Worldbuilding Codex"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Codex 🎭</span>
          </button>
        )}

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
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1.5 text-xs text-zinc-700 dark:text-zinc-200 z-50 animate-fade-in">
              <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/80 font-semibold text-[10px] text-zinc-400 uppercase tracking-wider">
                Studio Actions
              </div>

              {onOpenCodex && (
                <button
                  onClick={() => {
                    onOpenCodex();
                    setMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors font-semibold text-indigo-600 dark:text-indigo-400"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Story Codex & Character Bible</span>
                </button>
              )}

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
