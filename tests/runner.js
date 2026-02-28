/**
 * Glyph Garden — Minimal Test Framework for GJS
 *
 * Zero-dependency test runner compatible with GJS ES module mode.
 * Provides describe/it/expect/assert with colored terminal output.
 *
 * Usage:
 *   import { describe, it, expect, assert, runAll } from './runner.js';
 *
 *   describe('My Suite', () => {
 *       it('works', () => {
 *           expect(1 + 1).toBe(2);
 *       });
 *   });
 *
 *   // Call runAll() only from the main entry point (run-all.js).
 */

const COLORS = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
};

const suites = [];
let currentSuite = null;

/**
 * Define a test suite.
 */
export function describe(name, fn) {
    const suite = {name, tests: [], passed: 0, failed: 0, errors: []};
    const previous = currentSuite;
    currentSuite = suite;
    try {
        fn();
    } catch (e) {
        suite.errors.push({name: `(suite setup) ${name}`, error: e});
        suite.failed++;
    }
    suites.push(suite);
    currentSuite = previous;
}

/**
 * Define a single test case inside a describe() block.
 */
export function it(name, fn) {
    if (!currentSuite)
        throw new Error('it() must be called inside describe()');

    try {
        fn();
        currentSuite.tests.push({name, passed: true});
        currentSuite.passed++;
    } catch (e) {
        currentSuite.tests.push({name, passed: false, error: e.message});
        currentSuite.failed++;
    }
}

/**
 * Chainable expectation builder.
 */
export function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected)
                throw new Error(`Expected ${fmt(expected)}, got ${fmt(actual)}`);
        },

        toEqual(expected) {
            const a = JSON.stringify(actual);
            const b = JSON.stringify(expected);
            if (a !== b)
                throw new Error(`Expected ${b}, got ${a}`);
        },

        toBeGreaterThan(n) {
            if (!(actual > n))
                throw new Error(`Expected ${fmt(actual)} > ${fmt(n)}`);
        },

        toBeGreaterThanOrEqual(n) {
            if (!(actual >= n))
                throw new Error(`Expected ${fmt(actual)} >= ${fmt(n)}`);
        },

        toBeLessThan(n) {
            if (!(actual < n))
                throw new Error(`Expected ${fmt(actual)} < ${fmt(n)}`);
        },

        toBeLessThanOrEqual(n) {
            if (!(actual <= n))
                throw new Error(`Expected ${fmt(actual)} <= ${fmt(n)}`);
        },

        toBeTruthy() {
            if (!actual)
                throw new Error(`Expected truthy, got ${fmt(actual)}`);
        },

        toBeFalsy() {
            if (actual)
                throw new Error(`Expected falsy, got ${fmt(actual)}`);
        },

        toBeNull() {
            if (actual !== null)
                throw new Error(`Expected null, got ${fmt(actual)}`);
        },

        toBeUndefined() {
            if (actual !== undefined)
                throw new Error(`Expected undefined, got ${fmt(actual)}`);
        },

        toBeDefined() {
            if (actual === undefined)
                throw new Error(`Expected defined, got undefined`);
        },

        toBeInstanceOf(cls) {
            if (!(actual instanceof cls))
                throw new Error(`Expected instance of ${cls.name}`);
        },

        toContain(item) {
            if (Array.isArray(actual)) {
                if (!actual.includes(item))
                    throw new Error(`Expected array to contain ${fmt(item)}`);
            } else if (typeof actual === 'string') {
                if (!actual.includes(item))
                    throw new Error(`Expected string to contain ${fmt(item)}`);
            } else {
                throw new Error(`toContain requires array or string, got ${typeof actual}`);
            }
        },

        toHaveLength(n) {
            if (actual.length !== n)
                throw new Error(`Expected length ${n}, got ${actual.length}`);
        },

        toMatch(pattern) {
            if (!pattern.test(actual))
                throw new Error(`Expected ${fmt(actual)} to match ${pattern}`);
        },

        toThrow(expectedMsg) {
            if (typeof actual !== 'function')
                throw new Error('toThrow requires a function');
            let threw = false;
            let msg = '';
            try {
                actual();
            } catch (e) {
                threw = true;
                msg = e.message;
            }
            if (!threw)
                throw new Error('Expected function to throw');
            if (expectedMsg !== undefined && !msg.includes(expectedMsg))
                throw new Error(`Expected throw message to contain ${fmt(expectedMsg)}, got ${fmt(msg)}`);
        },

        not: {
            toBe(expected) {
                if (actual === expected)
                    throw new Error(`Expected ${fmt(actual)} not to be ${fmt(expected)}`);
            },
            toContain(item) {
                if (Array.isArray(actual) && actual.includes(item))
                    throw new Error(`Expected array not to contain ${fmt(item)}`);
                if (typeof actual === 'string' && actual.includes(item))
                    throw new Error(`Expected string not to contain ${fmt(item)}`);
            },
            toBeNull() {
                if (actual === null)
                    throw new Error('Expected not null');
            },
            toBeUndefined() {
                if (actual === undefined)
                    throw new Error('Expected not undefined');
            },
            toBeTruthy() {
                if (actual)
                    throw new Error(`Expected falsy, got ${fmt(actual)}`);
            },
        },
    };
}

/**
 * Simple assertion with optional message.
 */
export function assert(condition, message) {
    if (!condition)
        throw new Error(message || 'Assertion failed');
}

/**
 * Run all registered suites and print results.
 * Returns the number of failures (0 = all passed).
 */
export function runAll() {
    let totalPassed = 0;
    let totalFailed = 0;

    for (const suite of suites) {
        const icon = suite.failed > 0 ? `${COLORS.red}✗` : `${COLORS.green}✓`;
        print(`\n${COLORS.cyan}${COLORS.bold}SUITE:${COLORS.reset} ${suite.name}  ${icon}${COLORS.reset}`);

        for (const t of suite.tests) {
            if (t.passed) {
                print(`  ${COLORS.green}✓${COLORS.reset} ${COLORS.dim}${t.name}${COLORS.reset}`);
            } else {
                print(`  ${COLORS.red}✗ FAIL:${COLORS.reset} ${t.name}`);
                print(`    ${COLORS.red}${t.error}${COLORS.reset}`);
            }
        }

        for (const e of suite.errors) {
            print(`  ${COLORS.red}✗ ERROR:${COLORS.reset} ${e.name}`);
            print(`    ${COLORS.red}${e.error.message || e.error}${COLORS.reset}`);
        }

        totalPassed += suite.passed;
        totalFailed += suite.failed;
    }

    const total = totalPassed + totalFailed;
    print('');
    print(`${COLORS.bold}Results: ${COLORS.green}${totalPassed} passed${COLORS.reset}, ` +
          `${totalFailed > 0 ? COLORS.red : COLORS.dim}${totalFailed} failed${COLORS.reset}, ` +
          `${COLORS.bold}${total} total${COLORS.reset}`);
    print('');

    return totalFailed;
}

/** @private */
function fmt(v) {
    if (typeof v === 'string') return `"${v}"`;
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    return String(v);
}
