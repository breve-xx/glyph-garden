/**
 * Tests for edge cases and boundary conditions — using real core.js functions.
 */
import {describe, it, expect} from './runner.js';
import {
    ACCENT_MAP, ALL_ACCENTS, KeySyms, resolveKeyAction,
    lookupVowel, toggleCase, isValidSelection, buildActionLabel,
} from './fixtures.js';

describe('Edge Cases — Invalid Vowels', () => {
    it('lookupVowel with non-vowel letter returns null', () => {
        expect(lookupVowel('b')).toBeNull();
    });

    it('lookupVowel with number returns null', () => {
        expect(lookupVowel('1')).toBeNull();
    });

    it('lookupVowel with empty string returns null', () => {
        expect(lookupVowel('')).toBeNull();
    });

    it('lookupVowel with special character returns null', () => {
        expect(lookupVowel('@')).toBeNull();
    });

    it('lookupVowel with multi-char string returns null', () => {
        expect(lookupVowel('ae')).toBeNull();
    });
});

describe('Edge Cases — resolveKeyAction on empty state', () => {
    it('navigation on empty chars does not throw', () => {
        const state = {selectedIndex: 0, currentChars: [], baseVowel: '', isUppercase: false};
        let threw = false;
        try {
            resolveKeyAction(KeySyms.Right, state);
            resolveKeyAction(KeySyms.Return, state);
        } catch (e) {
            threw = true;
        }
        expect(threw).toBe(false);
    });

    it('End on empty chars returns navigate with index -1 (clamped by consumer)', () => {
        const state = {selectedIndex: 0, currentChars: [], baseVowel: '', isUppercase: false};
        const action = resolveKeyAction(KeySyms.End, state);
        expect(action.type).toBe('navigate');
    });
});

describe('Edge Cases — Lookup then re-lookup', () => {
    it('lookupVowel returns fresh state each time', () => {
        const first = lookupVowel('a');
        const second = lookupVowel('a');
        expect(first.chars).toEqual(second.chars);
        expect(first).not.toBe(second);
    });

    it('lookupVowel for different vowels returns different chars', () => {
        const a = lookupVowel('a');
        const e = lookupVowel('e');
        expect(a.chars).not.toEqual(e.chars);
    });
});

describe('Edge Cases — Rapid Toggle', () => {
    it('rapid case toggling maintains consistency', () => {
        let isUppercase = false;
        let chars = ACCENT_MAP.a;
        for (let i = 0; i < 10; i++) {
            const result = toggleCase('a', isUppercase);
            isUppercase = result.isUppercase;
            chars = result.chars;
        }
        // Even number of toggles = back to original
        expect(isUppercase).toBe(false);
        expect(chars).toEqual(ACCENT_MAP.a);
    });

    it('odd number of toggles results in uppercase', () => {
        let isUppercase = false;
        for (let i = 0; i < 7; i++) {
            isUppercase = toggleCase('a', isUppercase).isUppercase;
        }
        expect(isUppercase).toBe(true);
    });
});

describe('Edge Cases — Boundary Navigation', () => {
    it('End on single-char list goes to 0', () => {
        const state = {selectedIndex: 0, currentChars: ['ẋ'], baseVowel: 'x', isUppercase: false};
        const action = resolveKeyAction(KeySyms.End, state);
        expect(action.index).toBe(0);
    });

    it('repeated Left from start stays at 0', () => {
        const lookup = lookupVowel('i');
        const state = {selectedIndex: 0, currentChars: lookup.chars, baseVowel: 'i', isUppercase: false};
        for (let i = 0; i < 50; i++) {
            const action = resolveKeyAction(KeySyms.Left, state);
            state.selectedIndex = action.index;
        }
        expect(state.selectedIndex).toBe(0);
    });

    it('repeated Right from end stays at last', () => {
        const lookup = lookupVowel('i');
        const state = {selectedIndex: 0, currentChars: lookup.chars, baseVowel: 'i', isUppercase: false};
        for (let i = 0; i < 50; i++) {
            const action = resolveKeyAction(KeySyms.Right, state);
            state.selectedIndex = action.index;
        }
        expect(state.selectedIndex).toBe(ACCENT_MAP.i.length - 1);
    });
});

describe('Edge Cases — isValidSelection Boundaries', () => {
    it('rejects NaN', () => {
        expect(isValidSelection(NaN, ACCENT_MAP.a)).toBe(false);
    });

    it('rejects fractional index', () => {
        expect(isValidSelection(1.5, ACCENT_MAP.a)).toBe(false);
    });

    it('accepts 0 for non-empty array', () => {
        expect(isValidSelection(0, ACCENT_MAP.a)).toBe(true);
    });

    it('rejects any index for empty array', () => {
        expect(isValidSelection(0, [])).toBe(false);
    });
});

describe('Edge Cases — buildActionLabel', () => {
    it('both false returns "selected"', () => {
        expect(buildActionLabel(false, false)).toBe('selected');
    });

    it('copy only returns "copied"', () => {
        expect(buildActionLabel(true, false)).toBe('copied');
    });

    it('type only returns "typed"', () => {
        expect(buildActionLabel(false, true)).toBe('typed');
    });

    it('both true returns "copied and typed"', () => {
        expect(buildActionLabel(true, true)).toBe('copied and typed');
    });
});

describe('Edge Cases — toggleCase with invalid vowel', () => {
    it('toggleCase with unknown vowel returns null', () => {
        expect(toggleCase('z', false)).toBeNull();
    });
});

describe('Edge Cases — ALL_ACCENTS Completeness', () => {
    it('every lowercase vowel in ACCENT_MAP has an uppercase counterpart', () => {
        for (const vowel of Object.keys(ACCENT_MAP)) {
            expect(ALL_ACCENTS[vowel.toUpperCase()]).toBeDefined();
        }
    });

    it('lowercase and uppercase arrays have same length', () => {
        for (const vowel of Object.keys(ACCENT_MAP)) {
            expect(ALL_ACCENTS[vowel].length).toBe(
                ALL_ACCENTS[vowel.toUpperCase()].length
            );
        }
    });
});
