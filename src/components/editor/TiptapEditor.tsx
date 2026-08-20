import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { SpellcheckExtension } from '../../extensions/spellcheckExtension';
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
  const [spellcheckEnabled, setSpellcheckEnabled] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Begin drafting chapter prose...',
      }),
      CharacterCount,
      SpellcheckExtension.configure({
        enabled: spellcheckEnabled,
      }),
    ],
    editorProps: {
      attributes: {
        spellcheck: 'true',
        autocorrect: 'on',
        autocapitalize: 'on',
        lang: 'en-US',
        class: 'focus:outline-none min-h-[500px] leading-relaxed',
      },
    },
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const metrics = calculateWordCount(html);
      onContentChange(html, metrics.words);
    },
  });

  // Synchronize spellcheck attributes on editor DOM element
  useEffect(() => {
    if (editor && editor.view && editor.view.dom) {
      const dom = editor.view.dom as HTMLElement;
      dom.spellcheck = spellcheckEnabled;
      dom.setAttribute('spellcheck', spellcheckEnabled ? 'true' : 'false');
      dom.setAttribute('lang', 'en-US');
    }
  }, [spellcheckEnabled, editor]);

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
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-hidden relative">
      {/* Editor Formatting & Stage Toolbar (Hidden in Focus Mode) */}
      {!focusMode && (
        <EditorToolbar
          editor={editor}
          focusMode={focusMode}
          onToggleFocusMode={onToggleFocusMode}
          spellcheckEnabled={spellcheckEnabled}
          onToggleSpellcheck={() => setSpellcheckEnabled(!spellcheckEnabled)}
          leftSidebarOpen={leftSidebarOpen}
          onToggleLeftSidebar={onToggleLeftSidebar}
          rightInspectorOpen={rightInspectorOpen}
          onToggleRightInspector={onToggleRightInspector}
        />
      )}

      {/* Main Manuscript Canvas Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 py-8 md:px-12 flex justify-center">
        <div className="w-full max-w-3xl space-y-6">
          {/* Chapter Illustration Banner (Children's Books / Graphic Novels) */}
          <div className="space-y-2">
            {chapterImage && (
              <div className="relative group rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md bg-zinc-100 dark:bg-zinc-900 max-h-72 flex items-center justify-center">
                <img src={chapterImage} alt="Chapter Illustration" className="w-full h-full object-cover max-h-72" />
                <button
                  onClick={() => onChapterImageChange && onChapterImageChange('')}
                  className="absolute top-3 right-3 p-1.5 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  title="Remove Illustration"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Illustration Action Controls */}
            {!chapterImage && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowImageInput(!showImageInput)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5 transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>+ Add Chapter Illustration</span>
                </button>
              </div>
            )}

            {showImageInput && !chapterImage && (
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs">
                <label className="font-medium text-zinc-700 dark:text-zinc-300 block">Illustration Image URL or File:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://example.com/illustration.jpg"
                    onChange={(e) => onChapterImageChange && onChapterImageChange(e.target.value)}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                  />
                  <label className="px-3 py-1.5 bg-indigo-600 text-white font-medium rounded-lg cursor-pointer hover:bg-indigo-500 transition-colors flex items-center gap-1 shrink-0">
                    <Upload className="w-3 h-3" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Chapter Title Input */}
          <div>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Chapter Title..."
              className="w-full bg-transparent text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 focus:outline-none border-b border-transparent focus:border-indigo-500 transition-colors py-1"
            />
          </div>

          {/* Rich Text Editor Canvas */}
          <div className="prose dark:prose-invert max-w-none min-h-[500px]">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};
