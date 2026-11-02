/* Slate onboarding flow */
(function () {
  'use strict';

  var screens = Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var welcomeBar = document.getElementById('welcomeBar');
  var stepBar = document.getElementById('stepBar');
  var progress = document.getElementById('progress');
  var progressFill = document.getElementById('progressFill');
  var counter = document.getElementById('counter');
  var STEPS = screens.length - 1; // everything after the welcome screen
  var EXIT_URL = '../landing/index.html';
  var answers = {};
  var sliderRefreshers = [];
  var current = 0;

  /* ---------- Navigation: the hash keeps the browser's back button and refresh working ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function render(i) {
    current = i;
    screens.forEach(function (s, j) { s.hidden = j !== i; });
    welcomeBar.hidden = i !== 0;
    stepBar.hidden = i === 0;
    if (i > 0) {
      var pct = i / STEPS * 100;
      progressFill.style.width = pct + '%';
      progress.setAttribute('aria-valuenow', Math.round(pct));
      counter.innerHTML = pad(i) + '<small>/' + STEPS + '</small>';
    }
    window.scrollTo(0, 0);
    fitDecks();
    sliderRefreshers.forEach(function (fn) { fn(); });
    if (screens[i].dataset.screen === 'curating') runChecklist(); else stopChecklist();
  }

  function indexFromHash() {
    var n = parseInt(location.hash.slice(1), 10);
    return n >= 1 && n <= screens.length ? n - 1 : 0;
  }

  function go(i) {
    if (i >= screens.length) { location.href = EXIT_URL; return; }
    location.hash = i + 1;
  }

  window.addEventListener('hashchange', function () { render(indexFromHash()); });
  document.getElementById('backBtn').addEventListener('click', function () { go(current - 1); });
  document.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () { go(current + 1); });
  });

  /* ---------- Chips ---------- */
  document.querySelectorAll('[data-chips]').forEach(function (group) {
    var name = group.dataset.chips;
    var max = Number(group.dataset.max) || Infinity;
    var chips = group.querySelectorAll('.chip');
    answers[name] = [];

    function sync() {
      var full = answers[name].length >= max;
      chips.forEach(function (c) {
        var on = answers[name].indexOf(c.textContent) > -1;
        c.setAttribute('aria-pressed', String(on));
        c.setAttribute('aria-disabled', String(full && !on));
      });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var at = answers[name].indexOf(c.textContent);
        if (at > -1) answers[name].splice(at, 1);
        else if (answers[name].length < max) answers[name].push(c.textContent);
        sync();
      });
    });
    sync();
  });

  /* ---------- Sliders: t runs 0-1 along the track, stops map it to values piece by piece ---------- */
  function interpolate(stops, t) {
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
    }
    return stops[stops.length - 1][1];
  }

  var SLIDERS = {
    hours: {
      label: 'Time spent searching',
      start: 0.1223,
      stops: [[0, 0.5], [0.1223, 2], [1, 40]],
      format: function (v) {
        var h = v < 2 ? Math.round(v * 2) / 2 : Math.round(v);
        return { text: '~ ' + h + (h === 1 ? ' hour' : ' hours') };
      }
    },
    budget: {
      label: 'Budget per piece',
      bubble: true,
      start: 0.1203,
      stops: [[0, 25], [0.1203, 100], [1, 500]],
      format: function (v) {
        var d = Math.round(v / 5) * 5;
        var word = d < 75 ? 'Budget-friendly' : d <= 150 ? 'Reasonable' : d <= 300 ? 'Premium' : 'Luxury';
        return { text: '$' + d + (d >= 500 ? '+' : '') + ' ~ ' + word, html: '$' + d + (d >= 500 ? '+' : '') + ' ~ <small>' + word + '</small>' };
      }
    },
    coverage: {
      label: 'Importance of coverage',
      bubble: true,
      start: 0.1203,
      stops: [[0, 0], [1, 1]],
      format: function (v) {
        return { text: v < 0.25 ? 'Flexible' : v < 0.5 ? 'Somewhat important' : v < 0.75 ? 'Important' : 'Very important' };
      }
    }
  };

  document.querySelectorAll('[data-slider]').forEach(function (el) {
    var name = el.dataset.slider;
    var cfg = SLIDERS[name];
    el.innerHTML =
      '<div class="slider__fill"></div>' +
      '<input type="range" min="0" max="1000" aria-label="' + cfg.label + '">' +
      '<div class="slider__thumb"><svg width="20" height="20"><use href="#i-grabber"/></svg></div>' +
      (cfg.bubble ? '<div class="slider__bubble"></div>' : '');
    var fill = el.querySelector('.slider__fill');
    var input = el.querySelector('input');
    var thumb = el.querySelector('.slider__thumb');
    var bubble = el.querySelector('.slider__bubble');
    var outlet = cfg.bubble ? bubble : document.getElementById(name + 'Out');

    input.value = Math.round(cfg.start * 1000);

    // Follows the thumb but stays on screen; its arrow keeps pointing at the thumb
    function placeBubble(t) {
      if (!bubble) return;
      var box = el.getBoundingClientRect();
      var x = 16 + t * (box.width - 32);
      var half = bubble.offsetWidth / 2;
      var lo = 8 + half - box.left;
      var hi = document.documentElement.clientWidth - 8 - half - box.left;
      var clamped = Math.max(lo, Math.min(hi, x));
      bubble.style.left = clamped + 'px';
      bubble.style.setProperty('--nudge', x - clamped + 'px');
    }

    function update() {
      var t = input.value / 1000;
      var center = 'calc(16px + ' + t + ' * (100% - 32px))';
      fill.style.width = center;
      thumb.style.left = center;
      placeBubble(t);
      var out = cfg.format(interpolate(cfg.stops, t));
      if (out.html) outlet.innerHTML = out.html; else outlet.textContent = out.text;
      input.setAttribute('aria-valuetext', out.text);
      answers[name] = out.text;
    }
    input.addEventListener('input', update);
    sliderRefreshers.push(update);
    update();
  });

  /* ---------- Plans ---------- */
  var plans = document.querySelectorAll('#plans .plan');
  plans.forEach(function (p) {
    p.addEventListener('click', function () {
      plans.forEach(function (o) {
        o.classList.toggle('is-on', o === p);
        o.setAttribute('aria-checked', String(o === p));
      });
      answers.plan = p.querySelector('.plan__name').textContent;
    });
  });
  answers.plan = 'Annual';

  /* ---------- Curating checklist: ticks through, then moves on ---------- */
  var checklistItems = document.querySelectorAll('#checklist li');
  var checklistTimer = null;

  function stopChecklist() {
    clearTimeout(checklistTimer);
    checklistItems.forEach(function (li) { li.classList.remove('is-done'); });
  }
  function runChecklist() {
    stopChecklist();
    var n = 0;
    (function tick() {
      if (n < checklistItems.length) {
        checklistItems[n++].classList.add('is-done');
        checklistTimer = setTimeout(tick, 1100);
      } else {
        go(current + 1);
      }
    })();
  }

  /* ---------- Scale the look card artboard on narrow screens ---------- */
  var decks = document.querySelectorAll('[data-deck]');
  function fitDecks() {
    var k = Math.min(1, document.documentElement.clientWidth / 660).toFixed(4);
    decks.forEach(function (d) { d.style.setProperty('--k', k); });
  }
  window.addEventListener('resize', function () {
    fitDecks();
    sliderRefreshers.forEach(function (fn) { fn(); });
  });

  render(indexFromHash());
})();
