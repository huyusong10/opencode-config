# Fix Strategy

The hardest part of a review-and-fix skill isn't finding issues — it's deciding what to touch. Fix too little and you've just written a report. Fix too much and you've redesigned someone's page without consent, introduced regressions, or invented work for them reviewing a huge diff.

This reference is the decision tree.

## The three-light system

Every finding goes into one of three buckets: **green-light** (fix automatically), **yellow-light** (propose, don't apply), or **red-light** (never touch as part of this skill).

### 🟢 Green-light: fix automatically

Apply these without asking. The signal: the fix is **objectively correct** against a well-known craft principle, and the risk of regression is low.

**Accessibility failures with clear fixes:**
- Contrast ratio failures on text — darken the text color or lighten the background to the WCAG AA threshold.
- Missing `alt=""` on images (use empty alt for decorative, descriptive alt otherwise).
- `outline: none` or `outline: 0` without a `:focus-visible` replacement — add a visible focus style.
- Icon-only buttons missing `aria-label`.
- Form inputs labeled only by placeholder — add a proper `<label>`.

**Alignment and spacing fixes with an obvious target:**
- Elements drifting from their neighbors by small amounts (2–8px) when they should clearly align — snap them to the same value.
- Hardcoded spacing values where the codebase has spacing tokens — replace with the token.
- Uniform spacing between groups of elements where proximity grouping is expected (e.g., a label and its input spaced the same as the gap between fields) — tighten the intra-group spacing.

**Visual consistency fixes against an existing system:**
- Near-duplicate colors (e.g., `#2563eb` and `#2962ff` used interchangeably) — unify to the one that's most common or matches a design token.
- Same-purpose elements with slight variations (three "primary buttons" with different paddings/radii) — unify to the one that appears most often, or to the design system if there is one.
- Hardcoded colors where CSS variables / theme tokens exist — replace with the token.

**Typography fixes with clear targets:**
- Body text below the line-height range (under 1.3) or above (over 1.8) — bring into 1.4–1.7.
- Pure `#000` body text on white — soften to a very dark gray (e.g., `#1a1a1a` or `#111827`).
- Line lengths wildly out of the 45–75 char range — add a `max-width` in `ch` or `rem`.

**Purely structural cleanup:**
- Duplicate CSS declarations.
- Invalid HTML that's visually affecting layout.
- Missing semantic tags where a `<div>` is being used as a button or heading.

### 🟡 Yellow-light: propose, don't apply

Surface in the report as "Proposed but not applied". The signal: the fix has **multiple reasonable answers**, or it touches something where the user's intent matters more than craft principles.

**Visual identity changes:**
- Brand color swaps (changing the primary blue).
- Font family changes (even if the current font has issues — let the user pick the replacement).
- Large radius overhauls (switching the whole design from rounded to sharp corners).
- Shadow system redesigns.

**Structural layout changes:**
- Re-flowing a grid (2-column → 3-column).
- Reordering major page sections.
- Changing breakpoints or responsive strategy.
- Converting between layout paradigms (flexbox → grid, etc.).

**Subjective quality calls:**
- "The hero headline would feel better at 48px instead of 64px." — valid opinion, not a bug.
- "Consider adding an accent color to the CTA." — design direction, user should decide.
- "This section could use an illustration." — content/design decision, not a fix.

**When in doubt about severity:**
- If a "Major" finding has a fix that involves more than ~10 lines of change across multiple files, it probably belongs here — even if the fix itself is clearly correct, the size makes it a "propose first" item.

### 🔴 Red-light: never touch

Not within this Skill's scope, regardless of how obviously they'd help:

**Content and copy:**
- Headlines, subheads, button labels, microcopy.
- Even if "Click here" is bad link text, rewriting copy is a different job.

**Functionality:**
- Event handlers, state management, API calls, routing logic.
- You can fix the *style* of a broken button but not make it work.

**Dependencies:**
- Don't add a package to fix a visual issue ("install Tailwind to fix your spacing").
- Don't swap one icon library for another.

**Build / tooling config:**
- `tsconfig.json`, `vite.config.js`, `package.json`, `tailwind.config.js`, ESLint/Prettier config.
- Unless the user specifically invoked this skill for a config-level design system setup.

**Files outside the review scope:**
- If the user asked you to review `LandingPage.tsx`, don't also edit `NavBar.tsx` because you noticed issues there.
- Note it in the "Observed but out of scope" section and let the user decide.

**Anything requiring assets you don't have:**
- Don't generate images, SVGs, or icons to fill gaps.
- Don't invent brand assets.

## Edge cases and judgment calls

### "The fix is obvious but the file is huge"
If a Green-light finding lives in a 2000-line file, and the fix is still a 3-line edit — apply it. The file size doesn't change the scope of the edit.

### "There are 40 instances of the same issue"
Apply the fix everywhere it occurs in the reviewed files. Report as one finding with the count: "Replaced 40 hardcoded instances of `#2563eb` with `var(--color-primary)` across `LandingPage.tsx`, `Header.tsx`, `Footer.tsx`." Don't list 40 separate changelog entries.

### "The codebase has no design system / tokens"
Work with what's there. Don't introduce a token system just to fix one hardcoded value — that's scope creep (yellow-light at best, probably out of scope). Fix the immediate issue with a consistent concrete value.

### "The screenshot and source disagree"
Stop and investigate before editing. Common causes:
- The screenshot is stale — built from an older commit.
- There's a stylesheet or CSS layer you're missing (a global reset, a CSS-in-JS theme, a parent component's styles).
- Inline styles or style props are overriding the classes you're looking at.
- A build-time transform (CSS Modules, styled-components, Tailwind JIT) is producing the final styles.

If a browser/screenshot tool is available, **re-capture the page fresh** — this is the fastest way to rule out a stale screenshot. If the fresh capture matches the source, the old one was stale; if it still shows the mismatch, there's a hidden style source and you need to track it down (grep the codebase for the element's class/id, check parent components, look for global styles) before editing.

If you can't reconcile them, don't guess. Report the discrepancy and apply only the fixes you're confident about.

### "The fix might regress something I can't see"
Err toward yellow-light. If you suspect a fix could break layout elsewhere on the page (e.g., the element you're shrinking is also a flex child that other elements rely on for their width), propose rather than apply.

### "The user asked for 'a full review and fix' but the issues are all yellow-light"
Do the review, propose the fixes, and be clear that you chose not to apply unilaterally because the changes touch visual identity / subjective territory. Offer to apply any or all of the proposed changes on confirmation.

### "The user asked for 'just the critical stuff'"
Scope way down. Apply only Critical findings. Mention Major/Minor in the report's "also observed" section without proposing specific fixes, so the user can decide if they want a deeper pass later.

## Principles for the edit itself

**Minimal diff.** Fix the specific problem. Don't reformat the file, don't "clean up while you're in there," don't reorder imports, don't restructure adjacent code. Every extra change in the diff is cognitive load the user has to parse.

**Preserve conventions.** If the file uses:
- Tailwind utility classes → fix with utility classes.
- CSS Modules → fix in the module.
- CSS-in-JS → fix in the styled component.
- Inline style prop → can stay inline, but consider moving to a class if this is the tenth inline fix (and if so, flag it in the report).

Do not introduce a styling paradigm the codebase doesn't use. "I know Tailwind would be cleaner" is not a reason to rewrite the CSS.

**Use tokens first, values second.** Before writing `padding: 16px;` or `color: #1a1a1a;`, scan for existing variables. Check:
- `:root { --... }` declarations at the top of stylesheets.
- `theme` objects in JS/TS.
- `tailwind.config.js` extended theme.
- Existing class names that already apply the value (`.space-4`, `.text-gray-900`, etc.).

**Cross-file changes need justification.** A single fix touching 5 files needs a clearer story in the report than a fix touching 1 file. If you're touching multiple files for what should be one semantic change (e.g., unifying a color across the codebase), note that explicitly and show the count.

## Self-check before applying any edit

Before you apply an edit, ask yourself:

1. Did I view this file recently enough that my context is fresh?
2. Is the `old_str` I'm replacing unique in the file? (If not — the edit will fail or go to the wrong place.)
3. Do I know, in one sentence, why this edit fixes the finding?
4. Could this edit plausibly break something visible on the page that I haven't checked?
5. Am I staying within the review scope, or drifting into adjacent files?

If any answer is "I'm not sure," — re-view the file, narrow the edit, or demote to yellow-light.
