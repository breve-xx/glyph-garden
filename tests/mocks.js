/**
 * Glyph Garden — Mock objects for testing outside GNOME Shell.
 *
 * Provides MockExtension for lifecycle tests, and Gdk key constants
 * for prefs isModifierKey tests. Business logic mocks have been removed:
 * tests now import the real code from src/core.js via fixtures.js.
 */

// ---------------------------------------------------------------------------
// Gdk key constants (used in prefs isModifierKey tests)
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
