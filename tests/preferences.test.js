/**
 * Tests for preferences constants and helper functions.
 */
import {describe, it, expect} from './runner.js';
import {VOWELS, MODIFIER_PRESETS, isModifierKey} from './fixtures.js';
import {GdkKeys} from './mocks.js';

describe('Preferences — VOWELS', () => {
    it('contains exactly 5 entries', () => {
        expect(VOWELS).toHaveLength(5);
    });

    it('covers all five vowels', () => {
        const vowels = VOWELS.map(v => v.vowel).sort();
        expect(vowels).toEqual(['a', 'e', 'i', 'o', 'u']);
    });

    it('each entry has key, label, and vowel fields', () => {
        for (const entry of VOWELS) {
            expect(entry.key).toBeDefined();
            expect(entry.label).toBeDefined();
            expect(entry.vowel).toBeDefined();
        }
    });

    it('keys follow "accent-vowel-X" pattern', () => {
        for (const entry of VOWELS) {
            expect(entry.key).toBe(`accent-vowel-${entry.vowel}`);
        }
    });

    it('labels contain the uppercase vowel', () => {
        for (const entry of VOWELS) {
            expect(entry.label).toContain(entry.vowel.toUpperCase());
        }
    });
});

describe('Preferences — MODIFIER_PRESETS', () => {
    it('contains 6 presets', () => {
        expect(MODIFIER_PRESETS).toHaveLength(6);
    });

    it('first preset is Super+Alt (default)', () => {
        expect(MODIFIER_PRESETS[0].value).toBe('<Super><Alt>');
        expect(MODIFIER_PRESETS[0].label).toContain('default');
    });

    it('each preset has label and value fields', () => {
        for (const preset of MODIFIER_PRESETS) {
            expect(preset.label).toBeDefined();
            expect(preset.value).toBeDefined();
        }
    });

    it('all values contain valid modifier syntax', () => {
        for (const preset of MODIFIER_PRESETS) {
            expect(preset.value).toMatch(/<[A-Za-z]+>/);
        }
    });

    it('all values are unique', () => {
        const values = MODIFIER_PRESETS.map(p => p.value);
        const unique = new Set(values);
        expect(unique.size).toBe(values.length);
    });

    it('all labels are unique', () => {
        const labels = MODIFIER_PRESETS.map(p => p.label);
        const unique = new Set(labels);
        expect(unique.size).toBe(labels.length);
    });

    it('Ctrl+Alt preset exists', () => {
        const found = MODIFIER_PRESETS.find(p => p.value === '<Ctrl><Alt>');
        expect(found).toBeDefined();
    });

    it('Super+Shift preset exists', () => {
        const found = MODIFIER_PRESETS.find(p => p.value === '<Super><Shift>');
        expect(found).toBeDefined();
    });
});

describe('Preferences — isModifierKey', () => {
    it('identifies Shift_L as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Shift_L)).toBe(true);
    });

    it('identifies Shift_R as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Shift_R)).toBe(true);
    });

    it('identifies Control_L as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Control_L)).toBe(true);
    });

    it('identifies Control_R as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Control_R)).toBe(true);
    });

    it('identifies Alt_L as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Alt_L)).toBe(true);
    });

    it('identifies Alt_R as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Alt_R)).toBe(true);
    });

    it('identifies Super_L as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Super_L)).toBe(true);
    });

    it('identifies Super_R as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Super_R)).toBe(true);
    });

    it('identifies Meta_L as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Meta_L)).toBe(true);
    });

    it('identifies Meta_R as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Meta_R)).toBe(true);
    });

    it('identifies Hyper_L as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Hyper_L)).toBe(true);
    });

    it('identifies Hyper_R as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Hyper_R)).toBe(true);
    });

    it('identifies ISO_Level3_Shift as modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_ISO_Level3_Shift)).toBe(true);
    });

    it('rejects Escape as non-modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_Escape)).toBe(false);
    });

    it('rejects BackSpace as non-modifier', () => {
        expect(isModifierKey(GdkKeys.KEY_BackSpace)).toBe(false);
    });

    it('rejects regular letter keys', () => {
        expect(isModifierKey(0x061)).toBe(false); // 'a'
        expect(isModifierKey(0x07a)).toBe(false); // 'z'
    });

    it('rejects number keys', () => {
        expect(isModifierKey(0x030)).toBe(false); // '0'
        expect(isModifierKey(0x039)).toBe(false); // '9'
    });

    it('rejects 0 and negative values', () => {
        expect(isModifierKey(0)).toBe(false);
        expect(isModifierKey(-1)).toBe(false);
    });
});
