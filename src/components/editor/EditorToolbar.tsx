import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  RemoveFormatting,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  leftSidebarOpen?: boolean;
  onToggleLeftSidebar?: () => void;
  rightInspectorOpen?: boolean;
  onToggleRightInspector?: () => void;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  focusMode,
  onToggleFocusMode,
  leftSidebarOpen,
  onToggleLeftSidebar,
  rightInspectorOpen,
  onToggleRightInspector,
}) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-md transition-colors ${
      isActive
        ? 'bg-zinc-200 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-semibold border border-zinc-300 dark:border-zinc-700/60'
        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
    }`;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800/80 sticky top-0 z-10">
      {/* Left: Left Sidebar Toggle Indicator + Formatting Tools */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {onToggleLeftSidebar && (
          <>
            <button
              onClick={onToggleLeftSidebar}
              className={`p-1.5 rounded-md transition-all ${
                leftSidebarOpen
                  ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-zinc-700'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
              title="Toggle Left Sidebar (Chapters & Outline)"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 mx-0.5" />
          </>
        )}

        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-800 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-800 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-zinc-300 dark:bg-zinc-800 mx-1" />

        <button
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded-md text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
          title="Clear Formatting"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: Focus Mode + Right Inspector Toggle Indicator */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleFocusMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            focusMode
              ? 'bg-indigo-600 text-white hover:bg-indigo-500'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700/60'
          }`}
          title="Distraction-Free Focus Mode (Esc)"
        >
          {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{focusMode ? 'Exit Focus' : 'Focus Mode'}</span>
        </button>

        {onToggleRightInspector && !focusMode && (
          <button
            onClick={onToggleRightInspector}
            className={`p-1.5 rounded-md transition-all ${
              rightInspectorOpen
                ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-zinc-700'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
            }`}
            title="Toggle Right Overview Inspector"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
