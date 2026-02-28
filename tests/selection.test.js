/**
 * Tests for character selection logic — using real core functions.
 */
import {describe, it, expect} from './runner.js';
import {
    ACCENT_MAP, KeySyms, resolveKeyAction, lookupVowel, isValidSelection,
} from './fixtures.js';

function makeState(vowel) {
    const lookup = lookupVowel(vowel || 'a');
    return {
        selectedIndex: 0,
        currentChars: lookup.chars,
        baseVowel: lookup.baseVowel,
        isUppercase: lookup.isUppercase,
    };
}

function applyAction(state, symbol) {
    const action = resolveKeyAction(symbol, state);
    if (action.type === 'navigate') {
        state.selectedIndex = action.index;
    }
    return action;
}

describe('Selection — Enter Key', () => {
    it('Enter selects the current character', () => {
        const state = makeState('a');
        const action = resolveKeyAction(KeySyms.Return, state);
        expect(action.type).toBe('select');
        expect(action.charIndex).toBe(0);
        expect(state.currentChars[action.charIndex]).toBe(ACCENT_MAP.a[0]);
    });

    it('Enter after navigation selects the navigated-to character', () => {
        const state = makeState('a');
        applyAction(state, KeySyms.Right);
        applyAction(state, KeySyms.Right);
        const action = resolveKeyAction(KeySyms.Return, state);
        expect(action.type).toBe('select');
        expect(state.currentChars[action.charIndex]).toBe(ACCENT_MAP.a[2]);
    });

    it('KP_Enter also selects', () => {
        const state = makeState('e');
        applyAction(state, KeySyms.Right);
        const action = resolveKeyAction(KeySyms.KP_Enter, state);
        expect(action.type).toBe('select');
        expect(state.currentChars[action.charIndex]).toBe(ACCENT_MAP.e[1]);
    });

    it('selection action returns correct charIndex', () => {
        const state = makeState('a');
        const action = resolveKeyAction(KeySyms.Return, state);
        expect(action.type).toBe('select');
        expect(action.charIndex).toBe(state.selectedIndex);
    });
});

describe('Selection — Number Keys', () => {
    it('key 1 selects first character (index 0)', () => {
        const state = makeState('a');
        const action = resolveKeyAction(KeySyms.KEY_1, state);
        expect(action.type).toBe('select');
        expect(action.charIndex).toBe(0);
    });

    it('key 5 selects fifth character (index 4)', () => {
        const state = makeState('a');
        const action = resolveKeyAction(KeySyms.KEY_5, state);
        expect(action.type).toBe('select');
        expect(action.charIndex).toBe(4);
    });

    it('key 9 selects ninth character for vowel "a" (has 9 chars)', () => {
        const state = makeState('a');
        const action = resolveKeyAction(KeySyms.KEY_9, state);
        expect(action.type).toBe('select');
        expect(action.charIndex).toBe(8);
    });

    it('key 8 is ignored for vowel "i" (only 7 chars)', () => {
        const state = makeState('i');
        const action = resolveKeyAction(KeySyms.KEY_8, state);
        expect(action.type).toBe('none');
    });

    it('key 9 is ignored for vowel "e" (only 8 chars)', () => {
        const state = makeState('e');
        const action = resolveKeyAction(KeySyms.KEY_9, state);
        expect(action.type).toBe('none');
    });

    it('number key selection is independent of navigation', () => {
        const state = makeState('o');
        applyAction(state, KeySyms.Right);
        applyAction(state, KeySyms.Right);
        const action = resolveKeyAction(KeySyms.KEY_1, state);
        expect(action.charIndex).toBe(0);
    });

    for (const vowel of Object.keys(ACCENT_MAP)) {
        it(`all valid number keys work for vowel "${vowel}"`, () => {
            const chars = ACCENT_MAP[vowel];
            for (let n = 0; n < chars.length && n < 9; n++) {
                const state = makeState(vowel);
                const action = resolveKeyAction(KeySyms.KEY_1 + n, state);
                expect(action.type).toBe('select');
                expect(action.charIndex).toBe(n);
            }
        });
    }
});

describe('Selection — isValidSelection', () => {
    it('negative index is rejected', () => {
        expect(isValidSelection(-1, ACCENT_MAP.a)).toBe(false);
    });

    it('index equal to length is rejected', () => {
        expect(isValidSelection(ACCENT_MAP.a.length, ACCENT_MAP.a)).toBe(false);
    });

    it('index beyond length is rejected', () => {
        expect(isValidSelection(100, ACCENT_MAP.a)).toBe(false);
    });

    it('first valid index works', () => {
        expect(isValidSelection(0, ACCENT_MAP.e)).toBe(true);
    });

    it('last valid index works', () => {
        expect(isValidSelection(ACCENT_MAP.e.length - 1, ACCENT_MAP.e)).toBe(true);
    });
});
