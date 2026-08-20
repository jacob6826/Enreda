import Dexie, { Table } from 'dexie';
import type { Story, Chapter, Snapshot, CodexEntry } from '../../types/manuscript';

class ManuscriptDatabase extends Dexie {
  stories!: Table<Story, string>;
  chapters!: Table<Chapter, string>;
  codex!: Table<CodexEntry, string>;
  snapshots!: Table<Snapshot, string>;

  constructor() {
    super('EnredaDatabase');
    this.version(1).stores({
      stories: 'id, title, updatedAt',
      chapters: 'id, storyId, order, updatedAt',
      codex: 'id, storyId, category, name, updatedAt',
      snapshots: 'id, storyId, timestamp',
    });
  }
}

export const db = new ManuscriptDatabase();

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
  getCodex(storyId: string): Promise<CodexEntry[]>;
  saveCodexEntry(entry: CodexEntry): Promise<void>;
  deleteCodexEntry(entryId: string): Promise<void>;
  getSnapshots(storyId: string): Promise<Snapshot[]>;
  createSnapshot(storyId: string, label: string): Promise<Snapshot>;
  restoreSnapshot(snapshotId: string): Promise<{ story: Story; chapters: Chapter[] } | undefined>;
  deleteSnapshot(snapshotId: string): Promise<void>;
  seedInitialDataIfEmpty(): Promise<Story>;
}

export const indexedDBAdapter: StorageAdapter = {
  async getStories(): Promise<Story[]> {
    return await db.stories.orderBy('updatedAt').reverse().toArray();
  },

  async getStory(storyId: string): Promise<Story | undefined> {
    return await db.stories.get(storyId);
  },

  async saveStory(story: Story): Promise<void> {
    await db.stories.put(story);
  },

  async deleteStory(storyId: string): Promise<void> {
    await db.transaction('rw', [db.stories, db.chapters, db.codex, db.snapshots], async () => {
      await db.stories.delete(storyId);
      await db.chapters.where('storyId').equals(storyId).delete();
      await db.codex.where('storyId').equals(storyId).delete();
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
    const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);
    const story = await this.getStory(chapter.storyId);
    if (story) {
      story.totalWordCount = totalWords;
      story.updatedAt = Date.now();
      await db.stories.put(story);
    }
  },

  async saveChapters(chapters: Chapter[]): Promise<void> {
    await db.chapters.bulkPut(chapters);
    if (chapters.length > 0) {
      const storyId = chapters[0].storyId;
      const allChapters = await this.getChapters(storyId);
      const totalWords = allChapters.reduce((sum, c) => sum + c.wordCount, 0);
      const story = await this.getStory(storyId);
      if (story) {
        story.totalWordCount = totalWords;
        story.updatedAt = Date.now();
        await db.stories.put(story);
      }
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

  async getCodex(storyId: string): Promise<CodexEntry[]> {
    const all = await db.codex.toArray();
    const filtered = all.filter((e) => !e.storyId || e.storyId === storyId);
    return filtered.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async saveCodexEntry(entry: CodexEntry): Promise<void> {
    await db.codex.put(entry);
  },

  async deleteCodexEntry(entryId: string): Promise<void> {
    await db.codex.delete(entryId);
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
    const count = await db.stories.count();
    if (count > 0) {
      const stories = await this.getStories();
      return stories[0];
    }

    const defaultStoryId = 'story-default-1';
    const initialStory: Story = {
      id: defaultStoryId,
      title: 'The Silent Horizon',
      storyIdea: 'Fantasy worldbuilding in winter tundra.',
      storyOverview: 'In a world where winter lasts for decades, a lone wanderer and their polar bear companion uncover ancient ruins beneath the tundra.',
      targetWordCount: 50000,
      totalWordCount: 16,
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now(),
    };

    const initialChapters: Chapter[] = [
      {
        id: 'ch-1',
        storyId: defaultStoryId,
        title: 'Chapter 1: Polar Bear',
        content: '<p>In the vast open sheets of ice that make up the arctic north roams Polar Bear.</p>',
        overview: 'Introduction to the frozen landscape and the polar bear wandering across the tundra.',
        order: 1,
        wordCount: 16,
        targetWordCount: 2500,
        status: 'drafting',
        pov: 'Elena',
        tags: ['Ice', 'Wilderness'],
        updatedAt: Date.now(),
      },
    ];

    const initialCodex: CodexEntry[] = [
      {
        id: 'codex-1',
        storyId: defaultStoryId,
        category: 'character',
        name: 'Elena',
        role: 'Protagonist',
        summary: 'Lead wanderer of the Northern Expedition.',
        details: 'Protagonist traveling across the frozen northern wastes with her polar bear companion.',
        updatedAt: Date.now(),
      },
    ];

    await db.stories.put(initialStory);
    await db.chapters.bulkPut(initialChapters);
    await db.codex.bulkPut(initialCodex);

    return initialStory;
  },
};
