/**
 * Tests for keyboard event handling dispatch.
 */
import {describe, it, expect} from './runner.js';
import {ClutterKeys, MockPopup} from './mocks.js';
import {ACCENT_MAP, UPPERCASE_MAP} from './fixtures.js';

const CK = ClutterKeys;

function makePopup(vowel) {
    const popup = new MockPopup(ACCENT_MAP, UPPERCASE_MAP);
    popup.showForVowel(vowel || 'a');
    return popup;
}

describe('Key Events — Return Values', () => {
    it('Escape returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_Escape)).toBe(CK.EVENT_STOP);
    });

    it('Left returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_Left)).toBe(CK.EVENT_STOP);
    });

    it('Right returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_Right)).toBe(CK.EVENT_STOP);
    });

    it('Return returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_Return)).toBe(CK.EVENT_STOP);
    });

    it('Shift_L returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_Shift_L)).toBe(CK.EVENT_STOP);
    });

    it('Home returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_Home)).toBe(CK.EVENT_STOP);
    });

    it('End returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_End)).toBe(CK.EVENT_STOP);
    });

    it('Number key 1 returns EVENT_STOP', () => {
        const popup = makePopup('a');
        expect(popup.handleKeyPress(CK.KEY_1)).toBe(CK.EVENT_STOP);
    });

    it('Unknown key returns EVENT_STOP (keys are consumed)', () => {
        const popup = makePopup('a');
        const result = popup.handleKeyPress(0xffff);
        expect(result).toBe(CK.EVENT_STOP);
    });
});

describe('Key Events — Escape', () => {
    it('Escape dismisses the popup', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Escape);
        expect(popup.visible).toBe(false);
    });

    it('Escape resets state', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Escape);
        expect(popup._selectedIndex).toBe(0);
        expect(popup._currentChars).toEqual([]);
        expect(popup._baseVowel).toBe('');
    });
});

describe('Key Events — Combined Sequences', () => {
    it('navigate then select', () => {
        const popup = makePopup('o');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup._copiedChar).toBe(ACCENT_MAP.o[3]);
        expect(popup.visible).toBe(false);
    });

    it('toggle case then navigate then select', () => {
        const popup = makePopup('u');
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_End);
        popup.handleKeyPress(CK.KEY_Return);
        const lastIdx = ACCENT_MAP.u.length - 1;
        expect(popup._copiedChar).toBe(ACCENT_MAP.u[lastIdx].toUpperCase());
    });

    it('End, Left, Left, Enter selects third-from-last', () => {
        const popup = makePopup('a');
        const len = ACCENT_MAP.a.length;
        popup.handleKeyPress(CK.KEY_End);
        popup.handleKeyPress(CK.KEY_Left);
        popup.handleKeyPress(CK.KEY_Left);
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[len - 3]);
    });

    it('vim navigation then number key', () => {
        const popup = makePopup('e');
        popup.handleKeyPress(CK.KEY_l);
        popup.handleKeyPress(CK.KEY_l);
        // Number key selection is independent of navigation position
        popup.handleKeyPress(CK.KEY_1);
        expect(popup._copiedChar).toBe(ACCENT_MAP.e[0]);
    });
});
