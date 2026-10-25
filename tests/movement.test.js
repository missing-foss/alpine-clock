// SPDX-License-Identifier: Apache-2.0
// The stop-to-go movement, from the time alone.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const M = require('../assets/clock/movement.js');

const at = (h, m, s, ms = 0) => new Date(2026, 9, 24, h, m, s, ms);

test('the second hand sweeps the dial in 58.5 s, then waits at twelve', () => {
  assert.strictEqual(M.secondAngle(at(7, 0, 0)), 0);
  assert.strictEqual(M.secondAngle(at(7, 0, 29, 250)), 180, 'half the run is half the dial');
  assert.ok(Math.abs(M.secondAngle(at(7, 0, 58, 490)) - 359.94) < 0.01, 'just before twelve');
  for (const [s, ms] of [[58, 500], [59, 0], [59, 999]]) {
    assert.strictEqual(M.secondAngle(at(7, 0, s, ms)), 0, `${s}.${ms} s: waiting at twelve`);
  }
  assert.ok(M.secondAngle(at(7, 0, 30)) > M.secondAngle(at(7, 0, 29)), 'it sweeps, it does not tick');
});

test('the minute and hour hands stand still through the minute and step together at :00', () => {
  const count = (h, m, s) => M.minuteCount(at(h, m, s));
  assert.strictEqual(count(7, 41, 0), count(7, 41, 59), 'still through the minute');
  assert.strictEqual(count(7, 42, 0) - count(7, 41, 59), 1, 'one step at the minute');
  assert.strictEqual(M.minuteAngle(count(7, 42, 0)) % 360, 252);
  assert.strictEqual(M.hourAngle(count(7, 42, 0)) % 360, 7 * 30 + 21, 'the hour hand moves in minute steps');
  assert.strictEqual(M.hourAngle(count(7, 42, 0)) - M.hourAngle(count(7, 41, 0)), 0.5);
});

test('the hands always turn forward: :59 to :00, and midnight', () => {
  for (const [a, b] of [[at(11, 59, 59), at(12, 0, 0)], [at(23, 59, 59), new Date(2026, 9, 25, 0, 0, 0)]]) {
    const step = M.minuteAngle(M.minuteCount(b)) - M.minuteAngle(M.minuteCount(a));
    assert.strictEqual(step, 6, `${a.toTimeString().slice(0, 8)} → ${b.toTimeString().slice(0, 8)}: one minute forward`);
    assert.strictEqual(M.hourAngle(M.minuteCount(b)) - M.hourAngle(M.minuteCount(a)), 0.5);
  }
  assert.strictEqual(M.minuteAngle(M.minuteCount(new Date(2026, 9, 25, 0, 0))) % 360, 0, 'midnight points at twelve');
  assert.strictEqual(M.hourAngle(M.minuteCount(new Date(2026, 9, 25, 0, 0))) % 360, 0);
});

test('every minute of 2026 is one step: the DST nights skip and repeat nothing', () => {
  // Counted from the local date: the 23- and 25-hour days still give 1,440
  // steps, in whatever time zone the tests run.
  let previous = M.minuteCount(new Date(2026, 0, 1, 0, 0));
  for (let day = 2; day <= 366; day++) {
    const today = M.minuteCount(new Date(2026, 0, day, 0, 0));
    assert.strictEqual(today - previous, 1440, `2026 day ${day}`);
    previous = today;
  }
});
