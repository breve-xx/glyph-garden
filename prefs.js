/**
 * Vowel Like a Mac — Preferences
 *
 * Settings UI for configuring keyboard shortcuts.
 * Includes a modifier prefix selector that updates all five vowel
 * shortcuts at once, plus per-vowel override controls.
 */

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GObject from 'gi://GObject';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const VOWELS = [
    {key: 'accent-vowel-a', label: 'Accent menu for A', vowel: 'a'},
    {key: 'accent-vowel-e', label: 'Accent menu for E', vowel: 'e'},
    {key: 'accent-vowel-i', label: 'Accent menu for I', vowel: 'i'},
    {key: 'accent-vowel-o', label: 'Accent menu for O', vowel: 'o'},
    {key: 'accent-vowel-u', label: 'Accent menu for U', vowel: 'u'},
];

const MODIFIER_PRESETS = [
    {label: 'Super+Alt (default)', value: '<Super><Alt>'},
    {label: 'Ctrl+Alt',           value: '<Ctrl><Alt>'},
    {label: 'Super+Shift',        value: '<Super><Shift>'},
    {label: 'Ctrl+Shift',         value: '<Ctrl><Shift>'},
    {label: 'Super+Ctrl+Alt',     value: '<Super><Ctrl><Alt>'},
    {label: 'Super+Ctrl',         value: '<Super><Ctrl>'},
];

export default class VowelLikeAMacPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('Keyboard Shortcuts'),
            icon_name: 'input-keyboard-symbolic',
        });
        window.add(page);

        // --- Behaviour group ---
        const behaviourGroup = new Adw.PreferencesGroup({
            title: _('Behaviour'),
        });
        page.add(behaviourGroup);

        const notifyRow = new Adw.SwitchRow({
            title: _('Show notification on copy'),
            subtitle: _('Display a notification when a character is copied to the clipboard'),
        });
        settings.bind('show-notification', notifyRow, 'active',
            Gio.SettingsBindFlags.DEFAULT);
        behaviourGroup.add(notifyRow);

        // --- Modifier prefix group ---
        const prefixGroup = new Adw.PreferencesGroup({
            title: _('Modifier Prefix'),
            description: _('Choose the modifier keys pressed before a vowel. Changing this updates all five shortcuts at once.'),
        });
        page.add(prefixGroup);

        const prefixRow = new Adw.ComboRow({
            title: _('Modifier combination'),
            subtitle: _('e.g. Super+Alt means Super+Alt+A opens the A accent menu'),
        });

        const prefixModel = new Gtk.StringList();
        for (const preset of MODIFIER_PRESETS)
            prefixModel.append(preset.label);
        prefixRow.model = prefixModel;

        // Set active row from current setting
        const currentPrefix = settings.get_string('modifier-prefix');
        const activeIdx = MODIFIER_PRESETS.findIndex(p => p.value === currentPrefix);
        prefixRow.selected = activeIdx >= 0 ? activeIdx : 0;

        // Track shortcut labels so we can update them when prefix changes
        const shortcutLabels = {};

        prefixRow.connect('notify::selected', () => {
            const idx = prefixRow.selected;
            if (idx < 0 || idx >= MODIFIER_PRESETS.length) return;
            const prefix = MODIFIER_PRESETS[idx].value;
            settings.set_string('modifier-prefix', prefix);

            // Update all five vowel keybindings
            for (const {key, vowel} of VOWELS) {
                const accel = `${prefix}${vowel}`;
                settings.set_strv(key, [accel]);
                if (shortcutLabels[key])
                    shortcutLabels[key].accelerator = accel;
            }
        });

        prefixGroup.add(prefixRow);

        // --- Per-vowel overrides group ---
        const group = new Adw.PreferencesGroup({
            title: _('Per-Vowel Shortcuts'),
            description: _('Override individual shortcuts if needed. These are updated automatically when you change the modifier prefix above.'),
        });
        page.add(group);

        for (const {key, label, vowel} of VOWELS) {
            const row = new Adw.ActionRow({
                title: _(label),
                subtitle: _(`Shortcut to open accent menu for ${vowel.toUpperCase()}`),
            });

            const currentBinding = settings.get_strv(key);
            const shortcutLabel = new Gtk.ShortcutLabel({
                accelerator: currentBinding.length > 0 ? currentBinding[0] : '',
                disabled_text: _('Disabled'),
                valign: Gtk.Align.CENTER,
            });
            shortcutLabels[key] = shortcutLabel;

            const editButton = new Gtk.Button({
                label: _('Set'),
                valign: Gtk.Align.CENTER,
                css_classes: ['flat'],
            });

            editButton.connect('clicked', () => {
                this._showShortcutDialog(window, settings, key, label, shortcutLabel);
            });

            const resetButton = new Gtk.Button({
                icon_name: 'edit-undo-symbolic',
                valign: Gtk.Align.CENTER,
                css_classes: ['flat'],
                tooltip_text: _('Reset to default'),
            });

            resetButton.connect('clicked', () => {
                settings.reset(key);
                const defaultBinding = settings.get_strv(key);
                shortcutLabel.accelerator = defaultBinding.length > 0 ? defaultBinding[0] : '';
            });

            row.add_suffix(shortcutLabel);
            row.add_suffix(editButton);
            row.add_suffix(resetButton);
            group.add(row);
        }

        // Info group
        const infoGroup = new Adw.PreferencesGroup({
            title: _('Usage'),
            description: _('Press a shortcut to open the accent popup. Use arrow keys or number keys to select a character. The selected character is copied to your clipboard.'),
        });
        page.add(infoGroup);
    }

    _showShortcutDialog(parentWindow, settings, settingKey, label, shortcutLabel) {
        const dialog = new Gtk.Dialog({
            title: _('Set Shortcut'),
            transient_for: parentWindow,
            modal: true,
            default_width: 350,
            default_height: 200,
        });

        const contentArea = dialog.get_content_area();
        contentArea.spacing = 12;
        contentArea.margin_top = 20;
        contentArea.margin_bottom = 20;
        contentArea.margin_start = 20;
        contentArea.margin_end = 20;

        const infoLabel = new Gtk.Label({
            label: _(`Press a key combination for:\n<b>${label}</b>\n\nPress Escape to cancel, Backspace to disable.`),
            use_markup: true,
            justify: Gtk.Justification.CENTER,
        });
        contentArea.append(infoLabel);

        const controller = new Gtk.EventControllerKey();
        controller.connect('key-pressed', (_ctrl, keyval, keycode, state) => {
            if (isModifierKey(keyval))
                return Gdk.EVENT_STOP;

            if (keyval === Gdk.KEY_Escape) {
                dialog.close();
                return Gdk.EVENT_STOP;
            }

            if (keyval === Gdk.KEY_BackSpace) {
                settings.set_strv(settingKey, []);
                shortcutLabel.accelerator = '';
                dialog.close();
                return Gdk.EVENT_STOP;
            }

            const mask = state & Gtk.accelerator_get_default_mod_mask();
            const accel = Gtk.accelerator_name(keyval, mask);

            if (accel) {
                settings.set_strv(settingKey, [accel]);
                shortcutLabel.accelerator = accel;
            }

            dialog.close();
            return Gdk.EVENT_STOP;
        });

        dialog.add_controller(controller);
        dialog.present();
    }
}

function isModifierKey(keyval) {
    return [
        Gdk.KEY_Shift_L, Gdk.KEY_Shift_R,
        Gdk.KEY_Control_L, Gdk.KEY_Control_R,
        Gdk.KEY_Alt_L, Gdk.KEY_Alt_R,
        Gdk.KEY_Super_L, Gdk.KEY_Super_R,
        Gdk.KEY_Meta_L, Gdk.KEY_Meta_R,
        Gdk.KEY_Hyper_L, Gdk.KEY_Hyper_R,
        Gdk.KEY_ISO_Level3_Shift,
    ].includes(keyval);
}
