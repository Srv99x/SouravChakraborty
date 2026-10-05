/* souravchakraborty.me v2 — main script */
(function () {
  'use strict';

  var root = document.documentElement;
  var header = document.getElementById('site-header');
  var nav = document.getElementById('site-nav');
  var themeBtn = document.getElementById('theme-toggle');
  var menuBtn = document.getElementById('menu-btn');
  if (!header || !nav) return;

  function listen(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  /* Theme toggle */
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  function curTheme() {
    var t = root.getAttribute('data-theme');
    return (t === 'light' || t === 'dark') ? t : (mqDark.matches ? 'dark' : 'light');
  }

  function syncThemeBtn() {
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', curTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  function announceTheme() {
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: curTheme() } }));
  }

  if (themeBtn) {
    themeBtn.hidden = false;
    syncThemeBtn();
    themeBtn.addEventListener('click', function () {
      var next = curTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeBtn();
      announceTheme();
    });
    listen(mqDark, function () {
      syncThemeBtn();
      announceTheme();
    });
  }

  /* Header scroll */
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  var mqMob = window.matchMedia('(max-width: 719px)');
  function menuOpen() { return !!menuBtn && menuBtn.getAttribute('aria-expanded') === 'true'; }
  function setMenu(o) {
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', String(o));
    menuBtn.textContent = o ? 'Close' : 'Menu';
    header.classList.toggle('menu-open', o);
  }

  if (menuBtn) {
    menuBtn.hidden = false;
    menuBtn.addEventListener('click', function () { setMenu(!menuOpen()); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen()) { setMenu(false); menuBtn.focus(); }
    });
    listen(mqMob, function () { setMenu(false); });
  }

  /* Active section tracking */
  var links = {}, ids = [];
  Array.prototype.forEach.call(nav.querySelectorAll('a[href^="#"]'), function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id && document.getElementById(id)) {
      links[id] = a;
      ids.push(id);
    }
  });

  function setActive(id) {
    ids.forEach(function (k) {
      if (k === id) links[k].setAttribute('aria-current', 'true');
      else links[k].removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && ids.length) {
    var inBand = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { inBand[e.target.id] = e.isIntersecting; });
      for (var i = 0; i < ids.length; i++) {
        if (inBand[ids[i]]) { setActive(ids[i]); return; }
      }
      var first = document.getElementById(ids[0]);
      if (first && first.getBoundingClientRect().top > window.innerHeight * 0.45) setActive(null);
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* Copy email */
  var copyEmailBtn = document.getElementById('copy-email-btn');
  var copyLive = document.getElementById('copy-email-feedback');
  var email = 'sourav4298532@gmail.com';
  var copyTimer = null;

  function fallbackMailto() { window.location.href = 'mailto:' + email; }

  if (copyEmailBtn) {
    copyEmailBtn.hidden = false;
    copyEmailBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(function () {
          copyEmailBtn.textContent = 'Copied';
          if (copyLive) copyLive.textContent = 'Email copied';
          clearTimeout(copyTimer);
          copyTimer = setTimeout(function () {
            copyEmailBtn.textContent = 'Copy email';
            if (copyLive) copyLive.textContent = '';
          }, 2000);
        }).catch(fallbackMailto);
      } else {
        fallbackMailto();
      }
    });
  }

  /* Print datasheet */
  var printBtn = document.getElementById('print-sheet-btn');
  if (printBtn) {
    printBtn.hidden = false;
    printBtn.addEventListener('click', function () { window.print(); });
  }
})();
