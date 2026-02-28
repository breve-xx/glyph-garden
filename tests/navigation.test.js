/**
 * Tests for popup navigation logic — using real resolveKeyAction from core.js.
 */
import {describe, it, expect} from './runner.js';
import {ACCENT_MAP, KeySyms, resolveKeyAction, lookupVowel} from './fixtures.js';

function makeState(vowel) {
    const lookup = lookupVowel(vowel || 'a');
    return {
        selectedIndex: 0,
        currentChars: lookup.chars,
        baseVowel: lookup.baseVowel,
        isUppercase: lookup.isUppercase,
    };
}

function navigate(state, symbol) {
    const action = resolveKeyAction(symbol, state);
    if (action.type === 'navigate') {
        state.selectedIndex = action.index;
    }
    return action;
}

describe('Navigation — Arrow Keys', () => {
    it('starts at index 0', () => {
        const state = makeState('a');
        expect(state.selectedIndex).toBe(0);
    });

    it('Right arrow increments selection', () => {
        const state = makeState('a');
        navigate(state, KeySyms.Right);
        expect(state.selectedIndex).toBe(1);
    });

    it('Left arrow decrements selection', () => {
        const state = makeState('a');
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Left);
        expect(state.selectedIndex).toBe(1);
    });

    it('Left arrow does not go below 0', () => {
        const state = makeState('a');
        navigate(state, KeySyms.Left);
        expect(state.selectedIndex).toBe(0);
    });

    it('Right arrow does not exceed last index', () => {
        const state = makeState('a');
        const max = ACCENT_MAP.a.length - 1;
        for (let i = 0; i < 20; i++) {
            navigate(state, KeySyms.Right);
        }
        expect(state.selectedIndex).toBe(max);
    });

    it('multiple Right then Left returns to expected position', () => {
        const state = makeState('e');
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Left);
        expect(state.selectedIndex).toBe(2);
    });
});

describe('Navigation — Vim Keys', () => {
    it('"l" moves right', () => {
        const state = makeState('a');
        navigate(state, KeySyms.l);
        expect(state.selectedIndex).toBe(1);
    });

    it('"h" moves left', () => {
        const state = makeState('a');
        navigate(state, KeySyms.l);
        navigate(state, KeySyms.l);
        navigate(state, KeySyms.h);
        expect(state.selectedIndex).toBe(1);
    });

    it('"h" does not go below 0', () => {
        const state = makeState('a');
        navigate(state, KeySyms.h);
        expect(state.selectedIndex).toBe(0);
    });

    it('"l" does not exceed last index', () => {
        const state = makeState('i');
        for (let i = 0; i < 20; i++) {
            navigate(state, KeySyms.l);
        }
        expect(state.selectedIndex).toBe(ACCENT_MAP.i.length - 1);
    });
});

describe('Navigation — Home / End', () => {
    it('Home goes to index 0', () => {
        const state = makeState('a');
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Right);
        navigate(state, KeySyms.Home);
        expect(state.selectedIndex).toBe(0);
    });

    it('End goes to last index', () => {
        const state = makeState('o');
        navigate(state, KeySyms.End);
        expect(state.selectedIndex).toBe(ACCENT_MAP.o.length - 1);
    });

    it('Home then End traverses full range', () => {
        const state = makeState('u');
        navigate(state, KeySyms.End);
        navigate(state, KeySyms.Home);
        expect(state.selectedIndex).toBe(0);
        navigate(state, KeySyms.End);
        expect(state.selectedIndex).toBe(ACCENT_MAP.u.length - 1);
    });
});

describe('Navigation — Across All Vowels', () => {
    for (const vowel of Object.keys(ACCENT_MAP)) {
        it(`bounds are correct for vowel "${vowel}"`, () => {
            const state = makeState(vowel);
            const max = ACCENT_MAP[vowel].length - 1;

            navigate(state, KeySyms.End);
            expect(state.selectedIndex).toBe(max);

            navigate(state, KeySyms.Right);
            expect(state.selectedIndex).toBe(max);

            navigate(state, KeySyms.Home);
            expect(state.selectedIndex).toBe(0);

            navigate(state, KeySyms.Left);
            expect(state.selectedIndex).toBe(0);
        });
    }
});
