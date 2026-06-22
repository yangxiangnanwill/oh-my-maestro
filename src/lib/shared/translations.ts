// Maestro IDE — Concept Translation Registry

import type { DisplayMode } from './types.js';

/** Translation entry mapping a technical term to user-facing label */
export interface TranslationEntry {
  /** Technical term (maestro concept) */
  term: string;
  /** User-facing label in simple mode */
  simpleLabel: string;
  /** User-facing label in advanced mode (may be same as term) */
  advancedLabel: string;
  /** Category for grouping */
  category: 'core' | 'technical' | 'business';
  /** Whether this term should be hidden entirely in simple mode */
  hiddenInSimpleMode: boolean;
  /** Alternative terms that should also be translated */
  aliases: string[];
}

/** Core translation registry — maps maestro terminology to user-facing language */
export const TRANSLATIONS: TranslationEntry[] = [
  {
    term: 'chain',
    simpleLabel: 'Workflow',
    advancedLabel: 'Chain (Workflow)',
    category: 'core',
    hiddenInSimpleMode: false,
    aliases: ['command-chain', 'lifecycle-chain'],
  },
  {
    term: 'skill',
    simpleLabel: 'Action',
    advancedLabel: 'Skill (Action)',
    category: 'core',
    hiddenInSimpleMode: false,
    aliases: ['command', 'cmd'],
  },
  {
    term: 'delegate',
    simpleLabel: 'Run',
    advancedLabel: 'Delegate (Run)',
    category: 'technical',
    hiddenInSimpleMode: true,
    aliases: ['delegation', 'dispatch'],
  },
  {
    term: 'session',
    simpleLabel: 'Task Run',
    advancedLabel: 'Session',
    category: 'technical',
    hiddenInSimpleMode: true,
    aliases: ['execution-session', 'ralph-session'],
  },
  {
    term: 'milestone',
    simpleLabel: 'Goal',
    advancedLabel: 'Milestone (Goal)',
    category: 'core',
    hiddenInSimpleMode: false,
    aliases: ['project-milestone'],
  },
  {
    term: 'phase',
    simpleLabel: 'Stage',
    advancedLabel: 'Phase (Stage)',
    category: 'core',
    hiddenInSimpleMode: false,
    aliases: ['project-phase'],
  },
  {
    term: 'artifact',
    simpleLabel: 'Output',
    advancedLabel: 'Artifact (Output)',
    category: 'core',
    hiddenInSimpleMode: false,
    aliases: ['output-file', 'result'],
  },
  {
    term: 'analyze',
    simpleLabel: 'Evaluate',
    advancedLabel: 'Analyze (Evaluate)',
    category: 'business',
    hiddenInSimpleMode: false,
    aliases: ['analysis'],
  },
  {
    term: 'plan',
    simpleLabel: 'Prepare',
    advancedLabel: 'Plan (Prepare)',
    category: 'business',
    hiddenInSimpleMode: false,
    aliases: ['planning'],
  },
  {
    term: 'execute',
    simpleLabel: 'Build',
    advancedLabel: 'Execute (Build)',
    category: 'business',
    hiddenInSimpleMode: false,
    aliases: ['execution', 'implement'],
  },
];

/**
 * Translate a technical term to user-facing label based on display mode.
 * Returns the original term if no translation is found.
 * In simple mode, hidden terms are replaced with a generic placeholder.
 */
export function translate(term: string, mode: DisplayMode): string {
  const entry = findEntry(term);
  if (!entry) return term;

  if (mode === 'simple') {
    if (entry.hiddenInSimpleMode) return 'Processing';
    return entry.simpleLabel;
  }
  return entry.advancedLabel;
}

/**
 * Determine whether a term should be hidden entirely in the given mode.
 * Hidden terms in simple mode should not be rendered at all.
 */
export function shouldHide(term: string, mode: DisplayMode): boolean {
  if (mode !== 'simple') return false;
  const entry = findEntry(term);
  return entry ? entry.hiddenInSimpleMode : false;
}

/**
 * Translate an entire payload (object) by replacing keys and labels.
 * Data values are NOT modified — only keys and label-like string fields.
 */
export function translatePayload<T extends Record<string, unknown>>(
  payload: T,
  mode: DisplayMode
): { translated: T; untranslatedTerms: string[] } {
  const untranslatedTerms: string[] = [];
  const translated = { ...payload };

  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      // Only translate label-like fields, not data values
      if (key.endsWith('Name') || key.endsWith('Label') || key.endsWith('Title') || key === 'description') {
        const result = translateString(value, mode);
        (translated as Record<string, unknown>)[key] = result;
        // Track terms that appear in the string but aren't translatable
        const words = value.split(/\s+/);
        for (const word of words) {
          const cleaned = word.replace(/[^a-zA-Z-]/g, '');
          if (cleaned && findEntry(cleaned) === null && !untranslatedTerms.includes(cleaned)) {
            // Only add if it looks like a technical term (lowercase, not a common word)
            if (cleaned.length > 3 && cleaned === cleaned.toLowerCase()) {
              untranslatedTerms.push(cleaned);
            }
          }
        }
      }
    }
  }

  return { translated, untranslatedTerms };
}

/**
 * Translate a string that may contain embedded technical terms.
 * Replaces known terms within the string using word-boundary matching
 * with negative lookbehind/lookahead to avoid matching substrings
 * inside compound words (e.g., 'delegate' should not match inside 'delegate-executor').
 */
function translateString(str: string, mode: DisplayMode): string {
  let result = str;
  for (const entry of TRANSLATIONS) {
    const termsToReplace = [entry.term, ...entry.aliases];
    for (const term of termsToReplace) {
      // Use negative lookbehind/lookahead to ensure the term is not part
      // of a compound word (e.g., 'delegate' in 'delegate-executor').
      // Matches term when:
      //   - preceded by start-of-string, whitespace, or punctuation (not a letter or hyphen)
      //   - followed by end-of-string, whitespace, or punctuation (not a letter or hyphen)
      const regex = new RegExp(`(?<![a-zA-Z-])${escapeRegex(term)}(?![a-zA-Z-])`, 'g');
      const replacement = mode === 'simple'
        ? (entry.hiddenInSimpleMode ? 'Processing' : entry.simpleLabel)
        : entry.advancedLabel;
      result = result.replace(regex, replacement);
    }
  }
  return result;
}

/** Escape special regex characters in a string */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find a translation entry by term or alias */
function findEntry(term: string): TranslationEntry | undefined {
  return TRANSLATIONS.find(
    (e) => e.term === term || e.aliases.includes(term)
  );
}
