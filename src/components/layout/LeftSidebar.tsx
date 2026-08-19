import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Plus,
  GripVertical,
  Trash2,
  Wand2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  Target,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import type { Chapter, Story } from '../../types/manuscript';

interface LeftSidebarProps {
  story: Story | null;
  chapters: Chapter[];
  activeChapterId: string | null;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onDeleteChapter: (id: string) => void;
  onReorderChapters: (reordered: Chapter[]) => void;
  onUpdateStoryMeta: (updates: Partial<Story>) => void;
  onGenerateChapters: () => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  story,
  chapters,
  activeChapterId,
  onSelectChapter,
  onAddChapter,
  onDeleteChapter,
  onReorderChapters,
  onUpdateStoryMeta,
  onGenerateChapters,
  isOpen,
  onClose,
}) => {
  const [showIdeaDetails, setShowIdeaDetails] = useState(false);
  const [showCoverInput, setShowCoverInput] = useState(false);

  if (!isOpen || !story) return null;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(chapters);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorderChapters(items);
  };

  const handleCoverFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateStoryMeta({ coverImage: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const targetGoal = story.targetWordCount || 50000;
  const currentTotal = story.totalWordCount || 0;
  const totalPercent = Math.min(100, Math.round((currentTotal / targetGoal) * 100));

  return (
    <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800/80 flex flex-col h-full select-none shrink-0 z-20">
      {/* Story Pitch & Cover Image Header */}
      <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-indigo-500" /> Story Premise
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowIdeaDetails(!showIdeaDetails)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors p-0.5"
              title="Toggle Story Details"
            >
              {showIdeaDetails ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Close Left Sidebar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Cover Image Thumbnail / Uploader */}
        <div className="mb-2 flex items-center gap-2.5">
          <div className="relative group w-12 h-16 rounded border border-zinc-200 dark:border-zinc-700/80 overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            {story.coverImage ? (
              <img src={story.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-4 h-4 text-zinc-400" />
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-[9px] text-white text-center p-0.5">
              <span>Edit</span>
              <input type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 overflow-hidden">
            <input
              type="text"
              value={story.title}
              onChange={(e) => onUpdateStoryMeta({ title: e.target.value })}
              placeholder="Story Title..."
              className="w-full bg-transparent font-semibold text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none border-b border-transparent focus:border-indigo-500 transition-colors truncate"
            />
            <button
              onClick={() => setShowCoverInput(!showCoverInput)}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 mt-0.5"
            >
              <ImageIcon className="w-2.5 h-2.5" />
              <span>{story.coverImage ? 'Change Cover' : '+ Add Cover Image'}</span>
            </button>
          </div>
        </div>

        {/* Cover Image URL Input drawer */}
        {showCoverInput && (
          <div className="mb-2 p-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md space-y-1.5">
            <label className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 block">Cover Image URL or Upload:</label>
            <input
              type="text"
              value={story.coverImage || ''}
              onChange={(e) => onUpdateStoryMeta({ coverImage: e.target.value })}
              placeholder="https://example.com/cover.jpg"
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex items-center justify-between pt-0.5">
              <label className="text-[10px] text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline">
                Upload Image File
                <input type="file" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
              </label>
              {story.coverImage && (
                <button
                  onClick={() => onUpdateStoryMeta({ coverImage: '' })}
                  className="text-[10px] text-red-500 hover:underline"
                >
                  Remove Cover
                </button>
              )}
            </div>
          </div>
        )}

        {/* Target Word Count Goal Bar */}
        <div className="mt-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
          <div className="flex items-center justify-between text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3 text-indigo-500" /> Story Goal:
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={targetGoal}
                onChange={(e) => onUpdateStoryMeta({ targetWordCount: Math.max(100, parseInt(e.target.value) || 0) })}
                step={1000}
                className="w-16 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-1 text-right text-[10px] text-zinc-800 dark:text-zinc-200 font-mono focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px]">w</span>
            </div>
          </div>
          <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${totalPercent}%` }}
            />
          </div>
        </div>

        {showIdeaDetails && (
          <div className="mt-3 space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block">
              Logline / Pitch:
            </label>
            <textarea
              value={story.storyIdea}
              onChange={(e) => onUpdateStoryMeta({ storyIdea: e.target.value })}
              placeholder="What is the core premise of your story?"
              rows={3}
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md p-2 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* Chapters Header Bar */}
      <div className="px-3.5 py-2 bg-zinc-100/60 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          Chapters ({chapters.length})
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={onGenerateChapters}
            title="Parse Markdown headers in Story Overview to generate chapter cards"
            className="p-1 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors flex items-center gap-1 text-[11px] font-medium"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Parse Outline</span>
          </button>
          <button
            onClick={onAddChapter}
            className="p-1 rounded text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Add Chapter"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drag and Drop Chapter List */}
      <div className="flex-1 overflow-y-auto p-2">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="chapters-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1.5"
              >
                {chapters.map((chapter, index) => {
                  const isActive = chapter.id === activeChapterId;
                  const chGoal = chapter.targetWordCount || 2500;
                  const chPercent = Math.min(100, Math.round((chapter.wordCount / chGoal) * 100));

                  return (
                    <Draggable
                      key={chapter.id}
                      draggableId={chapter.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          onClick={() => onSelectChapter(chapter.id)}
                          className={`group flex flex-col gap-1 p-2 rounded-md text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                          } ${snapshot.isDragging ? 'bg-zinc-800 shadow-md ring-1 ring-indigo-500' : ''}`}
                        >
                          <div className="flex items-center justify-between overflow-hidden w-full">
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              <span
                                {...provided.dragHandleProps}
                                className="text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400 cursor-grab active:cursor-grabbing p-0.5"
                              >
                                <GripVertical className="w-3.5 h-3.5" />
                              </span>

                              {chapter.chapterImage && (
                                <img src={chapter.chapterImage} alt="Chapter Illustration" className="w-5 h-5 rounded object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                              )}

                              <span className="truncate">{chapter.title || `Chapter ${index + 1}`}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-1">
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {chapter.wordCount}/{chGoal}w
                              </span>
                              {chapters.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteChapter(chapter.id);
                                  }}
                                  className="p-0.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete Chapter"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Per-Chapter Word Count Mini Progress Bar */}
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800/80 h-1 rounded-full overflow-hidden mt-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                chPercent >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                              }`}
                              style={{ width: `${chPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {chapters.length === 0 && (
          <div className="text-center py-8 px-4 text-xs text-zinc-500">
            No chapters yet. Click <strong className="text-zinc-700 dark:text-zinc-300">+</strong> to create one or use <strong className="text-indigo-500">Parse Outline</strong>.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 border-t border-zinc-200 dark:border-zinc-800/80 text-[11px] text-zinc-500">
        <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-medium mb-0.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Top-Down Narrative Flow</span>
        </div>
        <p className="text-zinc-500 text-[10px] leading-tight">
          Support for story covers and chapter illustrations.
        </p>
      </div>
    </aside>
  );
};
