/**
 * Glyph Garden — Test Fixtures
 *
 * Replicated data structures from extension.js and prefs.js.
 * These are kept in sync with the source; the schema test validates alignment.
 */

// From extension.js
export const ACCENT_MAP = {
    a: ['à', 'á', 'â', 'ã', 'ä', 'å', 'ā', 'ă', 'ą'],
    e: ['è', 'é', 'ê', 'ë', 'ē', 'ė', 'ę', 'ě'],
    i: ['ì', 'í', 'î', 'ï', 'ī', 'į', 'ĩ'],
    o: ['ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ō', 'ő'],
    u: ['ù', 'ú', 'û', 'ü', 'ū', 'ů', 'ű', 'ų'],
};

export const UPPERCASE_MAP = {};
for (const [vowel, accents] of Object.entries(ACCENT_MAP)) {
    UPPERCASE_MAP[vowel.toUpperCase()] = accents.map(c => c.toUpperCase());
}

export const ALL_ACCENTS = {...ACCENT_MAP, ...UPPERCASE_MAP};

// Expected character counts per vowel
export const EXPECTED_COUNTS = {a: 9, e: 8, i: 7, o: 8, u: 8};

// From prefs.js
export const VOWELS = [
    {key: 'accent-vowel-a', label: 'Accent menu for A', vowel: 'a'},
    {key: 'accent-vowel-e', label: 'Accent menu for E', vowel: 'e'},
    {key: 'accent-vowel-i', label: 'Accent menu for I', vowel: 'i'},
    {key: 'accent-vowel-o', label: 'Accent menu for O', vowel: 'o'},
    {key: 'accent-vowel-u', label: 'Accent menu for U', vowel: 'u'},
];

export const MODIFIER_PRESETS = [
    {label: 'Super+Alt (default)', value: '<Super><Alt>'},
    {label: 'Ctrl+Alt',           value: '<Ctrl><Alt>'},
    {label: 'Super+Shift',        value: '<Super><Shift>'},
    {label: 'Ctrl+Shift',         value: '<Ctrl><Shift>'},
    {label: 'Super+Ctrl+Alt',     value: '<Super><Ctrl><Alt>'},
    {label: 'Super+Ctrl',         value: '<Super><Ctrl>'},
];

// GSettings schema keys that must exist
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

// isModifierKey — replicated from prefs.js
export function isModifierKey(keyval) {
    return [
        0xffe1, 0xffe2, // Shift_L, Shift_R
        0xffe3, 0xffe4, // Control_L, Control_R
        0xffe9, 0xffea, // Alt_L, Alt_R
        0xffeb, 0xffec, // Super_L, Super_R
        0xffe7, 0xffe8, // Meta_L, Meta_R
        0xffed, 0xffee, // Hyper_L, Hyper_R
        0xfe03,         // ISO_Level3_Shift
    ].includes(keyval);
}
