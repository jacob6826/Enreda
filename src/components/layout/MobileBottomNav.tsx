import React from 'react';
import { BookOpen, Layers, Edit3 } from 'lucide-react';

export type MobileTab = 'chapters' | 'editor' | 'overview';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onSelectTab: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const itemClass = (tab: MobileTab) =>
    `flex-1 flex flex-col items-center justify-center py-2.5 text-xs font-medium transition-colors ${
      activeTab === tab
        ? 'text-indigo-400 border-t-2 border-indigo-500 bg-zinc-900'
        : 'text-zinc-400 hover:text-zinc-200'
    }`;

  return (
    <nav className="md:hidden flex items-center bg-zinc-950 border-t border-zinc-800 select-none shrink-0 z-30">
      <button onClick={() => onSelectTab('chapters')} className={itemClass('chapters')}>
        <BookOpen className="w-4 h-4 mb-1" />
        <span>Chapters</span>
      </button>

      <button onClick={() => onSelectTab('editor')} className={itemClass('editor')}>
        <Edit3 className="w-4 h-4 mb-1" />
        <span>Editor</span>
      </button>

      <button onClick={() => onSelectTab('overview')} className={itemClass('overview')}>
        <Layers className="w-4 h-4 mb-1" />
        <span>Overview</span>
      </button>
    </nav>
  );
};
