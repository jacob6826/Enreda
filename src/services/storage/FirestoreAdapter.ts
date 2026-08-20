import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { Story, Chapter, Snapshot, CodexEntry } from '../../types/manuscript';
import { indexedDBAdapter } from './IndexedDBAdapter';
import type { StorageAdapter } from './IndexedDBAdapter';

export function createFirestoreAdapter(userId: string | null): StorageAdapter {
  // Fallback to IndexedDB if not logged in or db is null
  if (!userId || !db) {
    return indexedDBAdapter;
  }

  const userDocRef = doc(db, 'users', userId);
  const storiesCol = collection(userDocRef, 'stories');
  const chaptersCol = collection(userDocRef, 'chapters');
  const snapshotsCol = collection(userDocRef, 'snapshots');
  const codexCol = collection(userDocRef, 'codex');

  return {
    async getStories(): Promise<Story[]> {
      try {
        console.log(`[FirestoreSync] Fetching stories for user: ${userId}`);
        const snap = await getDocs(storiesCol);
        const firestoreStories: Story[] = [];
        snap.forEach((d) => {
          const data = d.data() as Story;
          firestoreStories.push({ ...data, targetWordCount: data.targetWordCount || 50000 });
        });

        const localStories = await indexedDBAdapter.getStories();

        // Seed or pull local fallback if Firestore returns empty
        if (firestoreStories.length === 0) {
          if (localStories.length > 0) {
            console.log('[FirestoreSync] Uploading local IndexedDB stories to Firestore...');
            for (const story of localStories) {
              await setDoc(doc(storiesCol, story.id), story, { merge: true });
              const localChs = await indexedDBAdapter.getChapters(story.id);
              for (const ch of localChs) {
                await setDoc(doc(chaptersCol, ch.id), ch, { merge: true });
              }
              const localCodex = await indexedDBAdapter.getCodex(story.id);
              for (const entry of localCodex) {
                await setDoc(doc(codexCol, entry.id), entry, { merge: true });
              }
            }
            return localStories;
          }
        }

        // Cache Firestore stories into local IndexedDB
        for (const story of firestoreStories) {
          await indexedDBAdapter.saveStory(story);
        }

        // MERGE local stories that may not have finished uploading to Firestore yet
        const storyMap = new Map<string, Story>();
        firestoreStories.forEach((s) => storyMap.set(s.id, s));
        for (const local of localStories) {
          if (!storyMap.has(local.id)) {
            storyMap.set(local.id, local);
            setDoc(doc(storiesCol, local.id), local, { merge: true }).catch(console.warn);
          }
        }

        const mergedStories = Array.from(storyMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
        return mergedStories;
      } catch (err) {
        console.warn('Firestore getStories failed, using IndexedDB fallback:', err);
        return await indexedDBAdapter.getStories();
      }
    },

    async getStory(storyId: string): Promise<Story | undefined> {
      try {
        const snap = await getDoc(doc(storiesCol, storyId));
        if (!snap.exists()) return await indexedDBAdapter.getStory(storyId);
        const story = snap.data() as Story;
        await indexedDBAdapter.saveStory(story);
        return story;
      } catch {
        return await indexedDBAdapter.getStory(storyId);
      }
    },

    async saveStory(story: Story): Promise<void> {
      await indexedDBAdapter.saveStory(story);
      try {
        await setDoc(doc(storiesCol, story.id), story, { merge: true });
      } catch (err) {
        console.warn('Firestore story save failed:', err);
      }
    },

    async deleteStory(storyId: string): Promise<void> {
      await indexedDBAdapter.deleteStory(storyId);
      try {
        await deleteDoc(doc(storiesCol, storyId));
        const chapters = await this.getChapters(storyId);
        const batch = writeBatch(db);
        chapters.forEach((ch) => batch.delete(doc(chaptersCol, ch.id)));

        const codexEntries = await this.getCodex(storyId);
        codexEntries.forEach((entry) => batch.delete(doc(codexCol, entry.id)));

        await batch.commit();
      } catch (err) {
        console.warn('Firestore story deletion failed:', err);
      }
    },

    async getChapters(storyId: string): Promise<Chapter[]> {
      try {
        const q = query(chaptersCol, where('storyId', '==', storyId));
        const snap = await getDocs(q);
        const chapters: Chapter[] = [];
        snap.forEach((d) => chapters.push(d.data() as Chapter));
        chapters.sort((a, b) => a.order - b.order);

        const localChs = await indexedDBAdapter.getChapters(storyId);

        if (chapters.length === 0) {
          if (localChs.length > 0) {
            const batch = writeBatch(db);
            localChs.forEach((ch) => batch.set(doc(chaptersCol, ch.id), ch, { merge: true }));
            await batch.commit();
          }
          return localChs;
        }

        // Cache chapters into IndexedDB
        for (const ch of chapters) {
          await indexedDBAdapter.saveChapter(ch);
        }

        // Merge local chapters for this story that haven't hit Firestore yet
        const chMap = new Map<string, Chapter>();
        chapters.forEach((c) => chMap.set(c.id, c));
        for (const local of localChs) {
          if (!chMap.has(local.id)) {
            chMap.set(local.id, local);
            setDoc(doc(chaptersCol, local.id), local, { merge: true }).catch(console.warn);
          }
        }

        return Array.from(chMap.values()).sort((a, b) => a.order - b.order);
      } catch {
        return await indexedDBAdapter.getChapters(storyId);
      }
    },

    async getChapter(chapterId: string): Promise<Chapter | undefined> {
      try {
        const snap = await getDoc(doc(chaptersCol, chapterId));
        if (!snap.exists()) return await indexedDBAdapter.getChapter(chapterId);
        const ch = snap.data() as Chapter;
        await indexedDBAdapter.saveChapter(ch);
        return ch;
      } catch {
        return await indexedDBAdapter.getChapter(chapterId);
      }
    },

    async saveChapter(chapter: Chapter): Promise<void> {
      await indexedDBAdapter.saveChapter(chapter);
      try {
        await setDoc(doc(chaptersCol, chapter.id), chapter, { merge: true });
      } catch (err) {
        console.warn('Firestore chapter save failed:', err);
      }
    },

    async saveChapters(chapters: Chapter[]): Promise<void> {
      await indexedDBAdapter.saveChapters(chapters);
      try {
        const batch = writeBatch(db);
        chapters.forEach((ch) => {
          batch.set(doc(chaptersCol, ch.id), ch, { merge: true });
        });
        await batch.commit();
      } catch (err) {
        console.warn('Firestore bulk chapters save failed:', err);
      }
    },

    async deleteChapter(chapterId: string): Promise<void> {
      await indexedDBAdapter.deleteChapter(chapterId);
      try {
        await deleteDoc(doc(chaptersCol, chapterId));
      } catch (err) {
        console.warn('Firestore chapter deletion failed:', err);
      }
    },

    async getCodex(storyId: string): Promise<CodexEntry[]> {
      try {
        console.log(`[FirestoreSync] Fetching Codex entries for storyId: ${storyId}`);
        const snap = await getDocs(codexCol);
        const entries: CodexEntry[] = [];
        snap.forEach((d) => {
          const data = d.data() as CodexEntry;
          if (data.storyId === storyId) {
            entries.push(data);
          }
        });
        entries.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const localEntries = await indexedDBAdapter.getCodex(storyId);

        if (entries.length === 0) {
          if (localEntries.length > 0) {
            console.log('[FirestoreSync] Uploading local Codex entries to Firestore...');
            const batch = writeBatch(db);
            localEntries.forEach((entry) => {
              batch.set(doc(codexCol, entry.id), entry, { merge: true });
            });
            await batch.commit();
          }
          return localEntries;
        }

        // Cache cloud entries down to local IndexedDB for offline support
        for (const entry of entries) {
          await indexedDBAdapter.saveCodexEntry(entry);
        }

        // Merge any local entries for this story that haven't hit Firestore yet
        const entryMap = new Map<string, CodexEntry>();
        entries.forEach((e) => entryMap.set(e.id, e));
        for (const local of localEntries) {
          if (local.storyId === storyId && !entryMap.has(local.id)) {
            entryMap.set(local.id, local);
            setDoc(doc(codexCol, local.id), local, { merge: true }).catch(console.warn);
          }
        }

        return Array.from(entryMap.values()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      } catch (err) {
        console.warn('Firestore getCodex failed, using IndexedDB fallback:', err);
        return await indexedDBAdapter.getCodex(storyId);
      }
    },

    async saveCodexEntry(entry: CodexEntry): Promise<void> {
      await indexedDBAdapter.saveCodexEntry(entry);
      try {
        await setDoc(doc(codexCol, entry.id), entry, { merge: true });
      } catch (err) {
        console.warn('Firestore codex save failed:', err);
      }
    },

    async deleteCodexEntry(entryId: string): Promise<void> {
      await indexedDBAdapter.deleteCodexEntry(entryId);
      try {
        await deleteDoc(doc(codexCol, entryId));
      } catch (err) {
        console.warn('Firestore codex deletion failed:', err);
      }
    },

    async getSnapshots(storyId: string): Promise<Snapshot[]> {
      try {
        const q = query(snapshotsCol, where('storyId', '==', storyId));
        const snap = await getDocs(q);
        const list: Snapshot[] = [];
        snap.forEach((d) => list.push(d.data() as Snapshot));
        list.sort((a, b) => b.timestamp - a.timestamp);
        if (list.length === 0) return await indexedDBAdapter.getSnapshots(storyId);
        return list;
      } catch {
        return await indexedDBAdapter.getSnapshots(storyId);
      }
    },

    async createSnapshot(storyId: string, label: string): Promise<Snapshot> {
      const snap = await indexedDBAdapter.createSnapshot(storyId, label);
      try {
        await setDoc(doc(snapshotsCol, snap.id), snap);
      } catch (err) {
        console.warn('Firestore snapshot creation failed:', err);
      }
      return snap;
    },

    async restoreSnapshot(snapshotId: string): Promise<{ story: Story; chapters: Chapter[] } | undefined> {
      return await indexedDBAdapter.restoreSnapshot(snapshotId);
    },

    async deleteSnapshot(snapshotId: string): Promise<void> {
      await indexedDBAdapter.deleteSnapshot(snapshotId);
      try {
        await deleteDoc(doc(snapshotsCol, snapshotId));
      } catch (err) {
        console.warn('Firestore snapshot deletion failed:', err);
      }
    },

    async seedInitialDataIfEmpty(): Promise<Story> {
      return await indexedDBAdapter.seedInitialDataIfEmpty();
    },
  };
}
