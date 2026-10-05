/* ==========================================================================
   souravchakraborty.me v2 — trace.js
   Request tracing on Figure 3 & Figure 4 architecture diagrams (DESIGN-INTERACTIVE.md 3).
   ========================================================================== */

(function () {
  'use strict';

  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  var CONFIGS = {
    voiceguard: {
      sel: '#project-voiceguard .diagram',
      x: 95.5,
      nodes: [20, 96, 172, 248],
      paths: {
        valid: [
          [0, 'Request received (audio clip: 2.0 s, 32 KB)', '0 ms'],
          [1, 'CORS: origin allowed', '2 ms'],
          [1, 'JWT: Bearer token valid (HS256)', '4 ms'],
          [2, 'Model inference: Wav2Vec2-Large-XLSR-53', '310 ms'],
          [3, '200 OK {"label":"natural","score":0.08}', '316 ms']
        ],
        notoken: [
          [0, 'Request received (audio clip: 2.0 s, 32 KB)', '0 ms'],
          [1, 'CORS: origin allowed', '2 ms'],
          [1, 'JWT: missing Bearer token (401 Unauthorized)', '4 ms', 1]
        ],
        wrongorigin: [
          [0, 'Request received from untrusted origin', '0 ms'],
          [1, 'CORS: origin rejected by policy (403 Forbidden)', '2 ms', 1]
        ]
      }
    },
    medisense: {
      sel: '#project-medisense .diagram',
      x: 110.5,
      nodes: [22, 98, 174, 250, 326],
      paths: {
        valid: [
          [0, 'Request initiated from frontend interface', '0 ms'],
          [1, 'API bridge: secure HMAC payload signature valid', '3 ms'],
          [2, 'FastAPI: JWT verified & OWASP sanitize passed', '6 ms'],
          [3, 'Gemini 2.5 Flash: structured symptom reasoning', '420 ms'],
          [4, '200 OK condition cards generated (urgency: low)', '428 ms']
        ],
        notoken: [
          [0, 'Request initiated from frontend interface', '0 ms'],
          [1, 'API bridge: missing HMAC signature (401 Unauthorized)', '3 ms', 1]
        ],
        wrongorigin: [
          [0, 'Request initiated with mismatched CORS origin header', '0 ms'],
          [1, 'CORS: origin rejected at edge bridge (403 Forbidden)', '2 ms', 1]
        ]
      }
    }
  };

  function initTrace(key) {
    var c = CONFIGS[key];
    if (!c) return;
    var container = document.querySelector(c.sel);
    if (!container) return;

    var prev = container.querySelector('.trace__controls');
    if (prev) prev.remove();

    var wrap = document.createElement('div');
    wrap.className = 'trace__controls';
    wrap.innerHTML =
      '<div class="trace__buttons">' +
        '<button class="btn btn--secondary btn--sm trace__send-btn" type="button">Send a request</button>' +
        '<div class="trace__radios" role="radiogroup" aria-label="' + key + ' outcome">' +
          '<label class="trace__radio"><input type="radio" name="tr-' + key + '" value="valid" checked> Valid token</label>' +
          '<label class="trace__radio"><input type="radio" name="tr-' + key + '" value="notoken"> No token</label>' +
          '<label class="trace__radio"><input type="radio" name="tr-' + key + '" value="wrongorigin"> Wrong origin</label>' +
        '</div>' +
      '</div>' +
      '<ol class="trace__log num" aria-live="polite" aria-label="Step log"></ol>' +
      '<p class="trace__caption caption">Timings illustrative.</p>';

    container.appendChild(wrap);

    var sendBtn = wrap.querySelector('.trace__send-btn');
    var log = wrap.querySelector('.trace__log');
    var svg = container.querySelector('svg');
    var boxes = svg ? svg.querySelectorAll('rect.d-box') : [];

    var dot = svg ? svg.querySelector('.trace__dot') : null;
    if (svg && !dot) {
      dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'trace__dot');
      dot.setAttribute('r', '4');
      dot.setAttribute('fill', 'var(--trace)');
      dot.setAttribute('opacity', '0');
      svg.appendChild(dot);
    }

    var animId = null;

    function reset() {
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      Array.prototype.forEach.call(boxes, function (b) { b.classList.remove('is-active', 'is-error'); });
      if (dot) dot.setAttribute('opacity', '0');
    }

    function run() {
      reset();
      log.innerHTML = '';
      var outcome = 'valid';
      var checked = wrap.querySelector('input[type="radio"]:checked');
      if (checked) outcome = checked.value;

      var steps = c.paths[outcome] || c.paths.valid;
      var last = steps[steps.length - 1];

      function renderItem(s) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="trace__log-step' + (s[3] ? ' trace__log-err' : '') + '">' + s[1] + '</span><span class="trace__log-time">' + s[2] + '</span>';
        log.appendChild(li);
      }

      if (mqReduced.matches) {
        steps.forEach(renderItem);
        if (boxes[last[0]]) boxes[last[0]].classList.add(last[3] ? 'is-error' : 'is-active');
        return;
      }

      var startY = c.nodes[0];
      var endY = c.nodes[last[0]];

      var guide = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      guide.setAttribute('d', 'M ' + c.x + ' ' + startY + ' V ' + endY);
      var totalLen = guide.getTotalLength();

      dot.setAttribute('cx', String(c.x));
      dot.setAttribute('cy', String(startY));
      dot.setAttribute('fill', 'var(--trace)');
      dot.setAttribute('opacity', '1');

      var start = performance.now();
      var dur = 1600;
      var currentStep = 0;

      function frame(now) {
        var p = Math.min(1, (now - start) / dur);
        var pt = guide.getPointAtLength(p * totalLen);
        dot.setAttribute('cy', pt.y.toFixed(1));

        var targetIdx = Math.floor(p * steps.length);
        while (currentStep <= targetIdx && currentStep < steps.length) {
          var step = steps[currentStep];
          renderItem(step);
          if (boxes[step[0]]) {
            if (step[3]) {
              boxes[step[0]].classList.add('is-error');
              dot.setAttribute('fill', 'var(--synthetic)');
            } else {
              boxes[step[0]].classList.add('is-active');
            }
          }
          currentStep++;
        }

        if (p < 1) animId = requestAnimationFrame(frame);
        else animId = null;
      }

      animId = requestAnimationFrame(frame);
    }

    if (sendBtn) sendBtn.addEventListener('click', run);
  }

  function initAll() {
    initTrace('voiceguard');
    initTrace('medisense');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  window.addEventListener('contentrendered', initAll);
})();
