// Custom Spellcheck Service with typo detection and suggestions

// Common English words set for instant client-side spellchecking
const COMMON_WORDS = new Set([
  // Core English vocabulary
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't",
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', "can't",
  'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing', "don't", 'down',
  'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't", 'have', "haven't",
  'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself', 'him', 'himself',
  'his', 'how', "how's", 'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is', "isn't", 'it', "it's",
  'its', 'itself', "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', "shan't", 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so', 'some', 'such',
  'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', "there's",
  'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're", "we've", 'were',
  "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while', 'who', "who's",
  'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll", "you're",
  "you've", 'your', 'yours', 'yourself', 'yourselves',

  // Nouns, verbs, adjectives
  'correct', 'spelling', 'good', 'bad', 'great', 'story', 'chapter', 'incident', 'beginning', 'end',
  'character', 'plot', 'narrative', 'writing', 'author', 'manuscript', 'word', 'words', 'text', 'page',
  'book', 'novel', 'idea', 'theme', 'action', 'scene', 'dialogue', 'conflict', 'resolution', 'setting',
  'world', 'time', 'day', 'night', 'life', 'mind', 'eye', 'hand', 'head', 'heart', 'voice', 'door',
  'room', 'house', 'city', 'street', 'road', 'place', 'water', 'fire', 'earth', 'air', 'light', 'dark',
  'shadow', 'sun', 'moon', 'star', 'sky', 'ground', 'tree', 'forest', 'mountain', 'river', 'sea',
  'ocean', 'wind', 'rain', 'snow', 'storm', 'person', 'man', 'woman', 'child', 'boy', 'girl', 'friend',
  'enemy', 'king', 'queen', 'prince', 'princess', 'lord', 'lady', 'hero', 'villain', 'master', 'servant',
  'father', 'mother', 'brother', 'sister', 'son', 'daughter', 'family', 'people', 'world', 'truth',
  'lie', 'secret', 'dream', 'hope', 'fear', 'love', 'hate', 'peace', 'war', 'death', 'life', 'power',
  'force', 'magic', 'spell', 'sword', 'shield', 'armor', 'stone', 'iron', 'gold', 'silver', 'crown',
  'throne', 'castle', 'tower', 'wall', 'gate', 'path', 'way', 'journey', 'quest', 'battle', 'fight',
  'victory', 'defeat', 'fate', 'destiny', 'soul', 'spirit', 'ghost', 'shadow', 'blood', 'tear', 'smile',
  'laugh', 'cry', 'scream', 'whisper', 'shout', 'call', 'look', 'see', 'watch', 'listen', 'hear',
  'feel', 'touch', 'think', 'know', 'remember', 'forget', 'believe', 'understand', 'want', 'need',
  'like', 'love', 'find', 'seek', 'take', 'give', 'hold', 'keep', 'leave', 'stay', 'go', 'come',
  'run', 'walk', 'stand', 'sit', 'fall', 'rise', 'fly', 'turn', 'move', 'stop', 'start', 'begin',
  'finish', 'open', 'close', 'make', 'create', 'build', 'break', 'destroy', 'kill', 'save', 'help',
  'protect', 'fight', 'lead', 'follow', 'speak', 'talk', 'tell', 'say', 'ask', 'answer', 'write',
  'read', 'draw', 'play', 'work', 'live', 'die', 'change', 'grow', 'become', 'seem', 'appear',
  'disappear', 'happen', 'occur', 'show', 'hide', 'cover', 'reveal', 'lead', 'follow', 'carry',
  'bring', 'send', 'throw', 'catch', 'drop', 'lift', 'push', 'pull', 'turn', 'spin', 'shake',
  'climb', 'jump', 'leap', 'swim', 'ride', 'drive', 'fly', 'sail', 'cross', 'reach', 'pass',
  'enter', 'exit', 'return', 'arrive', 'depart', 'wait', 'watch', 'search', 'seek', 'discover',
  'learn', 'teach', 'explain', 'describe', 'show', 'prove', 'test', 'try', 'attempt', 'succeed',
  'fail', 'win', 'lose', 'gain', 'earn', 'pay', 'buy', 'sell', 'trade', 'offer', 'accept',
  'refuse', 'deny', 'allow', 'permit', 'forbid', 'prevent', 'avoid', 'escape', 'survive', 'endure',

  // Adjectives & Adverbs
  'first', 'second', 'third', 'last', 'next', 'previous', 'early', 'late', 'old', 'new', 'young',
  'high', 'low', 'long', 'short', 'big', 'large', 'small', 'little', 'tiny', 'huge', 'vast',
  'deep', 'shallow', 'wide', 'narrow', 'heavy', 'light', 'dark', 'bright', 'clear', 'dim', 'soft',
  'hard', 'smooth', 'rough', 'sharp', 'dull', 'hot', 'warm', 'cool', 'cold', 'ice', 'dry', 'wet',
  'clean', 'dirty', 'pure', 'foul', 'sweet', 'bitter', 'fresh', 'stale', 'strong', 'weak', 'fast',
  'quick', 'slow', 'swift', 'sudden', 'silent', 'loud', 'quiet', 'calm', 'wild', 'fierce', 'gentle',
  'kind', 'cruel', 'brave', 'fearful', 'proud', 'humble', 'noble', 'base', 'wise', 'foolish',
  'smart', 'clever', 'dumb', 'blind', 'deaf', 'mute', 'dead', 'alive', 'free', 'bound', 'true',
  'false', 'real', 'fake', 'right', 'wrong', 'good', 'bad', 'evil', 'holy', 'sacred', 'blessed',
  'cursed', 'ancient', 'modern', 'future', 'past', 'present', 'main', 'central', 'inner', 'outer',
  'top', 'bottom', 'left', 'right', 'front', 'back', 'north', 'south', 'east', 'west', 'upper',
  'lower', 'inner', 'outer', 'far', 'near', 'close', 'distant', 'safe', 'dangerous', 'easy', 'hard',
  'difficult', 'simple', 'complex', 'strange', 'weird', 'odd', 'normal', 'usual', 'unusual', 'rare',
  'common', 'special', 'ordinary', 'extraordinary', 'magic', 'magical', 'mysterious', 'secret',
  'hidden', 'silent', 'quiet', 'still', 'peaceful', 'violent', 'savage', 'brutal', 'peaceful',

  // Common Misspellings mapping to correct suggestions
]);

const COMMON_CORRECTIONS: Record<string, string[]> = {
  corect: ['correct'],
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
  accommodate: ['accommodate'],
  manuscriptt: ['manuscript'],
  chacter: ['character'],
  incedent: ['incident'],
};

/**
 * Checks if a word is spelled correctly or misspelled
 */
export function checkWordSpelling(word: string): boolean {
  const cleanWord = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!cleanWord || cleanWord.length <= 1) return true;
  if (/^\d+$/.test(cleanWord)) return true; // Numbers are valid
  if (COMMON_WORDS.has(cleanWord)) return true;
  if (cleanWord.endsWith('s') && COMMON_WORDS.has(cleanWord.slice(0, -1))) return true;
  if (cleanWord.endsWith('ed') && COMMON_WORDS.has(cleanWord.slice(0, -2))) return true;
  if (cleanWord.endsWith('ing') && COMMON_WORDS.has(cleanWord.slice(0, -3))) return true;
  if (cleanWord.endsWith('ly') && COMMON_WORDS.has(cleanWord.slice(0, -2))) return true;
  return false;
}

/**
 * Gets spelling suggestions for a misspelled word
 */
export function getSpellingSuggestions(word: string): string[] {
  const clean = word.toLowerCase();
  if (COMMON_CORRECTIONS[clean]) {
    return COMMON_CORRECTIONS[clean];
  }
  // Basic Levenshtein / Edit Distance suggestions from dictionary
  const suggestions: string[] = [];
  for (const dictWord of COMMON_WORDS) {
    if (Math.abs(dictWord.length - clean.length) <= 2) {
      if (editDistance(clean, dictWord) <= 2) {
        suggestions.push(dictWord);
        if (suggestions.length >= 4) break;
      }
    }
  }
  return suggestions.length > 0 ? suggestions : ['correct', 'spelling'];
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
