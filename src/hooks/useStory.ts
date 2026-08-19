import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Story, Chapter, Snapshot, SyncState } from '../types/manuscript';
import { createFirestoreAdapter } from '../services/storage/FirestoreAdapter';
import { parseOverviewToChapters } from '../services/parser/outlineParser';
import type { User } from 'firebase/auth';

export function useStory(user?: User | null) {
  const storage = useMemo(() => createFirestoreAdapter(user?.uid || null), [user?.uid]);

  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<number>(Date.now());

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize DB and load active story
  const refreshStories = useCallback(async (preferredStoryId?: string) => {
    try {
      setLoading(true);
      const initialStory = await storage.seedInitialDataIfEmpty();
      const allStories = await storage.getStories();
      setStories(allStories);

      const targetStoryId = preferredStoryId || activeStory?.id || initialStory.id;
      const targetStory = allStories.find((s) => s.id === targetStoryId) || allStories[0] || initialStory;
      
      setActiveStory(targetStory);
      const loadedChapters = await storage.getChapters(targetStory.id);
      setChapters(loadedChapters);
      
      if (loadedChapters.length > 0 && (!activeChapterId || !loadedChapters.some(c => c.id === activeChapterId))) {
        setActiveChapterId(loadedChapters[0].id);
      }

      const loadedSnapshots = await storage.getSnapshots(targetStory.id);
      setSnapshots(loadedSnapshots);
    } catch (err) {
      console.error('Failed to load story data:', err);
      setSyncState('offline');
    } finally {
      setLoading(false);
    }
  }, [storage, activeStory?.id, activeChapterId]);

  useEffect(() => {
    refreshStories();
  }, [user?.uid, storage]);

  // 15-minute Automatic Snapshot timer following industry standards
  useEffect(() => {
    if (!activeStory) return;
    snapshotTimerRef.current = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      storage.createSnapshot(activeStory.id, `Auto-Save Checkpoint (${timeStr})`)
        .then(() => storage.getSnapshots(activeStory.id))
        .then(setSnapshots)
        .catch(console.error);
    }, 15 * 60 * 1000);

    return () => {
      if (snapshotTimerRef.current) clearInterval(snapshotTimerRef.current);
    };
  }, [activeStory]);

  // Active chapter getter
  const activeChapter = chapters.find((c) => c.id === activeChapterId) || chapters[0] || null;

  // Save story metadata changes with debounce
  const updateStoryMeta = useCallback((updates: Partial<Story>) => {
    if (!activeStory) return;
    setSyncState('saving');
    const updated = { ...activeStory, ...updates, updatedAt: Date.now() };
    setActiveStory(updated);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await storage.saveStory(updated);
        setStories(prev => prev.map(s => s.id === updated.id ? updated : s));
        setSyncState('synced');
        setLastSavedTime(Date.now());
      } catch {
        setSyncState('offline');
      }
    }, 1500);
  }, [activeStory]);

  // Update chapter content/overview/title with debounce
  const updateChapter = useCallback((chapterId: string, updates: Partial<Chapter>) => {
    setSyncState('saving');
    setChapters((prev) => {
      return prev.map((ch) => {
        if (ch.id === chapterId) {
          const updatedCh = { ...ch, ...updates, updatedAt: Date.now() };
          
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(async () => {
            try {
              await storage.saveChapter(updatedCh);
              const allChs = await storage.getChapters(updatedCh.storyId);
              const totalWords = allChs.reduce((sum, c) => sum + c.wordCount, 0);
              setActiveStory((s) => s ? { ...s, totalWordCount: totalWords, updatedAt: Date.now() } : null);
              setSyncState('synced');
              setLastSavedTime(Date.now());
            } catch {
              setSyncState('offline');
            }
          }, 2000);

          return updatedCh;
        }
        return ch;
      });
    });
  }, []);

  // Standard Manual Save + Version Snapshot trigger (Ctrl+S / Cmd+S or Save Button)
  const manualSaveAndSnapshot = useCallback(async (customLabel?: string) => {
    if (!activeStory) return;
    setSyncState('saving');

    // Clear any pending debounced timers
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    // Save active story and all current chapters immediately
    await storage.saveStory(activeStory);
    await storage.saveChapters(chapters);

    // Create standard version snapshot
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const label = customLabel?.trim() || `Manual Save (${timeStr})`;
    
    await storage.createSnapshot(activeStory.id, label);
    const updatedSnapshots = await storage.getSnapshots(activeStory.id);
    
    setSnapshots(updatedSnapshots);
    setSyncState('synced');
    setLastSavedTime(Date.now());
  }, [activeStory, chapters]);

  // Add Chapter
  const addChapter = useCallback(async () => {
    if (!activeStory) return;
    setSyncState('saving');
    const nextOrder = chapters.length + 1;
    const newChapter: Chapter = {
      id: 'ch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      storyId: activeStory.id,
      order: nextOrder,
      title: `Chapter ${nextOrder}: Untitled`,
      overview: '',
      content: '<p></p>',
      wordCount: 0,
      targetWordCount: 2500,
      updatedAt: Date.now(),
    };

    const updatedList = [...chapters, newChapter];
    setChapters(updatedList);
    setActiveChapterId(newChapter.id);

    try {
      await storage.saveChapter(newChapter);
      setSyncState('synced');
      setLastSavedTime(Date.now());
    } catch {
      setSyncState('offline');
    }
  }, [activeStory, chapters]);

  // Delete Chapter
  const deleteChapter = useCallback(async (chapterId: string) => {
    if (!activeStory) return;
    setSyncState('saving');
    const remaining = chapters.filter((c) => c.id !== chapterId);
    const reordered = remaining.map((c, idx) => ({ ...c, order: idx + 1 }));
    setChapters(reordered);
    if (activeChapterId === chapterId && reordered.length > 0) {
      setActiveChapterId(reordered[0].id);
    }

    try {
      await storage.deleteChapter(chapterId);
      setSyncState('synced');
      setLastSavedTime(Date.now());
    } catch {
      setSyncState('offline');
    }
  }, [activeStory, chapters, activeChapterId]);

  // Reorder Chapters
  const reorderChapters = useCallback(async (reorderedList: Chapter[]) => {
    const updated = reorderedList.map((c, idx) => ({ ...c, order: idx + 1 }));
    setChapters(updated);
    setSyncState('saving');
    try {
      await storage.saveChapters(updated);
      setSyncState('synced');
      setLastSavedTime(Date.now());
    } catch {
      setSyncState('offline');
    }
  }, []);

  // Switch Story
  const switchStory = useCallback(async (storyId: string) => {
    setLoading(true);
    const target = stories.find(s => s.id === storyId);
    if (!target) return;
    setActiveStory(target);
    const storyChapters = await storage.getChapters(target.id);
    setChapters(storyChapters);
    if (storyChapters.length > 0) {
      setActiveChapterId(storyChapters[0].id);
    }
    const storySnapshots = await storage.getSnapshots(target.id);
    setSnapshots(storySnapshots);
    setLoading(false);
  }, [stories]);

  // Create Story
  const createNewStory = useCallback(async (title: string, idea = '') => {
    const now = Date.now();
    const newStory: Story = {
      id: 'story-' + now + '-' + Math.random().toString(36).substr(2, 4),
      title: title || 'New Story Manuscript',
      storyIdea: idea,
      storyOverview: '# Act I: Opening\n- Scene 1 setup',
      totalWordCount: 0,
      targetWordCount: 50000,
      createdAt: now,
      updatedAt: now,
    };

    const firstChapter: Chapter = {
      id: 'ch-' + now + '-1',
      storyId: newStory.id,
      order: 1,
      title: 'Chapter 1: The Inciting Incident',
      overview: 'Introduce main characters and setting.',
      content: '<p></p>',
      wordCount: 0,
      targetWordCount: 2500,
      updatedAt: now,
    };

    await storage.saveStory(newStory);
    await storage.saveChapter(firstChapter);

    const all = await storage.getStories();
    setStories(all);
    setActiveStory(newStory);
    setChapters([firstChapter]);
    setActiveChapterId(firstChapter.id);
    setSnapshots([]);
  }, []);

  // Delete Story
  const deleteStory = useCallback(async (storyId: string) => {
    await storage.deleteStory(storyId);
    const remaining = await storage.getStories();
    setStories(remaining);
    if (remaining.length > 0) {
      switchStory(remaining[0].id);
    } else {
      refreshStories();
    }
  }, [switchStory, refreshStories]);

  // Generate Chapters from Story Overview
  const generateChaptersFromOverview = useCallback(async () => {
    if (!activeStory) return;
    const generated = parseOverviewToChapters(activeStory.id, activeStory.storyOverview, chapters.length + 1);
    if (generated.length === 0) return;

    setSyncState('saving');
    const merged = [...chapters, ...generated];
    setChapters(merged);
    await storage.saveChapters(generated);
    setSyncState('synced');
    setLastSavedTime(Date.now());
  }, [activeStory, chapters]);

  // Restore snapshot
  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    setLoading(true);
    const restored = await storage.restoreSnapshot(snapshotId);
    if (restored) {
      setActiveStory(restored.story);
      setChapters(restored.chapters);
      if (restored.chapters.length > 0) {
        setActiveChapterId(restored.chapters[0].id);
      }
    }
    setLoading(false);
  }, []);

  return {
    loading,
    stories,
    activeStory,
    chapters,
    activeChapter,
    activeChapterId,
    setActiveChapterId,
    syncState,
    snapshots,
    lastSavedTime,
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
    refreshStories,
  };
}
