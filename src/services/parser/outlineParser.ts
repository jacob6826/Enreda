import { Chapter } from '../../types/manuscript';

export function parseOverviewToChapters(storyId: string, overviewText: string, startOrder = 1): Chapter[] {
  if (!overviewText || !overviewText.trim()) return [];

  const lines = overviewText.split('\n');
  const chapters: Chapter[] = [];
  let currentTitle: string | null = null;
  let currentOverviewLines: string[] = [];
  let currentOrder = startOrder;

  const saveCurrentChapter = () => {
    if (currentTitle) {
      const overviewStr = currentOverviewLines.join('\n').trim();
      chapters.push({
        id: 'ch-gen-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        storyId,
        order: currentOrder++,
        title: currentTitle,
        overview: overviewStr,
        content: `<p></p>`,
        wordCount: 0,
        updatedAt: Date.now(),
      });
    }
  };

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headerMatch) {
      // Save previous chapter if active
      saveCurrentChapter();

      // Start new chapter
      currentTitle = headerMatch[1].trim();
      currentOverviewLines = [];
    } else if (currentTitle) {
      currentOverviewLines.push(line);
    }
  }

  // Save trailing chapter
  saveCurrentChapter();

  return chapters;
}
