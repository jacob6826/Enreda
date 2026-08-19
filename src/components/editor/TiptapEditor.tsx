import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { EditorToolbar } from './EditorToolbar';
import { calculateWordCount } from '../../hooks/useWordCount';
import { Image as ImageIcon, Upload, X } from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  chapterTitle: string;
  chapterOverview: string;
  chapterImage?: string;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onContentChange: (html: string, wordCount: number) => void;
  onTitleChange: (newTitle: string) => void;
  onChapterImageChange?: (image: string) => void;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightInspectorOpen?: boolean;
  onToggleRightInspector?: () => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  chapterTitle,
  chapterOverview,
  chapterImage,
  focusMode,
  onToggleFocusMode,
  onContentChange,
  onTitleChange,
  onChapterImageChange,
  leftSidebarOpen,
  onToggleLeftSidebar,
  rightInspectorOpen,
  onToggleRightInspector,
}) => {
  const [showImageInput, setShowImageInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Begin drafting chapter prose...',
      }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const metrics = calculateWordCount(html);
      onContentChange(html, metrics.words);
    },
  });

  // Update editor content when active chapter changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onChapterImageChange) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChapterImageChange(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-zinc-950 overflow-y-auto">
      {/* Formatting Toolbar + Sidebar Toggle Buttons */}
      <EditorToolbar
        editor={editor}
        focusMode={focusMode}
        onToggleFocusMode={onToggleFocusMode}
        leftSidebarOpen={leftSidebarOpen}
        onToggleLeftSidebar={onToggleLeftSidebar}
        rightInspectorOpen={rightInspectorOpen}
        onToggleRightInspector={onToggleRightInspector}
      />

      {/* Editor Main Canvas */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* Chapter Illustration Banner (Children's Books & Illustrated Fiction) */}
        {!focusMode && (
          <div className="mb-6">
            {chapterImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md max-h-72 bg-zinc-100 dark:bg-zinc-900">
                <img src={chapterImage} alt="Chapter Illustration" className="w-full h-full object-cover max-h-72" />
                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur p-1.5 rounded-lg">
                  <label className="text-xs text-white cursor-pointer hover:underline flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" /> Change
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {onChapterImageChange && (
                    <button
                      onClick={() => onChapterImageChange('')}
                      className="text-xs text-red-300 hover:text-red-100 p-0.5"
                      title="Remove Illustration"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between py-1 border-b border-dashed border-zinc-200 dark:border-zinc-800 text-xs">
                <button
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 font-medium"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>+ Add Chapter Illustration (Children's Books)</span>
                </button>
              </div>
            )}

            {showImageInput && !chapterImage && (
              <div className="mt-2 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2 text-xs">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 block">Chapter Illustration URL or Upload File:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/illustration.jpg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onChapterImageChange) {
                        onChapterImageChange((e.target as HTMLInputElement).value);
                        setShowImageInput(false);
                      }
                    }}
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3 h-3" /> Upload
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chapter Title Input */}
        <input
          type="text"
          value={chapterTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Chapter Title..."
          className="w-full text-2xl sm:text-3xl font-bold tracking-tight bg-transparent text-zinc-900 dark:text-zinc-100 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 mb-6 focus:outline-none focus:border-indigo-500 transition-colors"
        />

        {/* Pinned Chapter Overview Banner (if available & not focus mode) */}
        {!focusMode && chapterOverview && (
          <div className="mb-6 p-3.5 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
              <span>Chapter Notes & Objective:</span>
            </div>
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-600 dark:text-zinc-400 italic">
              {chapterOverview}
            </p>
          </div>
        )}

        {/* Rich-Text Canvas */}
        <EditorContent editor={editor} className="min-h-[500px]" />
      </div>
    </div>
  );
};
