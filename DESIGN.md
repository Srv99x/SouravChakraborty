# DESIGN.md — souravchakraborty.me (v2)

> Build spec for a full redesign of Sourav Chakraborty's portfolio.
> Target: static site, vanilla HTML + CSS + JS, deployable to the existing domain.
> Audience for this file: an AI coding agent (Antigravity IDE) and Sourav.
> Read the whole file before writing code. Sections 3–6 are binding; section 10 is the build order.

---

## 1. Concept: "The Datasheet"

Every electronic component ships with a datasheet: a cover with the part name and key features, a block diagram, a table of electrical characteristics measured under stated test conditions, application notes, and a revision history. Engineers trust datasheets because every number comes with the conditions it was measured under.

This portfolio presents Sourav the same way. He builds backends that serve ML models, and his own README is unusually honest about what is production-grade versus AI-assisted versus still being learned. A datasheet is the format built for exactly that kind of honesty: every skill gets a rating *and* the project that proves it.

**What changes from v1.** The current site is dark, centred, blue-accented (#2563eb), with a `skills.yml` code block and GitHub-stats images. v2 is a light, cool-paper technical document with a teal oscilloscope accent, left-aligned on a strict grid, with skills as a measured table and projects as application notes with real block diagrams. No GitHub-stats widgets.

**The one memorable thing.** The hero figure: an oscilloscope-style canvas that draws a speech waveform once on load, and lets the visitor overlay a "synthetic" trace with visible artifacts, referencing VoiceGuard AI. Everything else on the page stays quiet and disciplined so this figure carries the personality.

**The one useful surprise.** The page has a print stylesheet that turns it into a clean two-page datasheet PDF. Recruiters can print or "Save as PDF" and get something resume-grade.

---

## 2. Audience and primary job

- **Who:** internship recruiters and engineering leads (AI backend / MLOps roles, 2026), hackathon judges, open-source maintainers.
- **Primary job:** in under 30 seconds, a visitor should know (1) Sourav builds FastAPI services that serve ML models, (2) he has two deployed projects with live demos, (3) he is available for 2026 internships, (4) how to contact him or get the resume.
- **Secondary job:** reward a technical reader who scrolls, with specifics (models, auth, deployment topology, what's being refactored and why).

---

## 3. Design tokens

### 3.1 Colour

Light ("paper") is the default. Dark ("scope") follows the viewer's OS setting and can be toggled.

| Token | Paper (light) | Scope (dark) | Use |
|---|---|---|---|
| `--paper` | `#F1F4F3` | `#0C1B22` | Page background (cool grey, not cream) |
| `--sheet` | `#FFFFFF` | `#112630` | Figure panels, tables |
| `--ink` | `#13202B` | `#DCE7E6` | Body text, headings (printed-ink blue-black) |
| `--graphite` | `#55606B` | `#8FA3A8` | Secondary text, captions, table headers |
| `--grid` | `#D5DCDD` | `#1F3640` | Rules, table borders, figure grid lines |
| `--trace` | `#0B7A75` | `#4FD1C5` | The accent: waveform trace, links, focus ring, "shipped" rating |
| `--flag` | `#A66F00` | `#E0A82E` | "In progress / learning" status only |
| `--synthetic` | `#B23A48` | `#F0707E` | Only for the synthetic trace in the hero figure |

Rules:
- `--trace` is the only accent used across the page. `--flag` and `--synthetic` each have one narrow job.
- Never put coloured text on coloured background. Links are `--trace` with an underline (offset 3px, thickness 1px, 2px on hover).
- Contrast: `--ink` on `--paper` and `--graphite` on `--paper` must both pass WCAG AA (they do at these values; re-check if changed).

```css
:root {
  --paper:#F1F4F3; --sheet:#FFFFFF; --ink:#13202B; --graphite:#55606B;
  --grid:#D5DCDD; --trace:#0B7A75; --flag:#A66F00; --synthetic:#B23A48;
  color-scheme: light dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --paper:#0C1B22; --sheet:#112630; --ink:#DCE7E6; --graphite:#8FA3A8;
    --grid:#1F3640; --trace:#4FD1C5; --flag:#E0A82E; --synthetic:#F0707E;
  }
}
:root[data-theme="dark"] {
  --paper:#0C1B22; --sheet:#112630; --ink:#DCE7E6; --graphite:#8FA3A8;
  --grid:#1F3640; --trace:#4FD1C5; --flag:#E0A82E; --synthetic:#F0707E;
}
body { background: var(--paper); color: var(--ink); }
```

### 3.2 Typography

One family does almost everything: **Archivo** (Google Fonts, variable, with a width axis 62–125). Width is the main expressive tool: expanded for the name, normal for body, condensed for dense tables.

A second face appears only inside real code samples: **JetBrains Mono**. It is never used for labels, dates, tags or captions.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
--font-sans: "Archivo", "Helvetica Neue", Arial, system-ui, sans-serif;
--font-code: "JetBrains Mono", ui-monospace, "SFMono-Regular", Consolas, monospace;
```

Type scale (ratio ≈ 1.25, base 17px):

| Role | Size | Weight | Width (`font-stretch`) | Line height | Tracking |
|---|---|---|---|---|---|
| Name (hero) | `clamp(3rem, 9vw, 7.5rem)` | 800 | 125% | 0.92 | -0.02em |
| Section title | 1.75rem (28px) | 650 | 112% | 1.15 | -0.01em |
| Sub-title / project name | 1.3125rem (21px) | 600 | 100% | 1.25 | 0 |
| Body | 1.0625rem (17px) | 400 | 100% | 1.55 | 0 |
| Table body | 0.9375rem (15px) | 400 | 87.5% | 1.4 | 0 |
| Caption / table head | 0.8125rem (13px) | 500 | 100% | 1.4 | 0.01em |

Rules:
- Sentence case everywhere. No all-caps labels, no tracked-out eyebrows above headings.
- All numbers in tables and specs use `font-variant-numeric: tabular-nums;`.
- Body measure: `max-width: 68ch`.
- Never highlight a single word in a headline with colour, italic or bold.
- The hero name is the only expanded-width text. It is set flush-left and may break onto two lines (`Sourav` / `Chakraborty`).

### 3.3 Spacing, radius, elevation

- Spacing scale (px): 4, 8, 12, 16, 24, 32, 48, 72, 112. Section gap: 112 desktop, 72 mobile.
- Radius: `0` on figures and tables (they're printed matter). `2px` only on interactive controls (buttons, toggle). Nothing else is rounded.
- No drop shadows anywhere. Separation comes from `--sheet` panels on `--paper`, and 1px `--grid` rules.
- No gradients.

### 3.4 Grid

- Max content width 1180px, side padding `clamp(20px, 4vw, 48px)`.
- 12-column CSS grid, 24px gutter.
- **Every section uses the same split:** a 3-column left margin holding the section title and a one-line plain-language subtitle, and a 9-column body. This left margin is the "datasheet margin" and is the main structural device. Content is left-aligned throughout; nothing is centred except text inside buttons.
- Below 900px the margin collapses above the body (title, then content, full width).

---

## 4. Page structure and wireframes

Navigation uses plain words. Section titles borrow datasheet vocabulary, but each one has a plain subtitle so nobody has to decode the metaphor.

| Nav label | Section title (datasheet) | Plain subtitle | Anchor |
|---|---|---|---|
| — | Cover | — | `#top` |
| About | Description | What I build and where I study | `#about` |
| Work | Application notes | Projects, how they're built, live demos | `#work` |
| Skills | Characteristics | Each skill, rated, with the project that proves it | `#skills` |
| History | Revision history | Experience and milestones in order | `#history` |
| Now | Errata and roadmap | What I'm fixing and learning right now | `#now` |
| Contact | Ordering information | How to reach me | `#contact` |

### 4.1 Running header (sticky)

A thin bar (48px) like a datasheet's page header. Transparent until scroll > 8px, then `--paper` background with a 1px `--grid` bottom rule.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Sourav Chakraborty        About  Work  Skills  History  Now  Contact  ◐  │
└──────────────────────────────────────────────────────────────────────────┘
```

- Left: full name in Archivo 600, 15px (replaces the "SC." monogram).
- Right: nav links (15px, `--graphite`, active section in `--ink` with a 2px `--trace` underline driven by IntersectionObserver), then a theme toggle (◐ icon button, accessible label "Switch to dark theme" / "Switch to light theme").
- Mobile (<720px): name left, "Menu" text button right, opening a full-width sheet with the links stacked at 21px.

### 4.2 Cover (hero)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                     Revision Oct 2026   │
│  Sourav                                             Guwahati, Assam     │
│  Chakraborty                                                            │
│                                                                         │
│  AI backend engineer. I build FastAPI services that serve ML models,    │
│  secure them, and deploy them.                                          │
│                                                                         │
│  ● Available for 2026 internships                                       │
│                                                                         │
│  [ Download resume ]   GitHub   LinkedIn   Email                        │
│ ─────────────────────────────────────────────────────────────────────── │
│  Features                          │ ┌─────────────────────────────────┐│
│  ▪ Two deployed AI APIs with       │ │ ~~~~/\/\/\~~~/\/\/\/\~~~~/\/\~~ ││
│    live demos                      │ │ grid · waveform canvas          ││
│  ▪ ~91% deepfake-audio detection   │ │                                 ││
│    (Wav2Vec2, FastAPI)             │ └─────────────────────────────────┘│
│  ▪ JWT auth, CORS, OWASP Top 10    │ Figure 1. A speech signal. Overlay │
│    hardening                       │ a synthetic one to see the kind of │
│  ▪ CI/CD with GitHub Actions       │ artifacts VoiceGuard looks for.    │
│  ▪ Open source: GSSoC 2026, OSCG   │ [ Overlay synthetic ]  [ Replay ]  │
└─────────────────────────────────────────────────────────────────────────┘
```

- The name fills the left 8 columns at expanded width. Top-right corner, right-aligned at 13px `--graphite`: "Revision Oct 2026" and location, like a datasheet's title block.
- Availability line: a 8px filled circle in `--trace` plus text. No pulsing animation.
- Primary button "Download resume" (solid `--ink` background, `--paper` text, 2px radius, 44px tall). The other three are text links.
- "Features" list uses small filled squares (▪, 6px, `--trace`) as bullets, the datasheet convention. Content must stay factual (see section 7).
- Figure 1 spec is in section 5.1.

### 4.3 Description (About)

```
 Description            │ Two short paragraphs, 68ch max.
 What I build and       │
 where I study          │ ┌ Figure 2. Typical application ───────────────┐
                        │ │  Client ──HTTPS──▶ FastAPI ──▶ Model ──▶ JSON │
                        │ │            JWT·CORS   │ HF Spaces / Render    │
                        │ └───────────────────────────────────────────────┘
                        │ B.Tech CSE (AI & Data Science), Assam Down Town
                        │ University. Batch 2025–2029. CGPA 8.05.
```

- Figure 2 is an inline SVG block diagram (rectangles with 1px `--ink` strokes, arrows, 13px labels). It shows the architecture pattern both projects share. It must be readable at 360px wide; on mobile it stacks vertically.
- Education sits in a small two-column definition list (`<dl>`): Degree / University / Batch / CGPA.

### 4.4 Application notes (Work)

Each project is one application note. They are **not** identical cards: each is a full-width block with its own diagram, and the layout alternates which side the diagram sits on.

```
 Application notes      │ VoiceGuard AI                          Feb 2026
 Projects, how they're  │ Deepfake audio detection API
 built, live demos      │ ─────────────────────────────────────────────────
                        │ Problem → approach paragraph (≤ 90 words)
                        │
                        │ ┌ Specifications ──────────┐ ┌ Figure 3 ─────────┐
                        │ │ Detection accuracy  ~91% │ │ block diagram SVG │
                        │ │ Model     Wav2Vec2-XLSR  │ │                   │
                        │ │ Framework FastAPI        │ └───────────────────┘
                        │ │ Auth      JWT, CORS      │
                        │ │ Hosting   HF Spaces      │
                        │ │ CI/CD     GitHub Actions │
                        │ │ Context   India AI Impact Buildathon,
                        │ │           40,000+ participants │
                        │ └──────────────────────────┘
                        │ ▲ In progress: moving sync inference to a
                        │   routers/schemas/services layout.
                        │
                        │ [ Open live demo ]   View source
```

Per note:
- Header row: project name (21px, 600), one-line descriptor below it (`--graphite`), date right-aligned.
- Specifications table: two columns, no header row, 1px `--grid` row rules, label column `--graphite`. Tabular numbers.
- An "In progress" line when relevant: `▲` glyph and text in `--flag`. This is where the README's honesty lives (refactor plans, "rebuilding MediSense without AI-assisted code").
- Actions: one solid-outline button "Open live demo" (1px `--ink` border, 2px radius) and a text link "View source".
- Optional, VoiceGuard only: a collapsible `<details>` titled "Example request" containing a real `curl` example and JSON response in JetBrains Mono on `--sheet`. Use the actual endpoint shape from the repo; if unsure, omit rather than invent.

Order: VoiceGuard AI, MediSense AI, AudioGuard Agent. A fourth, smaller "Also built" line lists Firework Simulator v3 as a text link only (it's a fun side project, not core to the AI-backend story).

### 4.5 Characteristics (Skills)

This replaces the `skills.yml` block. It's the section technical readers will remember.

```
 Characteristics        │ Parameter        Rating        Test condition
 Each skill, rated,     │ ────────────────────────────────────────────────
 with the project that  │ Python           ■ Shipped     VoiceGuard, MediSense
 proves it              │ FastAPI          ■ Shipped     VoiceGuard, MediSense
                        │ JWT auth / CORS  ■ Shipped     VoiceGuard, MediSense
                        │ GitHub Actions   ■ Shipped     VoiceGuard CI/CD
                        │ HuggingFace      ■ Shipped     Wav2Vec2 on Spaces
                        │ Gemini API       ■ Shipped     MediSense
                        │ Docker           □ Project     Local builds
                        │ SQL, C++         □ Coursework  B.Tech
                        │ MLflow           □ Basics      Roadmap exercises
                        │ Async FastAPI    ▲ Learning    6-week MLOps plan
                        │ Redis / Celery   ▲ Learning    6-week MLOps plan
                        │ WebSockets       ▲ Learning    —
```

- Real `<table>` with `<caption>` (visually hidden: "Skills, with proficiency rating and where each was used").
- Columns: Parameter / Rating / Test condition. Table body at 87.5% width for density.
- Rating legend sits under the table in 13px: ■ Shipped (used in a deployed project), □ Project or coursework, ▲ Learning. Shipped uses `--trace`, Learning uses `--flag`, the middle tier uses `--graphite`. Shape + colour, never colour alone.
- Rows are grouped by tier, not alphabetically. Above 900px the table may show a filter row of three toggle buttons (All / Shipped / Learning) using `aria-pressed`. This is optional; ship without it first.
- On mobile (<600px) the table converts to stacked rows: Parameter bold on line one, rating + condition on line two. Do this with CSS (`display:block` on cells with `data-label`), not by duplicating markup.

### 4.6 Revision history (Experience)

A real sequence, so a numbered/dated table is appropriate here.

```
 Revision history       │ Date            Change
 Experience and         │ ───────────────────────────────────────────────
 milestones in order    │ Apr 2026–now    Contributor, GirlScript Summer of
                        │                 Code 2026 (AI Agents + Open
                        │                 Source tracks)
                        │ Mar 2026–now    Open Source Contributor, OSCG.
                        │                 Merged PR, Contributor Badge
                        │ Mar 2026        Shipped MediSense AI
                        │ Feb 2026        Shipped VoiceGuard AI at India AI
                        │                 Impact Buildathon (HCL GUVI)
                        │ 2025            Started B.Tech CSE (AI & DS), ADTU
```

- Newest first. Date column fixed width, tabular numerals, `--graphite`.
- Also mention GDG On Campus ADTU membership as a final row or inline.

### 4.7 Errata and roadmap (Now)

Two short lists side by side (stack on mobile):
- **Fixing:** moving VoiceGuard and MediSense to containerised, CI-driven workflows; rebuilding MediSense independently.
- **Learning:** async FastAPI (ASGI lifecycles), Redis/Celery, WebSocket streaming, DB connection pooling, multi-stage Docker builds; IBM AI/DS and Azure MLOps certifications.
- One closing sentence: writes technical breakdowns on LinkedIn (1,300+ network), linked.
- A small "Last updated: October 2026" line in 13px `--graphite`. Sourav edits this when he updates the section.

### 4.8 Ordering information (Contact)

```
 Ordering information   │ The fastest way to reach me is email.
 How to reach me        │
                        │ sourav4298532@gmail.com      [ Copy email ]
                        │
                        │ LinkedIn   GitHub   HuggingFace   ORCID
                        │
                        │ [ Download resume ]   Print this page as a datasheet
```

- Email shown in full at 21px. "Copy email" button writes to clipboard; on success the button label changes to "Copied" for 2s and a polite `aria-live` region announces "Email copied". If the clipboard API fails, fall back to a `mailto:` link.
- "Print this page as a datasheet" calls `window.print()`.

### 4.9 Footer

One line, 13px `--graphite`: "© 2026 Sourav Chakraborty. Built with HTML, CSS and JavaScript." plus a "Back to top" link. Nothing else.

---

## 5. Signature components

### 5.1 Figure 1: waveform canvas (hero)

The only significant motion on the page.

**Rendering**
- `<figure>` containing a `<canvas>` (aspect ratio 16:7, width 100% of its column), a `<figcaption>`, and two buttons.
- Panel background `--sheet`, 1px `--grid` border, a 10×10 graticule drawn in `--grid` (like an oscilloscope screen), centre horizontal line slightly darker.
- Handle `devicePixelRatio` for sharp lines. Redraw on resize (debounced 150ms) and on theme change (read colours from computed CSS variables).

**Signal (no audio file needed, generated in JS)**
- "Real" trace: a speech-like signal. Sum of 3–4 sines (e.g. 140 Hz fundamental plus harmonics, scaled into canvas space) multiplied by a syllable envelope (4–5 smooth bumps with small random variation from a fixed seed so it looks the same every load). Stroke `--trace`, 2px.
- "Synthetic" trace: the same envelope but with (a) overly regular periodicity, (b) a few hard discontinuities/clicks, (c) a faint high-frequency shimmer. Stroke `--synthetic`, 1.5px, drawn on top at 85% opacity.

**Behaviour**
- On load: the real trace draws left to right over 1.4s (`ease-out`), once. That is the page's single orchestrated load moment. Nothing else animates on load.
- "Overlay synthetic": draws the synthetic trace over 0.9s and toggles to "Hide synthetic" (`aria-pressed`). A small legend appears under the canvas: a teal line "Natural speech", a red line "Synthetic speech".
- "Replay": clears and redraws the current state.
- Pointer move over the canvas: a 1px vertical cursor line in `--graphite` with a tiny readout box showing `t = 0.42 s` (time across a nominal 2s window). Hidden on touch devices.
- `prefers-reduced-motion: reduce`: draw everything instantly, no cursor animation.
- Caption, required for honesty: "Figure 1. An illustrated speech signal, generated in the browser. Overlay a synthetic one to see the kind of artifacts VoiceGuard looks for. For real detection, try the live demo." The last sentence links to the VoiceGuard demo.
- Accessibility: canvas has `role="img"` and an `aria-label` describing it; buttons are real `<button>` elements.

### 5.2 Block diagrams (Figures 2–4)

- Hand-written inline SVG, no libraries. `viewBox` based, `width:100%`, `height:auto`.
- Boxes: 1px `--ink` stroke, `--sheet` fill, 0 radius. Arrows: 1px `--ink` with small filled arrowheads (`<marker>`). Labels: Archivo 13px `--ink`; secondary annotations `--graphite`.
- Use `currentColor` and CSS variables (`stroke: var(--ink)`) so diagrams follow the theme.
- Each diagram has `<title>` and `<desc>` for screen readers and a visible `<figcaption>` "Figure N. …".
- Content:
  - Figure 2 (About): Client → FastAPI (JWT, CORS) → Model → JSON response, with "Hosted on HF Spaces / Render; frontend on Vercel".
  - Figure 3 (VoiceGuard): Audio upload → FastAPI → Wav2Vec2-Large-XLSR-53 → score + label; CI box "GitHub Actions" feeding deploy.
  - Figure 4 (MediSense): Vercel frontend → secure API bridge → FastAPI on HuggingFace Spaces → Gemini 2.5 Flash → condition cards with probability and urgency.
  - AudioGuard Agent: a small three-step pipeline (Audio in pipeline → risk scoring → audit report). Keep it simple.

### 5.3 Buttons and links

| Type | Style |
|---|---|
| Primary ("Download resume") | `--ink` fill, `--paper` text, 2px radius, 44px min height, 0 20px padding, 600 weight. Hover: background `--trace`. |
| Secondary ("Open live demo", "Copy email", figure buttons) | Transparent, 1px `--ink` border, same size. Hover: `--sheet` fill. |
| Text link | `--trace`, underlined. External links get `rel="noopener"` and open in the same tab (no `target="_blank"` except the resume PDF). |

- No arrow glyphs appended to button or link text.
- Focus: `outline: 2px solid var(--trace); outline-offset: 3px;` on every interactive element. Never remove it.

---

## 6. Motion rules

- Allowed: Figure 1 load draw (once), Figure 1 overlay draw (on click), header background fade on scroll (150ms), nav underline moving to the active section (200ms), "Copied" label swap, mobile menu open/close (200ms, opacity + 8px translate).
- Not allowed: section fade-in-on-scroll, hover lifts or scales on blocks, parallax, cursor followers, typing effects, particle backgrounds, marquee tech-logo strips.
- `@media (prefers-reduced-motion: reduce)` disables all transitions and draws the figure instantly.

---

## 7. Content and copy

Copy rules: first person, plain verbs, sentence case, no hype words ("passionate", "cutting-edge", "ninja"). Every number must come from a real source (repo, certificate, resume). If a fact can't be verified, leave it out.

**Hero line (proposed):** "AI backend engineer. I build FastAPI services that serve ML models, secure them, and deploy them."

**Description (proposed):**
> I'm a second-year B.Tech CSE (AI & Data Science) student at Assam Down Town University in Guwahati, originally from Tripura. I work where ML inference meets backend engineering: designing REST APIs around models, adding authentication and hardening, and getting them deployed with CI/CD.
>
> I'm deliberate about the gap between a demo and a production system. Right now that means moving my projects to async inference, containers and proper service layouts, and rebuilding one of them without AI-written code so I understand every line.

**Features list (hero):** use the five bullets from the wireframe in 4.2.

**Project facts to use:**
- VoiceGuard AI — Feb 2026. Deepfake audio detection REST API, India AI Impact Buildathon by HCL GUVI (40,000+ participants). FastAPI + Meta Wav2Vec2-Large-XLSR-53, HuggingFace. ~91% detection accuracy. JWT, CORS, `.env` hygiene, Docker, GitHub Actions. Repo: github.com/Srv99x/voice-detection-ai. Demo: voice-detection-ai.vercel.app. In progress: refactoring sync inference (`run_in_executor`) into routers/schemas/services.
- MediSense AI — Mar 2026. Symptom analysis backend, Gemini 2.5 Flash + FastAPI on HuggingFace Spaces, secure API bridge to a Vercel frontend; structured condition cards with probability scores and urgency triage. OWASP Top 10 hardened. Repo: github.com/Srv99x/medisense-ai-app. Demo: medisense-ai-app.vercel.app. In progress: independent rebuild ("AI explains, I implement").
- AudioGuard Agent — GitAgent Hackathon. Agent that scores deepfake-audio risk in developer pipelines, classifies confidence, writes audit reports. Repo: github.com/Srv99x/audioguard-agent.

**Links:** GitHub github.com/Srv99x · LinkedIn linkedin.com/in/srv99x · HuggingFace huggingface.co/Srv99x · ORCID 0009-0008-2573-5210 · Email sourav4298532@gmail.com · Resume `/assets/Sourav_resume.pdf`.

Keep all content in one place: `content.js` exporting plain objects (projects, skills, history, now). The HTML renders from it so Sourav updates one file. The page must still show its core content if JS fails: render the initial HTML statically and use JS only to enhance (or hard-code the HTML and skip `content.js` entirely; either is fine, but pick one and be consistent).

---

## 8. Print stylesheet (the datasheet PDF)

`@media print`:
- Force light tokens; white background; ink `#000`; accent prints as `#0B7A75`.
- Hide: header, theme toggle, figure buttons, "Copy email", footer back-to-top, the `<details>` example request, mobile menu.
- Figure 1 prints the static real trace (render a PNG snapshot via `canvas.toDataURL()` into a hidden `<img>` on `beforeprint`, or simply print the canvas as is).
- Add a running title at the top of page 1: name, "AI backend engineer", email, GitHub, LinkedIn, all as visible text (print `a[href]::after { content: " (" attr(href) ")" }` only for external links in the contact block).
- `@page { size: A4; margin: 16mm; }`, avoid page breaks inside tables, figures and project notes (`break-inside: avoid`).
- Target: fits in two A4 pages. Test with Chrome "Save as PDF".

---

## 9. Technical requirements

**Stack:** vanilla HTML, CSS, JS. No framework, no build step, no CSS framework. One `index.html`, one `styles.css`, one `main.js` (plus optional `content.js`, `figure.js`).

**File structure**
```
/
├── index.html
├── styles.css
├── main.js            # nav, theme, copy email, print hook
├── figure.js          # Figure 1 canvas
├── content.js         # optional single source of content
├── assets/
│   ├── Sourav_resume.pdf
│   ├── og-image.png   # 1200×630, see below
│   └── favicon.svg
├── robots.txt
├── sitemap.xml
└── CNAME              # souravchakraborty.me (if GitHub Pages)
```

**Head / SEO**
- `<title>Sourav Chakraborty — AI backend engineer</title>` and a matching meta description.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- Fix canonical and OG URLs: v1 points `og:url` and `og:image` at the old `srv99x.github.io/sourav-cborty-portfolio/` path. All should use `https://souravchakraborty.me/`.
- New OG image in the datasheet style: paper background, name in expanded Archivo, the teal waveform, "AI backend engineer". 1200×630.
- JSON-LD `Person` schema with name, jobTitle, alumniOf, sameAs (GitHub, LinkedIn, HuggingFace, ORCID).
- `<meta name="theme-color">` for both schemes.

**Theme toggle**
- Default: follow OS. Toggle sets `data-theme` on `<html>` and saves the choice in `localStorage` (wrapped in try/catch). Apply the saved theme with a tiny inline script in `<head>` before CSS paints, to avoid a flash.

**Accessibility (must pass)**
- Semantic landmarks: `header`, `nav`, `main`, one `h1` (the name), `section` with `h2` per section, `footer`.
- Skip link "Skip to content" as the first focusable element.
- All interactive elements reachable and operable by keyboard; visible focus ring.
- Colour is never the only signal (ratings use shapes too).
- Lighthouse Accessibility ≥ 95.

**Performance budget**
- No GitHub-stats or streak images (they're slow third-party requests and break the visual system).
- Total JS < 15 KB minified, CSS < 20 KB. Fonts: only the two families above, `display=swap`.
- Lighthouse Performance ≥ 95 on mobile. LCP is the hero name, which is text, so it should be fast.

**Responsive breakpoints**
- ≥ 1100px: full 12-col with margin column.
- 900–1099px: margin column narrows to 2 cols.
- 600–899px: margin collapses above content; hero figure moves below the features list.
- < 600px: single column, skills table becomes stacked rows, diagrams stack vertically, name drops to `font-stretch:112%` so "Chakraborty" doesn't overflow at 360px. Test at 360px wide.
- Wide content (tables, code) scrolls in its own `overflow-x:auto` wrapper; the page body never scrolls sideways.

---

## 10. Build order for Antigravity

Work in these phases and check each before moving on. Paste the phase as the prompt, with this file attached as context.

1. **Tokens and skeleton.** Create the file structure, `styles.css` with all tokens from section 3, base typography, the 12-col grid and the margin-column section layout. Static HTML for every section with the real copy from section 7. No JS yet. Check: page reads well with CSS only, light and dark both correct.
2. **Header and navigation.** Sticky running header, active-section underline (IntersectionObserver), mobile menu, skip link, theme toggle with no-flash script.
3. **Tables and notes.** Specifications tables, skills table with legend and mobile stacked rows, revision history table. Check at 360px.
4. **Diagrams.** Figures 2–4 as inline SVG following 5.2. Check both themes.
5. **Figure 1.** Build `figure.js` per 5.1. Check reduced-motion, resize, theme switch, keyboard use of the buttons.
6. **Contact and print.** Copy-email with live region and fallback; print stylesheet per section 8. Check Chrome "Save as PDF" fits two A4 pages.
7. **SEO and polish.** Head tags, JSON-LD, OG image, sitemap, robots, favicon. Run Lighthouse (mobile) and fix anything under budget.

---

## 11. Do not

- Do not reuse v1's blue (#2563eb), the dark-default layout, centred hero, "SC." monogram or the `skills.yml` block.
- Do not add GitHub-stats cards, tech-logo marquees, progress bars or percentage skill meters.
- Do not add scroll-triggered fade-ins or hover-lift card effects.
- Do not use monospace for anything except real code.
- Do not use all-caps labels, eyebrow text above headings, or `→` in buttons/links.
- Do not invent metrics, employers, endpoints or testimonials.
- Do not turn the projects into a grid of identical rounded cards.

---

## 12. Acceptance checklist

- [ ] A first-time visitor can find "available for 2026 internships", both live demos and the resume without scrolling past the second section.
- [ ] Every skill row names where it was used or that it's being learned.
- [ ] Figure 1 draws once on load, overlay works, caption states it's illustrative and links to the real demo.
- [ ] Light and dark themes both pass contrast; toggle persists; no flash on reload.
- [ ] Keyboard-only navigation works end to end with visible focus.
- [ ] Works at 360px with no horizontal page scroll.
- [ ] Print / Save as PDF produces a clean two-page A4 datasheet.
- [ ] OG, canonical and sitemap all point to souravchakraborty.me.
- [ ] Lighthouse mobile: Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 95, SEO 100.
