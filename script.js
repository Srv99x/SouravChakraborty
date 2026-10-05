/* souravchakraborty.me v2 — main script.
   Phase 2: sticky-header state, active-section underline, mobile menu, theme toggle.
   Phase 6 adds: copy email (with aria-live + mailto fallback), print hook.
   The page is complete without this file; it only enhances. */
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

  /* ---- Theme -------------------------------------------------------------
     The saved choice is applied by the inline script in <head>. Here we only
     wire the toggle. Without a saved choice the OS setting applies via CSS. */
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'light' || t === 'dark') return t;
    return mqDark.matches ? 'dark' : 'light';
  }

  function syncThemeButton() {
    if (!themeBtn) return;
    themeBtn.setAttribute(
      'aria-label',
      currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );
  }

  function announceTheme() {
    // Phase 5 (figure.js) listens for this to redraw with the new colours.
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: currentTheme() } }));
  }

  if (themeBtn) {
    themeBtn.hidden = false;
    syncThemeButton();
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      syncThemeButton();
      announceTheme();
    });
    listen(mqDark, function () {
      syncThemeButton();
      announceTheme();
    });
  }

  /* ---- Header background after 8px of scroll ---------------------------- */
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Mobile menu (below 720px; CSS decides when the button shows) ----- */
  var mqMobile = window.matchMedia('(max-width: 719px)');

  function menuIsOpen() {
    return !!menuBtn && menuBtn.getAttribute('aria-expanded') === 'true';
  }

  function setMenu(open) {
    if (!menuBtn) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.textContent = open ? 'Close' : 'Menu';
    header.classList.toggle('menu-open', open);
  }

  if (menuBtn) {
    menuBtn.hidden = false;
    menuBtn.addEventListener('click', function () { setMenu(!menuIsOpen()); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuIsOpen()) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    listen(mqMobile, function () { setMenu(false); });
  }

  /* ---- Active-section underline ------------------------------------------ */
  var links = {};
  var ids = [];
  Array.prototype.forEach.call(nav.querySelectorAll('a[href^="#"]'), function (a) {
    var id = a.getAttribute('href').slice(1);
    if (id && document.getElementById(id)) {
      links[id] = a;
      ids.push(id);
    }
  });

  function setActive(id) {
    ids.forEach(function (key) {
      if (key === id) links[key].setAttribute('aria-current', 'true');
      else links[key].removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && ids.length) {
    var inBand = {};
    // A thin band at ~40% of the viewport height decides which section is "current".
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { inBand[entry.target.id] = entry.isIntersecting; });
      for (var i = 0; i < ids.length; i++) {
        if (inBand[ids[i]]) { setActive(ids[i]); return; }
      }
      // Nothing in the band: clear only while still above the first section (the cover).
      var first = document.getElementById(ids[0]);
      if (first.getBoundingClientRect().top > window.innerHeight * 0.45) setActive(null);
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---- Phase 6: Copy email with polite live region & mailto fallback ----- */
  var copyEmailBtn = document.getElementById('copy-email-btn');
  var copyLive = document.getElementById('copy-email-feedback');
  var emailAddress = 'sourav4298532@gmail.com';
  var copyTimer = null;

  function fallbackMailto() {
    window.location.href = 'mailto:' + emailAddress;
  }

  function handleCopied() {
    if (!copyEmailBtn) return;
    copyEmailBtn.textContent = 'Copied';
    if (copyLive) copyLive.textContent = 'Email copied';

    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () {
      copyEmailBtn.textContent = 'Copy email';
      if (copyLive) copyLive.textContent = '';
    }, 2000);
  }

  if (copyEmailBtn) {
    copyEmailBtn.hidden = false;
    copyEmailBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(emailAddress).then(handleCopied).catch(fallbackMailto);
      } else {
        fallbackMailto();
      }
    });
  }

  /* ---- Phase 6: Print button --------------------------------------------- */
  var printBtn = document.getElementById('print-sheet-btn');
  if (printBtn) {
    printBtn.hidden = false;
    printBtn.addEventListener('click', function () {
      window.print();
    });
  }
})();
