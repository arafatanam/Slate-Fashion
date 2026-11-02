/* Slate landing page interactions */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navbar: menu toggle + scrolled state ---------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.querySelectorAll('.nav__menu a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', function (e) { if (!nav.contains(e.target)) setMenu(false); });

  /* ---------- Scale fixed-size artboards to their containers ---------- */
  var showcase = document.getElementById('showcase');
  var fitCards = document.querySelectorAll('[data-fit]');
  var carouselEl = document.getElementById('collections');

  function fitAll() {
    var vw = doc.clientWidth;
    // Hero stage: fit the whole row on desktop; on small screens keep the phone large and let side cards bleed
    var k = Math.max(Math.min(1, (vw - 48) / 1673), Math.min(0.85, (vw * 0.72) / 390));
    showcase.style.setProperty('--k', k.toFixed(4));
    fitCards.forEach(function (el) {
      el.style.setProperty('--k', (el.clientWidth / Number(el.dataset.fit)).toFixed(4));
    });
    if (carouselEl) carouselEl.style.setProperty('--ck', Math.min(1, (carouselEl.parentElement.clientWidth - 32) / 385).toFixed(4));
    layoutLine();
  }

  /* ---------- How it works: timeline position + scroll progress ---------- */
  var steps = document.getElementById('steps');
  var line = steps.querySelector('.steps__line');
  var progress = document.getElementById('stepsProgress');
  var nums = steps.querySelectorAll('.step__num');

  function layoutLine() {
    var first = nums[0], last = nums[nums.length - 1];
    // step__num offsets are relative to their .step row, rows are relative to .steps
    var top = first.parentElement.offsetTop + first.offsetTop + 3.5;
    var bottom = steps.offsetHeight - (last.parentElement.offsetTop + last.offsetTop) + 11.5;
    steps.style.setProperty('--line-top', top + 'px');
    steps.style.setProperty('--line-bottom', Math.max(bottom, 0) + 'px');
  }

  var ticking = false;
  function updateProgress() {
    ticking = false;
    var r = line.getBoundingClientRect();
    var target = window.innerHeight * 0.55;
    var p = Math.min(1, Math.max(0, (target - r.top) / r.height));
    progress.style.setProperty('--p', (p * 100).toFixed(2) + '%');
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); } }
  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('resize', function () { fitAll(); onScroll(); });
  if ('ResizeObserver' in window) new ResizeObserver(function () { fitAll(); }).observe(steps);
  fitAll();
  updateProgress();
  window.addEventListener('load', function () { fitAll(); updateProgress(); });

  /* ---------- Modesty filter switch ---------- */
  var sw = document.getElementById('modestySwitch');
  sw.addEventListener('click', function () {
    sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));
  });

  /* ---------- Personal collections carousel ---------- */
  var carousel = document.getElementById('collections');
  var items = carousel.querySelectorAll('.carousel__item');
  var dots = carousel.querySelectorAll('.carousel__dots button');
  var n = items.length, current = 2, timer = null;

  function show(i) {
    current = (i + n) % n;
    items.forEach(function (el, j) {
      var d = (j - current + n) % n;
      el.classList.toggle('is-center', d === 0);
      el.classList.toggle('is-right', d === 1);
      el.classList.toggle('is-left', d === n - 1);
      el.setAttribute('aria-hidden', String(d !== 0));
    });
    dots.forEach(function (b, j) { b.setAttribute('aria-selected', String(j === current)); });
  }
  function play() { if (!reduceMotion) { stop(); timer = setInterval(function () { show(current + 1); }, 3200); } }
  function stop() { clearInterval(timer); }
  dots.forEach(function (b, j) { b.addEventListener('click', function () { show(j); play(); }); });
  items.forEach(function (el, j) { el.addEventListener('click', function () { show(j); play(); }); });
  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', play);
  show(current);
  play();

  /* ---------- Testimonials ---------- */
  var track = document.getElementById('reviewsTrack');
  var prev = document.getElementById('reviewsPrev');
  var next = document.getElementById('reviewsNext');
  function step() { var c = track.querySelector('.review'); return c.offsetWidth + 20; }
  function updateBtns() {
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  }
  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  track.addEventListener('scroll', updateBtns, { passive: true });
  window.addEventListener('resize', updateBtns);
  updateBtns();

  /* ---------- FAQ accordion (single open) ---------- */
  var faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    item.querySelector('.faq__q').addEventListener('click', function () {
      var willOpen = !item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        other.querySelector('.faq__q').setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('is-open');
        item.querySelector('.faq__q').setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Contact form (front-end only) ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    form.querySelectorAll('input, textarea').forEach(function (f) {
      var valid = f.value.trim() !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
      f.classList.toggle('is-invalid', !valid);
      f.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    if (!ok) { status.textContent = 'Please fill in every field with a valid email.'; return; }
    // TODO: send to your backend / form service here
    status.textContent = 'Thanks! We’ll get back to you soon.';
    form.reset();
  });
  form.addEventListener('input', function (e) { e.target.classList.remove('is-invalid'); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
