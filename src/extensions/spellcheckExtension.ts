import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { checkWordSpelling, getSpellingSuggestions } from '../services/spellcheck/spellcheckService';

export interface SpellcheckOptions {
  enabled: boolean;
}

export const spellcheckPluginKey = new PluginKey('spellcheckPluginKey');

export const SpellcheckExtension = Extension.create<SpellcheckOptions>({
  name: 'spellcheckExtension',

  addOptions() {
    return {
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    const extensionOptions = this.options;

    return [
      new Plugin({
        key: spellcheckPluginKey,
        props: {
          decorations(state) {
            if (!extensionOptions.enabled) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            const { doc, selection } = state;
            const activePos = selection.from;

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                // Match word tokens
                const regex = /\b[a-zA-Z']{2,}\b/g;
                let match: RegExpExecArray | null;

                while ((match = regex.exec(text)) !== null) {
                  const word = match[0];
                  const start = pos + match.index;
                  const end = start + word.length;

                  // CRITICAL: Skip the word currently being typed where the cursor caret is sitting!
                  if (activePos >= start && activePos <= end + 1) {
                    continue;
                  }

                  const isSpelledRight = checkWordSpelling(word);

                  if (!isSpelledRight) {
                    const suggestions = getSpellingSuggestions(word);
                    decorations.push(
                      Decoration.inline(start, end, {
                        class: 'spellcheck-error underline decoration-wavy decoration-red-500 decoration-2 bg-red-500/10 dark:bg-red-500/20 rounded-xs cursor-pointer',
                        'data-word': word,
                        'data-suggestions': suggestions.join(','),
                        title: `Misspelled: "${word}". Suggestions: ${suggestions.join(', ')}`,
                      })
                    );
                  }
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },
});
