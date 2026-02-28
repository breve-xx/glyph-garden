# Testing

This document covers the Glyph Garden test suite — how it works, how to run it,
and how to extend it.

## Overview

The test suite verifies all core functionality of the Glyph Garden GNOME Shell
extension:

| Area | What's Tested |
|------|---------------|
| Accent maps | Data integrity, character counts, Unicode validity, no duplicates |
| Navigation | Arrow keys, vim keys (h/l), Home/End, bounds clamping |
| Selection | Enter key, number keys 1–9, out-of-range rejection |
| Case toggling | Shift toggles lower↔upper, character updates, state tracking |
| Key events | Escape dismiss, return values (EVENT_STOP), combined sequences |
| Extension lifecycle | Enable/disable setup/teardown, keybinding registration, re-enable |
| Preferences | VOWELS array, MODIFIER_PRESETS, `isModifierKey()` function |
| Schema validation | Key existence, types, defaults, code–schema alignment |
| Edge cases | Invalid vowels, double dismiss, re-open, rapid toggling, boundary nav |

## Testing Framework

### Why GJS?

The test suite uses **GJS** (GNOME JavaScript) with a zero-dependency custom test
runner rather than Node.js/Jest/Jasmine because:

1. **Same runtime** — GJS is the runtime that powers GNOME Shell extensions.
   Testing in GJS means the test environment matches production exactly.
2. **GI access** — GJS can import GLib, Gio, and GObject natively, enabling
   real schema validation against the compiled GSettings schema.
3. **Zero dependencies** — No `npm install`, no `node_modules`. The test runner
   is 100% self-contained JavaScript.
4. **Container-ready** — The existing `Containerfile` already includes GJS.
   Tests run in the same container used for lint and build.

### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **GJS (chosen)** | Same runtime as extension, GI access, zero deps | Requires Linux/container for macOS devs |
| Node.js + Jest | Runs on macOS, rich ecosystem | Can't import GI modules, needs mocking layer, adds npm deps |
| GLib.Test | Native C testing, integrates with GNOME CI | C-oriented API, awkward from JavaScript |
| Jasmine for GJS | Familiar API | Requires additional setup, less maintained for GJS |

### Test Runner API

The custom runner in `tests/runner.js` provides:

```javascript
import { describe, it, expect, assert, runAll } from './runner.js';

describe('My Suite', () => {
    it('does something', () => {
        expect(1 + 1).toBe(2);
        expect([1, 2, 3]).toContain(2);
        expect('hello').toMatch(/^h/);
        assert(true, 'this must be true');
    });
});
```

**Available matchers:**

| Matcher | Example |
|---------|---------|
| `toBe(value)` | Strict equality (`===`) |
| `toEqual(value)` | Deep equality (JSON comparison) |
| `toBeGreaterThan(n)` | `actual > n` |
| `toBeLessThan(n)` | `actual < n` |
| `toBeTruthy()` / `toBeFalsy()` | Truthiness checks |
| `toBeNull()` / `toBeUndefined()` / `toBeDefined()` | Type checks |
| `toContain(item)` | Array/string inclusion |
| `toHaveLength(n)` | Length check |
| `toMatch(regex)` | Regex matching |
| `toThrow(msg?)` | Exception checking (pass a function) |
| `not.toBe(value)` | Negated strict equality |
| `not.toContain(item)` | Negated inclusion |

## Prerequisites

- **GJS** (comes with GNOME Shell; included in the dev container)
- **glib-compile-schemas** (for schema compilation; also in the container)
- No additional packages to install

If you're on macOS, use the Docker/Podman container (see below).

## Running Tests

### On Linux (GJS available)

```bash
# Run the full test suite
make test

# Or directly:
gjs -m tests/run-all.js
```

### Via Docker/Podman (macOS or CI)

```bash
# Build the dev container (includes tests)
docker build -t glyph-garden-dev -f Containerfile .

# Run the test suite
docker run --rm glyph-garden-dev make test
```

### Running a Single Test File

```bash
# Run only the accent map tests
gjs -m tests/accent-map.test.js

# In a container:
docker run --rm glyph-garden-dev gjs -m tests/accent-map.test.js
```

> **Note:** Single-file runs require a small modification — add
> `import { runAll } from './runner.js'; runAll();` and
> `import system from 'system'; system.exit(...)` at the bottom of the file,
> or create a one-off runner script.

### Understanding Output

```
SUITE: ACCENT_MAP
  ✓ contains exactly five lowercase vowels
  ✓ vowel "a" has 9 accented characters
  ✗ FAIL: some test
    Expected 8, got 7

Results: 89 passed, 1 failed, 90 total
```

- **✓** — Test passed
- **✗ FAIL** — Test failed (reason printed below)
- Exit code **0** = all passed, **1** = failures

## Project Structure

```
tests/
├── runner.js                   # Test framework (describe/it/expect)
├── mocks.js                    # Mock Clutter/St/GNOME Shell APIs
├── fixtures.js                 # Replicated data from source (ACCENT_MAP, etc.)
├── run-all.js                  # Entry point — imports all tests, calls runAll()
├── accent-map.test.js          # ACCENT_MAP / UPPERCASE_MAP / ALL_ACCENTS
├── navigation.test.js          # Arrow keys, vim keys, Home/End
├── selection.test.js           # Enter, number keys, _selectChar bounds
├── case-toggle.test.js         # Shift toggling, character updates
├── key-events.test.js          # Event dispatch, return values, sequences
├── extension-lifecycle.test.js # Enable/disable, keybinding management
├── preferences.test.js         # VOWELS, MODIFIER_PRESETS, isModifierKey
├── schema.test.js              # GSettings schema validation
└── edge-cases.test.js          # Invalid inputs, double dismiss, re-open
```

## Writing Tests

### Naming Convention

- Test files: `<topic>.test.js`
- Suites: `describe('Topic — Subtopic', () => { ... })`
- Tests: `it('does something specific', () => { ... })`

### Adding a New Test File

1. Create `tests/my-feature.test.js`:

```javascript
import { describe, it, expect } from './runner.js';

describe('My Feature', () => {
    it('works correctly', () => {
        expect(myFunction()).toBe(expected);
    });
});
```

2. Register it in `tests/run-all.js`:

```javascript
import './my-feature.test.js';   // ← add this line
```

3. Run `make test` to verify.

### Testing Pure Logic

Extract the logic you want to test and replicate it in `fixtures.js` or
directly in your test file. Since GNOME Shell APIs (St, Clutter, Meta, Shell)
aren't available outside the Shell process, we test the behavioral algorithms
with mock objects from `mocks.js`.

```javascript
// ✅ Test the algorithm, not the UI binding
import { MockPopup } from './mocks.js';
import { ACCENT_MAP, UPPERCASE_MAP } from './fixtures.js';

const popup = new MockPopup(ACCENT_MAP, UPPERCASE_MAP);
popup.showForVowel('a');
popup.handleKeyPress(CK.KEY_Right);
expect(popup._selectedIndex).toBe(1);
```

### Adding Mock Objects

If you need to test new GNOME Shell interactions, add mock factories to
`tests/mocks.js`. The mock should replicate the behavioral contract of the
real API without depending on GI imports that require the Shell process.

### Best Practices

- **Test one behavior per `it()` block** — makes failures easy to diagnose
- **Keep tests independent** — create a fresh mock/popup in each test
- **Use descriptive names** — `it('Left arrow does not go below 0')` not
  `it('test 3')`
- **Test boundaries** — first, last, zero, negative, out-of-range
- **Keep fixtures in sync** — when changing data in `extension.js` or
  `prefs.js`, update `tests/fixtures.js` accordingly. The schema test will
  catch schema-code drift automatically.

## Integration with CI

The test suite can be integrated into a GitHub Actions workflow:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: fedora:42
    steps:
      - uses: actions/checkout@v4
      - run: dnf install -y gnome-shell gjs glib2-devel make
      - run: make test
```

Or using the existing Containerfile:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t glyph-garden-dev -f Containerfile .
      - run: docker run --rm glyph-garden-dev make test
```
