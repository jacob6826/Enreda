import React, { useState } from 'react';
import { X, BookOpen, Plus, Trash2, ArrowRight } from 'lucide-react';
import type { Story } from '../../types/manuscript';

interface StoryDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  activeStoryId: string | null;
  onSelectStory: (id: string) => void;
  onCreateStory: (title: string, idea: string) => void;
  onDeleteStory: (id: string) => void;
}

export const StoryDashboardModal: React.FC<StoryDashboardModalProps> = ({
  isOpen,
  onClose,
  stories,
  activeStoryId,
  onSelectStory,
  onCreateStory,
  onDeleteStory,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIdea, setNewIdea] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateStory(newTitle.trim(), newIdea.trim());
    setNewTitle('');
    setNewIdea('');
    setShowNewForm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Manuscript Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            Your Manuscripts ({stories.length})
          </span>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Manuscript</span>
          </button>
        </div>

        {/* New Story Form */}
        {showNewForm && (
          <form onSubmit={handleCreate} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-3">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
              Create New Story
            </h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Manuscript Title (e.g. Echoes of Eldoria)"
              required
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
            <textarea
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value)}
              placeholder="Logline / High-level Story Premise (optional)..."
              rows={2}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-md"
              >
                Create Story
              </button>
            </div>
          </form>
        )}

        {/* Story Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {stories.map((story) => {
            const isActive = story.id === activeStoryId;
            return (
              <div
                key={story.id}
                onClick={() => {
                  onSelectStory(story.id);
                  onClose();
                }}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/60 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="space-y-1 flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-white">
                      {story.title}
                    </h3>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800/60">
                        Active
                      </span>
                    )}
                  </div>
                  {story.storyIdea && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 italic">
                      "{story.storyIdea}"
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
                    <span>{story.totalWordCount.toLocaleString()} words</span>
                    <span>Updated {new Date(story.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {stories.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete manuscript "${story.title}"?`)) {
                          onDeleteStory(story.id);
                        }
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                      title="Delete Manuscript"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
