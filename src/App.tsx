import { useState, useEffect, useCallback } from 'react';
import { useStory } from './hooks/useStory';
import { useWordCount } from './hooks/useWordCount';
import { useAuth } from './hooks/useAuth';
import { HeaderBar } from './components/layout/HeaderBar';
import { LeftSidebar } from './components/layout/LeftSidebar';
import { RightInspector } from './components/layout/RightInspector';
import { MobileBottomNav, MobileTab } from './components/layout/MobileBottomNav';
import { TiptapEditor } from './components/editor/TiptapEditor';
import { StoryDashboardModal } from './components/modals/StoryDashboardModal';
import { SnapshotModal } from './components/modals/SnapshotModal';
import { ExportModal } from './components/modals/ExportModal';
import { FindReplaceModal } from './components/modals/FindReplaceModal';
import { DownloadAppModal } from './components/modals/DownloadAppModal';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/auth/LandingPage';
import { Loader2, CheckCircle2 } from 'lucide-react';
import type { ThemeMode } from './types/manuscript';

export function App() {
  const { user, loading: authLoading, isFirebaseConfigured, loginWithEmail, registerWithEmail, logout } = useAuth();

  const {
    loading,
    stories,
    activeStory,
    chapters,
    activeChapter,
    activeChapterId,
    setActiveChapterId,
    syncState,
    snapshots,
    updateStoryMeta,
    updateChapter,
    addChapter,
    deleteChapter,
    reorderChapters,
    switchStory,
    createNewStory,
    deleteStory,
    generateChaptersFromOverview,
    manualSaveAndSnapshot,
    restoreSnapshot,
  } = useStory();

  // Guest bypass state for unauthenticated users
  const [hasContinuedAsGuest, setHasContinuedAsGuest] = useState<boolean>(() => {
    return sessionStorage.getItem('enreda_guest_continued') === 'true';
  });

  // Layout & Theme states (Default to Light Mode)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('manuscript_theme') as ThemeMode) || 'light';
  });
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightInspectorOpen, setRightInspectorOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('editor');
  const [saveToast, setSaveToast] = useState(false);

  // Modal states
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDownloadAppOpen, setIsDownloadAppOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Synchronize HTML element theme class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('manuscript_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Active chapter metrics
  const activeMetrics = useWordCount(activeChapter ? activeChapter.content : '');
  const activeChapterGoal = activeChapter?.targetWordCount || 2500;
  const activeChapterPercent = Math.min(100, Math.round((activeMetrics.words / activeChapterGoal) * 100));

  // Trigger manual save with visual toast feedback
  const handleManualSave = useCallback(async () => {
    await manualSaveAndSnapshot();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, [manualSaveAndSnapshot]);

  // Keyboard shortcut listener (Ctrl+S / Cmd+S for Save, Ctrl+F for Find, Esc for Focus Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusMode, handleManualSave]);

  if (loading || authLoading || !activeStory) {
    return (
      <div className="h-screen w-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-700 dark:text-zinc-300 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading Enreda...</span>
      </div>
    );
  }

  // Render Landing Page for first-time visitors / unauthenticated users
  if (!user && !hasContinuedAsGuest) {
    return (
      <LandingPage
        onEmailSignIn={loginWithEmail}
        onEmailRegister={registerWithEmail}
        onContinueAsGuest={() => {
          sessionStorage.setItem('enreda_guest_continued', 'true');
          setHasContinuedAsGuest(true);
        }}
        isFirebaseConfigured={isFirebaseConfigured}
      />
    );
  }

  // Effective panel visibility based on focus mode & mobile responsive state
  const isLeftOpen = !focusMode && leftSidebarOpen;
  const isRightOpen = !focusMode && rightInspectorOpen;

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Top Header Navigation (Hidden in Focus Mode) */}
      {!focusMode && (
        <HeaderBar
          story={activeStory}
          syncState={syncState}
          theme={theme}
          user={user}
          onToggleTheme={toggleTheme}
          onSyncNow={handleManualSave}
          onManualSave={handleManualSave}
          rightInspectorOpen={rightInspectorOpen}
          onToggleRightInspector={() => setRightInspectorOpen(!rightInspectorOpen)}
          onOpenDashboard={() => setIsDashboardOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSnapshot={() => setIsSnapshotOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenDownloadApp={() => setIsDownloadAppOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />
      )}

      {/* Main Workspace Stage */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Outline & Chapter Reordering) */}
        <div className={`${mobileTab === 'chapters' ? 'flex w-full' : 'hidden md:flex'}`}>
          <LeftSidebar
            story={activeStory}
            chapters={chapters}
            activeChapterId={activeChapterId}
            onSelectChapter={(id) => {
              setActiveChapterId(id);
              setMobileTab('editor');
            }}
            onAddChapter={addChapter}
            onDeleteChapter={deleteChapter}
            onReorderChapters={reorderChapters}
            onUpdateStoryMeta={updateStoryMeta}
            onGenerateChapters={generateChaptersFromOverview}
            isOpen={isLeftOpen || mobileTab === 'chapters'}
            onClose={() => setLeftSidebarOpen(false)}
          />
        </div>

        {/* Center Stage Editor Canvas */}
        <main className={`flex-1 flex flex-col h-full overflow-hidden ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          {activeChapter ? (
            <TiptapEditor
              content={activeChapter.content}
              chapterTitle={activeChapter.title}
              chapterOverview={activeChapter.overview}
              chapterImage={activeChapter.chapterImage}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode(!focusMode)}
              onContentChange={(html, wordCount) => {
                updateChapter(activeChapter.id, { content: html, wordCount });
              }}
              onTitleChange={(newTitle) => {
                updateChapter(activeChapter.id, { title: newTitle });
              }}
              onChapterImageChange={(img) => {
                updateChapter(activeChapter.id, { chapterImage: img });
              }}
              leftSidebarOpen={leftSidebarOpen}
              onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
              rightInspectorOpen={rightInspectorOpen}
              onToggleRightInspector={() => setRightInspectorOpen(!rightInspectorOpen)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
              Select or create a chapter to begin drafting.
            </div>
          )}

          {/* Bottom Status Bar (Metrics & Per-Chapter Goal) */}
          <footer className="h-7 bg-zinc-100/80 dark:bg-zinc-900 light:bg-zinc-100 border-t border-zinc-200 dark:border-zinc-800/80 px-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 select-none shrink-0">
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>
                Chapter: <strong className="text-zinc-800 dark:text-zinc-200">{activeMetrics.words}</strong> / {activeChapterGoal} words ({activeChapterPercent}%) • <strong className="text-zinc-800 dark:text-zinc-200">{activeMetrics.chars}</strong> chars
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>
                Manuscript Total: <strong className="text-indigo-600 dark:text-indigo-400">{activeStory.totalWordCount.toLocaleString()}</strong> words
              </span>
            </div>
          </footer>
        </main>

        {/* Right Inspector Drawer (Story & Chapter Overview Side-by-Side) */}
        <div className={`${mobileTab === 'overview' ? 'flex w-full' : 'hidden md:flex'}`}>
          <RightInspector
            story={activeStory}
            activeChapter={activeChapter}
            onUpdateStoryOverview={(newOverview) => {
              updateStoryMeta({ storyOverview: newOverview });
            }}
            onUpdateChapterOverview={(chapterId, newOverview) => {
              updateChapter(chapterId, { overview: newOverview });
            }}
            onUpdateChapterGoal={(chapterId, targetWords) => {
              updateChapter(chapterId, { targetWordCount: targetWords });
            }}
            isOpen={isRightOpen || mobileTab === 'overview'}
            onClose={() => setRightInspectorOpen(false)}
          />
        </div>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <MobileBottomNav
        activeTab={mobileTab}
        onSelectTab={(tab) => setMobileTab(tab)}
      />

      {/* Save Notification Toast */}
      {saveToast && (
        <div className="fixed bottom-12 right-6 z-50 bg-indigo-600 text-white px-3.5 py-2 rounded-lg shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Manuscript Saved & Snapshot Recorded!</span>
        </div>
      )}

      {/* Modals */}
      <StoryDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        stories={stories}
        activeStoryId={activeStory.id}
        onSelectStory={switchStory}
        onCreateStory={createNewStory}
        onDeleteStory={deleteStory}
      />

      <SnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        snapshots={snapshots}
        onCreateSnapshot={manualSaveAndSnapshot}
        onRestoreSnapshot={restoreSnapshot}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        story={activeStory}
        chapters={chapters}
      />

      <FindReplaceModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        activeChapter={activeChapter}
        allChapters={chapters}
        onUpdateChapterContent={(chId, newHtml) => {
          updateChapter(chId, { content: newHtml });
        }}
      />

      <DownloadAppModal
        isOpen={isDownloadAppOpen}
        onClose={() => setIsDownloadAppOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        isFirebaseConfigured={isFirebaseConfigured}
        onEmailSignIn={loginWithEmail}
        onEmailRegister={registerWithEmail}
        onLogout={logout}
      />
    </div>
  );
}
