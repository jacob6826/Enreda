import React, { useState } from 'react';
import { X, Search, Replace, CheckCircle } from 'lucide-react';
import type { Chapter } from '../../types/manuscript';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChapter: Chapter | null;
  allChapters: Chapter[];
  onUpdateChapterContent: (chapterId: string, newContent: string) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  activeChapter,
  allChapters,
  onUpdateChapterContent,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [scope, setScope] = useState<'current' | 'global'>('current');
  const [matchCount, setMatchCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const countOccurrences = (str: string, term: string) => {
    if (!term) return 0;
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    return (str.match(regex) || []).length;
  };

  const handleSearch = () => {
    if (!query.trim()) {
      setMatchCount(0);
      return;
    }
    let total = 0;
    if (scope === 'current' && activeChapter) {
      total = countOccurrences(activeChapter.content, query);
    } else if (scope === 'global') {
      allChapters.forEach((ch) => {
        total += countOccurrences(ch.content, query);
      });
    }
    setMatchCount(total);
  };

  const handleReplaceAll = () => {
    if (!query.trim()) return;
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let replacedCount = 0;

    if (scope === 'current' && activeChapter) {
      const count = countOccurrences(activeChapter.content, query);
      if (count > 0) {
        const newHtml = activeChapter.content.replace(regex, replacement);
        onUpdateChapterContent(activeChapter.id, newHtml);
        replacedCount += count;
      }
    } else if (scope === 'global') {
      allChapters.forEach((ch) => {
        const count = countOccurrences(ch.content, query);
        if (count > 0) {
          const newHtml = ch.content.replace(regex, replacement);
          onUpdateChapterContent(ch.id, newHtml);
          replacedCount += count;
        }
      });
    }

    setMatchCount(0);
    alert(`Successfully replaced ${replacedCount} occurrence(s).`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Find & Replace</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center gap-2 mb-4 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setScope('current')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              scope === 'current' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Current Chapter
          </button>
          <button
            onClick={() => setScope('global')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              scope === 'global' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entire Story (Global)
          </button>
        </div>

        {/* Search Input */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Find text:</label>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setMatchCount(null);
              }}
              placeholder="Text to find..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Replace with:</label>
            <input
              type="text"
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              placeholder="Replacement text..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Match Count Indicator */}
        {matchCount !== null && (
          <div className="mb-4 text-xs text-indigo-300 bg-indigo-950/50 p-2 rounded border border-indigo-800/60 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>Found {matchCount} occurrence(s) in {scope === 'current' ? 'active chapter' : 'entire manuscript'}.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
          <button
            onClick={handleSearch}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-md text-xs font-medium transition-colors"
          >
            Count Matches
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={!query.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              <Replace className="w-3.5 h-3.5" />
              <span>Replace All</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
