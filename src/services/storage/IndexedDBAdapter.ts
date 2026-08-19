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
    const demoStory: Story = {
      id: 'story-demo-1',
      title: 'The Starlight Dragon',
      storyIdea: 'An illustrated children\'s tale about Barnaby the small blue dragon who loses his glow and embarks on a nighttime quest across Whispering Woods.',
      storyOverview: `# Act I: The Dimming Spark
* **Setting**: The cozy hollow oak tree in Whispering Woods.
* **Protagonist**: Barnaby - a friendly little blue dragon who shines like a nightlight.
* **Inciting Beat**: Waking up on the eve of the Starlight Festival to find his tail spark has gone out!

# Act II: The Quest for Moon-Dew
* **Midpoint Journey**: Journeying to the Silver Pond. Meeting Pip the Barn Owl and Oliver the Hedgehog.
* **Conflict**: Finding the path blocked by the Shadow Brambles.

# Act III: The Festival Glow
* **Climax**: Learning that true light comes from sharing kindness and courage.
* **Resolution**: Barnaby's spark returns brighter than ever to light up the Starlight Parade.`,
      coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=800&auto=format&fit=crop&q=80',
      totalWordCount: 420,
      targetWordCount: 2500,
      updatedAt: now,
      createdAt: now,
    };

    const c1Content = `<p>Deep inside the hollow of the Great Oak Tree lived Barnaby, a tiny blue dragon no bigger than a teacup. Most dragons breathed fire, but Barnaby breathed gentle golden sparkles that lit up the forest at night.</p><p>Every year, Barnaby led the Starlight Festival parade through Whispering Woods. But when he woke up on the morning of the festival, his tail spark was completely gone!</p><blockquote><p>"Oh dear," squeaked Barnaby, wiggling his tail in front of the mirror. "How will the woodland animals find their way through the dark?"</p></blockquote>`;

    const c2Content = `<p>Barnaby gathered his mini acorn backpack and trotted out into the misty morning. High in the branches above, Pip the Barn Owl swooped down with a flutter of soft white feathers.</p><p>"Hoo-hoo! Why the long face, Barnaby?" asked Pip, perching on a mossy branch.</p><p>"My spark is gone!" cried Barnaby. "Oliver Hedgehog says the Silver Pond moon-dew is the only thing that can restore a dragon's glow."</p>`;

    const c3Content = `<p>Together, Barnaby, Pip, and Oliver reached the edge of the Silver Pond just as the evening moon rose above the trees. The water glittered like liquid starlight.</p><p>Barnaby dipped his tiny snout into the cool water and took a gentle sip. Suddenly, a warm tickle spread all the way down to his toes!</p>`;

    const ch1: Chapter = {
      id: 'ch-1',
      storyId: demoStory.id,
      order: 1,
      title: 'Chapter 1: The Lost Spark',
      overview: 'Introduce Barnaby in his cozy oak tree hollow. Discover that his glow spark has gone out on festival day.',
      chapterImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
      content: c1Content,
      wordCount: 140,
      targetWordCount: 500,
      updatedAt: now,
    };

    const ch2: Chapter = {
      id: 'ch-2',
      storyId: demoStory.id,
      order: 2,
      title: 'Chapter 2: Into Whispering Woods',
      overview: 'Barnaby sets out on his quest. Pip the Owl and Oliver Hedgehog join his journey.',
      chapterImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80',
      content: c2Content,
      wordCount: 150,
      targetWordCount: 500,
      updatedAt: now,
    };

    const ch3: Chapter = {
      id: 'ch-3',
      storyId: demoStory.id,
      order: 3,
      title: 'Chapter 3: The Silver Pond',
      overview: 'Reaching the magical Silver Pond and restoring Barnaby\'s starlight spark.',
      chapterImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
      content: c3Content,
      wordCount: 130,
      targetWordCount: 500,
      updatedAt: now,
    };

    await db.stories.put(demoStory);
    await db.chapters.bulkPut([ch1, ch2, ch3]);

    return demoStory;
  }
};
