import React, { useState } from 'react';
import { BookOpen, Sparkles, Wand2, Target, Image as ImageIcon, ArrowRight, FolderOpen, Plus } from 'lucide-react';
import type { Story } from '../../types/manuscript';

interface NewStorySetupScreenProps {
  existingStories: Story[];
  onStartNewStory: (data: {
    title: string;
    idea: string;
    overview: string;
    targetWordCount: number;
    coverImage?: string;
  }) => void;
  onContinueStory: (storyId: string) => void;
  onOpenDashboard: () => void;
}

export const NewStorySetupScreen: React.FC<NewStorySetupScreenProps> = ({
  existingStories,
  onStartNewStory,
  onContinueStory,
  onOpenDashboard,
}) => {
  const [mode, setMode] = useState<'create' | 'select'>(
    existingStories.length > 0 ? 'select' : 'create'
  );

  // Form states for new story setup wizard
  const [title, setTitle] = useState('');
  const [idea, setIdea] = useState('');
  const [overview, setOverview] = useState(
    '# Act I: The Beginning\n- Introduce protagonist & setting\n- Inciting incident\n\n# Act II: The Conflict\n- Midpoint twist\n\n# Act III: The Resolution\n- Climax & Resolution'
  );
  const [targetWordCount, setTargetWordCount] = useState<number>(50000);
  const [coverImage, setCoverImage] = useState<string>('');

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onStartNewStory({
      title: title.trim(),
      idea: idea.trim(),
      overview: overview.trim(),
      targetWordCount,
      coverImage: coverImage.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen w-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-6 font-sans select-none">
      {/* Container Box */}
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {mode === 'create' ? 'Kick Off Your Story' : 'Welcome to Enreda Studio'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {mode === 'create'
                  ? 'Define your premise and outline before entering the manuscript canvas'
                  : 'Select an existing story or start a brand new manuscript'}
              </p>
            </div>
          </div>

          {existingStories.length > 0 && (
            <button
              type="button"
              onClick={() => setMode(mode === 'create' ? 'select' : 'create')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
            >
              {mode === 'create' ? (
                <>
                  <FolderOpen className="w-4 h-4" />
                  <span>Existing Stories ({existingStories.length})</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>New Story Wizard</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* MODE 1: SELECT EXISTING STORY */}
        {mode === 'select' && existingStories.length > 0 ? (
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Your Manuscripts
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {existingStories.map((story) => (
                <div
                  key={story.id}
                  onClick={() => onContinueStory(story.id)}
                  className="p-4 bg-zinc-50 dark:bg-zinc-950/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700/60 rounded-2xl cursor-pointer transition-all flex items-start gap-3 group shadow-2xs"
                >
                  {story.coverImage ? (
                    <img src={story.coverImage} alt="Cover" className="w-10 h-14 rounded object-cover border border-zinc-300 dark:border-zinc-700 shrink-0" />
                  ) : (
                    <div className="w-10 h-14 rounded bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {story.title}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
                      {story.storyIdea || 'No premise logline defined yet.'}
                    </p>
                    <div className="text-[10px] text-zinc-400 mt-2 font-mono">
                      {story.totalWordCount.toLocaleString()} words
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onOpenDashboard}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
              >
                Manage All Manuscripts
              </button>

              <button
                type="button"
                onClick={() => setMode('create')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Start a New Manuscript</span>
              </button>
            </div>
          </div>
        ) : (
          /* MODE 2: CREATE STORY SETUP WIZARD */
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Story Title & Logline */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Story Title <span className="text-indigo-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Starlight Dragon, The Clockwork Key..."
                  required
                  autoFocus
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Core Premise / Logline
                </label>
                <input
                  type="text"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="e.g. A young astronomer discovers a dragon hidden inside a falling star."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Target Goal & Cover Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  Target Word Count Goal
                </label>
                <select
                  value={targetWordCount}
                  onChange={(e) => setTargetWordCount(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value={50000}>Novel (50,000 words)</option>
                  <option value={80000}>Epic Novel (80,000 words)</option>
                  <option value={20000}>Novella (20,000 words)</option>
                  <option value={5000}>Short Story / Picture Book (5,000 words)</option>
                  <option value={2500}>Children's Chapter Book (2,500 words)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1 mb-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                  Cover Image (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://... or upload file"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-medium cursor-pointer shrink-0">
                    Browse
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* General Overview / Initial Plot Beats */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                  General Plot Beats / Overview
                </label>
                <span className="text-[10px] text-zinc-400">Headers (# Act I) auto-generate chapters</span>
              </div>
              <textarea
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                rows={4}
                placeholder="# Act I: The Setup..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Story Studio Canvas</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
