/**
 * Glyph Garden — GNOME 49 Shell Extension
 *
 * Replicates macOS-style accented vowel input.
 * Alt+Vowel opens a centered popup of diacritical variants.
 * Select a character (click, number key, or arrow+Enter) to copy it to clipboard
 * and type it at the current caret position.
 */

import GLib from 'gi://GLib';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const ACCENT_MAP = {
    a: ['à', 'á', 'â', 'ã', 'ä', 'å', 'ā', 'ă', 'ą'],
    e: ['è', 'é', 'ê', 'ë', 'ē', 'ė', 'ę', 'ě'],
    i: ['ì', 'í', 'î', 'ï', 'ī', 'į', 'ĩ'],
    o: ['ò', 'ó', 'ô', 'õ', 'ö', 'ø', 'ō', 'ő'],
    u: ['ù', 'ú', 'û', 'ü', 'ū', 'ů', 'ű', 'ų'],
};

const UPPERCASE_MAP = {};
for (const [vowel, accents] of Object.entries(ACCENT_MAP)) {
    UPPERCASE_MAP[vowel.toUpperCase()] = accents.map(c => c.toUpperCase());
}

const ALL_ACCENTS = {...ACCENT_MAP, ...UPPERCASE_MAP};

function simulatePaste() {
    const seat = Clutter.get_default_backend().get_default_seat();
    const vk = seat.create_virtual_device(Clutter.InputDeviceType.KEYBOARD_DEVICE);
    const now = Clutter.get_current_event_time();
    vk.notify_keyval(now, Clutter.KEY_Control_L, Clutter.KeyState.PRESSED);
    vk.notify_keyval(now, Clutter.KEY_v, Clutter.KeyState.PRESSED);
    vk.notify_keyval(now, Clutter.KEY_v, Clutter.KeyState.RELEASED);
    vk.notify_keyval(now, Clutter.KEY_Control_L, Clutter.KeyState.RELEASED);
}

const AccentPopup = GObject.registerClass(
class AccentPopup extends St.BoxLayout {
    _init(settings) {
        super._init({
            style_class: 'accent-popup',
            vertical: true,
            reactive: true,
            can_focus: true,
            track_hover: true,
        });

        this._settings = settings;
        this._selectedIndex = 0;
        this._buttons = [];
        this._currentChars = [];
        this._baseVowel = '';
        this._isUppercase = false;
        this._pendingSources = new Set();

        this._title = new St.Label({
            style_class: 'accent-popup-title',
            text: '',
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._title);

        this._row = new St.BoxLayout({
            style_class: 'accent-popup-row',
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._row);

        this._hintBar = new St.Label({
            style_class: 'accent-hint-bar',
            text: '← → to navigate · Enter to copy & type · Shift to toggle case · Esc to close',
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._hintBar);

        this.hide();
    }

    _addTimeout(delayMs, callback) {
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delayMs, () => {
            this._pendingSources.delete(id);
            return callback();
        });
        this._pendingSources.add(id);
    }

    _clearTimeouts() {
        for (const id of this._pendingSources) {
            GLib.source_remove(id);
        }
        this._pendingSources.clear();
    }

    showForVowel(vowel) {
        const chars = ALL_ACCENTS[vowel];
        if (!chars) {
            return;
        }

        this._clearTimeouts();

        this._baseVowel = vowel.toLowerCase();
        this._isUppercase = vowel !== vowel.toLowerCase();
        this._currentChars = chars;
        this._selectedIndex = 0;
        this._title.set_text(`Accents for "${vowel}"`);

        this._row.destroy_all_children();
        this._buttons = [];

        chars.forEach((char, index) => {
            const btn = new St.BoxLayout({
                style_class: 'accent-button',
                vertical: true,
                reactive: true,
                can_focus: true,
                track_hover: true,
            });

            const charLabel = new St.Label({
                style_class: 'accent-button-char',
                text: char,
                x_align: Clutter.ActorAlign.CENTER,
            });
            btn.add_child(charLabel);

            const hint = new St.Label({
                style_class: 'accent-button-hint',
                text: `${index + 1}`,
                x_align: Clutter.ActorAlign.CENTER,
            });
            btn.add_child(hint);

            btn.connect('button-press-event', () => {
                this._selectChar(index);
                return Clutter.EVENT_STOP;
            });

            btn.connect('notify::hover', () => {
                if (btn.hover) {
                    this._selectedIndex = index;
                    this._updateSelection();
                }
            });

            this._buttons.push(btn);
            this._row.add_child(btn);
        });

        const opacityPct = this._settings.get_int('dialog-opacity');
        this.opacity = Math.round(opacityPct * 255 / 100);

        this._updateSelection();
        this._positionCenter();
        this.show();
        this.grab_key_focus();
    }

    _positionCenter() {
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor) {
            return;
        }

        const fallbackW = 400;
        const fallbackH = 120;
        this.ensure_style();

        // Re-center after layout settles with actual dimensions
        this._addTimeout(10, () => {
            const w = this.width || fallbackW;
            const h = this.height || fallbackH;
            this.set_position(
                Math.round(monitor.x + (monitor.width - w) / 2),
                Math.round(monitor.y + (monitor.height - h) / 2)
            );
            return GLib.SOURCE_REMOVE;
        });
        this.set_position(
            Math.round(monitor.x + (monitor.width - fallbackW) / 2),
            Math.round(monitor.y + (monitor.height - fallbackH) / 2)
        );
    }

    _updateSelection() {
        this._buttons.forEach((btn, i) => {
            if (i === this._selectedIndex) {
                btn.add_style_class_name('accent-button-selected');
            } else {
                btn.remove_style_class_name('accent-button-selected');
            }
        });
    }

    _toggleCase() {
        const newVowel = this._isUppercase
            ? this._baseVowel
            : this._baseVowel.toUpperCase();
        const newChars = ALL_ACCENTS[newVowel];
        if (!newChars) {
            return;
        }

        this._isUppercase = !this._isUppercase;
        this._currentChars = newChars;
        this._title.set_text(`Accents for "${newVowel}"`);

        this._buttons.forEach((btn, i) => {
            const charLabel = btn.get_child_at_index(0);
            charLabel.set_text(newChars[i]);
        });
    }

    _selectChar(index) {
        if (index < 0 || index >= this._currentChars.length) {
            return;
        }

        const char = this._currentChars[index];
        const doCopy = this._settings.get_boolean('copy-to-clipboard');
        const doType = this._settings.get_boolean('type-character');

        if (doCopy) {
            St.Clipboard.get_default().set_text(St.ClipboardType.CLIPBOARD, char);
        }

        if (this._settings.get_boolean('show-notification')) {
            const parts = [];
            if (doCopy) {
                parts.push('copied');
            }
            if (doType) {
                parts.push('typed');
            }
            const action = parts.join(' and ') || 'selected';
            Main.notify('Glyph Garden', `"${char}" ${action}`);
        }

        this.dismiss();

        if (doType) {
            this._typeCharacter(char, doCopy);
        }
    }

    _typeCharacter(char, alreadyOnClipboard) {
        if (alreadyOnClipboard) {
            this._addTimeout(50, () => {
                simulatePaste();
                return GLib.SOURCE_REMOVE;
            });
            return;
        }

        // Temporarily set clipboard, paste, then restore previous content
        const clipboard = St.Clipboard.get_default();
        clipboard.get_text(St.ClipboardType.CLIPBOARD, (_cb, previous) => {
            clipboard.set_text(St.ClipboardType.CLIPBOARD, char);
            this._addTimeout(50, () => {
                simulatePaste();
                this._addTimeout(100, () => {
                    clipboard.set_text(St.ClipboardType.CLIPBOARD, previous || '');
                    return GLib.SOURCE_REMOVE;
                });
                return GLib.SOURCE_REMOVE;
            });
        });
    }

    dismiss() {
        this._clearTimeouts();
        this._currentChars = [];
        this._buttons = [];
        this._selectedIndex = 0;
        this._baseVowel = '';
        this._isUppercase = false;
        this.hide();
    }

    vfunc_key_press_event(event) {
        const symbol = event.get_key_symbol();

        switch (symbol) {
            case Clutter.KEY_Shift_L:
            case Clutter.KEY_Shift_R: {
                this._toggleCase();
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_Escape: {
                this.dismiss();
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_Left:
            case Clutter.KEY_h: {
                this._selectedIndex = Math.max(0, this._selectedIndex - 1);
                this._updateSelection();
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_Right:
            case Clutter.KEY_l: {
                this._selectedIndex = Math.min(this._currentChars.length - 1, this._selectedIndex + 1);
                this._updateSelection();
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_Home: {
                this._selectedIndex = 0;
                this._updateSelection();
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_End: {
                this._selectedIndex = this._currentChars.length - 1;
                this._updateSelection();
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_Return:
            case Clutter.KEY_KP_Enter: {
                this._selectChar(this._selectedIndex);
                return Clutter.EVENT_STOP;
            }

            case Clutter.KEY_1:
            case Clutter.KEY_2:
            case Clutter.KEY_3:
            case Clutter.KEY_4:
            case Clutter.KEY_5:
            case Clutter.KEY_6:
            case Clutter.KEY_7:
            case Clutter.KEY_8:
            case Clutter.KEY_9: {
                const num = symbol - Clutter.KEY_1;
                if (num < this._currentChars.length) {
                    this._selectChar(num);
                }
                return Clutter.EVENT_STOP;
            }

            default: {
                return Clutter.EVENT_STOP;
            }
        }
    }
});

export default class GlyphGarden extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._popup = new AccentPopup(this._settings);
        Main.layoutManager.addTopChrome(this._popup);

        this._bindingIds = [];
        for (const vowel of Object.keys(ACCENT_MAP)) {
            const settingKey = `accent-vowel-${vowel}`;
            Main.wm.addKeybinding(
                settingKey,
                this._settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL | Shell.ActionMode.OVERVIEW,
                () => this._onAccentKey(vowel)
            );
            this._bindingIds.push(settingKey);
        }
    }

    disable() {
        for (const id of this._bindingIds) {
            Main.wm.removeKeybinding(id);
        }
        this._bindingIds = [];

        if (this._popup) {
            this._popup.dismiss();
            Main.layoutManager.removeChrome(this._popup);
            this._popup.destroy();
            this._popup = null;
        }

        this._settings = null;
    }

    _onAccentKey(vowel) {
        if (!this._popup) {
            return;
        }

        if (this._popup.visible) {
            this._popup.dismiss();
            return;
        }

        const [, , mods] = global.get_pointer();
        const isShift = (mods & Clutter.ModifierType.SHIFT_MASK) !== 0;
        const key = isShift ? vowel.toUpperCase() : vowel;

        this._popup.showForVowel(key);
    }
}
