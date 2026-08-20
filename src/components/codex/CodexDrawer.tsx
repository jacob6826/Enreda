import React, { useState } from 'react';
import {
  X,
  Plus,
  Search,
  User,
  MapPin,
  Shield,
  Sword,
  BookMarked,
  Image as ImageIcon,
  Trash2,
  Edit2,
  Sparkles,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { CodexEntry, CodexCategory } from '../../types/manuscript';

interface CodexDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entries: CodexEntry[];
  onSaveEntry: (entry: CodexEntry) => void;
  onDeleteEntry: (id: string) => void;
}

export const CodexDrawer: React.FC<CodexDrawerProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
  onDeleteEntry,
}) => {
  const [activeCategory, setActiveCategory] = useState<CodexCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<Partial<CodexEntry> | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CodexEntry | null>(null);

  if (!isOpen) return null;

  const filteredEntries = entries.filter((e) => {
    const matchesCat = activeCategory === 'all' || e.category === activeCategory;
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.role && e.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      e.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (category: CodexCategory) => {
    switch (category) {
      case 'character':
        return <User className="w-4 h-4 text-indigo-500" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-emerald-500" />;
      case 'faction':
        return <Shield className="w-4 h-4 text-amber-500" />;
      case 'item':
        return <Sword className="w-4 h-4 text-rose-500" />;
      case 'lore':
        return <BookMarked className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry?.name?.trim()) return;

    const entryToSave: CodexEntry = {
      id: editingEntry.id || 'codex-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      storyId: editingEntry.storyId || '',
      name: editingEntry.name.trim(),
      category: editingEntry.category || 'character',
      role: editingEntry.role?.trim() || '',
      avatar: editingEntry.avatar?.trim() || undefined,
      summary: editingEntry.summary?.trim() || '',
      details: editingEntry.details?.trim() || '',
      updatedAt: Date.now(),
    };

    onSaveEntry(entryToSave);
    setSelectedEntry(entryToSave);
    setEditingEntry(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editingEntry) {
          setEditingEntry({ ...editingEntry, avatar: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 h-full border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-zinc-900 dark:text-white">
                Story Codex & Bible
              </h2>
              <p className="text-[11px] text-zinc-500">
                Track characters, locations, factions, and worldbuilding lore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingEntry({ category: 'character', name: '', summary: '', details: '' })}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories Bar & Search */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['all', 'character', 'location', 'faction', 'item', 'lore'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search codex..."
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Main Stage Grid (List + Inspector Panel) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left List Column */}
          <div className="w-1/2 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto p-3 space-y-2">
            {filteredEntries.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700/80 shadow-2xs'
                      : 'bg-zinc-50/50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 border-zinc-200 dark:border-zinc-800/60'
                  }`}
                >
                  {entry.avatar ? (
                    <img src={entry.avatar} alt="Avatar" className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(entry.category)}
                    </div>
                  )}

                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                        {entry.name}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {entry.category}
                      </span>
                    </div>

                    {entry.role && (
                      <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {entry.role}
                      </div>
                    )}

                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      {entry.summary || 'No summary entered.'}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredEntries.length === 0 && (
              <div className="text-center py-12 px-4 text-xs text-zinc-500">
                No codex entries found. Click <strong className="text-indigo-600">+ New Entry</strong> to create one.
              </div>
            )}
          </div>

          {/* Right Inspector / Edit Column */}
          <div className="w-1/2 flex flex-col h-full bg-white dark:bg-zinc-900 overflow-y-auto p-4">
            {editingEntry ? (
              /* EDIT FORM */
              <form onSubmit={handleSaveForm} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {editingEntry.id ? 'Edit Entry' : 'Create New Entry'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
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
                    value={editingEntry.name || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                    placeholder="e.g. Elena Vance, Crystal Spire..."
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
                      value={editingEntry.category || 'character'}
                      onChange={(e) => setEditingEntry({ ...editingEntry, category: e.target.value as CodexCategory })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 capitalize"
                    >
                      <option value="character">Character</option>
                      <option value="location">Location</option>
                      <option value="faction">Faction</option>
                      <option value="item">Item / Relic</option>
                      <option value="lore">World Lore</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                      Role / Title
                    </label>
                    <input
                      type="text"
                      value={editingEntry.role || ''}
                      onChange={(e) => setEditingEntry({ ...editingEntry, role: e.target.value })}
                      placeholder="e.g. Protagonist, Capital"
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Avatar Image URL or Upload
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingEntry.avatar || ''}
                      onChange={(e) => setEditingEntry({ ...editingEntry, avatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                    <label className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-medium cursor-pointer shrink-0">
                      File
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Logline Summary
                  </label>
                  <input
                    type="text"
                    value={editingEntry.summary || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, summary: e.target.value })}
                    placeholder="Short one-line description..."
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Detailed Notes & Backstory
                  </label>
                  <textarea
                    value={editingEntry.details || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, details: e.target.value })}
                    placeholder="Full character motivations, backstory, traits, flaws..."
                    rows={5}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                >
                  Save Entry
                </button>
              </form>
            ) : selectedEntry ? (
              /* VIEW SELECTED ENTRY */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-3">
                    {selectedEntry.avatar ? (
                      <img src={selectedEntry.avatar} alt="Avatar" className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        {getCategoryIcon(selectedEntry.category)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                        {selectedEntry.name}
                      </h3>
                      {selectedEntry.role && (
                        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {selectedEntry.role}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingEntry(selectedEntry)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Edit Entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onDeleteEntry(selectedEntry.id);
                        setSelectedEntry(null);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {selectedEntry.summary && (
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 italic">
                    "{selectedEntry.summary}"
                  </div>
                )}

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                    Notes & Details
                  </h4>
                  <div className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                    {selectedEntry.details || 'No detailed notes provided.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-zinc-400">
                Select an entry on the left to view details or click <strong className="text-indigo-500 ml-1">+ New Entry</strong>.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
