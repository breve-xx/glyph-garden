/**
 * Tests for popup navigation logic.
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

describe('Navigation — Arrow Keys', () => {
    it('starts at index 0', () => {
        const popup = makePopup('a');
        expect(popup._selectedIndex).toBe(0);
    });

    it('Right arrow increments selection', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        expect(popup._selectedIndex).toBe(1);
    });

    it('Left arrow decrements selection', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Left);
        expect(popup._selectedIndex).toBe(1);
    });

    it('Left arrow does not go below 0', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Left);
        expect(popup._selectedIndex).toBe(0);
    });

    it('Right arrow does not exceed last index', () => {
        const popup = makePopup('a');
        const max = ACCENT_MAP.a.length - 1;
        for (let i = 0; i < 20; i++) {
            popup.handleKeyPress(CK.KEY_Right);
        }
        expect(popup._selectedIndex).toBe(max);
    });

    it('multiple Right then Left returns to expected position', () => {
        const popup = makePopup('e');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Left);
        expect(popup._selectedIndex).toBe(2);
    });
});

describe('Navigation — Vim Keys', () => {
    it('"l" moves right', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_l);
        expect(popup._selectedIndex).toBe(1);
    });

    it('"h" moves left', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_l);
        popup.handleKeyPress(CK.KEY_l);
        popup.handleKeyPress(CK.KEY_h);
        expect(popup._selectedIndex).toBe(1);
    });

    it('"h" does not go below 0', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_h);
        expect(popup._selectedIndex).toBe(0);
    });

    it('"l" does not exceed last index', () => {
        const popup = makePopup('i'); // 7 chars
        for (let i = 0; i < 20; i++) {
            popup.handleKeyPress(CK.KEY_l);
        }
        expect(popup._selectedIndex).toBe(ACCENT_MAP.i.length - 1);
    });
});

describe('Navigation — Home / End', () => {
    it('Home goes to index 0', () => {
        const popup = makePopup('a');
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Right);
        popup.handleKeyPress(CK.KEY_Home);
        expect(popup._selectedIndex).toBe(0);
    });

    it('End goes to last index', () => {
        const popup = makePopup('o');
        popup.handleKeyPress(CK.KEY_End);
        expect(popup._selectedIndex).toBe(ACCENT_MAP.o.length - 1);
    });

    it('Home then End traverses full range', () => {
        const popup = makePopup('u');
        popup.handleKeyPress(CK.KEY_End);
        popup.handleKeyPress(CK.KEY_Home);
        expect(popup._selectedIndex).toBe(0);
        popup.handleKeyPress(CK.KEY_End);
        expect(popup._selectedIndex).toBe(ACCENT_MAP.u.length - 1);
    });
});

describe('Navigation — Across All Vowels', () => {
    for (const vowel of Object.keys(ACCENT_MAP)) {
        it(`bounds are correct for vowel "${vowel}"`, () => {
            const popup = makePopup(vowel);
            const max = ACCENT_MAP[vowel].length - 1;

            // Go to end
            popup.handleKeyPress(CK.KEY_End);
            expect(popup._selectedIndex).toBe(max);

            // Try to exceed
            popup.handleKeyPress(CK.KEY_Right);
            expect(popup._selectedIndex).toBe(max);

            // Go to start
            popup.handleKeyPress(CK.KEY_Home);
            expect(popup._selectedIndex).toBe(0);

            // Try to go below
            popup.handleKeyPress(CK.KEY_Left);
            expect(popup._selectedIndex).toBe(0);
        });
    }
});
