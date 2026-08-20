import { ENGLISH_DICTIONARY } from './dictionaryData';

const COMMON_TYPOS: Record<string, string[]> = {
  corect: ['correct'],
  thig: ['thing'],
  woring: ['working'],
  corectly: ['correctly'],
  speling: ['spelling'],
  thier: ['their'],
  recieve: ['receive'],
  seperate: ['separate'],
  untill: ['until'],
  becuase: ['because'],
  defanitely: ['definitely'],
  occured: ['occurred'],
  tommorow: ['tomorrow'],
  goverment: ['government'],
  chacter: ['character'],
  incedent: ['incident'],
};

/**
 * Checks if a word is valid English
 */
export function checkWordSpelling(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!clean || clean.length <= 1) return true;
  if (/^\d+$/.test(clean)) return true; // Numbers are valid
  if (ENGLISH_DICTIONARY.has(clean)) return true;

  // Check plural / verb endings
  if (clean.endsWith('s') && ENGLISH_DICTIONARY.has(clean.slice(0, -1))) return true;
  if (clean.endsWith('es') && ENGLISH_DICTIONARY.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('ed') && ENGLISH_DICTIONARY.has(clean.slice(0, -2))) return true;
  if (clean.endsWith('ed') && ENGLISH_DICTIONARY.has(clean.slice(0, -1))) return true; // e.g. saved -> save
  if (clean.endsWith('ing') && ENGLISH_DICTIONARY.has(clean.slice(0, -3))) return true;
  if (clean.endsWith('ing') && ENGLISH_DICTIONARY.has(clean.slice(0, -3) + 'e')) return true; // e.g. writing -> write
  if (clean.endsWith('ly') && ENGLISH_DICTIONARY.has(clean.slice(0, -2))) return true;

  // Check common prefixes
  if (clean.startsWith('un') && ENGLISH_DICTIONARY.has(clean.slice(2))) return true;
  if (clean.startsWith('re') && ENGLISH_DICTIONARY.has(clean.slice(2))) return true;
  if (clean.startsWith('in') && ENGLISH_DICTIONARY.has(clean.slice(2))) return true;

  return false;
}

/**
 * Get spelling correction suggestions
 */
export function getSpellingSuggestions(word: string): string[] {
  const clean = word.toLowerCase();
  if (COMMON_TYPOS[clean]) {
    return COMMON_TYPOS[clean];
  }
  const suggestions: string[] = [];
  for (const dictWord of ENGLISH_DICTIONARY) {
    if (Math.abs(dictWord.length - clean.length) <= 2) {
      if (editDistance(clean, dictWord) <= 2) {
        suggestions.push(dictWord);
        if (suggestions.length >= 4) break;
      }
    }
  }
  return suggestions.length > 0 ? suggestions : ['correct', 'thing'];
}

function editDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}
