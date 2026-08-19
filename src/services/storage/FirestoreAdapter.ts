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
import type { Story, Chapter, Snapshot } from '../../types/manuscript';
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

  return {
    async getStories(): Promise<Story[]> {
      try {
        const q = query(storiesCol, orderBy('updatedAt', 'desc'));
        const snap = await getDocs(q);
        const stories: Story[] = [];
        snap.forEach((d) => {
          const data = d.data() as Story;
          stories.push({ ...data, targetWordCount: data.targetWordCount || 50000 });
        });

        // Get local IndexedDB stories to auto-sync into Firestore if needed
        const localStories = await indexedDBAdapter.getStories();

        if (stories.length > 0) {
          // Sync any local story that isn't in Firestore yet
          for (const localStory of localStories) {
            if (!stories.some((s) => s.id === localStory.id)) {
              try {
                await setDoc(doc(storiesCol, localStory.id), localStory, { merge: true });
                const localChs = await indexedDBAdapter.getChapters(localStory.id);
                if (localChs.length > 0) {
                  const batch = writeBatch(db);
                  localChs.forEach((ch) => batch.set(doc(chaptersCol, ch.id), ch, { merge: true }));
                  await batch.commit();
                }
                stories.push(localStory);
              } catch (e) {
                console.warn('Failed to push local story to Firestore:', e);
              }
            }
          }
          return stories;
        }

        // If Firestore is empty, upload all local stories to Firestore
        if (localStories.length > 0) {
          for (const localStory of localStories) {
            try {
              await setDoc(doc(storiesCol, localStory.id), localStory, { merge: true });
              const localChs = await indexedDBAdapter.getChapters(localStory.id);
              if (localChs.length > 0) {
                const batch = writeBatch(db);
                localChs.forEach((ch) => batch.set(doc(chaptersCol, ch.id), ch, { merge: true }));
                await batch.commit();
              }
            } catch (e) {
              console.warn('Failed to seed Firestore from local data:', e);
            }
          }
          return localStories;
        }

        return await indexedDBAdapter.getStories();
      } catch (err) {
        console.warn('Firestore getStories error, using local storage:', err);
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
        const chSnap = await getDocs(query(chaptersCol, where('storyId', '==', storyId)));
        if (db) {
          const batch = writeBatch(db);
          chSnap.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
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
          return await indexedDBAdapter.getChapters(storyId);
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
        if (db && chapters.length > 0) {
          const batch = writeBatch(db);
          chapters.forEach((ch) => {
            batch.set(doc(chaptersCol, ch.id), ch, { merge: true });
          });
          await batch.commit();
        }
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
