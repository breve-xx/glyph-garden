/**
 * Tests for case toggling logic.
 */
import {describe, it, expect} from './runner.js';
import {ClutterKeys, MockPopup} from './mocks.js';
import {ACCENT_MAP, UPPERCASE_MAP} from './fixtures.js';

const CK = ClutterKeys;

function makePopup(vowel) {
    const popup = new MockPopup(ACCENT_MAP, UPPERCASE_MAP);
    popup.showForVowel(vowel);
    return popup;
}

describe('Case Toggle — Basic', () => {
    it('starts lowercase when opened with lowercase vowel', () => {
        const popup = makePopup('a');
        expect(popup._isUppercase).toBe(false);
    });

    it('starts uppercase when opened with uppercase vowel', () => {
        const popup = makePopup('A');
        expect(popup._isUppercase).toBe(true);
    });

    it('Shift_L toggles from lowercase to uppercase', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Shift_L);
        expect(popup._isUppercase).toBe(true);
    });

    it('Shift_R toggles from lowercase to uppercase', () => {
        const popup = makePopup('e');
        popup.handleKeyPress(CK.KEY_Shift_R);
        expect(popup._isUppercase).toBe(true);
    });

    it('double Shift toggles back to lowercase', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_Shift_L);
        expect(popup._isUppercase).toBe(false);
    });

    it('toggle does not change selected index', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        const idx = popup._selectedIndex;
        popup.handleKeyPress(CK.KEY_Shift_L);
        expect(popup._selectedIndex).toBe(idx);
    });
});

describe('Case Toggle — Character Updates', () => {
    for (const vowel of Object.keys(ACCENT_MAP)) {
        it(`characters update to uppercase for vowel "${vowel}"`, () => {
            const popup = makePopup(vowel);
            popup.handleKeyPress(CK.KEY_Shift_L);
            const expected = ACCENT_MAP[vowel].map(c => c.toUpperCase());
            expect(popup._currentChars).toEqual(expected);
        });

        it(`characters revert to lowercase for vowel "${vowel}"`, () => {
            const popup = makePopup(vowel);
            popup.handleKeyPress(CK.KEY_Shift_L);
            popup.handleKeyPress(CK.KEY_Shift_L);
            expect(popup._currentChars).toEqual(ACCENT_MAP[vowel]);
        });
    }
});

describe('Case Toggle — Selection After Toggle', () => {
    it('selecting after toggle yields uppercase character', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[0].toUpperCase());
    });

    it('selecting after double toggle yields lowercase character', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[0]);
    });

    it('number key selection works after case toggle', () => {
        const popup = makePopup('e');
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_3);
        expect(popup._copiedChar).toBe(ACCENT_MAP.e[2].toUpperCase());
    });
});

describe('Case Toggle — Opened Uppercase', () => {
    it('toggle from uppercase to lowercase', () => {
        const popup = makePopup('A');
        expect(popup._isUppercase).toBe(true);
        popup.handleKeyPress(CK.KEY_Shift_L);
        expect(popup._isUppercase).toBe(false);
        expect(popup._currentChars).toEqual(ACCENT_MAP.a);
    });

    it('toggle back to uppercase', () => {
        const popup = makePopup('A');
        popup.handleKeyPress(CK.KEY_Shift_L);
        popup.handleKeyPress(CK.KEY_Shift_L);
        expect(popup._isUppercase).toBe(true);
        expect(popup._currentChars).toEqual(UPPERCASE_MAP.A);
    });
});
