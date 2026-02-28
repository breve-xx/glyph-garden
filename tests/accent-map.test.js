/**
 * Tests for ACCENT_MAP data integrity.
 */
import {describe, it, expect} from './runner.js';
import {ACCENT_MAP, UPPERCASE_MAP, ALL_ACCENTS, EXPECTED_COUNTS} from './fixtures.js';

describe('ACCENT_MAP', () => {
    it('contains exactly five lowercase vowels', () => {
        const keys = Object.keys(ACCENT_MAP).sort();
        expect(keys).toEqual(['a', 'e', 'i', 'o', 'u']);
    });

    it('vowel "a" has 9 accented characters', () => {
        expect(ACCENT_MAP.a).toHaveLength(EXPECTED_COUNTS.a);
    });

    it('vowel "e" has 8 accented characters', () => {
        expect(ACCENT_MAP.e).toHaveLength(EXPECTED_COUNTS.e);
    });

    it('vowel "i" has 7 accented characters', () => {
        expect(ACCENT_MAP.i).toHaveLength(EXPECTED_COUNTS.i);
    });

    it('vowel "o" has 8 accented characters', () => {
        expect(ACCENT_MAP.o).toHaveLength(EXPECTED_COUNTS.o);
    });

    it('vowel "u" has 8 accented characters', () => {
        expect(ACCENT_MAP.u).toHaveLength(EXPECTED_COUNTS.u);
    });

    it('all characters are lowercase strings', () => {
        for (const [vowel, chars] of Object.entries(ACCENT_MAP)) {
            for (const c of chars) {
                expect(c).toBe(c.toLowerCase());
                expect(typeof c).toBe('string');
                expect(c.length).toBe(1);
            }
        }
    });

    it('contains no duplicate characters within a vowel', () => {
        for (const [vowel, chars] of Object.entries(ACCENT_MAP)) {
            const unique = new Set(chars);
            expect(unique.size).toBe(chars.length);
        }
    });

    it('contains no duplicate characters across vowels', () => {
        const all = Object.values(ACCENT_MAP).flat();
        const unique = new Set(all);
        expect(unique.size).toBe(all.length);
    });

    it('all characters are valid Unicode (non-ASCII)', () => {
        for (const chars of Object.values(ACCENT_MAP)) {
            for (const c of chars) {
                expect(c.charCodeAt(0)).toBeGreaterThan(127);
            }
        }
    });

    it('total character count is 40', () => {
        const total = Object.values(ACCENT_MAP).flat().length;
        expect(total).toBe(40);
    });
});

describe('UPPERCASE_MAP', () => {
    it('contains exactly five uppercase vowels', () => {
        const keys = Object.keys(UPPERCASE_MAP).sort();
        expect(keys).toEqual(['A', 'E', 'I', 'O', 'U']);
    });

    it('each vowel has the same count as its lowercase counterpart', () => {
        for (const [vowel, chars] of Object.entries(ACCENT_MAP)) {
            expect(UPPERCASE_MAP[vowel.toUpperCase()]).toHaveLength(chars.length);
        }
    });

    it('all characters are uppercase versions of ACCENT_MAP chars', () => {
        for (const [vowel, chars] of Object.entries(ACCENT_MAP)) {
            const upper = UPPERCASE_MAP[vowel.toUpperCase()];
            for (let i = 0; i < chars.length; i++) {
                expect(upper[i]).toBe(chars[i].toUpperCase());
            }
        }
    });

    it('all characters are uppercase strings', () => {
        for (const chars of Object.values(UPPERCASE_MAP)) {
            for (const c of chars) {
                expect(c).toBe(c.toUpperCase());
            }
        }
    });
});

describe('ALL_ACCENTS', () => {
    it('contains 10 keys (5 lowercase + 5 uppercase)', () => {
        expect(Object.keys(ALL_ACCENTS)).toHaveLength(10);
    });

    it('includes all lowercase vowels', () => {
        for (const v of ['a', 'e', 'i', 'o', 'u']) {
            expect(ALL_ACCENTS[v]).toBeDefined();
        }
    });

    it('includes all uppercase vowels', () => {
        for (const v of ['A', 'E', 'I', 'O', 'U']) {
            expect(ALL_ACCENTS[v]).toBeDefined();
        }
    });

    it('total character count is 80 (40 lower + 40 upper)', () => {
        const total = Object.values(ALL_ACCENTS).flat().length;
        expect(total).toBe(80);
    });
});
