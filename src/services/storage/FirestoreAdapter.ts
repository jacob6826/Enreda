import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
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
        const q = query(storiesCol, orderBy('updatedAt', 'desc'));
        const snap = await getDocs(q);
        const firestoreStories: Story[] = [];
        snap.forEach((d) => {
          const data = d.data() as Story;
          firestoreStories.push({ ...data, targetWordCount: data.targetWordCount || 50000 });
        });

        // Seed or pull local fallback if Firestore returns empty
        if (firestoreStories.length === 0) {
          const localStories = await indexedDBAdapter.getStories();
          if (localStories.length > 0) {
            console.log('[FirestoreSync] Uploading local IndexedDB stories to Firestore...');
            for (const story of localStories) {
              await setDoc(doc(storiesCol, story.id), story, { merge: true });
              const localChs = await indexedDBAdapter.getChapters(story.id);
              for (const ch of localChs) {
                await setDoc(doc(chaptersCol, ch.id), ch, { merge: true });
              }
            }
            return localStories;
          }
          return firestoreStories;
        }

        return firestoreStories;
      } catch (err) {
        console.warn('Firestore getStories failed, using local IndexedDB:', err);
        return await indexedDBAdapter.getStories();
      }
    },

    async getStory(storyId: string): Promise<Story | undefined> {
      try {
        const docRef = doc(storiesCol, storyId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return await indexedDBAdapter.getStory(storyId);
        const data = snap.data() as Story;
        return { ...data, targetWordCount: data.targetWordCount || 50000 };
      } catch {
        return await indexedDBAdapter.getStory(storyId);
      }
    },

    async saveStory(story: Story): Promise<void> {
      // Save locally first for instant offline access
      await indexedDBAdapter.saveStory(story);
      try {
        const docRef = doc(storiesCol, story.id);
        await setDoc(docRef, story, { merge: true });
      } catch (err) {
        console.warn('Firestore story save failed, changes cached locally:', err);
      }
    },

    async deleteStory(storyId: string): Promise<void> {
      await indexedDBAdapter.deleteStory(storyId);
      try {
        await deleteDoc(doc(storiesCol, storyId));
        // Delete chapters in Firestore
        const chSnap = await getDocs(query(chaptersCol, where('storyId', '==', storyId)));
        const batch = writeBatch(db);
        chSnap.forEach((d) => batch.delete(d.ref));

        const codexSnap = await getDocs(query(codexCol, where('storyId', '==', storyId)));
        codexSnap.forEach((d) => batch.delete(d.ref));

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
        if (chapters.length === 0) {
          const localChs = await indexedDBAdapter.getChapters(storyId);
          if (localChs.length > 0) {
            const batch = writeBatch(db);
            localChs.forEach((ch) => batch.set(doc(chaptersCol, ch.id), ch, { merge: true }));
            await batch.commit();
          }
          return localChs;
        }
        return chapters;
      } catch {
        return await indexedDBAdapter.getChapters(storyId);
      }
    },

    async getChapter(chapterId: string): Promise<Chapter | undefined> {
      try {
        const snap = await getDoc(doc(chaptersCol, chapterId));
        if (!snap.exists()) return await indexedDBAdapter.getChapter(chapterId);
        return snap.data() as Chapter;
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
        const q = query(codexCol, where('storyId', '==', storyId));
        const snap = await getDocs(q);
        const entries: CodexEntry[] = [];
        snap.forEach((d) => entries.push(d.data() as CodexEntry));
        entries.sort((a, b) => b.updatedAt - a.updatedAt);
        if (entries.length === 0) {
          return await indexedDBAdapter.getCodex(storyId);
        }
        return entries;
      } catch {
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
