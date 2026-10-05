# DESIGN-INTERACTIVE.md — interaction layer for souravchakraborty.me (v2.1)

> Addendum to DESIGN.md. Read DESIGN.md first; everything there still applies unless this file overrides it.
> Goal: make the site something visitors *use*, not just scroll, while keeping the datasheet look.
> Every interaction here shows off a real backend/AI skill of Sourav's. No decorative gimmicks.

---

## 0. Overrides to DESIGN.md

- **Motion rule (section 6) still holds for automatic motion:** only Figure 1 draws on load. Everything in this file is triggered by the visitor (click, drag, type, speak), which section 6 already allows.
- **JS budget (section 9) rises** from 15 KB to **40 KB minified total**. Still no frameworks, no libraries.
- **New files:** `console.js`, `scope.js` (replaces `figure.js`), `trace.js`. All content comes from one `content.js` so the console and the page never disagree.
- Every interactive piece must have a **no-JS fallback** (static content stays readable) and full **keyboard support**.

There are four interactions, ranked by priority. Build them in this order and ship after each one.

---

## 1. Live scope: "Try it with your voice" (upgrades Figure 1)

The hero figure becomes a working instrument instead of an illustration.

```
┌ Figure 1 ─────────────────────────────────────────────────────────┐
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ graticule + live waveform (teal) ~~~/\/\/\~~~/\/\/\~~~         │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ spectrogram strip (64px tall)  ▒▒▓▓░░▒▒▓▓▓░░                   │ │
│ └───────────────────────────────────────────────────────────────┘ │
│ [ Record 5 seconds ]  [ Drop or choose an audio file ]  [ Sample ]│
│ Peak −6.2 dB   Duration 4.8 s   Pitch ≈ 142 Hz                    │
│ Your audio stays in your browser. To check if a clip is a         │
│ deepfake, run it through VoiceGuard AI.                           │
└───────────────────────────────────────────────────────────────────┘
```

**Modes**
1. **Sample (default):** the generated speech signal from DESIGN.md 5.1, drawn once on load. "Overlay synthetic" stays as a button in this mode.
2. **Record 5 seconds:** asks for microphone permission only when clicked (`getUserMedia({audio:true})`). While recording, the waveform scrolls live (AnalyserNode, `requestAnimationFrame`) and a countdown shows on the button ("Recording… 3"). Stops automatically at 5s, then draws the full clip statically.
3. **Drop or choose a file:** accepts `.wav, .mp3, .m4a, .ogg` up to 10 MB via drag-and-drop on the figure or a hidden `<input type="file">`. Decode with `AudioContext.decodeAudioData`, then draw.

**Readouts** (computed in the browser, tabular numerals): peak level in dB, duration, rough pitch estimate (autocorrelation on the loudest 2048-sample window; show "—" if no clear pitch).

**Spectrogram strip:** under the waveform, a 64px-tall strip from an FFT (AnalyserNode, `fftSize 1024`) coloured from `--sheet` to `--trace`. This is what makes the figure feel like a real lab tool.

**Playback:** after recording or loading, a "Play" button plays the clip with a vertical playhead moving across the waveform.

**Honesty and privacy (required copy):**
- Under the buttons: "Your audio stays in your browser. To check if a clip is a deepfake, run it through VoiceGuard AI." (link to the demo).
- Never upload audio anywhere. Never claim to detect deepfakes on this page.
- If mic permission is denied: show "Microphone access was blocked. You can still drop an audio file or use the sample." in place of the readouts.
- If the browser lacks Web Audio: hide Record and File buttons and keep the sample mode.

**Accessibility:** buttons are real `<button>`s; the drop zone is also a button that opens the file picker; readouts sit in an `aria-live="polite"` region; `prefers-reduced-motion` turns the live scrolling waveform into a once-per-second redraw.

---

## 2. API console: "Query me like an API"

A new section between Work and Skills (nav label "Console", section title "Interface", subtitle "Ask about me the way you'd call an API"). This is the piece recruiters for backend roles will remember.

```
┌ Interface ──────────────────────────────────────────────────────────┐
│ Endpoints                 │  GET ▾  /v1/projects?status=live  [Send]│
│  GET  /v1/profile         │ ───────────────────────────────────────│
│  GET  /v1/projects        │  200 OK          38 ms     1.2 KB       │
│  GET  /v1/projects/{id}   │  {                                      │
│  GET  /v1/skills          │    "count": 2,                          │
│  GET  /v1/now             │    "items": [                           │
│  POST /v1/contact         │      { "id": "voiceguard", ...          │
│                           │                                         │
│ Try: ?rating=shipped      │  [ Copy as curl ]   [ Copy JSON ]       │
└─────────────────────────────────────────────────────────────────────┘
```

**How it works**
- Entirely client-side. A tiny router in `console.js` maps method + path + query to handlers that read from `content.js`. Label it clearly: small caption "Runs in your browser against this page's data. No server involved."
- Request line: method `<select>` (GET/POST), path `<input>` with autocomplete from the endpoint list, Send button. Enter key sends. Up/Down arrows cycle request history (last 10, in memory).
- Clicking an endpoint on the left fills the request line.
- Response panel: status line (code, simulated latency 20–60 ms, size), then pretty-printed JSON with syntax colouring using only the theme tokens (keys `--ink`, strings `--trace`, numbers `--flag`, punctuation `--graphite`). JetBrains Mono is allowed here (it's real code).

**Endpoints**

| Method | Path | Returns |
|---|---|---|
| GET | `/v1/profile` | name, role, university, batch, CGPA, location, availability |
| GET | `/v1/projects` | list; supports `?status=live` and `?tech=fastapi` |
| GET | `/v1/projects/{id}` | one project with specs and in-progress notes; ids `voiceguard`, `medisense`, `audioguard` |
| GET | `/v1/skills` | list; supports `?rating=shipped\|project\|learning` |
| GET | `/v1/now` | current roadmap items and last-updated date |
| POST | `/v1/contact` | see below |

**Realistic errors (this is the part that shows backend skill):**
- Unknown path → `404 Not Found` with `{"detail":"Not Found"}` (FastAPI's real format).
- Unknown project id → `404` with `{"detail":"Project 'xyz' not found","available":[...]}`.
- Bad query value → `422 Unprocessable Entity` in FastAPI's validation-error shape (`loc`, `msg`, `type`).
- Wrong method → `405 Method Not Allowed`.

**POST /v1/contact (the payoff)**
- Shows a JSON body editor prefilled with `{"name": "", "email": "", "message": ""}`.
- Without an `Authorization` header → `401 Unauthorized` with `{"detail":"Missing bearer token","hint":"Click 'Get token' to authenticate"}`. A "Get token" button adds a fake header `Authorization: Bearer demo.jwt.token` and visibly shows it in the request line. This demonstrates the JWT pattern from his projects in a playful way.
- With token and valid body → `201 Created`, then open a `mailto:` link to sourav4298532@gmail.com prefilled with the name and message. Say so in the response: `{"status":"created","next":"Your email app is opening with this message"}`.
- Missing fields → `422` naming the missing field.

**Copy as curl:** generates a curl command for the current request against `https://souravchakraborty.me/api/...` with a comment line `# illustrative: this API runs in the browser`.

**Mobile:** endpoint list becomes a horizontal scroll row of chips above the request line; response panel scrolls horizontally inside itself.

**No-JS fallback:** a static `<pre>` showing one example request and response.

---

## 3. Request trace on the architecture diagrams

Figures 3 and 4 (VoiceGuard and MediSense) get a "Send a request" control that animates one request through the diagram, step by step.

```
 Client ──▶ [CORS] ──▶ [JWT check] ──▶ FastAPI ──▶ Wav2Vec2 ──▶ JSON
    ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━▶
 [ Send a request ]  ( ) Valid token  ( ) No token  ( ) Wrong origin

 Step log
  1  Request received                    0 ms
  2  CORS: origin allowed                2 ms
  3  JWT: token valid                    4 ms
  4  Model inference                   310 ms
  5  200 OK  {"label":"human","score":0.08}
```

- A small dot (8px, `--trace`) travels along the SVG path (animate with `getPointAtLength`, ~1.6s total). Each node it passes gets a 2px `--trace` outline for the duration of that step.
- Radio options change the outcome: "No token" stops at the JWT node, turns it `--synthetic`, logs `401 Unauthorized`. "Wrong origin" stops at CORS with `403`. This visually explains the security work without paragraphs.
- The step log is an ordered list (a real sequence, so numbering is correct here) in an `aria-live` region, so screen-reader users get the same story.
- Timings are illustrative; the caption says "Timings illustrative."
- Reduced motion: no travelling dot; steps appear in the log instantly with node highlights.

---

## 4. Linked skills table

Small, but it makes the Characteristics table feel alive.

- Filter buttons (All / Shipped / Project / Learning) with `aria-pressed`, now required (was optional).
- Each "Test condition" cell links to the project it names. Clicking scrolls to that application note and gives it a 2px `--trace` left border for 2 seconds.
- Hovering or focusing a project's tech in a spec table highlights the matching skill rows (and the reverse), using a `data-skill` attribute on both.
- A "Query this in the console" text link under the table fills the console with `GET /v1/skills?rating=shipped` and scrolls there.

---

## 5. Keyboard shortcuts (small, optional)

Only if everything above is done and under budget.
- `/` focuses the console path input.
- `t` toggles theme.
- `?` opens a small dialog listing shortcuts.
- Shortcuts are disabled while typing in an input. No command palette.

---

## 6. Still not allowed

Everything in DESIGN.md section 11, plus: custom cursors, cursor-follow effects, auto-playing sound, 3D/WebGL scenes, a terminal that pretends to be a shell (`ls`, `cd`, `whoami`). The console is an API client, not a fake terminal.

---

## 7. Build order for Antigravity

1. **content.js refactor.** Move all projects, skills, history and now data into `content.js`. Page content renders from it, with static HTML fallback kept in `index.html`.
2. **Live scope** (section 1).
3. **API console** (section 2).
4. **Request trace** (section 3).
5. **Linked skills table** (section 4).
6. **Shortcuts** (section 5), only if under budget.
7. **QA.** Keyboard-only run through every interaction, mic-denied path, Safari iOS (Web Audio needs a user gesture), 360px width, reduced motion, both themes, Lighthouse mobile ≥ 95 for performance and accessibility.

## 8. Acceptance checklist

- [ ] A visitor can record their voice or drop a file and see waveform, spectrogram and readouts, with nothing uploaded.
- [ ] Mic denied and no-Web-Audio paths show a clear message and still work.
- [ ] The console returns correct JSON for every listed endpoint, plus realistic 401/404/405/422 errors.
- [ ] POST /v1/contact with token opens a prefilled email.
- [ ] Request trace shows success, 401 and 403 paths, with a readable step log.
- [ ] Skills filter and cross-links work by keyboard.
- [ ] All interactions work at 360px and with reduced motion.
- [ ] Total JS ≤ 40 KB minified.
