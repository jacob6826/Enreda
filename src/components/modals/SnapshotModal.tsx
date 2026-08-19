import React, { useState } from 'react';
import { X, Camera, RotateCcw, Clock, Save, Bookmark } from 'lucide-react';
import type { Snapshot } from '../../types/manuscript';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: Snapshot[];
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (id: string) => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  snapshots,
  onCreateSnapshot,
  onRestoreSnapshot,
}) => {
  const [labelInput, setLabelInput] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSnapshot(labelInput.trim() || `Manual Snapshot`);
    setLabelInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Version History & Snapshots</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Version Snapshot Form */}
        <form onSubmit={handleCreate} className="mb-4 flex gap-2">
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Version label (e.g. v1.0 - Draft Complete)..."
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors shrink-0 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Snapshot</span>
          </button>
        </form>

        {/* Snapshots List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {snapshots.map((snap) => {
            const date = new Date(snap.timestamp);
            const isAuto = snap.label.toLowerCase().includes('auto');
            return (
              <div
                key={snap.id}
                className="p-3 bg-zinc-950/70 border border-zinc-800/80 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-zinc-200">
                      {snap.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                      isAuto
                        ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        : 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
                    }`}>
                      {isAuto ? 'Auto Checkpoint' : 'Version Snapshot'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span>• {snap.payload.chapters.length} chapters</span>
                    <span>• {snap.payload.story.totalWordCount.toLocaleString()} words</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Restore manuscript snapshot "${snap.label}"? Current unsaved edits will be replaced.`)) {
                      onRestoreSnapshot(snap.id);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-md text-xs font-medium transition-colors"
                  title="Restore this manuscript state"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Restore</span>
                </button>
              </div>
            );
          })}

          {snapshots.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-500">
              No snapshots saved yet. Click <strong className="text-indigo-400">Save Snapshot</strong> or <strong className="text-zinc-200">Save (Ctrl+S)</strong> to record a version checkpoint.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
