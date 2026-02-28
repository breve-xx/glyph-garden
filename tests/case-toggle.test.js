/**
 * Tests for case toggling logic — using real toggleCase from core.js.
 */
import {describe, it, expect} from './runner.js';
import {ACCENT_MAP, UPPERCASE_MAP, toggleCase, lookupVowel, KeySyms, resolveKeyAction} from './fixtures.js';

describe('Case Toggle — Basic', () => {
    it('starts lowercase when opened with lowercase vowel', () => {
        const lookup = lookupVowel('a');
        expect(lookup.isUppercase).toBe(false);
    });

    it('starts uppercase when opened with uppercase vowel', () => {
        const lookup = lookupVowel('A');
        expect(lookup.isUppercase).toBe(true);
    });

    it('toggleCase flips from lowercase to uppercase', () => {
        const result = toggleCase('a', false);
        expect(result.isUppercase).toBe(true);
        expect(result.vowel).toBe('A');
    });

    it('toggleCase flips from uppercase to lowercase', () => {
        const result = toggleCase('a', true);
        expect(result.isUppercase).toBe(false);
        expect(result.vowel).toBe('a');
    });

    it('double toggle returns to original case', () => {
        const first = toggleCase('a', false);
        const second = toggleCase('a', first.isUppercase);
        expect(second.isUppercase).toBe(false);
    });

    it('resolveKeyAction returns toggle_case for Shift', () => {
        const state = {selectedIndex: 2, currentChars: ACCENT_MAP.a, baseVowel: 'a', isUppercase: false};
        const action = resolveKeyAction(KeySyms.Shift_L, state);
        expect(action.type).toBe('toggle_case');
    });
});

describe('Case Toggle — Character Updates', () => {
    for (const vowel of Object.keys(ACCENT_MAP)) {
        it(`characters update to uppercase for vowel "${vowel}"`, () => {
            const result = toggleCase(vowel, false);
            const expected = ACCENT_MAP[vowel].map((c) => c.toUpperCase());
            expect(result.chars).toEqual(expected);
        });

        it(`characters revert to lowercase for vowel "${vowel}"`, () => {
            const up = toggleCase(vowel, false);
            const down = toggleCase(vowel, up.isUppercase);
            expect(down.chars).toEqual(ACCENT_MAP[vowel]);
        });
    }
});

describe('Case Toggle — Selection After Toggle', () => {
    it('selecting after toggle yields uppercase character', () => {
        const toggled = toggleCase('a', false);
        expect(toggled.chars[0]).toBe(ACCENT_MAP.a[0].toUpperCase());
    });

    it('selecting after double toggle yields lowercase character', () => {
        const first = toggleCase('a', false);
        const second = toggleCase('a', first.isUppercase);
        expect(second.chars[0]).toBe(ACCENT_MAP.a[0]);
    });

    it('number key selection works after case toggle', () => {
        const toggled = toggleCase('e', false);
        const state = {selectedIndex: 0, currentChars: toggled.chars, baseVowel: 'e', isUppercase: true};
        const action = resolveKeyAction(KeySyms.KEY_3, state);
        expect(action.type).toBe('select');
        expect(toggled.chars[action.charIndex]).toBe(ACCENT_MAP.e[2].toUpperCase());
    });
});

describe('Case Toggle — Opened Uppercase', () => {
    it('toggle from uppercase to lowercase', () => {
        const lookup = lookupVowel('A');
        expect(lookup.isUppercase).toBe(true);
        const result = toggleCase(lookup.baseVowel, lookup.isUppercase);
        expect(result.isUppercase).toBe(false);
        expect(result.chars).toEqual(ACCENT_MAP.a);
    });

    it('toggle back to uppercase', () => {
        const lookup = lookupVowel('A');
        const down = toggleCase(lookup.baseVowel, lookup.isUppercase);
        const up = toggleCase(lookup.baseVowel, down.isUppercase);
        expect(up.isUppercase).toBe(true);
        expect(up.chars).toEqual(UPPERCASE_MAP.A);
    });
});
