# Report Template

The report is not just a recap — it's how the user audits what you did. Assume they will skim for 30 seconds before deciding to trust you or to scrutinize the diff.

The template below covers the full case (changes applied + proposals + observations). Trim sections that have nothing in them; don't emit empty headers.

## Full template

````markdown
# UI Review & Fix: [page name or short description]

**Reviewed:** [what you worked with — "1440px desktop screenshot + `src/pages/Landing/`"]
**Scope:** [files you operated on — "LandingPage.tsx, Hero.tsx, Features.tsx, landing.css"]

## Design intent
[One line: what this page appears to be trying to do. This is the yardstick.]

## Summary
[2–4 sentences:
- What state the design was in (key themes, not a list of findings).
- What you changed (a headline count: "Applied 7 fixes across 3 files" + the biggest 1–2).
- Anything urgent you did NOT change and why.]

## Changes applied

### 🔴 Critical

**1. [Short title]**
- **Was:** [what was wrong — specific element, specific property, specific evidence from screenshot and/or source].
- **Changed:** `path/to/file.tsx` (line ~42)
  ```
  - color: #9ca3af;
  + color: #4b5563;
  ```
- **Why:** [one line tying the fix to its impact — e.g., "Brings contrast from 2.85:1 to 7.2:1, passing WCAG AA for body text."]

**2. [Short title]**
- **Was:** ...
- **Changed:** ...
- **Why:** ...

### 🟡 Major

**1. [Short title]**
- **Was:** ...
- **Changed:** ...
- **Why:** ...

### 🟢 Minor

**1. [Short title]** — `path/to/file.tsx:88`
- Brief one-liner for small fixes — full before/after isn't always necessary for trivial changes.

---

## Proposed but not applied

These are changes that would improve the design but touch areas where your input should drive the decision — visual identity, structural layout, or subjective calls.

**1. [Short title]**
- **Issue:** [what's suboptimal].
- **Options:**
  - Option A: [concrete change, tradeoff].
  - Option B: [concrete change, tradeoff].
- **Recommendation:** [your lean, if you have one — otherwise "either reasonable, depends on X"].

**2. [Short title]**
- ...

---

## Observed but out of scope

Things I noticed but didn't fix because they live outside the reviewed files or are outside this skill's remit.

- [File / area]: [what I noticed, one line]. Recommend a separate review pass for this.
- ...

---

## Strengths

- [Specific thing the design does well — "Type scale is disciplined: 5 sizes used consistently throughout, creating clear hierarchy without visual clutter."]
- [Another.]
- [2–4 total. If the design has few strengths, say so honestly rather than padding.]

---

## Limitations and open questions

- [Things you couldn't evaluate — "Only desktop screenshot provided; mobile behavior not reviewed."]
- [Assumptions you made — "Assumed this is a B2B SaaS marketing page based on copy and layout — correct me if not."]
- [Things you applied but couldn't re-verify visually — "7 fixes applied; not re-rendered, so visual result not confirmed."]
````

## Notes on filling it in

### Changelog formatting depth

Scale the detail to the fix:
- **Critical / Major**: show the concrete before/after code diff. The user needs to audit these.
- **Minor**: a one-line summary with file:line is usually enough. Don't bury the important stuff under trivia.
- **Bulk changes** (e.g., replaced 40 color instances): collapse into one entry with the total count and file list, not 40 entries.

### "Was / Changed / Why" structure

Each non-trivial entry should answer three questions in order:
1. **Was** — what the problem is. Must be specific: element, property, evidence.
2. **Changed** — what edit you made. Path + approximate line + concise diff.
3. **Why** — one line connecting the fix to its impact (user-facing or craft-principle).

Skipping the "why" makes reports feel like mechanical diffs. Including it tells the reader you were thinking, and it's what lets them decide whether you got the tradeoff right.

### Proposing vs. applying

If a finding is in "Proposed but not applied", it must include either:
- **Options** (at least 2 concrete directions with tradeoffs), or
- A single clear recommendation with a reason it needs user sign-off before applying.

A yellow-light entry with no tradeoff discussion is half-formed — it's either a green-light fix you should have made, or it needs the discussion to be actionable.

### Strengths: honest, specific, short

Don't manufacture praise. If the design is mediocre across the board, say "the design is functional but without distinctive strengths" rather than inventing compliments.

When you do praise, be specific. "Clean typography" is meaningless; "Type scale uses 5 sizes with consistent 1.25 ratio, creating clear hierarchy" is calibrating.

### Limitations section

This is where you earn trust. Every limitation you voluntarily surface here is one the user doesn't discover later by surprise. Include:
- What you didn't see (mobile, other pages, other files).
- What you assumed (page purpose, target audience).
- What you applied but didn't re-verify (if you didn't re-render after edits).
- Anything you fixed but weren't 100% sure about.

### Adapting to the user's ask

The template above is the default. Adapt based on the request:

- **"Just critical stuff"** → Only Critical section. Others collapsed into "Also observed".
- **"Review the header"** → Entire report scoped to the header; don't surface findings from other sections.
- **"Give me JSON output"** → The content structure (severity levels, was/changed/why, proposals, observations, strengths, limitations) stays; just serialize it.
- **"Don't apply anything, just tell me"** → Everything in the "Proposed" section; no "Changes applied".

## Compact example (small review)

```markdown
# UI Review & Fix: Pricing page hero

**Reviewed:** 1440px screenshot + `src/pages/Pricing/Hero.tsx`, `pricing.css`
**Scope:** Hero section only (per user request)

## Design intent
B2B SaaS pricing page hero — reducing friction for users evaluating plan options.

## Summary
The hero reads clearly but had a minor contrast failure on the subhead and an alignment drift on the CTA. Applied 2 fixes, both small and low-risk. Also noticed the pricing cards below the hero use 3 different radii — proposed fix below but not applied since it touches more files.

## Changes applied

### 🟡 Major

**1. Subhead contrast below AA**
- **Was:** `.hero-subhead` was `color: #9ca3af` on white (~2.9:1 contrast) — failed WCAG AA for body text.
- **Changed:** `pricing.css:34`
  ```
  - color: #9ca3af;
  + color: #4b5563;
  ```
- **Why:** Brings contrast to ~7.5:1, passes WCAG AA with margin and AAA.

### 🟢 Minor

**1. CTA button drift** — `Hero.tsx:28`
- CTA's left edge was 8px off from the headline (padding inherited from parent). Added `px-0` to the button wrapper to snap it to the grid.

## Proposed but not applied

**1. Inconsistent card radii in pricing section**
- **Issue:** The three plan cards use border-radii of 8px, 12px, and 16px respectively. No apparent reason for the variation.
- **Options:**
  - Unify all to 12px (most common in the design elsewhere).
  - Unify to 8px (matches the button radius — tighter feel).
- **Recommendation:** 12px — it's the middle option and matches what the primary card uses, so it's the least disruptive.
- Did not apply because this spans 3 card components and affects visual identity.

## Strengths
- Pricing table layout is clean: clear 3-column grid, consistent column widths, pricing prominently placed.
- Headline hierarchy is strong: 48px headline → 20px subhead → 16px body is a clean 1.25 ratio.

## Limitations
- Reviewed desktop only. Mobile behavior of the pricing cards stacking not assessed.
- Changes applied but not re-rendered; visual result not confirmed.
```
