/* ==========================================================================
   souravchakraborty.me v2 — figure.js
   Oscilloscope waveform canvas for Figure 1 (DESIGN.md 5.1).
   Handles: 10x10 graticule, real speech trace (Wav2Vec2 reference),
   synthetic trace overlay with vocoder artifacts, load animation,
   overlay toggle, replay, DPR scaling, resize debounce, theme changes,
   pointer cursor with readout, and prefers-reduced-motion.
   ========================================================================== */

(function () {
  'use strict';

  var canvas = document.getElementById('figure-1-canvas');
  var overlayBtn = document.getElementById('figure-overlay-btn');
  var replayBtn = document.getElementById('figure-replay-btn');
  var legend = document.getElementById('figure-legend');

  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Media queries
  var mqReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqPointerCoarse = window.matchMedia('(pointer: coarse)');

  // State
  var state = {
    realProgress: 0,
    synthProgress: 0,
    synthActive: false,
    animating: false,
    cursorX: null,
    width: 0,
    height: 0,
    dpr: 1
  };

  // Cached theme colors
  var colors = {
    sheet: '#FFFFFF',
    grid: '#D5DCDD',
    graphite: '#55606B',
    trace: '#0B7A75',
    synthetic: '#B23A48',
    ink: '#13202B'
  };

  function updateColors() {
    var cs = getComputedStyle(document.documentElement);
    colors.sheet = cs.getPropertyValue('--sheet').trim() || '#FFFFFF';
    colors.grid = cs.getPropertyValue('--grid').trim() || '#D5DCDD';
    colors.graphite = cs.getPropertyValue('--graphite').trim() || '#55606B';
    colors.trace = cs.getPropertyValue('--trace').trim() || '#0B7A75';
    colors.synthetic = cs.getPropertyValue('--synthetic').trim() || '#B23A48';
    colors.ink = cs.getPropertyValue('--ink').trim() || '#13202B';
  }

  /* --------------------------------------------------------------------------
     Signal Synthesis (DESIGN.md 5.1)
     Nominal duration T = 2.0s.
     Real trace: Speech-like signal with 5 syllable envelope bumps and
     natural pitch micro-inflections.
     Synthetic trace: Overly regular pitch, hard clicks, and vocoder shimmer.
     -------------------------------------------------------------------------- */
  var DURATION = 2.0;

  // Syllables: fixed pseudo-random parameters for deterministic rendering
  var SYLLABLES = [
    { c: 0.24, w: 0.08, a: 0.82 },
    { c: 0.62, w: 0.11, a: 1.00 },
    { c: 1.02, w: 0.09, a: 0.74 },
    { c: 1.42, w: 0.12, a: 0.92 },
    { c: 1.78, w: 0.07, a: 0.58 }
  ];

  function envelope(t) {
    var sum = 0.015; // faint baseline floor
    for (var i = 0; i < SYLLABLES.length; i++) {
      var s = SYLLABLES[i];
      var dt = (t - s.c) / s.w;
      sum += s.a * Math.exp(-0.5 * dt * dt);
    }
    return sum;
  }

  function realSignal(t) {
    var env = envelope(t);
    // 140 Hz fundamental with subtle pitch inflection (135 Hz -> 146 Hz)
    var phase = 2 * Math.PI * (136 * t + 2.5 * t * t);
    var carrier = Math.sin(phase) +
                  0.48 * Math.sin(2 * phase + 0.45) +
                  0.26 * Math.sin(3 * phase + 1.25) +
                  0.14 * Math.sin(5 * phase + 2.10);
    return env * carrier * 0.76;
  }

  function syntheticSignal(t) {
    var env = envelope(t);
    // (a) Overly rigid periodicity: strict 162 Hz with zero intonation drift
    var phase = 2 * Math.PI * 162 * t;
    var carrier = Math.sin(phase) +
                  0.55 * Math.sin(2 * phase) +
                  0.32 * Math.sin(3 * phase) +
                  0.20 * Math.sin(4 * phase);

    // (b) Hard phase discontinuities and clicks at syllable boundaries
    var click = 0;
    if (Math.abs(t - 0.62) < 0.008) click = 0.55 * Math.sin((t - 0.62) * 500);
    if (Math.abs(t - 1.42) < 0.008) click = -0.48 * Math.sin((t - 1.42) * 500);

    // (c) High-frequency metallic shimmer / vocoder artifacts (2300Hz & 3700Hz)
    var shimmer = 0.22 * Math.sin(2 * Math.PI * 2350 * t) +
                  0.12 * Math.sin(2 * Math.PI * 3720 * t);

    return (env * (carrier + shimmer) + click) * 0.74;
  }

  /* --------------------------------------------------------------------------
     Canvas Drawing
     -------------------------------------------------------------------------- */
  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    var dpr = window.devicePixelRatio || 1;
    state.width = rect.width;
    state.height = rect.width * (7 / 16); // 16:7 aspect ratio
    state.dpr = dpr;

    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);

    updateColors();
    draw();
  }

  function draw() {
    var w = state.width;
    var h = state.height;
    if (w <= 0 || h <= 0) return;

    ctx.save();
    ctx.scale(state.dpr, state.dpr);

    // 1. Panel background
    ctx.fillStyle = colors.sheet;
    ctx.fillRect(0, 0, w, h);

    // 2. 10x10 Graticule (oscilloscope grid)
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.grid;

    var xStep = w / 10;
    var yStep = h / 10;

    ctx.beginPath();
    for (var i = 1; i < 10; i++) {
      var gx = Math.round(i * xStep) + 0.5;
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);

      var gy = Math.round(i * yStep) + 0.5;
      if (i !== 5) { // Skip center line; we'll draw it with accent weight
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
      }
    }
    ctx.stroke();

    // Center horizontal line (slightly darker / emphasized)
    var midY = Math.round(h / 2) + 0.5;
    ctx.beginPath();
    ctx.strokeStyle = colors.graphite;
    ctx.globalAlpha = 0.45;
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Sub-divisions / center axis tick marks
    ctx.beginPath();
    ctx.strokeStyle = colors.grid;
    for (var k = 0; k <= 50; k++) {
      var tx = Math.round(k * (w / 50)) + 0.5;
      ctx.moveTo(tx, midY - 2);
      ctx.lineTo(tx, midY + 2);
    }
    ctx.stroke();

    var cy = h / 2;
    var amp = (h / 2) * 0.82;

    // 3. Draw Real Trace (Natural speech, stroke --trace, 2px)
    if (state.realProgress > 0) {
      var maxRealX = w * state.realProgress;
      ctx.beginPath();
      ctx.strokeStyle = colors.trace;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      var stepPx = 1; // 1px sampling resolution
      for (var px = 0; px <= maxRealX; px += stepPx) {
        var t = (px / w) * DURATION;
        var val = realSignal(t);
        var py = cy - val * amp;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // 4. Draw Synthetic Trace (stroke --synthetic, 1.5px, 85% opacity)
    if (state.synthActive && state.synthProgress > 0) {
      var maxSynthX = w * state.synthProgress;
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = colors.synthetic;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (var spx = 0; spx <= maxSynthX; spx += stepPx) {
        var st = (spx / w) * DURATION;
        var sval = syntheticSignal(st);
        var spy = cy - sval * amp;
        if (spx === 0) ctx.moveTo(spx, spy);
        else ctx.lineTo(spx, spy);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Cursor line & time readout box (if hover active and not coarse pointer)
    if (state.cursorX !== null && !mqPointerCoarse.matches) {
      var cx = Math.max(0, Math.min(w, state.cursorX));
      var timeSec = ((cx / w) * DURATION).toFixed(2);

      // Vertical cursor line
      ctx.beginPath();
      ctx.strokeStyle = colors.graphite;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.moveTo(cx + 0.5, 0);
      ctx.lineTo(cx + 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Readout box
      var readoutText = 't = ' + timeSec + ' s';
      ctx.font = '500 11px Archivo, system-ui, sans-serif';
      var textMetrics = ctx.measureText(readoutText);
      var boxPad = 6;
      var boxW = textMetrics.width + boxPad * 2;
      var boxH = 20;

      // Position box near cursor, flipping side if near edge
      var boxX = cx + 8;
      if (boxX + boxW > w - 4) boxX = cx - boxW - 8;
      var boxY = 8;

      ctx.fillStyle = colors.sheet;
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW, boxH);

      ctx.fillStyle = colors.ink;
      ctx.textBaseline = 'middle';
      ctx.fillText(readoutText, boxX + boxPad, boxY + boxH / 2);
    }

    ctx.restore();
  }

  /* --------------------------------------------------------------------------
     Animation Engine
     -------------------------------------------------------------------------- */
  var animFrameId = null;

  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  function startAnimation(animateReal, animateSynth) {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (mqReducedMotion.matches) {
      state.realProgress = 1.0;
      if (state.synthActive) state.synthProgress = 1.0;
      draw();
      return;
    }

    var startTime = performance.now();
    var realDuration = animateReal ? 1400 : 0;
    var synthDuration = animateSynth ? 900 : 0;
    var totalDuration = Math.max(realDuration, synthDuration, 1);

    var initialReal = animateReal ? 0 : state.realProgress;
    var initialSynth = animateSynth ? 0 : state.synthProgress;

    state.animating = true;

    function step(now) {
      var elapsed = now - startTime;

      if (animateReal) {
        var rNorm = Math.min(1, elapsed / realDuration);
        state.realProgress = easeOutCubic(rNorm);
      }

      if (animateSynth && state.synthActive) {
        var sNorm = Math.min(1, elapsed / synthDuration);
        state.synthProgress = easeOutCubic(sNorm);
      }

      draw();

      if (elapsed < totalDuration) {
        animFrameId = requestAnimationFrame(step);
      } else {
        if (animateReal) state.realProgress = 1.0;
        if (animateSynth && state.synthActive) state.synthProgress = 1.0;
        state.animating = false;
        animFrameId = null;
        draw();
      }
    }

    animFrameId = requestAnimationFrame(step);
  }

  /* --------------------------------------------------------------------------
     Controls & Interaction
     -------------------------------------------------------------------------- */
  function toggleSynthetic() {
    state.synthActive = !state.synthActive;

    if (overlayBtn) {
      overlayBtn.setAttribute('aria-pressed', String(state.synthActive));
      overlayBtn.textContent = state.synthActive ? 'Hide synthetic' : 'Overlay synthetic';
    }

    if (legend) {
      legend.hidden = !state.synthActive;
    }

    if (state.synthActive) {
      state.synthProgress = 0;
      startAnimation(false, true);
    } else {
      state.synthProgress = 0;
      draw();
    }
  }

  function replay() {
    state.realProgress = 0;
    if (state.synthActive) state.synthProgress = 0;
    startAnimation(true, state.synthActive);
  }

  if (overlayBtn) {
    overlayBtn.addEventListener('click', toggleSynthetic);
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', replay);
  }

  // Pointer interactions for the vertical cursor line and readout
  canvas.addEventListener('pointermove', function (e) {
    if (mqPointerCoarse.matches) return;
    var rect = canvas.getBoundingClientRect();
    state.cursorX = e.clientX - rect.left;
    draw();
  });

  canvas.addEventListener('pointerleave', function () {
    state.cursorX = null;
    draw();
  });

  // Theme changes: update colors and redraw immediately
  document.addEventListener('themechange', function () {
    updateColors();
    draw();
  });

  // Watch for prefers-color-scheme changes
  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  if (mqDark.addEventListener) {
    mqDark.addEventListener('change', function () {
      updateColors();
      draw();
    });
  }

  // Debounced resize (150ms)
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 150);
  });

  // Before print: force complete render and light theme
  window.addEventListener('beforeprint', function () {
    state.realProgress = 1.0;
    if (state.synthActive) state.synthProgress = 1.0;
    state.cursorX = null;
    updateColors();
    draw();
  });

  // Initial setup and load animation
  resizeCanvas();
  startAnimation(true, false);
})();
