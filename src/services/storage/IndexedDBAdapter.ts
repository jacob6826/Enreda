import { db } from './db';
import type { Story, Chapter, Snapshot } from '../../types/manuscript';

export interface StorageAdapter {
  getStories(): Promise<Story[]>;
  getStory(storyId: string): Promise<Story | undefined>;
  saveStory(story: Story): Promise<void>;
  deleteStory(storyId: string): Promise<void>;
  
  getChapters(storyId: string): Promise<Chapter[]>;
  getChapter(chapterId: string): Promise<Chapter | undefined>;
  saveChapter(chapter: Chapter): Promise<void>;
  saveChapters(chapters: Chapter[]): Promise<void>;
  deleteChapter(chapterId: string): Promise<void>;

  getSnapshots(storyId: string): Promise<Snapshot[]>;
  createSnapshot(storyId: string, label: string): Promise<Snapshot>;
  restoreSnapshot(snapshotId: string): Promise<{ story: Story; chapters: Chapter[] } | undefined>;
  deleteSnapshot(snapshotId: string): Promise<void>;

  seedInitialDataIfEmpty(): Promise<Story>;
}

export const indexedDBAdapter: StorageAdapter = {
  async getStories(): Promise<Story[]> {
    const stories = await db.stories.orderBy('updatedAt').reverse().toArray();
    return stories.map((s) => ({
      ...s,
      targetWordCount: s.targetWordCount || 50000,
    }));
  },

  async getStory(storyId: string): Promise<Story | undefined> {
    const s = await db.stories.get(storyId);
    if (!s) return undefined;
    return { ...s, targetWordCount: s.targetWordCount || 50000 };
  },

  async saveStory(story: Story): Promise<void> {
    await db.stories.put(story);
  },

  async deleteStory(storyId: string): Promise<void> {
    await db.transaction('rw', [db.stories, db.chapters, db.snapshots], async () => {
      await db.stories.delete(storyId);
      await db.chapters.where('storyId').equals(storyId).delete();
      await db.snapshots.where('storyId').equals(storyId).delete();
    });
  },

  async getChapters(storyId: string): Promise<Chapter[]> {
    const chapters = await db.chapters.where('storyId').equals(storyId).toArray();
    return chapters.sort((a, b) => a.order - b.order);
  },

  async getChapter(chapterId: string): Promise<Chapter | undefined> {
    return await db.chapters.get(chapterId);
  },

  async saveChapter(chapter: Chapter): Promise<void> {
    await db.chapters.put(chapter);
    const chapters = await this.getChapters(chapter.storyId);
    const totalWords = chapters.reduce((sum, c) => sum + (c.id === chapter.id ? chapter.wordCount : c.wordCount), 0);
    const story = await this.getStory(chapter.storyId);
    if (story) {
      story.totalWordCount = totalWords;
      story.updatedAt = Date.now();
      await db.stories.put(story);
    }
  },

  async saveChapters(chapters: Chapter[]): Promise<void> {
    if (chapters.length === 0) return;
    await db.chapters.bulkPut(chapters);
    const storyId = chapters[0].storyId;
    const allChapters = await this.getChapters(storyId);
    const totalWords = allChapters.reduce((sum, c) => sum + c.wordCount, 0);
    const story = await this.getStory(storyId);
    if (story) {
      story.totalWordCount = totalWords;
      story.updatedAt = Date.now();
      await db.stories.put(story);
    }
  },

  async deleteChapter(chapterId: string): Promise<void> {
    const chapter = await db.chapters.get(chapterId);
    if (!chapter) return;
    const storyId = chapter.storyId;
    await db.chapters.delete(chapterId);

    const remaining = await this.getChapters(storyId);
    const reordered = remaining.map((ch, idx) => ({ ...ch, order: idx + 1 }));
    await db.chapters.bulkPut(reordered);

    const totalWords = reordered.reduce((sum, c) => sum + c.wordCount, 0);
    const story = await this.getStory(storyId);
    if (story) {
      story.totalWordCount = totalWords;
      story.updatedAt = Date.now();
      await db.stories.put(story);
    }
  },

  async getSnapshots(storyId: string): Promise<Snapshot[]> {
    return await db.snapshots.where('storyId').equals(storyId).reverse().sortBy('timestamp');
  },

  async createSnapshot(storyId: string, label: string): Promise<Snapshot> {
    const story = await this.getStory(storyId);
    if (!story) throw new Error('Story not found');
    const chapters = await this.getChapters(storyId);

    const snapshot: Snapshot = {
      id: 'snap-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      storyId,
      label: label || `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now(),
      payload: {
        story: { ...story },
        chapters: chapters.map(c => ({ ...c })),
      }
    };

    await db.snapshots.put(snapshot);
    return snapshot;
  },

  async restoreSnapshot(snapshotId: string): Promise<{ story: Story; chapters: Chapter[] } | undefined> {
    const snapshot = await db.snapshots.get(snapshotId);
    if (!snapshot) return undefined;

    const { story, chapters } = snapshot.payload;
    await db.transaction('rw', [db.stories, db.chapters], async () => {
      await db.stories.put(story);
      await db.chapters.where('storyId').equals(story.id).delete();
      await db.chapters.bulkPut(chapters);
    });

    return { story, chapters };
  },

  async deleteSnapshot(snapshotId: string): Promise<void> {
    await db.snapshots.delete(snapshotId);
  },

  async seedInitialDataIfEmpty(): Promise<Story> {
    const existingStories = await this.getStories();
    if (existingStories.length > 0) {
      return existingStories[0];
    }

    const now = Date.now();
    const cleanStory: Story = {
      id: 'story-1',
      title: 'My First Story',
      storyIdea: '',
      storyOverview: `# Act I: The Beginning\n- Introduce main character\n- Inciting incident`,
      totalWordCount: 0,
      targetWordCount: 50000,
      updatedAt: now,
      createdAt: now,
    };

    const firstChapter: Chapter = {
      id: 'ch-1',
      storyId: cleanStory.id,
      order: 1,
      title: 'Chapter 1: The Inciting Incident',
      overview: 'Introduce main characters and setting.',
      content: '<p></p>',
      wordCount: 0,
      targetWordCount: 2500,
      updatedAt: now,
    };

    await db.stories.put(cleanStory);
    await db.chapters.put(firstChapter);

    return cleanStory;
  }
};
