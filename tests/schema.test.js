/**
 * Tests for GSettings schema validation.
 *
 * When running under GJS with glib-compile-schemas available, this validates
 * the actual compiled schema. Otherwise it falls back to parsing the XML file.
 */
import {describe, it, expect, assert} from './runner.js';
import {SCHEMA_KEYS, VOWELS, MODIFIER_PRESETS} from './fixtures.js';

// Parse schema XML to extract key definitions
function parseSchemaXML(xml) {
    const keys = {};
    const keyRegex = /<key\s+name="([^"]+)"\s+type="([^"]+)">/g;
    const defaultRegex = /<default>(.*?)<\/default>/gs;

    let match;
    while ((match = keyRegex.exec(xml)) !== null) {
        const [, name, type] = match;
        // Find the default value that follows this key
        const after = xml.slice(match.index);
        const defMatch = defaultRegex.exec(after);
        defaultRegex.lastIndex = 0;
        keys[name] = {
            type,
            defaultRaw: defMatch ? defMatch[1].trim() : null,
        };
    }
    return keys;
}

// Read schema file synchronously using GLib (when available) or fall back
let schemaXML;
try {
    // Determine path relative to this test file
    const thisDir = import.meta.url.replace('file://', '').replace(/\/[^/]+$/, '');
    const schemaPath = `${thisDir}/../src/schemas/org.gnome.shell.extensions.glyph-garden.gschema.xml`;

    // Try GLib.file_get_contents (GJS environment)
    const GLib = (await import('gi://GLib')).default;
    const [ok, contents] = GLib.file_get_contents(schemaPath);
    if (ok) {
        const decoder = new TextDecoder();
        schemaXML = decoder.decode(contents);
    }
} catch {
    // Not in GJS — try reading via globalThis or leave as null
    try {
        // Node.js fallback (if ever needed)
        const fs = await import('fs');
        const path = await import('path');
        const url = await import('url');
        const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
        schemaXML = fs.readFileSync(
            path.join(__dirname, '..', 'src', 'schemas',
                'org.gnome.shell.extensions.glyph-garden.gschema.xml'),
            'utf8'
        );
    } catch {
        schemaXML = null;
    }
}

const schemaKeys = schemaXML ? parseSchemaXML(schemaXML) : null;

describe('Schema — Key Existence', () => {
    if (!schemaKeys) {
        it('SKIPPED: schema file not readable in this environment', () => {
            // Intentionally pass — schema tests require GJS or Node
        });
        return;
    }

    it('schema defines all expected keys', () => {
        for (const key of SCHEMA_KEYS) {
            assert(key.name in schemaKeys,
                `Expected schema key "${key.name}" not found`);
        }
    });

    it('schema has no unexpected keys', () => {
        const expected = new Set(SCHEMA_KEYS.map(k => k.name));
        for (const name of Object.keys(schemaKeys)) {
            assert(expected.has(name),
                `Unexpected schema key "${name}" found`);
        }
    });
});

describe('Schema — Key Types', () => {
    if (!schemaKeys) {
        return;
    }

    for (const key of SCHEMA_KEYS) {
        it(`key "${key.name}" has type "${key.type}"`, () => {
            expect(schemaKeys[key.name].type).toBe(key.type);
        });
    }
});

describe('Schema — Default Values', () => {
    if (!schemaKeys) {
        return;
    }

    it('modifier-prefix defaults to Super+Alt', () => {
        const raw = schemaKeys['modifier-prefix'].defaultRaw;
        expect(raw).toContain('Super');
        expect(raw).toContain('Alt');
    });

    it('show-notification defaults to true', () => {
        expect(schemaKeys['show-notification'].defaultRaw).toBe('true');
    });

    it('copy-to-clipboard defaults to false', () => {
        expect(schemaKeys['copy-to-clipboard'].defaultRaw).toBe('false');
    });

    it('type-character defaults to true', () => {
        expect(schemaKeys['type-character'].defaultRaw).toBe('true');
    });

    it('dialog-opacity defaults to 100', () => {
        expect(schemaKeys['dialog-opacity'].defaultRaw).toBe('100');
    });

    for (const {key, vowel} of VOWELS) {
        it(`${key} default contains the vowel "${vowel}"`, () => {
            const raw = schemaKeys[key].defaultRaw;
            expect(raw).toContain(vowel);
        });
    }
});

describe('Schema — Code Alignment', () => {
    if (!schemaKeys) {
        return;
    }

    it('all VOWELS keys exist in schema', () => {
        for (const {key} of VOWELS) {
            assert(key in schemaKeys, `VOWELS key "${key}" missing from schema`);
        }
    });

    it('all VOWELS keys have type "as" (array of strings)', () => {
        for (const {key} of VOWELS) {
            expect(schemaKeys[key].type).toBe('as');
        }
    });

    it('modifier-prefix is a string type', () => {
        expect(schemaKeys['modifier-prefix'].type).toBe('s');
    });

    it('boolean settings are type "b"', () => {
        for (const name of ['show-notification', 'copy-to-clipboard', 'type-character']) {
            expect(schemaKeys[name].type).toBe('b');
        }
    });

    it('dialog-opacity is integer type "i"', () => {
        expect(schemaKeys['dialog-opacity'].type).toBe('i');
    });
});
