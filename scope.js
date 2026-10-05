/* ==========================================================================
   souravchakraborty.me v2 — scope.js
   Live scope instrument for Figure 1 (DESIGN-INTERACTIVE.md section 1).
   Replaces figure.js.
   ========================================================================== */

(function () {
  'use strict';

  var figure = document.getElementById('figure-1');
  var canvas = document.getElementById('figure-1-canvas');
  var specCanvas = document.getElementById('figure-1-spectrogram');
  var overlayBtn = document.getElementById('figure-overlay-btn');
  var replayBtn = document.getElementById('figure-replay-btn');
  var legend = document.getElementById('figure-legend');
  var recordBtn = document.getElementById('scope-record-btn');
  var fileBtn = document.getElementById('scope-file-btn');
  var fileInput = document.getElementById('scope-file-input');
  var sampleBtn = document.getElementById('scope-sample-btn');
  var playBtn = document.getElementById('scope-play-btn');
  var readouts = document.getElementById('scope-readouts');
  var caption = document.getElementById('scope-caption');

  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var specCtx = specCanvas ? specCanvas.getContext('2d') : null;
  if (!ctx) return;

  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqCoarse = window.matchMedia('(pointer: coarse)');

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  function getAudioCtx() {
    if (!AudioCtx) return null;
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  var colors = {
    sheet: '#FFFFFF',
    grid: '#D5DCDD',
    graphite: '#55606B',
    trace: '#0B7A75',
    synthetic: '#B23A48',
    ink: '#13202B'
  };

  function parseHex(hex) {
    hex = hex.replace('#', '').trim();
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function updateColors() {
    var cs = getComputedStyle(document.documentElement);
    ['sheet', 'grid', 'graphite', 'trace', 'synthetic', 'ink'].forEach(function (k) {
      colors[k] = cs.getPropertyValue('--' + k).trim() || colors[k];
    });
  }

  var state = {
    mode: 'sample',
    realProgress: 0,
    synthProgress: 0,
    synthActive: false,
    animating: false,
    cursorX: null,
    playhead: null,
    width: 0,
    height: 0,
    specHeight: 64,
    dpr: 1,

    audioBuffer: null,
    channelData: null,
    sampleRate: 44100,
    duration: 2.0,
    peakDb: '-3.1',
    pitch: 140,

    isRecording: false,
    recordingTimer: null,
    recordingLeft: 5,
    mediaStream: null,
    recordedChunks: [],

    isPlaying: false,
    playbackSource: null,
    playbackStartTime: 0
  };

  var SAMPLE_DURATION = 2.0;
  var SYLLABLES = [
    [0.24, 0.08, 0.82],
    [0.62, 0.11, 1.00],
    [1.02, 0.09, 0.74],
    [1.42, 0.12, 0.92],
    [1.78, 0.07, 0.58]
  ];

  function envelope(t) {
    var s = 0.015;
    for (var i = 0; i < SYLLABLES.length; i++) {
      var d = (t - SYLLABLES[i][0]) / SYLLABLES[i][1];
      s += SYLLABLES[i][2] * Math.exp(-0.5 * d * d);
    }
    return s;
  }

  function realSignal(t) {
    var env = envelope(t);
    var p = 2 * Math.PI * (136 * t + 2.5 * t * t);
    var c = Math.sin(p) + 0.48 * Math.sin(2 * p + 0.45) + 0.26 * Math.sin(3 * p + 1.25) + 0.14 * Math.sin(5 * p + 2.1);
    return env * c * 0.76;
  }

  function syntheticSignal(t) {
    var env = envelope(t);
    var p = 2 * Math.PI * 162 * t;
    var c = Math.sin(p) + 0.55 * Math.sin(2 * p) + 0.32 * Math.sin(3 * p) + 0.20 * Math.sin(4 * p);
    var click = 0;
    if (Math.abs(t - 0.62) < 0.008) click = 0.55 * Math.sin((t - 0.62) * 500);
    if (Math.abs(t - 1.42) < 0.008) click = -0.48 * Math.sin((t - 1.42) * 500);
    var shimmer = 0.22 * Math.sin(2 * Math.PI * 2350 * t) + 0.12 * Math.sin(2 * Math.PI * 3720 * t);
    return (env * (c + shimmer) + click) * 0.74;
  }

  function computePeakDb(data) {
    var peak = 0;
    for (var i = 0; i < data.length; i++) {
      var v = Math.abs(data[i]);
      if (v > peak) peak = v;
    }
    if (peak < 0.00001) return '-∞';
    var db = 20 * Math.log10(peak);
    return (db > 0 ? 0 : db).toFixed(1);
  }

  function estimatePitch(data, rate) {
    var win = 2048;
    if (data.length < win) return null;

    var maxRms = 0, bestOff = 0;
    for (var o = 0; o + win < data.length; o += 512) {
      var sq = 0;
      for (var i = 0; i < win; i += 4) { var val = data[o + i]; sq += val * val; }
      if (sq > maxRms) { maxRms = sq; bestOff = o; }
    }
    if (maxRms < 0.0005) return null;

    var minLag = Math.floor(rate / 500), maxLag = Math.floor(rate / 50);
    var bestCorr = 0, bestLag = -1;

    for (var lag = minLag; lag <= maxLag; lag++) {
      var corr = 0, nA = 0, nB = 0;
      for (var j = 0; j < win - lag; j += 2) {
        var a = data[bestOff + j], b = data[bestOff + j + lag];
        corr += a * b; nA += a * a; nB += b * b;
      }
      var norm = Math.sqrt(nA * nB);
      if (norm > 0) {
        var nc = corr / norm;
        if (nc > bestCorr) { bestCorr = nc; bestLag = lag; }
      }
    }

    if (bestCorr > 0.35 && bestLag > 0) {
      var hz = Math.round(rate / bestLag);
      if (hz >= 50 && hz <= 500) return hz;
    }
    return null;
  }

  function updateReadouts(peakDb, duration, pitch) {
    if (!readouts) return;
    readouts.innerHTML =
      '<span>Peak −' + Math.abs(parseFloat(peakDb)).toFixed(1) + ' dB</span>' +
      '<span>Duration ' + parseFloat(duration).toFixed(1) + ' s</span>' +
      '<span>' + (pitch ? 'Pitch ≈ ' + pitch + ' Hz' : 'Pitch —') + '</span>';
  }

  function showMsg(msg) {
    if (readouts) readouts.innerHTML = '<span class="scope__message">' + msg + '</span>';
  }

  function drawGrid(c, w, h) {
    c.fillStyle = colors.sheet;
    c.fillRect(0, 0, w, h);
    c.lineWidth = 1;
    c.strokeStyle = colors.grid;
    c.beginPath();
    for (var i = 1; i < 10; i++) {
      var gx = Math.round(i * (w / 10)) + 0.5, gy = Math.round(i * (h / 10)) + 0.5;
      c.moveTo(gx, 0); c.lineTo(gx, h);
      if (i !== 5) { c.moveTo(0, gy); c.lineTo(w, gy); }
    }
    c.stroke();

    var midY = Math.round(h / 2) + 0.5;
    c.beginPath();
    c.strokeStyle = colors.graphite;
    c.globalAlpha = 0.45;
    c.moveTo(0, midY); c.lineTo(w, midY);
    c.stroke();
    c.globalAlpha = 1;

    c.beginPath();
    c.strokeStyle = colors.grid;
    for (var k = 0; k <= 50; k++) {
      var tx = Math.round(k * (w / 50)) + 0.5;
      c.moveTo(tx, midY - 2); c.lineTo(tx, midY + 2);
    }
    c.stroke();
  }

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    var dpr = window.devicePixelRatio || 1;
    state.width = rect.width;
    state.height = rect.width * (7 / 16);
    state.dpr = dpr;

    canvas.width = Math.round(state.width * dpr);
    canvas.height = Math.round(state.height * dpr);

    if (specCanvas) {
      specCanvas.width = Math.round(state.width * dpr);
      specCanvas.height = Math.round(state.specHeight * dpr);
    }

    updateColors();
    drawWaveform();
    drawSpectrogram();
  }

  function drawWaveform() {
    var w = state.width, h = state.height;
    if (w <= 0 || h <= 0) return;

    ctx.save();
    ctx.scale(state.dpr, state.dpr);
    drawGrid(ctx, w, h);

    var cy = h / 2, amp = cy * 0.82;

    if (state.mode === 'sample') {
      if (state.realProgress > 0) {
        var maxRX = w * state.realProgress;
        ctx.beginPath();
        ctx.strokeStyle = colors.trace;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        for (var px = 0; px <= maxRX; px++) {
          var py = cy - realSignal((px / w) * SAMPLE_DURATION) * amp;
          if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      if (state.synthActive && state.synthProgress > 0) {
        var maxSX = w * state.synthProgress;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = colors.synthetic;
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (var spx = 0; spx <= maxSX; spx++) {
          var spy = cy - syntheticSignal((spx / w) * SAMPLE_DURATION) * amp;
          if (spx === 0) ctx.moveTo(spx, spy); else ctx.lineTo(spx, spy);
        }
        ctx.stroke();
        ctx.restore();
      }
    } else if (state.channelData) {
      var data = state.channelData, total = data.length, perPx = total / w;
      ctx.beginPath();
      ctx.strokeStyle = colors.trace;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      for (var col = 0; col < w; col++) {
        var sIdx = Math.floor(col * perPx), eIdx = Math.min(total, Math.floor((col + 1) * perPx));
        var mn = 1.0, mx = -1.0;
        for (var si = sIdx; si < eIdx; si++) {
          var v = data[si];
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
        if (mn > mx) { mn = 0; mx = 0; }
        var y1 = cy - mx * amp, y2 = cy - mn * amp;
        if (y2 - y1 < 1) y2 = y1 + 1;
        ctx.moveTo(col + 0.5, y1);
        ctx.lineTo(col + 0.5, y2);
      }
      ctx.stroke();
    }

    if (state.playhead !== null) {
      var phX = Math.round(w * state.playhead) + 0.5;
      ctx.beginPath();
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 2;
      ctx.moveTo(phX, 0); ctx.lineTo(phX, h);
      ctx.stroke();
    }

    if (state.cursorX !== null && !mqCoarse.matches && !state.isRecording) {
      var curX = Math.max(0, Math.min(w, state.cursorX));
      var dur = state.mode === 'sample' ? SAMPLE_DURATION : state.duration;
      var timeSec = ((curX / w) * dur).toFixed(2);

      ctx.beginPath();
      ctx.strokeStyle = colors.graphite;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.moveTo(curX + 0.5, 0); ctx.lineTo(curX + 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]);

      var txt = 't = ' + timeSec + ' s';
      ctx.font = '500 11px Archivo, system-ui, sans-serif';
      var m = ctx.measureText(txt);
      var bw = m.width + 12, bh = 20;
      var bx = curX + 8;
      if (bx + bw > w - 4) bx = curX - bw - 8;

      ctx.fillStyle = colors.sheet;
      ctx.fillRect(bx, 8, bw, bh);
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, 8.5, bw, bh);
      ctx.fillStyle = colors.ink;
      ctx.textBaseline = 'middle';
      ctx.fillText(txt, bx + 6, 8 + bh / 2);
    }

    ctx.restore();
  }

  function drawSpectrogram() {
    if (!specCtx || !specCanvas) return;
    var w = state.width, h = state.specHeight;
    if (w <= 0 || h <= 0) return;

    specCtx.save();
    specCtx.scale(state.dpr, state.dpr);
    specCtx.fillStyle = colors.sheet;
    specCtx.fillRect(0, 0, w, h);

    var sr = parseHex(colors.sheet), tr = parseHex(colors.trace);
    var cols = Math.min(Math.floor(w), 320), colW = w / cols;
    var bands = 32, bandH = h / bands;

    function fillCell(x, y, mag) {
      var r = Math.round(sr.r + (tr.r - sr.r) * mag);
      var g = Math.round(sr.g + (tr.g - sr.g) * mag);
      var b = Math.round(sr.b + (tr.b - sr.b) * mag);
      specCtx.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      specCtx.fillRect(x, y, colW + 0.5, bandH + 0.5);
    }

    if (state.mode === 'sample') {
      for (var c = 0; c < cols; c++) {
        var env = envelope((c / cols) * SAMPLE_DURATION);
        for (var b = 0; b < bands; b++) {
          var fn = (bands - 1 - b) / bands;
          var f1 = Math.exp(-Math.pow((fn - 0.15) / 0.08, 2));
          var f2 = Math.exp(-Math.pow((fn - 0.38) / 0.12, 2));
          var f3 = Math.exp(-Math.pow((fn - 0.65) / 0.15, 2));
          fillCell(c * colW, b * bandH, Math.min(1, Math.max(0, env * (0.6 * f1 + 0.35 * f2 + 0.25 * f3))));
        }
      }
    } else if (state.channelData) {
      var d = state.channelData, sLen = Math.floor(d.length / cols);
      for (var col = 0; col < cols; col++) {
        var start = col * sLen, sq = 0;
        for (var s = 0; s < sLen; s += 8) { var v = d[start + s] || 0; sq += v * v; }
        var rms = Math.sqrt(sq / (sLen / 8));
        for (var band = 0; band < bands; band++) {
          var bn = (bands - 1 - band) / bands;
          fillCell(col * colW, band * bandH, Math.min(1, Math.max(0, rms * 4.5 * Math.exp(-bn * 2.2))));
        }
      }
    }

    specCtx.strokeStyle = colors.grid;
    specCtx.lineWidth = 1;
    specCtx.strokeRect(0.5, 0.5, w - 1, h - 1);
    specCtx.font = '500 10px Archivo, system-ui, sans-serif';
    specCtx.fillStyle = colors.graphite;
    specCtx.textBaseline = 'top';
    specCtx.fillText('SPECTROGRAM', 8, 6);
    specCtx.restore();
  }

  var animFrameId = null;
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }

  function startSampleAnimation(animReal, animSynth) {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    if (mqReduced.matches) {
      state.realProgress = 1;
      if (state.synthActive) state.synthProgress = 1;
      drawWaveform();
      drawSpectrogram();
      return;
    }

    var start = performance.now();
    var rDur = animReal ? 1400 : 0, sDur = animSynth ? 900 : 0;
    var tot = Math.max(rDur, sDur, 1);
    state.animating = true;

    function step(now) {
      var el = now - start;
      if (animReal) state.realProgress = easeOut(Math.min(1, el / rDur));
      if (animSynth && state.synthActive) state.synthProgress = easeOut(Math.min(1, el / sDur));
      drawWaveform();

      if (el < tot) {
        animFrameId = requestAnimationFrame(step);
      } else {
        if (animReal) state.realProgress = 1;
        if (animSynth && state.synthActive) state.synthProgress = 1;
        state.animating = false;
        animFrameId = null;
        drawWaveform();
        drawSpectrogram();
      }
    }
    animFrameId = requestAnimationFrame(step);
  }

  function loadAudioFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Audio file exceeds the 10 MB limit.');
      return;
    }
    var actx = getAudioCtx();
    if (!actx) { showMsg('Web Audio is not supported in this browser.'); return; }
    showMsg('Decoding audio…');
    var reader = new FileReader();
    reader.onload = function (ev) {
      actx.decodeAudioData(ev.target.result, function (decoded) {
        setAudioBuffer(decoded, file.name);
      }, function (err) {
        showMsg('Could not decode audio file: ' + (err ? err.message : 'Unknown format'));
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function setAudioBuffer(buffer, label) {
    state.mode = 'file';
    state.audioBuffer = buffer;
    state.channelData = buffer.getChannelData(0);
    state.sampleRate = buffer.sampleRate;
    state.duration = buffer.duration;
    state.peakDb = computePeakDb(state.channelData);
    state.pitch = estimatePitch(state.channelData, state.sampleRate);
    state.playhead = null;

    updateReadouts(state.peakDb, state.duration, state.pitch);
    if (overlayBtn) overlayBtn.hidden = true;
    if (legend) legend.hidden = true;
    if (playBtn) { playBtn.hidden = false; playBtn.textContent = 'Play'; }
    if (caption) caption.innerHTML = 'Figure 1. Waveform and spectrogram of <strong>' + (label || 'loaded audio') + '</strong>.';

    drawWaveform();
    drawSpectrogram();
  }

  function startRecording() {
    if (state.isRecording) return;
    var actx = getAudioCtx();
    if (!actx) { showMsg('Web Audio is not supported in this browser.'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showMsg('Microphone recording is not supported in this browser.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      state.isRecording = true;
      state.mode = 'recording';
      state.mediaStream = stream;
      state.recordedChunks = [];
      state.recordingLeft = 5;

      if (overlayBtn) overlayBtn.hidden = true;
      if (legend) legend.hidden = true;
      if (playBtn) playBtn.hidden = true;

      recordBtn.textContent = 'Recording… 5';
      showMsg('Recording in progress…');

      var source = actx.createMediaStreamSource(stream);
      var analyser = actx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);

      var mediaRecorder = null;
      try {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = function (e) {
          if (e.data && e.data.size > 0) state.recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = function () {
          var blob = new Blob(state.recordedChunks, { type: 'audio/webm;codecs=opus' });
          var fr = new FileReader();
          fr.onload = function (ev) {
            actx.decodeAudioData(ev.target.result, function (decoded) {
              setAudioBuffer(decoded, 'Voice Recording');
            }, function () {
              showMsg('Recording finished.');
            });
          };
          fr.readAsArrayBuffer(blob);
        };
        mediaRecorder.start();
      } catch (e) {}

      var timeData = new Uint8Array(analyser.frequencyBinCount);
      function renderLive() {
        if (!state.isRecording) return;
        analyser.getByteTimeDomainData(timeData);
        var w = state.width, h = state.height;

        ctx.save();
        ctx.scale(state.dpr, state.dpr);
        drawGrid(ctx, w, h);

        ctx.beginPath();
        ctx.strokeStyle = colors.trace;
        ctx.lineWidth = 2;
        var sliceW = w / timeData.length;
        for (var si = 0; si < timeData.length; si++) {
          var v = (timeData[si] - 128) / 128.0;
          var y = (h / 2) + v * (h / 2) * 0.85;
          if (si === 0) ctx.moveTo(si * sliceW, y);
          else ctx.lineTo(si * sliceW, y);
        }
        ctx.stroke();
        ctx.restore();

        if (!mqReduced.matches) {
          requestAnimationFrame(renderLive);
        } else {
          setTimeout(function () { if (state.isRecording) renderLive(); }, 1000);
        }
      }
      renderLive();

      state.recordingTimer = setInterval(function () {
        state.recordingLeft--;
        if (state.recordingLeft > 0) {
          recordBtn.textContent = 'Recording… ' + state.recordingLeft;
        } else {
          stopRecording(mediaRecorder);
        }
      }, 1000);

    }).catch(function () {
      state.isRecording = false;
      showMsg('Microphone access was blocked. You can still drop an audio file or use the sample.');
    });
  }

  function stopRecording(mediaRecorder) {
    if (!state.isRecording) return;
    state.isRecording = false;
    clearInterval(state.recordingTimer);
    recordBtn.textContent = 'Record 5 seconds';

    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if (state.mediaStream) {
      state.mediaStream.getTracks().forEach(function (t) { t.stop(); });
      state.mediaStream = null;
    }
  }

  function togglePlayback() {
    if (state.isPlaying) { stopPlayback(); return; }
    var actx = getAudioCtx();
    if (!actx) return;

    if (state.mode === 'sample') {
      var sBuf = actx.createBuffer(1, Math.round(actx.sampleRate * SAMPLE_DURATION), actx.sampleRate);
      var cd = sBuf.getChannelData(0);
      for (var i = 0; i < cd.length; i++) cd[i] = realSignal(i / actx.sampleRate) * 0.5;
      playBuffer(actx, sBuf);
    } else if (state.audioBuffer) {
      playBuffer(actx, state.audioBuffer);
    }
  }

  function playBuffer(actx, buffer) {
    var source = actx.createBufferSource();
    source.buffer = buffer;
    source.connect(actx.destination);

    state.isPlaying = true;
    state.playbackSource = source;
    state.playbackStartTime = actx.currentTime;
    if (playBtn) playBtn.textContent = 'Stop';

    source.onended = function () { stopPlayback(); };
    source.start(0);

    function stepPh() {
      if (!state.isPlaying) return;
      var el = actx.currentTime - state.playbackStartTime;
      var p = Math.min(1, el / buffer.duration);
      state.playhead = p;
      drawWaveform();
      if (p < 1) requestAnimationFrame(stepPh);
      else stopPlayback();
    }
    requestAnimationFrame(stepPh);
  }

  function stopPlayback() {
    state.isPlaying = false;
    state.playhead = null;
    if (state.playbackSource) {
      try { state.playbackSource.stop(); } catch (e) {}
      state.playbackSource = null;
    }
    if (playBtn) playBtn.textContent = 'Play';
    drawWaveform();
  }

  function setSampleMode() {
    stopPlayback();
    state.mode = 'sample';
    state.channelData = null;
    state.audioBuffer = null;
    state.playhead = null;
    state.duration = SAMPLE_DURATION;
    state.peakDb = '-3.1';
    state.pitch = 140;

    if (overlayBtn) {
      overlayBtn.hidden = false;
      overlayBtn.setAttribute('aria-pressed', String(state.synthActive));
      overlayBtn.textContent = state.synthActive ? 'Hide synthetic' : 'Overlay synthetic';
    }
    if (legend) legend.hidden = !state.synthActive;
    if (playBtn) { playBtn.hidden = false; playBtn.textContent = 'Play'; }
    if (caption) caption.innerHTML = 'Figure 1. A speech signal. Overlay a synthetic one to see the kind of artifacts VoiceGuard looks for.';

    updateReadouts(state.peakDb, state.duration, state.pitch);
    startSampleAnimation(true, state.synthActive);
  }

  if (sampleBtn) sampleBtn.addEventListener('click', setSampleMode);

  if (overlayBtn) {
    overlayBtn.addEventListener('click', function () {
      state.synthActive = !state.synthActive;
      overlayBtn.setAttribute('aria-pressed', String(state.synthActive));
      overlayBtn.textContent = state.synthActive ? 'Hide synthetic' : 'Overlay synthetic';
      if (legend) legend.hidden = !state.synthActive;
      if (state.synthActive) {
        state.synthProgress = 0;
        startSampleAnimation(false, true);
      } else {
        state.synthProgress = 0;
        drawWaveform();
      }
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', function () {
      if (state.mode === 'sample') {
        state.realProgress = 0;
        if (state.synthActive) state.synthProgress = 0;
        startSampleAnimation(true, state.synthActive);
      } else {
        togglePlayback();
      }
    });
  }

  if (fileBtn && fileInput) {
    fileBtn.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', function (e) {
      if (e.target.files && e.target.files[0]) loadAudioFile(e.target.files[0]);
    });
  }

  if (figure) {
    figure.addEventListener('dragover', function (e) { e.preventDefault(); figure.classList.add('is-dragover'); });
    figure.addEventListener('dragleave', function () { figure.classList.remove('is-dragover'); });
    figure.addEventListener('drop', function (e) {
      e.preventDefault();
      figure.classList.remove('is-dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        loadAudioFile(e.dataTransfer.files[0]);
      }
    });
  }

  if (recordBtn) {
    recordBtn.addEventListener('click', function () {
      if (state.isRecording) stopRecording();
      else startRecording();
    });
  }

  if (playBtn) playBtn.addEventListener('click', togglePlayback);

  canvas.addEventListener('pointermove', function (e) {
    if (mqCoarse.matches) return;
    var rect = canvas.getBoundingClientRect();
    state.cursorX = e.clientX - rect.left;
    drawWaveform();
  });

  canvas.addEventListener('pointerleave', function () {
    state.cursorX = null;
    drawWaveform();
  });

  document.addEventListener('themechange', function () {
    updateColors();
    drawWaveform();
    drawSpectrogram();
  });

  var mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  if (mqDark.addEventListener) {
    mqDark.addEventListener('change', function () {
      updateColors();
      drawWaveform();
      drawSpectrogram();
    });
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 150);
  });

  if (!AudioCtx) {
    if (recordBtn) recordBtn.hidden = true;
    if (fileBtn) fileBtn.hidden = true;
  }

  updateReadouts(state.peakDb, state.duration, state.pitch);
  resizeCanvas();
  startSampleAnimation(true, false);
})();
