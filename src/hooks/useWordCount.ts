import { useMemo } from 'react';

export function calculateWordCount(htmlOrText: string): { words: number; chars: number } {
  if (!htmlOrText) return { words: 0, chars: 0 };
  const tmp = document.createElement('DIV');
  tmp.innerHTML = htmlOrText;
  const text = tmp.textContent || tmp.innerText || '';
  const clean = text.trim();
  if (!clean) return { words: 0, chars: 0 };
  const words = clean.split(/\s+/).filter(Boolean).length;
  return { words, chars: clean.length };
}

export function useWordCount(content: string) {
  return useMemo(() => calculateWordCount(content), [content]);
}
