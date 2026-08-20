import React, { useState } from 'react';
import {
  Layers,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Target,
  Sparkles,
  Tag,
  UserCheck,
  Plus,
  Search,
  User,
  MapPin,
  Shield,
  Sword,
  BookMarked,
  Trash2,
  Edit2,
} from 'lucide-react';
import type { Chapter, Story, ChapterStatus, CodexEntry, CodexCategory } from '../../types/manuscript';

interface RightInspectorProps {
  story: Story | null;
  activeChapter: Chapter | null;
  codexEntries: CodexEntry[];
  onSaveCodexEntry: (entry: CodexEntry) => void;
  onDeleteCodexEntry: (id: string) => void;
  onUpdateStoryOverview: (newOverview: string) => void;
  onUpdateChapterOverview: (chapterId: string, newOverview: string) => void;
  onUpdateChapterGoal?: (chapterId: string, targetWords: number) => void;
  onUpdateChapterMeta?: (chapterId: string, updates: Partial<Chapter>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const RightInspector: React.FC<RightInspectorProps> = ({
  story,
  activeChapter,
  codexEntries,
  onSaveCodexEntry,
  onDeleteCodexEntry,
  onUpdateStoryOverview,
  onUpdateChapterOverview,
  onUpdateChapterGoal,
  onUpdateChapterMeta,
  isOpen,
  onClose,
}) => {
  // Tab switcher state: 'overview' | 'codex'
  const [activeTab, setActiveTab] = useState<'overview' | 'codex'>('overview');

  // Overview states
  const [showStoryHelp, setShowStoryHelp] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({
    story: false,
    chapter: false,
    meta: false,
  });

  // Codex tab states inside right sidebar
  const [codexCategory, setCodexCategory] = useState<CodexCategory | 'all'>('all');
  const [codexSearch, setCodexSearch] = useState('');
  const [editingCodex, setEditingCodex] = useState<Partial<CodexEntry> | null>(null);
  const [selectedCodex, setSelectedCodex] = useState<CodexEntry | null>(null);

  if (!isOpen || !story) return null;

  const toggleSection = (key: 'story' | 'chapter' | 'meta') => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const chGoal = activeChapter?.targetWordCount || 2500;
  const chWords = activeChapter?.wordCount || 0;
  const chPercent = Math.min(100, Math.round((chWords / chGoal) * 100));

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim() && activeChapter && onUpdateChapterMeta) {
      e.preventDefault();
      const currentTags = activeChapter.tags || [];
      if (!currentTags.includes(tagInput.trim())) {
        onUpdateChapterMeta(activeChapter.id, { tags: [...currentTags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (activeChapter && onUpdateChapterMeta) {
      const currentTags = activeChapter.tags || [];
      onUpdateChapterMeta(activeChapter.id, { tags: currentTags.filter((t) => t !== tagToRemove) });
    }
  };

  // Codex filter logic
  const filteredCodex = codexEntries.filter((e) => {
    const matchCat = codexCategory === 'all' || e.category === codexCategory;
    const matchSearch =
      e.name.toLowerCase().includes(codexSearch.toLowerCase()) ||
      (e.role && e.role.toLowerCase().includes(codexSearch.toLowerCase())) ||
      e.summary.toLowerCase().includes(codexSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryIcon = (category: CodexCategory) => {
    switch (category) {
      case 'character':
        return <User className="w-3.5 h-3.5 text-indigo-500" />;
      case 'location':
        return <MapPin className="w-3.5 h-3.5 text-emerald-500" />;
      case 'faction':
        return <Shield className="w-3.5 h-3.5 text-amber-500" />;
      case 'item':
        return <Sword className="w-3.5 h-3.5 text-rose-500" />;
      case 'lore':
        return <BookMarked className="w-3.5 h-3.5 text-purple-500" />;
    }
  };

  const handleSaveCodexForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCodex?.name?.trim()) return;

    const entryToSave: CodexEntry = {
      id: editingCodex.id || 'codex-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      storyId: story.id,
      name: editingCodex.name.trim(),
      category: editingCodex.category || 'character',
      role: editingCodex.role?.trim() || '',
      avatar: editingCodex.avatar?.trim() || undefined,
      summary: editingCodex.summary?.trim() || '',
      details: editingCodex.details?.trim() || '',
      updatedAt: Date.now(),
    };

    onSaveCodexEntry(entryToSave);
    setSelectedCodex(entryToSave);
    setEditingCodex(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editingCodex) {
          setEditingCodex({ ...editingCodex, avatar: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside className="w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800/80 flex flex-col h-full shrink-0 z-20">
      {/* Header with Dual-Tab Switcher */}
      <div className="px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/40 flex items-center justify-between">
        <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800/80 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('codex')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'codex'
                ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Codex 🎭</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Close Right Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* TAB 1: OVERVIEW INSPECTOR */}
      {activeTab === 'overview' && (
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {/* Chapter Status & POV Tags */}
          {activeChapter && (
            <div className="bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <div
                onClick={() => toggleSection('meta')}
                className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-between cursor-pointer hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {collapsedSections.meta ? (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  )}
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Chapter Status & POV
                  </span>
                </div>
              </div>

              {!collapsedSections.meta && (
                <div className="p-2.5 space-y-3 bg-white dark:bg-zinc-900">
                  {/* Status Dropdown */}
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                      Draft Status:
                    </label>
                    <select
                      value={activeChapter.status || 'drafting'}
                      onChange={(e) => {
                        if (onUpdateChapterMeta) {
                          onUpdateChapterMeta(activeChapter.id, { status: e.target.value as ChapterStatus });
                        }
                      }}
                      className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500"
                    >
                      <option value="outline">🟡 Outline Beat</option>
                      <option value="drafting">🔵 Drafting</option>
                      <option value="revising">🟣 Revising</option>
                      <option value="final">🟢 Final Polish</option>
                    </select>
                  </div>

                  {/* POV Input */}
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                      <UserCheck className="w-3 h-3 text-indigo-500" /> Point of View (POV):
                    </label>
                    <input
                      type="text"
                      value={activeChapter.pov || ''}
                      onChange={(e) => {
                        if (onUpdateChapterMeta) {
                          onUpdateChapterMeta(activeChapter.id, { pov: e.target.value });
                        }
                      }}
                      placeholder="e.g. Elena, Marcus (3rd Person)"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Scene Tags */}
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1 mb-1">
                      <Tag className="w-3 h-3 text-indigo-500" /> Scene Tags:
                    </label>
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {(activeChapter.tags || []).map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[10px] font-medium text-indigo-700 dark:text-indigo-300"
                        >
                          <span>{t}</span>
                          <button
                            onClick={() => handleRemoveTag(t)}
                            className="hover:text-red-500 transition-colors ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Type tag and press Enter..."
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Story Overview & High-Level Arc */}
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
                  rows={7}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs text-zinc-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono leading-relaxed resize-y"
                />
              </div>
            )}
          </div>

          {/* Active Chapter Overview & Word Goal */}
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
                    Scene goals and chapter notes:
                  </label>
                  {activeChapter ? (
                    <textarea
                      value={activeChapter.overview}
                      onChange={(e) =>
                        onUpdateChapterOverview(activeChapter.id, e.target.value)
                      }
                      placeholder="Notes for this chapter (POV, objectives, conflict)..."
                      rows={6}
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
      )}

      {/* TAB 2: CODEX SIDEBAR VIEW */}
      {activeTab === 'codex' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-950/40">
          {/* Header Controls: Search & New Entry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={codexSearch}
                  onChange={(e) => setCodexSearch(e.target.value)}
                  placeholder="Search codex..."
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={() => setEditingCodex({ category: 'character', name: '', summary: '', details: '' })}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                title="Create Codex Entry"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Entry</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {(['all', 'character', 'location', 'faction', 'item', 'lore'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCodexCategory(cat)}
                  className={`px-2 py-0.5 rounded-md font-semibold capitalize whitespace-nowrap transition-colors ${
                    codexCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* EDIT FORM MODE INSIDE SIDEBAR */}
          {editingCodex ? (
            <form onSubmit={handleSaveCodexForm} className="flex-1 overflow-y-auto space-y-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {editingCodex.id ? 'Edit Codex Entry' : 'New Codex Entry'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingCodex(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Name <span className="text-indigo-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingCodex.name || ''}
                  onChange={(e) => setEditingCodex({ ...editingCodex, name: e.target.value })}
                  placeholder="Character or Location name..."
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={editingCodex.category || 'character'}
                    onChange={(e) => setEditingCodex({ ...editingCodex, category: e.target.value as CodexCategory })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 capitalize"
                  >
                    <option value="character">Character</option>
                    <option value="location">Location</option>
                    <option value="faction">Faction</option>
                    <option value="item">Item</option>
                    <option value="lore">Lore</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={editingCodex.role || ''}
                    onChange={(e) => setEditingCodex({ ...editingCodex, role: e.target.value })}
                    placeholder="Protagonist, Capital..."
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Logline Summary
                </label>
                <input
                  type="text"
                  value={editingCodex.summary || ''}
                  onChange={(e) => setEditingCodex({ ...editingCodex, summary: e.target.value })}
                  placeholder="One line description..."
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                  Notes & Details
                </label>
                <textarea
                  value={editingCodex.details || ''}
                  onChange={(e) => setEditingCodex({ ...editingCodex, details: e.target.value })}
                  placeholder="Motivations, backstory, traits..."
                  rows={4}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                Save Entry
              </button>
            </form>
          ) : selectedCodex ? (
            /* SELECTED CODEX ENTRY DETAIL MODE */
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <button
                  onClick={() => setSelectedCodex(null)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  ← Back to List
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingCodex(selectedCodex)}
                    className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      onDeleteCodexEntry(selectedCodex.id);
                      setSelectedCodex(null);
                    }}
                    className="p-1 text-zinc-400 hover:text-red-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {selectedCodex.avatar ? (
                  <img src={selectedCodex.avatar} alt="Avatar" className="w-10 h-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    {getCategoryIcon(selectedCodex.category)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    {selectedCodex.name}
                  </h3>
                  {selectedCodex.role && (
                    <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold block">
                      {selectedCodex.role}
                    </span>
                  )}
                </div>
              </div>

              {selectedCodex.summary && (
                <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 italic">
                  "{selectedCodex.summary}"
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Notes
                </h4>
                <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                  {selectedCodex.details || 'No detailed notes provided.'}
                </div>
              </div>
            </div>
          ) : (
            /* CODEX ENTRIES LIST */
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCodex.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => setSelectedCodex(entry)}
                  className="p-2.5 bg-white dark:bg-zinc-900 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-zinc-200/80 dark:border-zinc-800 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 shadow-2xs group"
                >
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="Avatar" className="w-8 h-8 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(entry.category)}
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {entry.name}
                      </h4>
                      <span className="text-[9px] text-zinc-400 uppercase font-mono">
                        {entry.category}
                      </span>
                    </div>
                    {entry.role && (
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                        {entry.role}
                      </div>
                    )}
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {entry.summary || 'No summary'}
                    </p>
                  </div>
                </div>
              ))}

              {filteredCodex.length === 0 && (
                <div className="text-center py-10 px-4 text-xs text-zinc-400">
                  No codex entries found. Click <strong className="text-indigo-500">+ Entry</strong> above to add characters or locations.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
