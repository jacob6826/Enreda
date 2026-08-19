import React, { useState } from 'react';
import { Layers, FileText, X, ChevronDown, ChevronRight, HelpCircle, Target } from 'lucide-react';
import type { Chapter, Story } from '../../types/manuscript';

interface RightInspectorProps {
  story: Story | null;
  activeChapter: Chapter | null;
  onUpdateStoryOverview: (newOverview: string) => void;
  onUpdateChapterOverview: (chapterId: string, newOverview: string) => void;
  onUpdateChapterGoal?: (chapterId: string, targetWords: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  story,
  activeChapter,
  onUpdateStoryOverview,
  onUpdateChapterOverview,
  onUpdateChapterGoal,
  isOpen,
  onClose,
}) => {
  const [showStoryHelp, setShowStoryHelp] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    story: false,
    chapter: false,
  });

  if (!isOpen || !story) return null;

  const toggleSection = (key: 'story' | 'chapter') => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const chGoal = activeChapter?.targetWordCount || 2500;
  const chWords = activeChapter?.wordCount || 0;
  const chPercent = Math.min(100, Math.round((chWords / chGoal) * 100));

  return (
    <aside className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800/80 flex flex-col h-full select-none shrink-0 z-20">
      {/* Header */}
      <div className="px-3.5 py-3 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/40">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Overview Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Overview Panes Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Section 1: Story Overview & High-Level Arc */}
        <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div
            onClick={() => toggleSection('story')}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-between cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {collapsedSections.story ? (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              )}
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
                Story Arc & Outline
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStoryHelp(!showStoryHelp);
              }}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
              title="Formatting Tips"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          {!collapsedSections.story && (
            <div className="p-2.5 space-y-2">
              {showStoryHelp && (
                <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 p-2 rounded-md text-[11px] text-indigo-800 dark:text-indigo-200 leading-relaxed">
                  <strong>Tip:</strong> Use Markdown headings like <code># Act I: Title</code> for acts. Clicking <em>Parse Outline</em> in the left sidebar will convert these headings into chapter cards!
                </div>
              )}
              <textarea
                value={story.storyOverview}
                onChange={(e) => onUpdateStoryOverview(e.target.value)}
                placeholder="# Act I: Inciting Incident&#10;* Setting notes...&#10;* Character beats..."
                rows={8}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
              />
            </div>
          )}
        </div>

        {/* Section 2: Active Chapter Overview & Word Goal */}
        <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
          <div
            onClick={() => toggleSection('chapter')}
            className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-between cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {collapsedSections.chapter ? (
                <ChevronRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              )}
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                {activeChapter ? activeChapter.title : 'Active Chapter Overview'}
              </span>
            </div>
          </div>

          {!collapsedSections.chapter && (
            <div className="p-2.5 space-y-3">
              {/* Chapter Word Count Goal Input */}
              {activeChapter && (
                <div className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-indigo-500" /> Chapter Goal:
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={chGoal}
                        onChange={(e) => {
                          const val = Math.max(100, parseInt(e.target.value) || 0);
                          if (onUpdateChapterGoal) onUpdateChapterGoal(activeChapter.id, val);
                        }}
                        step={250}
                        className="w-16 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1 text-right text-[10px] text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px]">words</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span>{chWords} / {chGoal} words</span>
                    <span>{chPercent}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        chPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${chPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block mb-1">
                  Scene goals, POV, pacing, and chapter beats:
                </label>
                {activeChapter ? (
                  <textarea
                    value={activeChapter.overview}
                    onChange={(e) =>
                      onUpdateChapterOverview(activeChapter.id, e.target.value)
                    }
                    placeholder="Notes for this chapter (POV, objectives, conflict)..."
                    rows={8}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
                  />
                ) : (
                  <div className="text-xs text-zinc-500 italic p-2">
                    No chapter selected. Select a chapter from the left panel.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
