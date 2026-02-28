/**
 * Glyph Garden — Core Business Logic
 *
 * Pure data and functions with zero GNOME Shell dependencies.
 * Imported by extension.js (runtime) and tests (directly).
 */

// ── Accent Data ──────────────────────────────────────────────────────────────

export const ACCENT_MAP = {
    a: ['à', 'á', 'â', 'ã', 'ä', 'å', 'ā', 'ă', 'ą'],
    e: ['è', 'é', 'ê', 'ë', 'ē', 'ė', 'ę', 'ě'],
    i: ['ì', 'í', 'î', 'ï', 'ī', 'į', 'ĩ'],
    o: ['ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ō', 'ő'],
    u: ['ù', 'ú', 'û', 'ü', 'ū', 'ů', 'ű', 'ų'],
};

export const UPPERCASE_MAP = {};
for (const [vowel, accents] of Object.entries(ACCENT_MAP)) {
    UPPERCASE_MAP[vowel.toUpperCase()] = accents.map((c) => c.toUpperCase());
}

export const ALL_ACCENTS = {...ACCENT_MAP, ...UPPERCASE_MAP};

// ── Preferences Data ─────────────────────────────────────────────────────────

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

const MODIFIER_KEYS = new Set([
    0xffe1, 0xffe2, // Shift_L, Shift_R
    0xffe3, 0xffe4, // Control_L, Control_R
    0xffe9, 0xffea, // Alt_L, Alt_R
    0xffeb, 0xffec, // Super_L, Super_R
    0xffe7, 0xffe8, // Meta_L, Meta_R
    0xffed, 0xffee, // Hyper_L, Hyper_R
    0xfe03,         // ISO_Level3_Shift
]);

export function isModifierKey(keyval) {
    return MODIFIER_KEYS.has(keyval);
}

// ── Key Symbols ──────────────────────────────────────────────────────────────
// Subset of Clutter/Gdk key constants used by the extension.
// Defined here so tests don't need gi://Clutter.

export const KeySyms = {
    Escape: 0xff1b,
    Return: 0xff0d,
    KP_Enter: 0xff8d,
    Left: 0xff51,
    Right: 0xff53,
    Home: 0xff50,
    End: 0xff57,
    Shift_L: 0xffe1,
    Shift_R: 0xffe2,
    KEY_1: 0x031,
    KEY_2: 0x032,
    KEY_3: 0x033,
    KEY_4: 0x034,
    KEY_5: 0x035,
    KEY_6: 0x036,
    KEY_7: 0x037,
    KEY_8: 0x038,
    KEY_9: 0x039,
    h: 0x068,
    l: 0x06c,
};

// ── Key Dispatch Actions ─────────────────────────────────────────────────────
// Pure function: given a key symbol and current state, returns an action
// descriptor. The UI layer (extension.js) executes the side effects.

/**
 * @typedef {Object} PopupState
 * @property {number}   selectedIndex
 * @property {string[]} currentChars
 * @property {string}   baseVowel
 * @property {boolean}  isUppercase
 */

/**
 * @typedef {Object} KeyAction
 * @property {string}  type - 'navigate'|'select'|'toggle_case'|'dismiss'|'none'
 * @property {number}  [index] - new selectedIndex (for 'navigate')
 * @property {number}  [charIndex] - character to select (for 'select')
 */

/**
 * Determine what action a key press should trigger.
 *
 * @param {number} symbol - Key symbol constant
 * @param {PopupState} state - Current popup state
 * @returns {KeyAction}
 */
export function resolveKeyAction(symbol, state) {
    const {selectedIndex, currentChars} = state;
    const maxIndex = currentChars.length - 1;

    switch (symbol) {
        case KeySyms.Shift_L:
        case KeySyms.Shift_R: {
            return {type: 'toggle_case'};
        }

        case KeySyms.Escape: {
            return {type: 'dismiss'};
        }

        case KeySyms.Left:
        case KeySyms.h: {
            return {type: 'navigate', index: Math.max(0, selectedIndex - 1)};
        }

        case KeySyms.Right:
        case KeySyms.l: {
            return {type: 'navigate', index: Math.min(maxIndex, selectedIndex + 1)};
        }

        case KeySyms.Home: {
            return {type: 'navigate', index: 0};
        }

        case KeySyms.End: {
            return {type: 'navigate', index: maxIndex};
        }

        case KeySyms.Return:
        case KeySyms.KP_Enter: {
            return {type: 'select', charIndex: selectedIndex};
        }

        case KeySyms.KEY_1:
        case KeySyms.KEY_2:
        case KeySyms.KEY_3:
        case KeySyms.KEY_4:
        case KeySyms.KEY_5:
        case KeySyms.KEY_6:
        case KeySyms.KEY_7:
        case KeySyms.KEY_8:
        case KeySyms.KEY_9: {
            const num = symbol - KeySyms.KEY_1;
            if (num < currentChars.length) {
                return {type: 'select', charIndex: num};
            }
            return {type: 'none'};
        }

        default: {
            return {type: 'none'};
        }
    }
}

// ── Case Toggle ──────────────────────────────────────────────────────────────

/**
 * Compute the toggled vowel key and its character list.
 *
 * @param {string}  baseVowel   - Lowercase base vowel (e.g. 'a')
 * @param {boolean} isUppercase - Current case state
 * @returns {{ vowel: string, chars: string[], isUppercase: boolean } | null}
 */
export function toggleCase(baseVowel, isUppercase) {
    const newVowel = isUppercase ? baseVowel : baseVowel.toUpperCase();
    const newChars = ALL_ACCENTS[newVowel];
    if (!newChars) {
        return null;
    }
    return {vowel: newVowel, chars: newChars, isUppercase: !isUppercase};
}

// ── Vowel Lookup ─────────────────────────────────────────────────────────────

/**
 * Look up accent characters for a vowel key. Returns null if invalid.
 *
 * @param {string} vowel - Lowercase or uppercase vowel letter
 * @returns {{ chars: string[], baseVowel: string, isUppercase: boolean } | null}
 */
export function lookupVowel(vowel) {
    const chars = ALL_ACCENTS[vowel];
    if (!chars) {
        return null;
    }
    return {
        chars,
        baseVowel: vowel.toLowerCase(),
        isUppercase: vowel !== vowel.toLowerCase(),
    };
}

// ── Selection ────────────────────────────────────────────────────────────────

/**
 * Validate a character selection index.
 *
 * @param {number}   index - Candidate index
 * @param {string[]} chars - Current character list
 * @returns {boolean}
 */
export function isValidSelection(index, chars) {
    return Number.isInteger(index) && index >= 0 && index < chars.length;
}

/**
 * Build the notification action string based on settings.
 *
 * @param {boolean} doCopy - Whether copy-to-clipboard is enabled
 * @param {boolean} doType - Whether type-character is enabled
 * @returns {string} e.g. "copied", "typed", "copied and typed", "selected"
 */
export function buildActionLabel(doCopy, doType) {
    const parts = [];
    if (doCopy) {
        parts.push('copied');
    }
    if (doType) {
        parts.push('typed');
    }
    return parts.join(' and ') || 'selected';
}
