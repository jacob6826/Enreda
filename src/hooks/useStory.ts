import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Story, Chapter, Snapshot, SyncState, CodexEntry } from '../types/manuscript';
import { createFirestoreAdapter, subscribeToRealtimeSync } from '../services/storage/FirestoreAdapter';
import { parseOverviewToChapters } from '../services/parser/outlineParser';
import type { User } from 'firebase/auth';

export function useStory(user?: User | null) {
  const storage = useMemo(() => createFirestoreAdapter(user?.uid || null), [user?.uid]);

  const [stories, setStories] = useState<Story[]>([]);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [codexEntries, setCodexEntries] = useState<CodexEntry[]>([]);
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<number>(Date.now());

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const snapshotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast instant sync helper for local cross-tab / cross-process updates
  const notifyBroadcastSync = useCallback(() => {
    try {
      const channel = new BroadcastChannel('enreda_sync_channel');
      channel.postMessage({ type: 'REFRESH_DATA', timestamp: Date.now() });
      channel.close();
    } catch {}
  }, []);

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

      const loadedCodex = await storage.getCodex(targetStory.id);
      setCodexEntries(loadedCodex);

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

  // Real-time Firestore Sync (<1 second cloud sync across all devices)
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToRealtimeSync(user.uid, activeStory?.id || null, {
      onStoriesUpdate: (updatedStories) => {
        setStories((prev) => {
          // Merge to prevent local active changes from being lost
          const map = new Map<string, Story>();
          updatedStories.forEach((s) => map.set(s.id, s));
          prev.forEach((s) => {
            if (!map.has(s.id)) map.set(s.id, s);
          });
          return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        });
      },
      onChaptersUpdate: (updatedChapters) => {
        setChapters(updatedChapters);
      },
      onCodexUpdate: (updatedCodex) => {
        setCodexEntries(updatedCodex);
      },
    });

    return () => unsubscribe();
  }, [user?.uid, activeStory?.id]);

  // Instant local cross-window BroadcastChannel listener (<0.1 second sync)
  useEffect(() => {
    try {
      const channel = new BroadcastChannel('enreda_sync_channel');
      channel.onmessage = () => {
        if (activeStory) {
          storage.getStories().then(setStories).catch(console.warn);
          storage.getChapters(activeStory.id).then(setChapters).catch(console.warn);
          storage.getCodex(activeStory.id).then(setCodexEntries).catch(console.warn);
        }
      };
      return () => channel.close();
    } catch {
      return () => {};
    }
  }, [activeStory, storage]);

  // 15-minute Automatic Snapshot timer
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
  }, [activeStory, storage]);

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
        notifyBroadcastSync();
      } catch {
        setSyncState('offline');
      }
    }, 1500);
  }, [activeStory, storage, notifyBroadcastSync]);

  // Update chapter content/overview/title/status/pov/tags with debounce
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
              notifyBroadcastSync();
            } catch {
              setSyncState('offline');
            }
          }, 1500);

          return updatedCh;
        }
        return ch;
      });
    });
  }, [storage, notifyBroadcastSync]);

  // Save Codex Entry
  const saveCodexEntry = useCallback(async (entry: CodexEntry) => {
    if (!activeStory) return;
    setSyncState('saving');
    const fullEntry = { ...entry, storyId: activeStory.id, updatedAt: Date.now() };
    setCodexEntries(prev => {
      const exists = prev.some(e => e.id === fullEntry.id);
      if (exists) return prev.map(e => e.id === fullEntry.id ? fullEntry : e);
      return [fullEntry, ...prev];
    });
    try {
      await storage.saveCodexEntry(fullEntry);
      setSyncState('synced');
      notifyBroadcastSync();
    } catch {
      setSyncState('offline');
    }
  }, [activeStory, storage, notifyBroadcastSync]);

  // Delete Codex Entry
  const deleteCodexEntry = useCallback(async (entryId: string) => {
    setSyncState('saving');
    setCodexEntries(prev => prev.filter(e => e.id !== entryId));
    try {
      await storage.deleteCodexEntry(entryId);
      setSyncState('synced');
      notifyBroadcastSync();
    } catch {
      setSyncState('offline');
    }
  }, [storage, notifyBroadcastSync]);

  // Standard Manual Save + Version Snapshot trigger
  const manualSaveAndSnapshot = useCallback(async (customLabel?: string) => {
    if (!activeStory) return;
    setSyncState('saving');

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    await storage.saveStory(activeStory);
    await storage.saveChapters(chapters);
    for (const entry of codexEntries) {
      await storage.saveCodexEntry(entry);
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const label = customLabel?.trim() || `Manual Save (${timeStr})`;
    
    await storage.createSnapshot(activeStory.id, label);
    const updatedSnapshots = await storage.getSnapshots(activeStory.id);
    
    setSnapshots(updatedSnapshots);
    setSyncState('synced');
    setLastSavedTime(Date.now());
    notifyBroadcastSync();
  }, [activeStory, chapters, codexEntries, storage, notifyBroadcastSync]);

  // Add Chapter
  const addChapter = useCallback(async () => {
    if (!activeStory) return;
    const now = Date.now();
    const newChapter: Chapter = {
      id: 'ch-' + now + '-' + Math.random().toString(36).substr(2, 4),
      storyId: activeStory.id,
      order: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      overview: 'New chapter overview beat...',
      content: '<p></p>',
      wordCount: 0,
      targetWordCount: 2500,
      status: 'drafting',
      updatedAt: now,
    };

    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    setActiveChapterId(newChapter.id);

    try {
      await storage.saveChapter(newChapter);
      notifyBroadcastSync();
    } catch (err) {
      console.error('Failed to save new chapter:', err);
    }
  }, [activeStory, chapters, storage, notifyBroadcastSync]);

  // Delete Chapter
  const deleteChapter = useCallback(async (chapterId: string) => {
    if (chapters.length <= 1) return;
    const remaining = chapters.filter((c) => c.id !== chapterId);
    const reordered = remaining.map((ch, idx) => ({ ...ch, order: idx + 1 }));
    setChapters(reordered);
    if (activeChapterId === chapterId) {
      setActiveChapterId(reordered[0]?.id || null);
    }

    try {
      await storage.deleteChapter(chapterId);
      const totalWords = reordered.reduce((sum, c) => sum + c.wordCount, 0);
      if (activeStory) {
        const updatedStory = { ...activeStory, totalWordCount: totalWords, updatedAt: Date.now() };
        setActiveStory(updatedStory);
        await storage.saveStory(updatedStory);
        setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
      }
      notifyBroadcastSync();
    } catch (err) {
      console.error('Failed to delete chapter:', err);
    }
  }, [chapters, activeChapterId, activeStory, storage, notifyBroadcastSync]);

  // Reorder Chapters
  const reorderChapters = useCallback(async (reordered: Chapter[]) => {
    const updated = reordered.map((ch, idx) => ({ ...ch, order: idx + 1, updatedAt: Date.now() }));
    setChapters(updated);
    try {
      await storage.saveChapters(updated);
      notifyBroadcastSync();
    } catch (err) {
      console.error('Failed to reorder chapters:', err);
    }
  }, [storage, notifyBroadcastSync]);

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
    const storyCodex = await storage.getCodex(target.id);
    setCodexEntries(storyCodex);

    const storySnapshots = await storage.getSnapshots(target.id);
    setSnapshots(storySnapshots);
    setLoading(false);
  }, [stories, storage]);

  // Create Story with Full Setup Meta & Parsed Chapters
  const createStoryWithSetup = useCallback(async (data: {
    title: string;
    idea: string;
    overview: string;
    targetWordCount: number;
    coverImage?: string;
  }) => {
    setLoading(true);
    const now = Date.now();
    const newStory: Story = {
      id: 'story-' + now + '-' + Math.random().toString(36).substr(2, 4),
      title: data.title || 'New Story Manuscript',
      storyIdea: data.idea || '',
      storyOverview: data.overview || '# Act I: Opening\n- Scene 1 setup',
      totalWordCount: 0,
      targetWordCount: data.targetWordCount || 50000,
      coverImage: data.coverImage,
      createdAt: now,
      updatedAt: now,
    };

    let initialChapters = parseOverviewToChapters(newStory.id, newStory.storyOverview, 1);
    if (initialChapters.length === 0) {
      initialChapters = [{
        id: 'ch-' + now + '-1',
        storyId: newStory.id,
        order: 1,
        title: 'Chapter 1: The Inciting Incident',
        overview: 'Introduce main characters and setting.',
        content: '<p></p>',
        wordCount: 0,
        targetWordCount: 2500,
        status: 'drafting',
        updatedAt: now,
      }];
    }

    await storage.saveStory(newStory);
    await storage.saveChapters(initialChapters);

    const all = await storage.getStories();
    setStories(all);
    setActiveStory(newStory);
    setChapters(initialChapters);
    setActiveChapterId(initialChapters[0].id);
    setCodexEntries([]);
    setSnapshots([]);
    setLoading(false);
    notifyBroadcastSync();
    return newStory;
  }, [storage, notifyBroadcastSync]);

  // Simple Create Story fallback
  const createNewStory = useCallback(async (title: string, idea = '') => {
    return await createStoryWithSetup({
      title,
      idea,
      overview: '# Act I: Opening\n- Scene 1 setup',
      targetWordCount: 50000,
    });
  }, [createStoryWithSetup]);

  // Delete Story
  const deleteStory = useCallback(async (storyId: string) => {
    if (stories.length <= 1) return;
    setLoading(true);
    try {
      await storage.deleteStory(storyId);
      const remaining = stories.filter(s => s.id !== storyId);
      setStories(remaining);
      if (activeStory?.id === storyId && remaining.length > 0) {
        await switchStory(remaining[0].id);
      }
      notifyBroadcastSync();
    } catch (err) {
      console.error('Failed to delete story:', err);
    } finally {
      setLoading(false);
    }
  }, [stories, activeStory?.id, storage, switchStory, notifyBroadcastSync]);

  // Generate Chapters from Story Overview AI / Markdown Outline
  const generateChaptersFromOverview = useCallback(async () => {
    if (!activeStory || !activeStory.storyOverview) return;
    const parsed = parseOverviewToChapters(activeStory.id, activeStory.storyOverview, chapters.length + 1);
    if (parsed.length === 0) return;

    const merged = [...chapters, ...parsed];
    setChapters(merged);
    try {
      await storage.saveChapters(merged);
      notifyBroadcastSync();
    } catch (err) {
      console.error('Failed to save generated chapters:', err);
    }
  }, [activeStory, chapters, storage, notifyBroadcastSync]);

  // Restore snapshot version
  const restoreSnapshot = useCallback(async (snapshotId: string) => {
    try {
      const restored = await storage.restoreSnapshot(snapshotId);
      if (restored) {
        setActiveStory(restored.story);
        setChapters(restored.chapters);
        if (restored.chapters.length > 0) {
          setActiveChapterId(restored.chapters[0].id);
        }
        await refreshStories(restored.story.id);
        notifyBroadcastSync();
      }
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
    }
  }, [storage, refreshStories, notifyBroadcastSync]);

  return {
    loading,
    stories,
    activeStory,
    chapters,
    activeChapter,
    activeChapterId,
    setActiveChapterId,
    codexEntries,
    saveCodexEntry,
    deleteCodexEntry,
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
    createStoryWithSetup,
    deleteStory,
    generateChaptersFromOverview,
    manualSaveAndSnapshot,
    restoreSnapshot,
  };
}
