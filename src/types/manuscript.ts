export interface Story {
  id: string;
  title: string;
  storyIdea: string;
  storyOverview: string;
  coverImage?: string; // Data URL or Image URL for story cover
  totalWordCount: number;
  targetWordCount: number; // e.g. 50,000 words goal
  updatedAt: number;
  createdAt: number;
}

export interface Chapter {
  id: string;
  storyId: string;
  order: number;
  title: string;
  overview: string;
  content: string; // Stored as HTML string
  chapterImage?: string; // Data URL or Image URL for chapter illustration (children books)
  wordCount: number;
  targetWordCount?: number; // e.g. 2,500 words chapter goal
  updatedAt: number;
}

export interface Snapshot {
  id: string;
  storyId: string;
  label: string;
  timestamp: number;
  payload: {
    story: Story;
    chapters: Chapter[];
  };
}

export type SyncState = 'synced' | 'saving' | 'offline';

export type ExportFormat = 'md' | 'docx' | 'pdf';

export type ExportMode = 'standard' | 'annotated';

export type ThemeMode = 'dark' | 'light';
