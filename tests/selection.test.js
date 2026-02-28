/**
 * Tests for character selection logic.
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

describe('Selection — Enter Key', () => {
    it('Enter selects the current character', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[0]);
    });

    it('Enter after navigation selects the navigated-to character', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[2]);
    });

    it('KP_Enter also selects', () => {
        const popup = makePopup('e');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_KP_Enter);
        expect(popup._copiedChar).toBe(ACCENT_MAP.e[1]);
    });

    it('popup is dismissed after selection', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Return);
        expect(popup.visible).toBe(false);
    });
});

describe('Selection — Number Keys', () => {
    it('key 1 selects first character (index 0)', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_1);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[0]);
    });

    it('key 5 selects fifth character (index 4)', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_5);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[4]);
    });

    it('key 9 selects ninth character for vowel "a" (has 9 chars)', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_9);
        expect(popup._copiedChar).toBe(ACCENT_MAP.a[8]);
    });

    it('key 8 is ignored for vowel "i" (only 7 chars)', () => {
        const popup = makePopup('i');
        popup.handleKeyPress(CK.KEY_8);
        expect(popup._copiedChar).toBeNull();
        expect(popup.visible).toBe(true);
    });

    it('key 9 is ignored for vowel "e" (only 8 chars)', () => {
        const popup = makePopup('e');
        popup.handleKeyPress(CK.KEY_9);
        expect(popup._copiedChar).toBeNull();
        expect(popup.visible).toBe(true);
    });

    it('popup is dismissed after number key selection', () => {
        const popup = makePopup('o');
        popup.handleKeyPress(CK.KEY_3);
        expect(popup.visible).toBe(false);
    });

    for (const vowel of Object.keys(ACCENT_MAP)) {
        it(`all valid number keys work for vowel "${vowel}"`, () => {
            const chars = ACCENT_MAP[vowel];
            for (let n = 0; n < chars.length && n < 9; n++) {
                const p = makePopup(vowel);
                p.handleKeyPress(CK.KEY_1 + n);
                expect(p._copiedChar).toBe(chars[n]);
            }
        });
    }
});

describe('Selection — _selectChar bounds', () => {
    it('negative index is rejected', () => {
        const popup = makePopup('a');
        popup._selectChar(-1);
        expect(popup._copiedChar).toBeNull();
        expect(popup.visible).toBe(true);
    });

    it('index equal to length is rejected', () => {
        const popup = makePopup('a');
        popup._selectChar(ACCENT_MAP.a.length);
        expect(popup._copiedChar).toBeNull();
        expect(popup.visible).toBe(true);
    });

    it('index beyond length is rejected', () => {
        const popup = makePopup('a');
        popup._selectChar(100);
        expect(popup._copiedChar).toBeNull();
        expect(popup.visible).toBe(true);
    });

    it('first valid index works', () => {
        const popup = makePopup('e');
        popup._selectChar(0);
        expect(popup._copiedChar).toBe(ACCENT_MAP.e[0]);
    });

    it('last valid index works', () => {
        const popup = makePopup('e');
        popup._selectChar(ACCENT_MAP.e.length - 1);
        expect(popup._copiedChar).toBe(ACCENT_MAP.e[ACCENT_MAP.e.length - 1]);
    });
});
