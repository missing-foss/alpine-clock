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

test('a crafted fragment reaches the markup as nothing: bad colours and faces fall back to the face\'s own', () => {
  const hostile = '#123456" onload="alert(1)';
  const options = {
    face: 'Day', hourColor: hostile, minuteColor: '"><script>alert(1)</script>', secondColor: '<svg/onload=alert(1)>',
    numbers: '<b>', mountains: '<b>'
  };
  // A payload in front of a valid colour: only an anchored pattern stops it.
  const tailed = { face: 'Day', hourColor: 'x" onload="alert(1)" a="#123456' };
  const svg = Face.svg(options);
  assert.strictEqual(svg, Face.svg({ face: 'Day' }), 'the same face as with no colours chosen');
  assert.strictEqual(Face.svg(tailed), Face.svg({ face: 'Day' }), 'a colour only at the end is no colour');
  for (const s of ['alert', 'script', 'onload', '<b>']) assert.ok(!svg.includes(s), s);
  assert.deepStrictEqual(Face.handColours({ hourColor: '#12345', minuteColor: '#1234567', secondColor: 'red' }),
    Face.handColours({}), 'only #RRGGBB counts');
  for (const face of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    assert.strictEqual(Face.svg({ face }), Face.svg({ face: 'Night' }), `${face}: Night`);
  }
});

// A document that records what the page's DOM calls build, and prints it
// back as markup, so the drawn face can be compared with the tree's text.
function fakeDocument() {
  const namespaces = new Set();
  const print = (node) => node.text !== undefined ? node.text
    : '<' + node.tag + node.attrs.map(([k, v]) => ` ${k}="${v}"`).join('') +
      (node.children.length ? '>' + node.children.map(print).join('') + '</' + node.tag + '>' : '/>');
  return {
    namespaces, print,
    createElementNS(ns, tag) {
      namespaces.add(ns);
      return { tag, attrs: [], children: [], setAttribute(k, v) { this.attrs.push([k, v]); }, appendChild(c) { this.children.push(c); } };
    },
    createTextNode(text) { return { text }; }
  };
}

test('the page draws the face with DOM calls, element by element, as the tree says', () => {
  for (const options of [{ face: 'Day', numbers: 'all' }, { face: 'Night', numbers: 'quarters', mountains: false },
    { hourColor: '#ff0000', secondColor: '"><script>alert(1)</script>' }]) {
    const doc = fakeDocument();
    const drawn = doc.print(Face.draw(doc, options));
    // The root's xmlns comes from createElementNS, not from an attribute.
    assert.strictEqual(drawn, Face.svg(options).replace(' xmlns="http://www.w3.org/2000/svg"', ''), JSON.stringify(options));
    assert.deepStrictEqual([...doc.namespaces], ['http://www.w3.org/2000/svg'], 'every element in the SVG namespace');
    assert.ok(!drawn.includes('script'), 'a hostile colour never reaches the drawing');
  }
});
