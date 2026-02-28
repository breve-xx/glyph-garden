/**
 * Glyph Garden — Test Fixtures
 *
 * Re-exports from src/core.js (the real production code) plus
 * test-only constants like expected counts and schema key definitions.
 */

export {
    ACCENT_MAP,
    UPPERCASE_MAP,
    ALL_ACCENTS,
    VOWELS,
    MODIFIER_PRESETS,
    isModifierKey,
    KeySyms,
    resolveKeyAction,
    toggleCase,
    lookupVowel,
    isValidSelection,
    buildActionLabel,
} from '../src/core.js';

// Expected character counts per vowel (test-only)
export const EXPECTED_COUNTS = {a: 9, e: 8, i: 7, o: 8, u: 8};

// GSettings schema keys that must exist (test-only)
export const SCHEMA_KEYS = [
    {name: 'modifier-prefix', type: 's'},
    {name: 'show-notification', type: 'b'},
    {name: 'copy-to-clipboard', type: 'b'},
    {name: 'type-character', type: 'b'},
    {name: 'dialog-opacity', type: 'i'},
    {name: 'accent-vowel-a', type: 'as'},
    {name: 'accent-vowel-e', type: 'as'},
    {name: 'accent-vowel-i', type: 'as'},
    {name: 'accent-vowel-o', type: 'as'},
    {name: 'accent-vowel-u', type: 'as'},
];
