/**
 * Glyph Garden — Mock objects for testing outside GNOME Shell.
 *
 * Provides mock constants and factories for Clutter, St, Meta, Shell,
 * and Main that mirror the APIs used in extension.js and prefs.js.
 */

// ---------------------------------------------------------------------------
// Clutter key symbol constants (subset used by the extension)
// ---------------------------------------------------------------------------
export const ClutterKeys = {
    KEY_Escape: 0xff1b,
    KEY_Return: 0xff0d,
    KEY_KP_Enter: 0xff8d,
    KEY_Left: 0xff51,
    KEY_Right: 0xff53,
    KEY_Home: 0xff50,
    KEY_End: 0xff57,
    KEY_Shift_L: 0xffe1,
    KEY_Shift_R: 0xffe2,
    KEY_Control_L: 0xffe3,
    KEY_Control_R: 0xffe4,
    KEY_Alt_L: 0xffe9,
    KEY_Alt_R: 0xffea,
    KEY_Super_L: 0xffeb,
    KEY_Super_R: 0xffec,
    KEY_Meta_L: 0xffe7,
    KEY_Meta_R: 0xffe8,
    KEY_Hyper_L: 0xffed,
    KEY_Hyper_R: 0xffee,
    KEY_ISO_Level3_Shift: 0xfe03,
    KEY_1: 0x031,
    KEY_2: 0x032,
    KEY_3: 0x033,
    KEY_4: 0x034,
    KEY_5: 0x035,
    KEY_6: 0x036,
    KEY_7: 0x037,
    KEY_8: 0x038,
    KEY_9: 0x039,
    KEY_h: 0x068,
    KEY_l: 0x06c,
    KEY_v: 0x076,

    EVENT_STOP: true,
    EVENT_PROPAGATE: false,

    ModifierType: {
        SHIFT_MASK: 1 << 0,
        CONTROL_MASK: 1 << 2,
        MOD1_MASK: 1 << 3,   // Alt
        SUPER_MASK: 1 << 26,
    },
};

// ---------------------------------------------------------------------------
// Gdk key constants (used in prefs.js isModifierKey)
// ---------------------------------------------------------------------------
export const GdkKeys = {
    KEY_Escape: 0xff1b,
    KEY_BackSpace: 0xff08,
    KEY_Shift_L: 0xffe1,
    KEY_Shift_R: 0xffe2,
    KEY_Control_L: 0xffe3,
    KEY_Control_R: 0xffe4,
    KEY_Alt_L: 0xffe9,
    KEY_Alt_R: 0xffea,
    KEY_Super_L: 0xffeb,
    KEY_Super_R: 0xffec,
    KEY_Meta_L: 0xffe7,
    KEY_Meta_R: 0xffe8,
    KEY_Hyper_L: 0xffed,
    KEY_Hyper_R: 0xffee,
    KEY_ISO_Level3_Shift: 0xfe03,
};

// ---------------------------------------------------------------------------
// Mock event factory
// ---------------------------------------------------------------------------
export function makeKeyEvent(symbol) {
    return {
        get_key_symbol() { return symbol; },
    };
}

// ---------------------------------------------------------------------------
// Mock AccentPopup state machine
//
// Mirrors the behavioral logic of AccentPopup from extension.js without
// depending on St/Clutter/GObject. Used to test navigation, selection,
// case toggling, key event dispatch, and dismiss behavior.
// ---------------------------------------------------------------------------
export class MockPopup {
    constructor(accentMap, uppercaseMap) {
        this._accentMap = accentMap;
        this._uppercaseMap = uppercaseMap;
        this._allAccents = {...accentMap, ...uppercaseMap};
        this._selectedIndex = 0;
        this._currentChars = [];
        this._baseVowel = '';
        this._isUppercase = false;
        this._visible = false;
        this._copiedChar = null;
        this._dismissed = false;
        this._settings = {
            'copy-to-clipboard': false,
            'type-character': true,
            'show-notification': true,
            'dialog-opacity': 100,
        };
    }

    get visible() { return this._visible; }

    showForVowel(vowel) {
        const chars = this._allAccents[vowel];
        if (!chars) return;

        this._baseVowel = vowel.toLowerCase();
        this._isUppercase = vowel !== vowel.toLowerCase();
        this._currentChars = [...chars];
        this._selectedIndex = 0;
        this._visible = true;
        this._dismissed = false;
    }

    _updateSelection() {
        // In real code this updates CSS classes; here it's a no-op.
    }

    _toggleCase() {
        const newVowel = this._isUppercase
            ? this._baseVowel
            : this._baseVowel.toUpperCase();
        const newChars = this._allAccents[newVowel];
        if (!newChars) return;

        this._isUppercase = !this._isUppercase;
        this._currentChars = [...newChars];
    }

    _selectChar(index) {
        if (index < 0 || index >= this._currentChars.length) return;
        this._copiedChar = this._currentChars[index];
        this.dismiss();
    }

    dismiss() {
        this._currentChars = [];
        this._selectedIndex = 0;
        this._baseVowel = '';
        this._isUppercase = false;
        this._visible = false;
        this._dismissed = true;
    }

    /**
     * Simulates vfunc_key_press_event logic from extension.js.
     */
    handleKeyPress(symbol) {
        const CK = ClutterKeys;

        if (symbol === CK.KEY_Shift_L || symbol === CK.KEY_Shift_R) {
            this._toggleCase();
            return CK.EVENT_STOP;
        }
        if (symbol === CK.KEY_Escape) {
            this.dismiss();
            return CK.EVENT_STOP;
        }
        if (symbol === CK.KEY_Left || symbol === CK.KEY_h) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
            this._updateSelection();
            return CK.EVENT_STOP;
        }
        if (symbol === CK.KEY_Right || symbol === CK.KEY_l) {
            this._selectedIndex = Math.min(this._currentChars.length - 1, this._selectedIndex + 1);
            this._updateSelection();
            return CK.EVENT_STOP;
        }
        if (symbol === CK.KEY_Home) {
            this._selectedIndex = 0;
            this._updateSelection();
            return CK.EVENT_STOP;
        }
        if (symbol === CK.KEY_End) {
            this._selectedIndex = this._currentChars.length - 1;
            this._updateSelection();
            return CK.EVENT_STOP;
        }
        if (symbol === CK.KEY_Return || symbol === CK.KEY_KP_Enter) {
            this._selectChar(this._selectedIndex);
            return CK.EVENT_STOP;
        }
        if (symbol >= CK.KEY_1 && symbol <= CK.KEY_9) {
            const num = symbol - CK.KEY_1;
            if (num < this._currentChars.length) {
                this._selectChar(num);
                return CK.EVENT_STOP;
            }
        }

        return CK.EVENT_STOP;
    }
}

// ---------------------------------------------------------------------------
// Mock GlyphGarden extension lifecycle
// ---------------------------------------------------------------------------
export class MockExtension {
    constructor() {
        this._settings = null;
        this._popup = null;
        this._bindingIds = [];
        this._enabled = false;
    }

    enable(accentMap) {
        this._settings = {};
        this._popup = {visible: false, dismiss() { this.visible = false; }};
        this._bindingIds = [];
        for (const vowel of Object.keys(accentMap)) {
            this._bindingIds.push(`accent-vowel-${vowel}`);
        }
        this._enabled = true;
    }

    disable() {
        this._bindingIds = [];
        if (this._popup) {
            this._popup.dismiss();
            this._popup = null;
        }
        this._settings = null;
        this._enabled = false;
    }
}
