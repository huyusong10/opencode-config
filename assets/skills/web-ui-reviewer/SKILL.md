---
name: web-ui-reviewer
description: Review the visual quality of a web interface — alignment, spacing, typography, visual consistency, layout, accessibility — then directly fix the issues in the source code and report what was changed. Use whenever the user or another agent needs to critique, polish, audit, QA, or "fix the visual issues" in a web UI; when they say things like "clean up this page", "the UI looks off, can you make it better", "review and fix my landing page", "the spacing and alignment are bad", or "make this look more professional". Also trigger when a UI looks amateurish without the user knowing why — this skill diagnoses, fixes, and reports. The skill requires BOTH a rendered screenshot AND the source code to work well; if only one is provided it will actively try to acquire the other (using a browser/screenshot tool if available for screenshots, or searching the workspace / asking the user for source), and will degrade honestly if acquisition isn't possible.
---

# Web UI Reviewer

A skill for doing what a senior design engineer does: look at a web UI, identify specific visual issues, fix them directly in the source, and report what changed. Not "the spacing feels off" — concrete findings tied to concrete elements, fixed with concrete code edits, summarized in a clear changelog.

## What this skill is and isn't

**Is:** a diagnose-fix-report loop for visual quality of already-captured web UI. The full cycle runs in one invocation.

**Isn't:**
- A browser, scraper, or screenshot tool — capture happens upstream.
- A functional QA tool — you're not testing whether forms submit, only whether they look right.
- A full rewrite tool — you make targeted, surgical fixes, not redesigns.

## Expected inputs: you need BOTH screenshot AND source code

This Skill fundamentally requires **both** a screenshot of the rendered page **and** the source code. Neither alone is sufficient. They serve complementary roles that no single input can replace:

- **Screenshots** reveal *perceived* issues — misalignment, clashing colors, cramped spacing, broken hierarchy, things that look wrong when rendered. The eye catches what static analysis misses. A CSS file with perfect tokens can still render as a disaster.
- **Source code** (HTML/CSS/JSX/components) reveals *structural* issues — inconsistent spacing tokens, hardcoded colors, missing semantics, unused styles. It also tells you *why* a pixel-level problem exists, and it's what you'll actually edit to fix things. A beautiful screenshot can hide 200 lines of tangled CSS debt.

**Do not attempt a review with only one of these.** The single most common failure mode of UI review agents is trying to critique from a screenshot alone (leading to vague aesthetic speculation) or from source alone (missing obvious visual problems because the code "looks fine"). Your first job is to make sure you have both in hand.

### Before starting the review, check what you have

Do this check explicitly at the start of every invocation:

1. **Do I have a screenshot of the rendered page?** — an actual image of how the page looks to a user, ideally at the viewport size(s) the user cares about.
2. **Do I have the source code?** — the HTML/CSS/component files that produce the page, in a filesystem you can read and edit.

If you have both, proceed to Phase 1.

### If you're missing the screenshot: go get it

If you have the source but not a rendered screenshot, **actively acquire one** before reviewing. Do not try to mentally simulate how the code would render — even strong LLMs are unreliable at this, and the whole point of this Skill is to catch what the eye catches.

Ways to acquire a screenshot, in rough order of preference:

1. **Ask whether a capture tool / skill is available.** The Skill's guidance assumes another skill (or connected tool) handles page capture. Check your available tools for names suggesting browser automation, page screenshots, or rendering — common patterns include tools with "browser", "screenshot", "playwright", "puppeteer", "chromium", "page", "render", "capture", or "visual" in the name. If one exists, use it to capture the relevant page(s).
2. **Ask the user to provide one.** If there's no automation tool available, ask: "To do a proper visual review I need a screenshot of the rendered page. Can you paste one, or do you have a dev server running at a URL I could point a capture tool at?"
3. **Capture at the right viewport(s).** If the user cares about mobile, capture at mobile width (~375–414px). For desktop reviews, 1280–1440px is typical. When the design is responsive and the user hasn't specified, default to desktop and ask if mobile also matters.

Only proceed in "source-only" mode if acquiring a screenshot is genuinely impossible (no capture tool, no running page, user can't provide one). In that case, narrow scope to structural issues only, apply only highly conservative fixes, and state the limitation prominently in the report.

### If you're missing the source: go find it

If you have a screenshot but not source code, **actively acquire the source** before reviewing.

Ways to locate source:
1. **Search the workspace.** If there's a filesystem available, look for likely candidates: recently edited HTML/CSS/JSX/TSX files, files whose names match what you see on the screenshot, index files in common web project structures (`src/`, `pages/`, `components/`, `public/`).
2. **Ask the user.** "I have the screenshot — where does the source for this page live so I can read and edit it?"
3. **View-source from a URL, if that's the only option.** If the user provides a URL and you have a fetch tool, retrieve the rendered HTML. This is weaker than real source (no component structure, no source CSS, often minified) but better than nothing for a read-only review.

Only proceed in "screenshot-only" mode if acquiring source is genuinely impossible. In that case, you cannot apply fixes — only produce the review and propose specific edits the user can apply themselves.

### Cross-reference continuously

Once you have both, cross-reference constantly throughout the review: a spacing issue you see in the screenshot should trace back to a specific CSS rule; an inconsistent color you spot in the CSS should manifest somewhere in the rendered pixels.

If the pixels disagree with the source — e.g., the screenshot shows a 20px gap but the CSS says `gap: 16px` — **stop and investigate before editing**. Common causes: a stale screenshot from an older build, a parent component overriding styles, inline styles you haven't seen, a build-time transform (Tailwind JIT, CSS Modules, styled-components), or a CSS layer loaded from somewhere you haven't looked. Guessing past this kind of disagreement is how bad edits happen.

### After fixes: re-capture if possible

Visual fixes are only verified when you see them. After applying edits, if a capture tool is available, re-screenshot the page and check that the fixes landed as intended. This catches regressions (a padding change that shifted a neighbor, a color update that now clashes with something else) before they reach the user.

If re-capture isn't possible in this environment, state so explicitly in the report under limitations — don't claim fixes as verified when they haven't been.

## The full workflow

This Skill has three phases. Don't skip ahead — each phase produces inputs the next one depends on.

```
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
 │  1. REVIEW   │ ──▶ │   2. FIX     │ ──▶ │  3. REPORT   │
 │  diagnose    │     │  edit source │     │  summarize   │
 └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Phase 1: Review

### Step 1.0: Confirm you have both inputs

Before anything else, confirm you have the screenshot and source in hand. This is the single most important gate in the whole workflow — skipping it is how agents produce confident-sounding reviews that miss the actual problems.

- **Screenshot of the rendered page:** an actual image, not an imagined render. If you don't have one, acquire one (browser/screenshot tool → ask user → URL fetch, in that order) before proceeding. See the "Expected inputs" section above for the detailed guidance.
- **Source code:** the HTML/CSS/component files you'll edit. If you don't have access to them, find them (workspace search → ask user) before proceeding.

If you genuinely cannot get both — explain what you have, what you're missing, and what a capable review will look like given the gap. Do not proceed into Phase 1.1 with only one input while silently hoping the other isn't needed.

### Step 1.1: Orient yourself

Before any critique, establish what the page is trying to do. A marketing landing page is judged differently from an admin dashboard. In one line, write down:

- **Purpose** — marketing, tool, content, commerce, admin, form, etc.
- **Primary user action** — what's this page for?
- **Style being attempted** — minimal, playful, editorial, dense-utilitarian, etc.

This is the yardstick. An admin UI that looks "cluttered" next to a Stripe landing page isn't a bug — density serves the task. Judge the page against its own intent, not a generic ideal.

### Step 1.2: Scan for blockers

Do a first pass looking for issues that make nothing else matter:
- Overlapping or clipping elements, text bleeding out of containers
- Content cut off at the viewport edge
- Broken images, missing assets
- Color clashes severe enough to make text illegible
- Layout collapses (elements in wildly wrong positions)

These are "stop the ship" findings. If any exist, make sure they're first in your fix queue.

### Step 1.3: Review across five dimensions

Work through these in order — ordered from most objectively verifiable to most subjective, so your review stands on solid ground before making judgment calls. Read the relevant reference file when you dig into each dimension; don't pre-load all of them.

1. **Alignment & spacing** — grid discipline, spacing rhythm, relational proximity. See `references/alignment-and-spacing.md`.
2. **Typography & readability** — type scale, hierarchy, line length, contrast. See `references/typography.md`.
3. **Visual consistency** — colors, radii, shadows, button styles, iconography. See `references/visual-consistency.md`.
4. **Layout & responsive behavior** — information hierarchy, density, breakpoints. See `references/layout.md`.
5. **Accessibility fundamentals** — contrast ratios, focus states, semantic structure, alt text. See `references/accessibility.md`.

For each finding, record:
- **What**: the specific problem
- **Where**: the element(s), file(s), and line number(s) if known
- **Evidence**: what you saw in the screenshot + what you found in the source
- **Severity**: Critical / Major / Minor (see below)
- **Proposed fix**: what you plan to change

### Step 1.4: Severity-rank the findings

- **Critical** — Breaks the page, blocks user tasks, excludes users. Overflowing content, contrast failures on primary text, completely broken layouts, missing focus on interactive elements.
- **Major** — Noticeably degrades quality/usability but doesn't block. Inconsistent spacing, obvious visual inconsistency, weak hierarchy, suboptimal line lengths.
- **Minor** — Polish. 2px drifts, slightly off-brand radius on one element, subtle shadow inconsistencies.

When in doubt, rank lower. Inflated severity teaches the user to ignore you.

### Core principle for findings: specific beats generic

The failure mode of UI review is vagueness. Every finding should be actionable without a follow-up question.

**Bad:** "The header looks cluttered."
**Good:** "The header has 5 nav items, a logo, a search bar, and two CTAs in a single row — on 1440px the rightmost CTA sits 8px from the viewport edge with no breathing room. Source: `Header.tsx:42-60`, the `.nav-container` uses `gap: 12px` which compresses everything."

---

## Phase 2: Fix

This is what distinguishes this Skill from a pure reviewer. You don't just recommend — you edit. But you edit with discipline. See `references/fix-strategy.md` for the full decision tree on what to fix automatically, what to pause for, and what never to touch.

### Quick summary of the fix rules

- **Apply automatically**: Critical + Major findings with clearly correct fixes; trivial Minor fixes; replacements that align with an existing design system in the codebase.
- **Propose but don't apply**: changes to visual identity (brand colors, fonts), structural layout changes, subjective "I'd prefer" calls.
- **Never touch**: copy/content, functionality, dependencies, tooling config, files outside the review scope.

### How to make edits safely (the essentials)

1. **Read before writing.** View the file you're about to edit. Always.
2. **Prefer minimal diffs.** Fix the specific problem; don't reformat or restructure adjacent code.
3. **Preserve existing conventions.** Tailwind stays Tailwind, CSS modules stay CSS modules.
4. **Use design tokens where they exist.** If `theme.colors.primary` exists, use it rather than hardcoding `#2563eb`.
5. **Keep a running changelog as you go** — you'll need it for the report.
6. **Verify each edit** — re-read the changed section to confirm it landed correctly.

See `references/fix-strategy.md` for the full guidance.

### After the edits: re-capture to verify visually

Once the edits are applied, if a browser/screenshot tool is available, **re-capture the page and compare against the original screenshot**. This is the only reliable way to know your fixes landed as intended rather than introducing new issues — a padding change can shift a neighbor, a color update can clash with something you didn't think about, a text-wrap change can push a layout off. Re-capture catches this before it reaches the user.

Compare the before/after and note in your changelog whether each fix visually verified. If you can't re-capture (no tool available, no running page), state "applied, not visually re-verified" honestly in the report's limitations section.

---

## Phase 3: Report

The report has a specific shape because it serves three audiences: the user reviewing what you did, another agent consuming this as input, and future-you coming back to this file later. See `references/report-template.md` for the full template.

At minimum the report must contain:

1. **Design intent** — your one-line read of what the page is.
2. **Summary** — 2-4 sentences: what you found, what you changed, anything urgent you didn't change.
3. **Changes applied** — per-finding breakdown: severity + title, what was wrong, what you changed (file + lines + concise before/after), why it matters.
4. **Proposed but not applied** — yellow-light items awaiting user decision, with tradeoff explanations.
5. **Observed but out of scope** — things you noticed but didn't touch.
6. **Strengths** — 2-4 specific things the design does well. Calibration, not flattery.
7. **Open questions / limitations** — anything you couldn't evaluate.

### Tone and calibration

**You're not the final arbiter of taste.** Alignment grids, type scales, contrast ratios are well-established — findings there can be stated confidently. Anything that reads as "I personally would have done X" should be framed as an option, not a directive.

**Don't pad.** A report with 8 well-chosen findings gets acted on; a report with 50 gets ignored. Ruthlessly prioritize.

**Praise is data.** Telling the user the type scale is clean is as useful as telling them the button colors are inconsistent — it tells them what not to touch.

---

## Anti-patterns to watch for in your own output

- **Vague aesthetic language** — "feels cheap", "looks dated". Always push to the *why*.
- **Design trend cargo-culting** — recommending glassmorphism or gradients because they're trendy. Only recommend a direction if the current design is incoherent in a way that direction resolves.
- **Over-indexing on your own aesthetic** — if the design executes a style well (brutalist, maximalist, retro), don't critique it for not being minimalist. Judge against its own intent.
- **Scope creep during fixes** — the #1 way this Skill produces bad outputs. You came to fix alignment; don't also restructure the navbar.
- **Fixing without reading** — editing a file without viewing it first is how regressions happen.
- **Claiming fixes you didn't verify** — if you applied an edit but didn't re-read the result, say "applied, not visually re-verified" rather than "fixed ✓".

## When you don't have enough to operate

If the input is genuinely insufficient — screenshot too blurry to read, source missing the stylesheet — don't manufacture findings or hallucinate fixes. Say what you need and stop. A short honest "I can't do this well with what I have; here's what would help" is far better than a confident report full of speculation.
