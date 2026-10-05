/* ==========================================================================
   souravchakraborty.me v2 — console.js
   Interactive API console (DESIGN-INTERACTIVE.md section 2).
   ========================================================================== */

(function () {
  'use strict';

  var rootEl = document.getElementById('api-console');
  if (!rootEl) return;

  var methodSelect = document.getElementById('console-method');
  var pathInput = document.getElementById('console-path');
  var sendBtn = document.getElementById('console-send-btn');
  var tokenBtn = document.getElementById('console-token-btn');
  var tokenRemoveBtn = document.getElementById('console-token-remove');
  var authBanner = document.getElementById('console-auth-banner');
  var bodyEditor = document.getElementById('console-body-editor');
  var bodyInput = document.getElementById('console-body-input');
  var statusCodeEl = document.getElementById('console-status-code');
  var latencyEl = document.getElementById('console-latency');
  var sizeEl = document.getElementById('console-size');
  var outputCode = document.querySelector('#console-output code');
  var copyCurlBtn = document.getElementById('console-copy-curl');
  var copyJsonBtn = document.getElementById('console-copy-json');
  var endpointBtns = document.querySelectorAll('.console__endpoint-btn');
  var hintBtns = document.querySelectorAll('.console__hint-btn');

  var state = {
    hasToken: false,
    history: [],
    historyIndex: -1,
    lastResponse: null,
    lastFormattedJson: ''
  };

  var STATUS_MAP = {
    200: 'OK',
    201: 'Created',
    401: 'Unauthorized',
    404: 'Not Found',
    405: 'Method Not Allowed',
    422: 'Unprocessable Entity'
  };

  function res(status, data) {
    return { status: status, statusText: STATUS_MAP[status] || '', data: data };
  }

  function err(status, detail) {
    return res(status, { detail: detail });
  }

  function unproc(loc, msg, type) {
    return res(422, { detail: [{ loc: loc, msg: msg, type: type }] });
  }

  function strip(s) {
    return s ? String(s).replace(/<[^>]+>/g, '').trim() : '';
  }

  function syntaxHighlightJson(jsonObj) {
    var jsonStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj, null, 2);
    var safe = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return safe.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?|[{}[\],:])/g, function (m) {
      var cls = 'json-punct';
      if (m.charCodeAt(0) === 34) cls = /:$/.test(m) ? 'json-key' : 'json-str';
      else if (/true|false|\d/.test(m)) cls = 'json-num';
      return '<span class="' + cls + '">' + m + '</span>';
    });
  }

  function parseUrl(rawUrl) {
    var p = rawUrl.trim();
    if (p.charCodeAt(0) !== 47) p = '/' + p;
    var qIdx = p.indexOf('?'), query = {}, pathname = p;
    if (qIdx !== -1) {
      pathname = p.slice(0, qIdx);
      p.slice(qIdx + 1).split('&').forEach(function (pair) {
        if (!pair) return;
        var parts = pair.split('=');
        query[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      });
    }
    return { pathname: pathname, query: query };
  }

  function handleRequest(method, rawPath, bodyRaw) {
    var parsed = parseUrl(rawPath);
    var path = parsed.pathname, query = parsed.query;
    var content = window.CONTENT || {};

    if ((method === 'POST') !== (path === '/v1/contact')) return err(405, 'Method Not Allowed');

    // 1. GET /v1/profile
    if (path === '/v1/profile') {
      var prof = content.profile || {};
      return res(200, {
        name: prof.name || "Sourav Chakraborty",
        role: prof.role || "AI backend engineer",
        location: prof.location || "Guwahati, Assam",
        origin: prof.origin || "Tripura",
        availability: prof.availability || "Available for 2026 internships",
        university: prof.university || "Assam Down Town University",
        degree: prof.degree || "B.Tech CSE (AI & Data Science)",
        batch: prof.batch || "2025–2029",
        cgpa: prof.cgpa || "8.05",
        email: prof.email || "sourav4298532@gmail.com",
        links: prof.links || {}
      });
    }

    // 2. GET /v1/projects
    if (path === '/v1/projects') {
      var all = content.projects || [];
      var filtered = all.slice();

      if (query.status !== undefined) {
        if (query.status !== 'live' && query.status !== 'project') {
          return unproc(["query", "status"], "Input should be 'live' or 'project'", "literal_error");
        }
        filtered = filtered.filter(function (p) { return p.status === query.status; });
      }

      if (query.tech !== undefined) {
        var t = query.tech.toLowerCase();
        filtered = filtered.filter(function (p) {
          return (p.tech || []).some(function (item) { return item.toLowerCase().indexOf(t) !== -1; });
        });
      }

      var items = filtered.map(function (p) {
        return {
          id: p.id,
          name: p.name,
          descriptor: p.descriptor,
          date: p.date,
          status: p.status,
          tech: p.tech,
          text: strip(p.text),
          inProgress: p.inProgress ? strip(p.inProgress) : null,
          links: p.links
        };
      });

      return res(200, { count: items.length, items: items });
    }

    // 3. GET /v1/projects/{id}
    if (path.startsWith('/v1/projects/')) {
      var pid = path.slice('/v1/projects/'.length).trim().toLowerCase();
      var prjList = content.projects || [];
      var found = prjList.find(function (p) { return p.id.toLowerCase() === pid; });

      if (!found) {
        return res(404, {
          detail: "Project '" + pid + "' not found",
          available: prjList.map(function (p) { return p.id; })
        });
      }

      return res(200, {
        id: found.id,
        name: found.name,
        descriptor: found.descriptor,
        date: found.date,
        status: found.status,
        tech: found.tech,
        text: strip(found.text),
        specs: (found.specs || []).map(function (s) { return { key: s.key, value: strip(s.value) }; }),
        inProgress: found.inProgress ? strip(found.inProgress) : null,
        links: found.links
      });
    }

    // 4. GET /v1/skills
    if (path === '/v1/skills') {
      var allSkills = content.skills || [];
      var sFiltered = allSkills.slice();

      if (query.rating !== undefined) {
        var r = query.rating.toLowerCase();
        if (r !== 'shipped' && r !== 'project' && r !== 'learning') {
          return unproc(["query", "rating"], "Input should be 'shipped', 'project' or 'learning'", "literal_error");
        }
        sFiltered = sFiltered.filter(function (s) { return s.tier === r; });
      }

      var sItems = sFiltered.map(function (s) {
        return {
          parameter: s.parameter,
          rating: s.tier,
          ratingLabel: s.ratingLabel,
          testCondition: strip(s.testCondition),
          projects: s.projects || []
        };
      });

      return res(200, { count: sItems.length, items: sItems });
    }

    // 5. GET /v1/now
    if (path === '/v1/now') {
      var n = content.now || {};
      return res(200, {
        fixing: n.fixing || [],
        learning: n.learning || [],
        lastUpdated: n.lastUpdated || "October 2026"
      });
    }

    // 6. POST /v1/contact
    if (path === '/v1/contact') {
      if (!state.hasToken) {
        return res(401, {
          detail: "Missing bearer token",
          hint: "Click 'Get token' to authenticate"
        });
      }

      var body = {};
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch (e) {
        return unproc(["body"], "JSON decode error: " + e.message, "value_error.jsondecode");
      }

      var missing = [];
      if (!body.name || !body.name.trim()) missing.push('name');
      if (!body.email || !body.email.trim()) missing.push('email');
      if (!body.message || !body.message.trim()) missing.push('message');

      if (missing.length) {
        return res(422, {
          detail: missing.map(function (f) {
            return { loc: ["body", f], msg: "Field required", type: "missing" };
          })
        });
      }

      var sub = encodeURIComponent('Portfolio Contact from ' + body.name);
      var b = encodeURIComponent(body.message + '\n\nReply to: ' + body.email);
      setTimeout(function () {
        window.location.href = 'mailto:sourav4298532@gmail.com?subject=' + sub + '&body=' + b;
      }, 500);

      return res(201, {
        status: "created",
        next: "Your email app is opening with this message",
        contact: { name: body.name, email: body.email, message: body.message }
      });
    }

    return err(404, 'Not Found');
  }

  function executeCurrentRequest() {
    var method = methodSelect.value;
    var path = pathInput.value.trim() || '/v1/profile';
    var body = bodyInput ? bodyInput.value : '';

    if (!state.history.length || state.history[state.history.length - 1] !== path) {
      state.history.push(path);
      if (state.history.length > 10) state.history.shift();
    }
    state.historyIndex = state.history.length;

    var latency = Math.floor(Math.random() * 35) + 20;
    var r = handleRequest(method, path, body);
    state.lastResponse = r;

    var raw = JSON.stringify(r.data, null, 2);
    state.lastFormattedJson = raw;

    var byteSize = new Blob([raw]).size;
    var sizeStr = byteSize > 1024 ? (byteSize / 1024).toFixed(1) + ' KB' : byteSize + ' B';

    setTimeout(function () {
      statusCodeEl.textContent = r.status + ' ' + r.statusText;
      statusCodeEl.className = 'console__status-code';
      if (r.status >= 400 && r.status < 500) {
        if (r.status === 401 || r.status === 422) statusCodeEl.classList.add('is-warn');
        else statusCodeEl.classList.add('is-error');
      } else if (r.status >= 500) {
        statusCodeEl.classList.add('is-error');
      }

      latencyEl.textContent = latency + ' ms';
      sizeEl.textContent = sizeStr;
      outputCode.innerHTML = syntaxHighlightJson(r.data);
    }, latency);
  }

  function syncMethodAndBody() {
    if (bodyEditor) bodyEditor.hidden = (methodSelect.value !== 'POST');
  }

  function setToken(active) {
    state.hasToken = active;
    if (authBanner) authBanner.hidden = !active;
    if (tokenBtn) {
      tokenBtn.classList.toggle('is-active', active);
      tokenBtn.textContent = active ? 'Token active' : 'Get token';
    }
  }

  if (tokenBtn) tokenBtn.addEventListener('click', function () { setToken(!state.hasToken); });
  if (tokenRemoveBtn) tokenRemoveBtn.addEventListener('click', function () { setToken(false); });
  if (sendBtn) sendBtn.addEventListener('click', executeCurrentRequest);

  if (pathInput) {
    pathInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeCurrentRequest();
      } else if (e.key === 'ArrowUp') {
        if (state.history.length && state.historyIndex > 0) {
          state.historyIndex--;
          pathInput.value = state.history[state.historyIndex];
          e.preventDefault();
        }
      } else if (e.key === 'ArrowDown') {
        if (state.history.length && state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          pathInput.value = state.history[state.historyIndex];
          e.preventDefault();
        }
      }
    });
  }

  if (methodSelect) methodSelect.addEventListener('change', syncMethodAndBody);

  Array.prototype.forEach.call(endpointBtns, function (btn) {
    btn.addEventListener('click', function () {
      Array.prototype.forEach.call(endpointBtns, function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      methodSelect.value = btn.getAttribute('data-method') || 'GET';
      pathInput.value = btn.getAttribute('data-path') || '/v1/profile';
      syncMethodAndBody();
      executeCurrentRequest();
    });
  });

  Array.prototype.forEach.call(hintBtns, function (hBtn) {
    hBtn.addEventListener('click', function () {
      methodSelect.value = hBtn.getAttribute('data-method') || 'GET';
      pathInput.value = hBtn.getAttribute('data-path') || '/v1/skills';
      syncMethodAndBody();
      executeCurrentRequest();
    });
  });

  function copyText(str, btn) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(str).then(function () {
      var orig = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = orig; }, 2000);
    });
  }

  if (copyCurlBtn) {
    copyCurlBtn.addEventListener('click', function () {
      var m = methodSelect.value;
      var p = pathInput.value.trim() || '/v1/profile';
      var u = 'https://souravchakraborty.me/api' + (p.startsWith('/') ? p : '/' + p);
      var lines = [
        '# illustrative: this API runs in the browser',
        'curl -X ' + m + ' "' + u + '" \\',
        '  -H "Accept: application/json"'
      ];
      if (state.hasToken) lines.push('  -H "Authorization: Bearer demo.jwt.token"');
      if (m === 'POST') {
        lines.push('  -H "Content-Type: application/json" \\');
        lines.push("  -d '" + (bodyInput ? bodyInput.value.replace(/'/g, "'\\''") : '{}') + "'");
      }
      copyText(lines.join('\n'), copyCurlBtn);
    });
  }

  if (copyJsonBtn) {
    copyJsonBtn.addEventListener('click', function () {
      if (state.lastFormattedJson) copyText(state.lastFormattedJson, copyJsonBtn);
    });
  }

  syncMethodAndBody();
  executeCurrentRequest();
})();
