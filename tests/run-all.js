/**
 * Glyph Garden — Test Suite Entry Point
 *
 * Run with:  gjs -m tests/run-all.js
 */
import system from 'system';

import './accent-map.test.js';
import './navigation.test.js';
import './selection.test.js';
import './case-toggle.test.js';
import './key-events.test.js';
import './extension-lifecycle.test.js';
import './preferences.test.js';
import './schema.test.js';
import './edge-cases.test.js';

import {runAll} from './runner.js';

const failures = runAll();
system.exit(failures > 0 ? 1 : 0);
