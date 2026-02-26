/**
 * Vowel Like a Mac — GNOME 49 Shell Extension
 *
 * Replicates macOS-style accented vowel input.
 * Alt+Vowel opens a centered popup of diacritical variants.
 * Select a character (click, number key, or arrow+Enter) to copy it to clipboard.
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

const AccentPopup = GObject.registerClass(
class AccentPopup extends St.BoxLayout {
    _init(extension) {
        super._init({
            style_class: 'accent-popup',
            vertical: true,
            reactive: true,
            can_focus: true,
            track_hover: true,
        });

        this._extension = extension;
        this._selectedIndex = 0;
        this._buttons = [];
        this._currentChars = [];

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
            text: '← → to navigate · Enter to copy · Esc to close',
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._hintBar);

        this.hide();
    }

    showForVowel(vowel) {
        const chars = ALL_ACCENTS[vowel];
        if (!chars) return;

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

        this._updateSelection();
        this._positionCenter();
        this.show();
        this.grab_key_focus();
    }

    _positionCenter() {
        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor) return;

        // Force a layout pass so we get actual dimensions
        this.ensure_style();

        // Use a short delay to let the layout settle, then center
        const id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
            const w = this.width || 400;
            const h = this.height || 120;
            this.set_position(
                Math.round(monitor.x + (monitor.width - w) / 2),
                Math.round(monitor.y + (monitor.height - h) / 2)
            );
            return GLib.SOURCE_REMOVE;
        });
        // Also set an initial position as a fallback
        this.set_position(
            Math.round(monitor.x + (monitor.width - 400) / 2),
            Math.round(monitor.y + (monitor.height - 120) / 2)
        );
    }

    _updateSelection() {
        this._buttons.forEach((btn, i) => {
            if (i === this._selectedIndex)
                btn.add_style_class_name('accent-button-selected');
            else
                btn.remove_style_class_name('accent-button-selected');
        });
    }

    _selectChar(index) {
        if (index < 0 || index >= this._currentChars.length) return;
        const char = this._currentChars[index];
        const clipboard = St.Clipboard.get_default();
        clipboard.set_text(St.ClipboardType.CLIPBOARD, char);
        Main.notify('Vowel Like a Mac', `"${char}" copied to clipboard`);
        this.dismiss();
    }

    dismiss() {
        this._currentChars = [];
        this._buttons = [];
        this._selectedIndex = 0;
        this.hide();
    }

    vfunc_key_press_event(event) {
        const symbol = event.get_key_symbol();

        // Escape → dismiss
        if (symbol === Clutter.KEY_Escape) {
            this.dismiss();
            return Clutter.EVENT_STOP;
        }

        // Arrow keys → navigate
        if (symbol === Clutter.KEY_Left || symbol === Clutter.KEY_h) {
            this._selectedIndex = Math.max(0, this._selectedIndex - 1);
            this._updateSelection();
            return Clutter.EVENT_STOP;
        }
        if (symbol === Clutter.KEY_Right || symbol === Clutter.KEY_l) {
            this._selectedIndex = Math.min(this._currentChars.length - 1, this._selectedIndex + 1);
            this._updateSelection();
            return Clutter.EVENT_STOP;
        }

        // Home / End
        if (symbol === Clutter.KEY_Home) {
            this._selectedIndex = 0;
            this._updateSelection();
            return Clutter.EVENT_STOP;
        }
        if (symbol === Clutter.KEY_End) {
            this._selectedIndex = this._currentChars.length - 1;
            this._updateSelection();
            return Clutter.EVENT_STOP;
        }

        // Enter → select
        if (symbol === Clutter.KEY_Return || symbol === Clutter.KEY_KP_Enter) {
            this._selectChar(this._selectedIndex);
            return Clutter.EVENT_STOP;
        }

        // Number keys 1-9 → direct select
        if (symbol >= Clutter.KEY_1 && symbol <= Clutter.KEY_9) {
            const num = symbol - Clutter.KEY_1;
            if (num < this._currentChars.length) {
                this._selectChar(num);
                return Clutter.EVENT_STOP;
            }
        }

        return Clutter.EVENT_STOP;
    }
});

export default class VowelLikeAMac extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._popup = new AccentPopup(this);
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
        if (this._popup.visible) {
            this._popup.dismiss();
            return;
        }

        // Detect if Shift is held for uppercase
        const [, , mods] = global.get_pointer();
        const isShift = (mods & Clutter.ModifierType.SHIFT_MASK) !== 0;
        const key = isShift ? vowel.toUpperCase() : vowel;

        this._popup.showForVowel(key);
    }
}
