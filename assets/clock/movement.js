// SPDX-License-Identifier: Apache-2.0
// The stop-to-go movement, from the local time alone: no state, so a restart
// or a DST change lands in the right place. No DOM: tested in Node.
(function (root) {
  'use strict';

  // The second hand sweeps the dial in RUN seconds, then waits at twelve.
  var RUN = 58.5;

  // The second hand's angle in degrees, clockwise from twelve.
  function secondAngle(date) {
    var s = date.getSeconds() + date.getMilliseconds() / 1000;
    return s < RUN ? (s / RUN) * 360 : 0;
  }

  // Whole minutes since a fixed local date, counted from the local calendar
  // date so that a DST change neither skips nor repeats a step. The hands'
  // angles grow with it and never wrap, so a step from :59 to :00 or from
  // 23:59 to 00:00 turns forward, never back round the dial.
  function minuteCount(date) {
    var days = Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
    return (days * 24 + date.getHours()) * 60 + date.getMinutes();
  }

  // The minute and hour hands step together, once a minute.
  function minuteAngle(count) { return count * 6; }
  function hourAngle(count) { return count * 0.5; }

  var api = { RUN: RUN, secondAngle: secondAngle, minuteCount: minuteCount, minuteAngle: minuteAngle, hourAngle: hourAngle };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Movement = api;
}(this));
