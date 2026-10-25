// SPDX-License-Identifier: Apache-2.0
// The screensaver: draws the face once, runs the second hand as a CSS
// animation in phase with the clock, and steps the minute and hour hands
// once a minute. Kiosk Satellite passes the settings in the URL fragment and
// recreates the page when they change.
(function () {
  'use strict';
  var options = {};
  try { options = JSON.parse(decodeURIComponent(location.hash.slice(1) || '%7B%7D')); } catch (_) {}
  var size = typeof options.size === 'number' && isFinite(options.size) ? Math.max(40, Math.min(100, options.size)) : 85;
  var style = document.documentElement.style;
  style.setProperty('--size', String(size));

  var clock = document.getElementById('clock');
  clock.innerHTML = Face.svg(options);
  var second = clock.querySelector('.hand.second');
  var minute = clock.querySelector('.hand.minute');
  var hour = clock.querySelector('.hand.hour');

  // A slow drift of a fiftieth of the clock's width, one step a minute,
  // round a small circle in an hour: the face never sits still for long.
  function drift(now) {
    if (options.drift === false) return;
    var angle = (now.getMinutes() / 60) * 2 * Math.PI;
    style.setProperty('--drift-x', (Math.cos(angle) * 0.02).toFixed(4));
    style.setProperty('--drift-y', (Math.sin(angle) * 0.02).toFixed(4));
  }

  // Minutes are counted from the start of the twelve hours the page opened
  // in, so the angles stay small (a renderer may hold them in 32-bit floats)
  // and still only grow: a step never turns back round the dial.
  var origin = null;
  function step(now) {
    var count = Movement.minuteCount(now);
    if (origin === null) origin = count - (count % 720);
    minute.style.transform = 'rotate(' + Movement.minuteAngle(count - origin) + 'deg)';
    hour.style.transform = 'rotate(' + Movement.hourAngle(count - origin) + 'deg)';
    // In phase: restart the sweep with this minute's start as its start.
    // A changed delay alone would not restart a running animation. At the
    // minute the hand is waiting at twelve, so the restart doesn't show.
    var into = now.getSeconds() + now.getMilliseconds() / 1000;
    second.style.animation = 'none';
    void second.getBoundingClientRect();
    second.style.animation = '';
    second.style.animationDelay = (-into).toFixed(3) + 's';
    drift(now);
  }

  function tick() {
    var now = new Date();
    step(now);
    // Wake just after the next minute starts.
    setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 20);
  }

  // The first position without the settle: the hands are already there.
  clock.classList.add('still');
  step(new Date());
  // Two frames later the transitions are on, for the steps to come.
  requestAnimationFrame(function () { requestAnimationFrame(function () { clock.classList.remove('still'); }); });
  var now = new Date();
  setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 20);
}());
