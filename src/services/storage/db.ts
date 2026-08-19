import Dexie, { Table } from 'dexie';
import { Story, Chapter, Snapshot } from '../../types/manuscript';

export class ManuscriptDatabase extends Dexie {
  stories!: Table<Story, string>;
  chapters!: Table<Chapter, string>;
  snapshots!: Table<Snapshot, string>;

  constructor() {
    super('ManuscriptStudioDB');
    this.version(1).stores({
      stories: 'id, title, updatedAt',
      chapters: 'id, storyId, order, updatedAt',
      snapshots: 'id, storyId, timestamp'
    });
  }
}

export const db = new ManuscriptDatabase();
