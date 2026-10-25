// SPDX-License-Identifier: Apache-2.0
// The face as SVG markup, drawn once per set of settings: bezel, ring, the
// optional ridge, the marks and numbers, and the hands' shapes. A string, no
// DOM, so the geometry is tested in Node. Units: the face's radius R is 100,
// the viewBox runs from -100 to 100, y grows downwards.
(function (root) {
  'use strict';

  var FACES = {
    Day: { face: '#f6f6f1', rim: '#c9ccc6', bezel: '#2a2d2b', ink: '#161816', minor: '#3a3e3b', signal: '#d9822b',
      far: '#dfe3dc', near: '#c8cfc6', snow: '#fbfbf8' },
    Night: { face: '#171a19', rim: '#2b302d', bezel: '#0b0d0c', ink: '#e9ece8', minor: '#9aa29d', signal: '#e8953f',
      far: '#1e2321', near: '#262c29', snow: '#353c38' }
  };

  // Where things sit, in units of R.
  var GEOMETRY = {
    bezel: 99.5, face: 93, rim: 90.5, rimWidth: 0.8, ridgeClip: 90,
    dot: 83.5, dotRadius: 1.1,
    wedgeOuter: 86, wedgeInner: 67, wedgeOuterWidth: 6.8, wedgeInnerWidth: 2.8,
    numberAll: 73, numberQuarters: 72.5, numberSizeAll: 15, numberSizeQuarters: 20,
    hour: { length: 50, tail: 12, base: 8.5, tip: 5 },
    minute: { length: 80, tail: 12, base: 7, tip: 3.4 },
    second: { length: 82, tail: 20, width: 1.6, weightFrom: 12, weightTo: 22, weightWidth: 4 },
    hub: 3.4, hubHole: 1.3
  };

  // The ridges, in units of R: a far layer and a near one, with snow on the
  // near ridge's high peak above a ragged line. Generic, no real mountain.
  var BACK = [[-1, 0.30], [-0.84, 0.19], [-0.7, 0.25], [-0.52, 0.09], [-0.38, 0.17], [-0.24, 0.11], [-0.08, 0.21],
    [0.04, 0.13], [0.12, 0.06], [0.2, 0.12], [0.33, 0.08], [0.46, 0.17], [0.6, 0.1], [0.74, 0.2], [0.88, 0.14], [1, 0.22]];
  var FRONT = [[-1, 0.44], [-0.86, 0.35], [-0.72, 0.41], [-0.56, 0.30], [-0.44, 0.36], [-0.3, 0.31], [-0.16, 0.39],
    [-0.02, 0.33], [0.1, 0.24], [0.2, 0.12], [0.25, 0.16], [0.29, 0.19], [0.36, 0.27], [0.47, 0.33], [0.6, 0.29],
    [0.74, 0.37], [0.88, 0.33], [1, 0.4]];
  var SNOWLINE = 0.205;

  function n(x) { return Math.round(x * 100) / 100; }

  // The hours that show a number instead of a wedge: none, 12, 3, 6 and 9, or all.
  function numberedHours(numbers) {
    if (numbers === 'all') return [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (numbers === 'quarters') return [12, 3, 6, 9];
    return [];
  }

  function ridge(points) {
    var d = 'M -100 100';
    points.forEach(function (p) { d += ' L ' + n(p[0] * 100) + ' ' + n(p[1] * 100); });
    return d + ' L 100 100 Z';
  }

  function mountains(f) {
    var snow = 'M -100 -100 L 100 -100';
    for (var k = 0, x = 1; x >= -1.0001; k++, x = 1 - k * 0.025) {
      var dip = Math.round(x * 40) % 2 === 0 ? 0.018 : -0.006;
      snow += ' L ' + n(x * 100) + ' ' + n((SNOWLINE + dip) * 100);
    }
    return '<clipPath id="face-clip"><circle r="' + GEOMETRY.ridgeClip + '"/></clipPath>' +
      '<clipPath id="near-clip"><path d="' + ridge(FRONT) + '"/></clipPath>' +
      '<g class="mountains" clip-path="url(#face-clip)">' +
      '<path d="' + ridge(BACK) + '" fill="' + f.far + '"/>' +
      '<path d="' + ridge(FRONT) + '" fill="' + f.near + '"/>' +
      '<path d="' + snow + ' Z" fill="' + f.snow + '" clip-path="url(#near-clip)"/>' +
      '</g>';
  }

  function marks(f, numbered) {
    var g = GEOMETRY, out = '';
    for (var i = 0; i < 60; i++) {
      var hour = i / 5 === 0 ? 12 : i / 5;
      var rotate = ' transform="rotate(' + i * 6 + ')"';
      // Every minute has its dot; an hour without a number has its wedge
      // over it, wide enough to cover it.
      out += '<circle class="dot"' + rotate + ' cy="' + -g.dot + '" r="' + g.dotRadius + '" fill="' + f.minor + '"/>';
      if (i % 5 === 0 && numbered.indexOf(hour) < 0) {
        out += '<path class="wedge"' + rotate + ' fill="' + f.ink + '" d="M ' + -g.wedgeOuterWidth / 2 + ' ' + -g.wedgeOuter +
          ' L ' + g.wedgeOuterWidth / 2 + ' ' + -g.wedgeOuter + ' L ' + g.wedgeInnerWidth / 2 + ' ' + -g.wedgeInner +
          ' L ' + -g.wedgeInnerWidth / 2 + ' ' + -g.wedgeInner + ' Z"/>';
      }
    }
    return out;
  }

  function numbers(f, numbered, quarters) {
    var g = GEOMETRY;
    var radius = quarters ? g.numberQuarters : g.numberAll;
    var size = quarters ? g.numberSizeQuarters : g.numberSizeAll;
    return numbered.map(function (hour) {
      var a = hour * Math.PI / 6;
      return '<text class="number" x="' + n(Math.sin(a) * radius) + '" y="' + n(-Math.cos(a) * radius + 0.8) +
        '" font-size="' + size + '" fill="' + f.ink + '">' + hour + '</text>';
    }).join('');
  }

  // A tapered hand pointing at twelve: wide at the hub, narrow at the tip,
  // round at both ends.
  function taper(h) {
    return 'M ' + -h.base / 2 + ' ' + h.tail + ' L ' + -h.tip / 2 + ' ' + -h.length +
      ' A ' + h.tip / 2 + ' ' + h.tip / 2 + ' 0 0 1 ' + h.tip / 2 + ' ' + -h.length +
      ' L ' + h.base / 2 + ' ' + h.tail + ' A ' + h.base / 2 + ' ' + h.base / 2 + ' 0 0 1 ' + -h.base / 2 + ' ' + h.tail + ' Z';
  }

  // The hands' colours: the face's own, or the three chosen ones.
  function handColours(options) {
    var f = FACES[options.face] || FACES.Night;
    return {
      hour: options.hourColor || f.ink,
      minute: options.minuteColor || f.ink,
      second: options.secondColor || f.signal
    };
  }

  // The whole clock: the face, then the three hands as groups the page turns.
  function svg(options) {
    var f = FACES[options.face] || FACES.Night;
    var g = GEOMETRY, c = handColours(options);
    var numbered = numberedHours(options.numbers);
    var s = g.second;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" role="img">' +
      '<circle r="' + g.bezel + '" fill="' + f.bezel + '"/>' +
      '<circle r="' + g.face + '" fill="' + f.face + '"/>' +
      '<circle r="' + g.rim + '" fill="none" stroke="' + f.rim + '" stroke-width="' + g.rimWidth + '"/>' +
      (options.mountains === false ? '' : mountains(f)) +
      marks(f, numbered) +
      numbers(f, numbered, options.numbers === 'quarters') +
      '<g class="hand hour"><path d="' + taper(g.hour) + '" fill="' + c.hour + '"/></g>' +
      '<g class="hand minute"><path d="' + taper(g.minute) + '" fill="' + c.minute + '"/></g>' +
      '<g class="hand second" stroke="' + c.second + '" stroke-linecap="round">' +
      '<line y1="' + s.tail + '" y2="' + -s.length + '" stroke-width="' + s.width + '"/>' +
      '<line y1="' + s.weightTo + '" y2="' + s.weightFrom + '" stroke-width="' + s.weightWidth + '"/>' +
      '<circle r="' + g.hub + '" fill="' + c.second + '" stroke="none"/>' +
      '<circle r="' + g.hubHole + '" fill="' + f.face + '" stroke="none"/></g>' +
      '</svg>';
  }

  var api = { FACES: FACES, GEOMETRY: GEOMETRY, numberedHours: numberedHours, handColours: handColours, svg: svg };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Face = api;
}(this));
