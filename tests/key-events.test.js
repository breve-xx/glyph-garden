/**
 * Tests for key event dispatch — using real resolveKeyAction from core.js.
 */
import {describe, it, expect} from './runner.js';
import {ACCENT_MAP, KeySyms, resolveKeyAction, lookupVowel, toggleCase} from './fixtures.js';

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
    switch (action.type) {
        case 'navigate': {
            state.selectedIndex = action.index;
            break;
        }
        case 'toggle_case': {
            const result = toggleCase(state.baseVowel, state.isUppercase);
            if (result) {
                state.isUppercase = result.isUppercase;
                state.currentChars = result.chars;
            }
            break;
        }
        default: {
            break;
        }
    }
    return action;
}

describe('Key Events — Action Types', () => {
    it('Escape returns dismiss action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.Escape, state).type).toBe('dismiss');
    });

    it('Left returns navigate action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.Left, state).type).toBe('navigate');
    });

    it('Right returns navigate action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.Right, state).type).toBe('navigate');
    });

    it('Return returns select action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.Return, state).type).toBe('select');
    });

    it('Shift_L returns toggle_case action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.Shift_L, state).type).toBe('toggle_case');
    });

    it('Home returns navigate action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.Home, state).type).toBe('navigate');
    });

    it('End returns navigate action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.End, state).type).toBe('navigate');
    });

    it('Number key 1 returns select action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(KeySyms.KEY_1, state).type).toBe('select');
    });

    it('Unknown key returns none action', () => {
        const state = makeState('a');
        expect(resolveKeyAction(0xffff, state).type).toBe('none');
    });
});

describe('Key Events — Escape', () => {
    it('Escape produces dismiss action', () => {
        const state = makeState('a');
        const action = resolveKeyAction(KeySyms.Escape, state);
        expect(action.type).toBe('dismiss');
    });
});

describe('Key Events — Combined Sequences', () => {
    it('navigate then select', () => {
        const state = makeState('o');
        applyAction(state, KeySyms.Right);
        applyAction(state, KeySyms.Right);
        applyAction(state, KeySyms.Right);
        const action = resolveKeyAction(KeySyms.Return, state);
        expect(action.type).toBe('select');
        expect(state.currentChars[action.charIndex]).toBe(ACCENT_MAP.o[3]);
    });

    it('toggle case then navigate then select', () => {
        const state = makeState('u');
        applyAction(state, KeySyms.Shift_L);
        applyAction(state, KeySyms.End);
        const action = resolveKeyAction(KeySyms.Return, state);
        const lastIdx = ACCENT_MAP.u.length - 1;
        expect(state.currentChars[action.charIndex]).toBe(ACCENT_MAP.u[lastIdx].toUpperCase());
    });

    it('End, Left, Left, Enter selects third-from-last', () => {
        const state = makeState('a');
        const len = ACCENT_MAP.a.length;
        applyAction(state, KeySyms.End);
        applyAction(state, KeySyms.Left);
        applyAction(state, KeySyms.Left);
        const action = resolveKeyAction(KeySyms.Return, state);
        expect(state.currentChars[action.charIndex]).toBe(ACCENT_MAP.a[len - 3]);
    });

    it('vim navigation then number key', () => {
        const state = makeState('e');
        applyAction(state, KeySyms.l);
        applyAction(state, KeySyms.l);
        const action = resolveKeyAction(KeySyms.KEY_1, state);
        expect(action.charIndex).toBe(0);
    });
});
