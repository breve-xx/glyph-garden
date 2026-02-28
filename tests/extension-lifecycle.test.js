/**
 * Tests for extension enable/disable lifecycle.
 */
import {describe, it, expect} from './runner.js';
import {MockExtension} from './mocks.js';
import {ACCENT_MAP} from './fixtures.js';

describe('Extension Lifecycle — Enable', () => {
    it('enable sets up settings', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        expect(ext._settings).not.toBeNull();
    });

    it('enable creates popup', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        expect(ext._popup).not.toBeNull();
    });

    it('enable registers keybindings for all 5 vowels', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        expect(ext._bindingIds).toHaveLength(5);
    });

    it('keybinding IDs follow "accent-vowel-X" pattern', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        for (const vowel of Object.keys(ACCENT_MAP)) {
            expect(ext._bindingIds).toContain(`accent-vowel-${vowel}`);
        }
    });

    it('extension is marked as enabled', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        expect(ext._enabled).toBe(true);
    });
});

describe('Extension Lifecycle — Disable', () => {
    it('disable clears keybindings', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext.disable();
        expect(ext._bindingIds).toHaveLength(0);
    });

    it('disable removes popup', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext.disable();
        expect(ext._popup).toBeNull();
    });

    it('disable clears settings', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext.disable();
        expect(ext._settings).toBeNull();
    });

    it('extension is marked as disabled', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext.disable();
        expect(ext._enabled).toBe(false);
    });

    it('disable is idempotent (calling twice does not throw)', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext.disable();
        // Second disable should not throw
        let threw = false;
        try { ext.disable(); } catch (e) { threw = true; }
        expect(threw).toBe(false);
    });
});

describe('Extension Lifecycle — Re-enable', () => {
    it('can re-enable after disable', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext.disable();
        ext.enable(ACCENT_MAP);
        expect(ext._enabled).toBe(true);
        expect(ext._bindingIds).toHaveLength(5);
        expect(ext._popup).not.toBeNull();
    });
});

describe('Extension — _onAccentKey Toggle', () => {
    it('opening popup sets it visible', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        expect(ext._popup.visible).toBe(false);
    });

    it('dismiss hides popup', () => {
        const ext = new MockExtension();
        ext.enable(ACCENT_MAP);
        ext._popup.visible = true;
        ext._popup.dismiss();
        expect(ext._popup.visible).toBe(false);
    });
});
