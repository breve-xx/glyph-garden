/**
 * Tests for edge cases and boundary conditions.
 */
import {describe, it, expect} from './runner.js';
import {ClutterKeys, MockPopup} from './mocks.js';
import {ACCENT_MAP, UPPERCASE_MAP, ALL_ACCENTS} from './fixtures.js';

const CK = ClutterKeys;

function makePopup(vowel) {
    const popup = new MockPopup(ACCENT_MAP, UPPERCASE_MAP);
    if (vowel) popup.showForVowel(vowel);
    return popup;
}

describe('Edge Cases — Invalid Vowels', () => {
    it('showForVowel with non-vowel letter does nothing', () => {
        const popup = makePopup();
        popup.showForVowel('b');
        expect(popup.visible).toBe(false);
        expect(popup._currentChars).toEqual([]);
    });

    it('showForVowel with number does nothing', () => {
        const popup = makePopup();
        popup.showForVowel('1');
        expect(popup.visible).toBe(false);
    });

    it('showForVowel with empty string does nothing', () => {
        const popup = makePopup();
        popup.showForVowel('');
        expect(popup.visible).toBe(false);
    });

    it('showForVowel with special character does nothing', () => {
        const popup = makePopup();
        popup.showForVowel('@');
        expect(popup.visible).toBe(false);
    });

    it('showForVowel with multi-char string does nothing', () => {
        const popup = makePopup();
        popup.showForVowel('ae');
        expect(popup.visible).toBe(false);
    });
});

describe('Edge Cases — Double Dismiss', () => {
    it('dismissing twice does not throw', () => {
        const popup = makePopup('a');
        popup.dismiss();
        let threw = false;
        try { popup.dismiss(); } catch (e) { threw = true; }
        expect(threw).toBe(false);
    });

    it('state is clean after double dismiss', () => {
        const popup = makePopup('a');
        popup.dismiss();
        popup.dismiss();
        expect(popup.visible).toBe(false);
        expect(popup._selectedIndex).toBe(0);
        expect(popup._currentChars).toEqual([]);
        expect(popup._baseVowel).toBe('');
        expect(popup._isUppercase).toBe(false);
    });
});

describe('Edge Cases — Re-open After Dismiss', () => {
    it('can reopen with same vowel after dismiss', () => {
        const popup = makePopup('a');
        popup.dismiss();
        popup.showForVowel('a');
        expect(popup.visible).toBe(true);
        expect(popup._currentChars).toEqual(ACCENT_MAP.a);
    });

    it('can reopen with different vowel after dismiss', () => {
        const popup = makePopup('a');
        popup.dismiss();
        popup.showForVowel('e');
        expect(popup.visible).toBe(true);
        expect(popup._currentChars).toEqual(ACCENT_MAP.e);
    });

    it('reopen resets selected index', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.dismiss();
        popup.showForVowel('a');
        expect(popup._selectedIndex).toBe(0);
    });
});

describe('Edge Cases — Selection After Dismiss', () => {
    it('key events on dismissed popup are handled gracefully', () => {
        const popup = makePopup('a');
        popup.dismiss();
        // _currentChars is empty, so navigation should still work (clamped)
        let threw = false;
        try {
            popup.handleKeyPress(CK.KEY_Right);
            popup.handleKeyPress(CK.KEY_Return);
        } catch (e) { threw = true; }
        expect(threw).toBe(false);
    });
});

describe('Edge Cases — Rapid Toggle', () => {
    it('rapid case toggling maintains consistency', () => {
        const popup = makePopup('a');
        for (let i = 0; i < 10; i++)
            popup.handleKeyPress(CK.KEY_Shift_L);
        // Even number of toggles = back to original
        expect(popup._isUppercase).toBe(false);
        expect(popup._currentChars).toEqual(ACCENT_MAP.a);
    });

    it('odd number of toggles results in uppercase', () => {
        const popup = makePopup('a');
        for (let i = 0; i < 7; i++)
            popup.handleKeyPress(CK.KEY_Shift_L);
        expect(popup._isUppercase).toBe(true);
    });
});

describe('Edge Cases — Boundary Navigation', () => {
    it('End on single-char vowel (hypothetical) goes to 0', () => {
        // Simulate a vowel with 1 character
        const popup = new MockPopup({x: ['ẋ']}, {X: ['Ẋ']});
        popup.showForVowel('x');
        popup.handleKeyPress(CK.KEY_End);
        expect(popup._selectedIndex).toBe(0);
    });

    it('repeated Left from start stays at 0', () => {
        const popup = makePopup('i');
        for (let i = 0; i < 50; i++)
            popup.handleKeyPress(CK.KEY_Left);
        expect(popup._selectedIndex).toBe(0);
    });

    it('repeated Right from end stays at last', () => {
        const popup = makePopup('i');
        for (let i = 0; i < 50; i++)
            popup.handleKeyPress(CK.KEY_Right);
        expect(popup._selectedIndex).toBe(ACCENT_MAP.i.length - 1);
    });
});

describe('Edge Cases — showForVowel Replaces Current', () => {
    it('calling showForVowel while visible replaces content', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.showForVowel('e');
        expect(popup._currentChars).toEqual(ACCENT_MAP.e);
        expect(popup._selectedIndex).toBe(0);
        expect(popup._baseVowel).toBe('e');
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
