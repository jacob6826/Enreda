import React, { useState } from 'react';
import { X, Download, FileText, FileCode, FileSpreadsheet, Check } from 'lucide-react';
import type { Story, Chapter, ExportFormat, ExportMode } from '../../types/manuscript';
import { exportManuscript } from '../../services/export/exporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: Story | null;
  chapters: Chapter[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  story,
  chapters,
}) => {
  const [format, setFormat] = useState<ExportFormat>('md');
  const [mode, setMode] = useState<ExportMode>('standard');
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !story) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportManuscript(story, chapters, format, mode);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export manuscript. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">Universal Manuscript Export</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Format Picker */}
        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            1. Select Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setFormat('md')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                format === 'md'
                  ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-5 h-5 text-indigo-400" />
              <span className="text-xs font-semibold">Markdown (.md)</span>
            </button>

            <button
              onClick={() => setFormat('docx')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                format === 'docx'
                  ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-semibold">Word (.docx)</span>
            </button>

            <button
              onClick={() => setFormat('pdf')}
              className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                format === 'pdf'
                  ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileText className="w-5 h-5 text-red-400" />
              <span className="text-xs font-semibold">PDF Document</span>
            </button>
          </div>
        </div>

        {/* 2. Compilation Toggle */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            2. Compilation Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('standard')}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === 'standard'
                  ? 'bg-indigo-950/50 border-indigo-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-xs mb-1">
                <span>Standard Mode</span>
                {mode === 'standard' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Compiles Title → Chapters (Prose Only) into one clean manuscript document.
              </p>
            </button>

            <button
              onClick={() => setMode('annotated')}
              className={`p-3 rounded-lg border text-left transition-all ${
                mode === 'annotated'
                  ? 'bg-indigo-950/50 border-indigo-500 text-white'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-xs mb-1">
                <span>Annotated / Pitch Mode</span>
                {mode === 'annotated' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Prepends Story Arc and embeds Chapter Overviews as subheaders before prose.
              </p>
            </button>
          </div>
        </div>

        {/* Summary Footer */}
        <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 mb-6 text-xs text-zinc-400 flex items-center justify-between font-mono">
          <span>Manuscript Scope:</span>
          <span className="text-white font-semibold">{chapters.length} Chapters • {story.totalWordCount.toLocaleString()} words</span>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Compiling...' : `Download .${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
