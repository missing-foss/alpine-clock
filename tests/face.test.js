// SPDX-License-Identifier: Apache-2.0
// The face's geometry: marks, numbers and hands where the design puts them.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const Face = require('../assets/clock/face.js');

const count = (svg, cls) => (svg.match(new RegExp(`class="${cls}"`, 'g')) || []).length;
const numbers = (svg) => [...svg.matchAll(/<text class="number" x="([-\d.]+)" y="([-\d.]+)"[^>]*>(\d+)</g)]
  .map((m) => ({ hour: Number(m[3]), x: Number(m[1]), y: Number(m[2]) }));

test('all 60 minute dots, always; a wedge at exactly the hours without a number', () => {
  for (const [mode, wedges, shown] of [['none', 12, []], ['quarters', 8, [12, 3, 6, 9]], ['all', 0, [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]]]) {
    const svg = Face.svg({ face: 'Night', numbers: mode });
    assert.strictEqual(count(svg, 'dot'), 60, `${mode}: 60 dots`);
    assert.strictEqual(count(svg, 'wedge'), wedges, `${mode}: wedges`);
    assert.deepStrictEqual(numbers(svg).map((n) => n.hour), shown, `${mode}: numbers`);
    const wedgeAngles = [...svg.matchAll(/<path class="wedge" transform="rotate\((\d+)\)"/g)].map((m) => Number(m[1]) / 30 || 12);
    assert.deepStrictEqual(wedgeAngles.filter((h) => shown.includes(h)), [], `${mode}: no wedge under a number`);
  }
});

test('the numbers sit at 0.73 R, or 0.725 R for 12, 3, 6 and 9 alone, inside the dots at 0.835 R', () => {
  for (const [mode, radius] of [['all', 73], ['quarters', 72.5]]) {
    for (const n of numbers(Face.svg({ numbers: mode }))) {
      const r = Math.hypot(n.x, n.y - 0.8);
      assert.ok(Math.abs(r - radius) < 0.02, `${mode} ${n.hour}: radius ${r}`);
      const a = Math.atan2(n.x, -(n.y - 0.8)) * 180 / Math.PI;
      assert.ok(Math.abs(((a + 360) % 360) - (n.hour % 12) * 30) < 0.1, `${mode} ${n.hour}: angle ${a}`);
    }
  }
  assert.strictEqual(Face.GEOMETRY.dot, 83.5);
});

test('the mountains are optional; the hands follow the face unless colours are chosen', () => {
  assert.ok(Face.svg({ mountains: true }).includes('class="mountains"'));
  assert.ok(!Face.svg({ mountains: false }).includes('class="mountains"'));
  assert.deepStrictEqual(Face.handColours({ face: 'Day' }), { hour: '#161816', minute: '#161816', second: '#d9822b' });
  assert.deepStrictEqual(Face.handColours({ face: 'Night' }), { hour: '#e9ece8', minute: '#e9ece8', second: '#e8953f' });
  assert.deepStrictEqual(Face.handColours({}), Face.handColours({ face: 'Night' }), 'Night by default');
  assert.deepStrictEqual(Face.handColours({ face: 'Day', hourColor: '#112233', minuteColor: null, secondColor: '#445566' }),
    { hour: '#112233', minute: '#161816', second: '#445566' });
});

test('three hands, the second hand a needle without a disc at its tip', () => {
  const svg = Face.svg({});
  for (const hand of ['hour', 'minute', 'second']) assert.strictEqual(count(svg, `hand ${hand}`), 1, hand);
  const second = svg.slice(svg.indexOf('class="hand second"'));
  const circles = [...second.matchAll(/<circle r="([\d.]+)"/g)].map((m) => Number(m[1]));
  assert.deepStrictEqual(circles, [Face.GEOMETRY.hub, Face.GEOMETRY.hubHole], 'only the hub, at the centre');
  assert.ok(!/<circle[^>]*cy=/.test(second), 'no disc away from the centre');
});
