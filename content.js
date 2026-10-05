/* ==========================================================================
   souravchakraborty.me v2 — content.js
   Single source of truth for portfolio content (DESIGN.md 7 & DESIGN-INTERACTIVE.md 0, 7).
   ========================================================================== */

(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    var exp = factory();
    root.CONTENT = exp.CONTENT;
    root.renderContent = exp;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var CONTENT = {
    profile: {
      name: "Sourav Chakraborty",
      role: "AI backend engineer",
      revision: "Revision Oct 2026",
      location: "Guwahati, Assam",
      origin: "Tripura",
      lede: "AI backend engineer. I build FastAPI services that serve ML models, secure them, and deploy them.",
      availability: "Available for 2026 internships",
      available: true,
      email: "sourav4298532@gmail.com",
      degree: "B.Tech CSE (AI & Data Science)",
      university: "Assam Down Town University",
      batch: "2025–2029",
      cgpa: "8.05",
      links: {
        github: "https://github.com/Srv99x",
        linkedin: "https://linkedin.com/in/srv99x",
        huggingface: "https://huggingface.co/Srv99x",
        orcid: "https://orcid.org/0009-0008-2573-5210",
        resume: "assets/Sourav_resume.pdf"
      }
    },

    projects: [
      {
        id: "voiceguard",
        name: "VoiceGuard AI",
        descriptor: "Deepfake audio detection API",
        date: "Feb 2026",
        dateNum: true,
        status: "live",
        flip: false,
        tech: ["fastapi", "wav2vec2", "jwt-cors", "docker", "github-actions", "huggingface"],
        text: "Cloned voices are hard to tell apart from real ones by ear. For the India AI Impact Buildathon by HCL GUVI, I built a REST API that takes an audio clip and returns a score and a label: natural or synthetic speech. A FastAPI service wraps Meta's Wav2Vec2-Large-XLSR-53 model from HuggingFace. Requests are protected with JWT auth and CORS rules, secrets stay in <code>.env</code>, and every change deploys through GitHub Actions.",
        specs: [
          { key: "Detection accuracy", value: "~91%", isNum: true },
          { key: "Model", value: "Wav2Vec2-Large-XLSR-53", skill: "wav2vec2" },
          { key: "Framework", value: "FastAPI", skill: "fastapi" },
          { key: "Auth", value: "JWT, CORS", skill: "jwt-cors" },
          { key: "Hosting", value: "HuggingFace Spaces", skill: "huggingface" },
          { key: "Containers", value: "Docker (local builds)", skill: "docker" },
          { key: "CI/CD", value: "GitHub Actions", skill: "github-actions" },
          { key: "Context", value: 'India AI Impact Buildathon (HCL GUVI), <span class="num">40,000+</span> participants' }
        ],
        inProgress: "moving sync inference (<code>run_in_executor</code>) to a routers / schemas / services layout.",
        links: [
          { label: "Open live demo", url: "https://voice-detection-ai.vercel.app/", isPrimary: true },
          { label: "View source", url: "https://github.com/Srv99x/voice-detection-ai", isPrimary: false }
        ],
        figure: {
          number: 3,
          caption: 'Figure 3. VoiceGuard AI. An uploaded clip is scored by Wav2Vec2-Large-XLSR-53 behind FastAPI. GitHub Actions deploys the service.'
        }
      },
      {
        id: "medisense",
        name: "MediSense AI",
        descriptor: "Symptom analysis backend",
        date: "Mar 2026",
        dateNum: true,
        status: "live",
        flip: true,
        tech: ["fastapi", "gemini", "jwt-cors", "huggingface", "vercel", "owasp"],
        text: "MediSense turns a plain-language description of symptoms into structured condition cards, each with a probability score and an urgency level for triage. A FastAPI service on HuggingFace Spaces calls Gemini 2.5 Flash and shapes the response. The Vercel frontend never talks to the model directly: it goes through a secure API bridge, and the backend is hardened against the OWASP Top 10.",
        specs: [
          { key: "Model", value: "Gemini 2.5 Flash", skill: "gemini" },
          { key: "Framework", value: "FastAPI", skill: "fastapi" },
          { key: "Hosting", value: "HuggingFace Spaces (API), Vercel (frontend)", skill: "huggingface" },
          { key: "Integration", value: "Secure API bridge" },
          { key: "Auth", value: "JWT, CORS", skill: "jwt-cors" },
          { key: "Security", value: 'OWASP Top <span class="num">10</span> hardening' },
          { key: "Output", value: "Condition cards with probability and urgency" }
        ],
        inProgress: "rebuilding MediSense without AI-assisted code. AI explains, I implement.",
        links: [
          { label: "Open live demo", url: "https://medisense-ai-app.vercel.app/", isPrimary: true },
          { label: "View source", url: "https://github.com/Srv99x/medisense-ai-app", isPrimary: false }
        ],
        figure: {
          number: 4,
          caption: 'Figure 4. MediSense AI. The Vercel frontend reaches Gemini 2.5 Flash only through the FastAPI service, by way of a secure API bridge.'
        }
      },
      {
        id: "audioguard",
        name: "AudioGuard Agent",
        descriptor: "Deepfake-audio risk checks for developer pipelines",
        date: "GitAgent Hackathon",
        dateNum: false,
        status: "project",
        flip: false,
        tech: ["fastapi", "python"],
        text: "An agent that runs inside a developer pipeline, scores audio for deepfake risk, classifies how confident that score is, and writes an audit report. Built for the GitAgent Hackathon.",
        specs: [
          { key: "Input", value: "Audio in a developer pipeline" },
          { key: "Output", value: "Risk score, confidence class, audit report" },
          { key: "Context", value: "GitAgent Hackathon" }
        ],
        inProgress: null,
        links: [
          { label: "View source", url: "https://github.com/Srv99x/audioguard-agent", isPrimary: false }
        ],
        figure: {
          number: 5,
          caption: 'Figure 5. AudioGuard Agent. Audio is risk scored and the result is written up as an audit report.'
        }
      }
    ],

    alsoBuilt: "Also built: Firework Simulator v3",

    skills: [
      { parameter: "Python", tier: "shipped", ratingLabel: "Shipped", testCondition: '<a href="#project-voiceguard">VoiceGuard</a>, <a href="#project-medisense">MediSense</a>', projects: ["voiceguard", "medisense"], skill: "python" },
      { parameter: "FastAPI", tier: "shipped", ratingLabel: "Shipped", testCondition: '<a href="#project-voiceguard">VoiceGuard</a>, <a href="#project-medisense">MediSense</a>', projects: ["voiceguard", "medisense"], skill: "fastapi" },
      { parameter: "JWT auth / CORS", tier: "shipped", ratingLabel: "Shipped", testCondition: '<a href="#project-voiceguard">VoiceGuard</a>, <a href="#project-medisense">MediSense</a>', projects: ["voiceguard", "medisense"], skill: "jwt-cors" },
      { parameter: "GitHub Actions", tier: "shipped", ratingLabel: "Shipped", testCondition: '<a href="#project-voiceguard">VoiceGuard CI/CD</a>', projects: ["voiceguard"], skill: "github-actions" },
      { parameter: "HuggingFace", tier: "shipped", ratingLabel: "Shipped", testCondition: '<a href="#project-voiceguard">Wav2Vec2 on Spaces</a>', projects: ["voiceguard"], skill: "huggingface" },
      { parameter: "Gemini API", tier: "shipped", ratingLabel: "Shipped", testCondition: '<a href="#project-medisense">MediSense</a>', projects: ["medisense"], skill: "gemini" },
      { parameter: "Docker", tier: "project", ratingLabel: "Project", testCondition: 'Local builds', projects: ["voiceguard"], skill: "docker" },
      { parameter: "SQL, C++", tier: "project", ratingLabel: "Coursework", testCondition: 'B.Tech', projects: [], skill: "sql-cpp" },
      { parameter: "MLflow", tier: "project", ratingLabel: "Basics", testCondition: 'Roadmap exercises', projects: [], skill: "mlflow" },
      { parameter: "Async FastAPI", tier: "learning", ratingLabel: "Learning", testCondition: '6-week MLOps plan', projects: [], skill: "async-fastapi" },
      { parameter: "Redis / Celery", tier: "learning", ratingLabel: "Learning", testCondition: '6-week MLOps plan', projects: [], skill: "redis-celery" },
      { parameter: "WebSockets", tier: "learning", ratingLabel: "Learning", testCondition: '<span aria-hidden="true">—</span><span class="visually-hidden">None yet</span>', projects: [], skill: "websockets" }
    ],

    skillLegend: [
      { tier: "shipped", mark: "■", label: "Shipped", note: "(used in a deployed project)" },
      { tier: "project", mark: "□", label: "Project or coursework", note: "" },
      { tier: "learning", mark: "▲", label: "Learning", note: "" }
    ],

    history: [
      { date: "Apr 2026–now", change: "Contributor, GirlScript Summer of Code 2026 (AI Agents and Open Source tracks)" },
      { date: "Mar 2026–now", change: "Open Source Contributor, OSCG. Merged PR, Contributor Badge" },
      { date: "Mar 2026", change: "Shipped MediSense AI" },
      { date: "Feb 2026", change: "Shipped VoiceGuard AI at India AI Impact Buildathon (HCL GUVI)" },
      { date: "2025", change: "Started B.Tech CSE (AI &amp; DS), ADTU" }
    ],
    historyAside: "Also a member of GDG On Campus ADTU.",

    now: {
      fixing: [
        "Moving VoiceGuard and MediSense to containerised, CI-driven workflows",
        "Rebuilding MediSense independently"
      ],
      learning: [
        "Async FastAPI (ASGI lifecycles)",
        "Redis and Celery",
        "WebSocket streaming",
        "Database connection pooling",
        "Multi-stage Docker builds",
        "IBM AI/DS and Azure MLOps certifications"
      ],
      network: 'I write technical breakdowns on <a href="https://linkedin.com/in/srv99x" rel="noopener">LinkedIn</a>, where my network is 1,300+ people.',
      lastUpdated: "October 2026"
    }
  };

  function esc(s) {
    return typeof s === 'string' ? s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : s;
  }

  function renderProjects(projects, alsoBuilt, container) {
    if (!container) return;
    var saved = {};
    projects.forEach(function (p) {
      var panel = container.querySelector ? container.querySelector('#project-' + p.id + ' .diagram__panel') : null;
      if (panel) saved[p.id] = panel.innerHTML;
    });

    var html = projects.map(function (p) {
      var rows = p.specs.map(function (s) {
        return '<tr' + (s.skill ? ' data-skill="' + s.skill + '"' : '') + '><th scope="row">' + esc(s.key) + '</th><td' + (s.isNum ? ' class="num"' : '') + '>' + s.value + '</td></tr>';
      }).join('\n');

      var actions = p.links.map(function (l) {
        return '<a' + (l.isPrimary ? ' class="btn btn--secondary"' : '') + ' href="' + esc(l.url) + '" rel="noopener">' + esc(l.label) + '</a>';
      }).join('\n');

      return (
        '<article class="note' + (p.flip ? ' note--flip' : '') + '" id="project-' + esc(p.id) + '" aria-labelledby="note-' + esc(p.id) + '">' +
          '<header class="note__header">' +
            '<div><h3 class="note__name" id="note-' + esc(p.id) + '">' + esc(p.name) + '</h3><p class="note__descriptor">' + esc(p.descriptor) + '</p></div>' +
            '<p class="note__date' + (p.dateNum ? ' num' : '') + '">' + esc(p.date) + '</p>' +
          '</header>' +
          '<p class="note__text">' + p.text + '</p>' +
          '<div class="note__body">' +
            '<div class="note__specs table-wrap"><table class="specs"><caption>Specifications</caption><tbody>\n' + rows + '\n</tbody></table></div>' +
            '<figure class="figure diagram"><div class="diagram__panel">' + (saved[p.id] || '') + '</div><figcaption class="caption">' + (p.figure ? p.figure.caption : '') + '</figcaption></figure>' +
          '</div>' +
          (p.inProgress ? '<p class="note__progress"><span class="note__progress-mark" aria-hidden="true">▲</span><span><span class="visually-hidden">Status: </span>In progress: ' + p.inProgress + '</span></p>' : '') +
          '<div class="note__actions">' + actions + '</div>' +
        '</article>'
      );
    }).join('\n');

    if (alsoBuilt) html += '\n<p class="also-built">' + esc(alsoBuilt) + '</p>';
    container.innerHTML = html;
  }

  function renderSkills(skills, legend, container) {
    if (!container) return;
    var tiers = ['shipped', 'project', 'learning'];
    var marks = { shipped: '■', project: '□', learning: '▲' };
    var tbodies = tiers.map(function (tier) {
      var list = skills.filter(function (s) { return s.tier === tier; });
      if (!list.length) return '';
      var rows = list.map(function (s) {
        return (
          '<tr' + (s.skill ? ' data-skill="' + s.skill + '"' : '') + '>' +
            '<th scope="row" data-label="Parameter">' + esc(s.parameter) + '</th>' +
            '<td data-label="Rating"><span class="rating rating--' + s.tier + '"><span class="rating__mark" aria-hidden="true">' + marks[s.tier] + '</span>' + esc(s.ratingLabel) + '</span></td>' +
            '<td data-label="Test condition">' + s.testCondition + '</td>' +
          '</tr>'
        );
      }).join('\n');
      return '<tbody>\n' + rows + '\n</tbody>';
    }).join('\n');

    var legendHtml = '';
    if (legend && legend.length) {
      legendHtml = '<ul class="legend" aria-label="Rating legend">\n' +
        legend.map(function (item) {
          return '<li><span class="rating rating--' + item.tier + '"><span class="rating__mark" aria-hidden="true">' + item.mark + '</span>' + esc(item.label) + '</span>' + (item.note ? ' ' + esc(item.note) : '') + '</li>';
        }).join('\n') +
        '\n</ul>';
    }

    container.innerHTML =
      '<div class="table-wrap"><table class="data-table skills"><caption class="visually-hidden">Skills, with proficiency rating and where each was used</caption>' +
      '<thead><tr><th scope="col">Parameter</th><th scope="col">Rating</th><th scope="col">Test condition</th></tr></thead>' +
      tbodies + '</table></div>' + legendHtml;
  }

  function renderHistory(history, aside, container) {
    if (!container) return;
    var rows = history.map(function (h) {
      return '<tr><td class="history__date">' + esc(h.date) + '</td><td>' + h.change + '</td></tr>';
    }).join('\n');
    container.innerHTML =
      '<div class="table-wrap"><table class="data-table history"><caption class="visually-hidden">Experience and milestones, newest first</caption>' +
      '<thead><tr><th scope="col">Date</th><th scope="col">Change</th></tr></thead><tbody>\n' +
      rows + '\n</tbody></table></div>' + (aside ? '<p class="aside-line">' + esc(aside) + '</p>' : '');
  }

  function renderNow(now, container) {
    if (!container) return;
    function ul(arr) { return (arr || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('\n'); }
    container.innerHTML =
      '<div class="now-lists"><div><h3 class="subtitle">Fixing</h3><ul class="plain-list">\n' + ul(now.fixing) + '\n</ul></div>' +
      '<div><h3 class="subtitle">Learning</h3><ul class="plain-list">\n' + ul(now.learning) + '\n</ul></div></div>' +
      (now.network ? '<p class="prose">' + now.network + '</p>' : '') +
      (now.lastUpdated ? '<p class="caption">Last updated: ' + esc(now.lastUpdated) + '</p>' : '');
  }

  function renderAll(data) {
    var d = data || CONTENT;
    if (typeof document === 'undefined') return;

    var workMount = document.getElementById('work-mount') || document.querySelector('#work .section__body');
    var skillsMount = document.getElementById('skills-mount') || document.querySelector('#skills .section__body');
    var historyMount = document.getElementById('history-mount') || document.querySelector('#history .section__body');
    var nowMount = document.getElementById('now-mount') || document.querySelector('#now .section__body');

    if (workMount && d.projects) renderProjects(d.projects, d.alsoBuilt, workMount);
    if (skillsMount && d.skills) renderSkills(d.skills, d.skillLegend, skillsMount);
    if (historyMount && d.history) renderHistory(d.history, d.historyAside, historyMount);
    if (nowMount && d.now) renderNow(d.now, nowMount);

    if (typeof window !== 'undefined' && window.dispatchEvent && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('contentrendered'));
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { renderAll(CONTENT); });
    } else {
      renderAll(CONTENT);
    }
  }

  return {
    CONTENT: CONTENT,
    renderAll: renderAll,
    renderProjects: renderProjects,
    renderSkills: renderSkills,
    renderHistory: renderHistory,
    renderNow: renderNow
  };
});
