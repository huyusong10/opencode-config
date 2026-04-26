# Accessibility Fundamentals

Accessibility isn't separate from visual design — it *is* visual design for a broader audience. Most accessibility issues are also visual quality issues; fixing them usually improves the experience for everyone. This reference covers the accessibility concerns most visible in a UI review; a full WCAG audit is beyond scope here.

## What to look for

### 1. Color contrast

This is the single most common and most impactful accessibility issue. WCAG guidelines:

- **Body text (under 18pt / 14pt bold)**: contrast ratio of at least **4.5:1** against its background for AA, 7:1 for AAA.
- **Large text (18pt+ / 14pt+ bold)**: 3:1 for AA, 4.5:1 for AAA.
- **UI components and graphical elements**: 3:1 against adjacent colors.

How to check:
- If you have the colors (from source or picked from a screenshot), use a contrast ratio calculator mentally or reference common failures: gray text on white like `#999 on #fff` ≈ 2.85:1 — fails. `#666 on #fff` ≈ 5.74:1 — passes body.
- Eye-test: if text looks faded or hard to read at a normal viewing distance, that's a contrast smell even before you measure.
- Common failure spots: placeholder text in form fields, "helper" text below inputs, disabled states, footer text, text over images/gradients.

**Frequent offender**: text over photography or video. If you see hero text over an image, ask: is there a scrim, gradient, or solid overlay ensuring contrast across all parts of the image? Without it, the text fails contrast in some regions.

### 2. Focus states

Keyboard users (and users with motor impairments) rely on focus indicators to know where they are. Designs that remove the default focus ring without replacing it break the page for these users.

- Every interactive element (links, buttons, form fields, custom controls) needs a visible focus state.
- The focus indicator should have strong contrast (3:1 against adjacent colors).
- A subtle 1px outline the same color as the button itself doesn't count.

If you only have a static screenshot, you can't see focus states — but you can check source for:
- `outline: none` or `outline: 0` without a replacement `:focus-visible` style. This is a red flag.
- Missing `:focus` or `:focus-visible` styles on buttons and links.

### 3. Semantic structure and hierarchy

If you have HTML source:

- Are headings nested in order (h1 → h2 → h3, not h1 → h4)? Screen readers use this structure to navigate.
- Is there exactly one h1 per page?
- Are buttons actual `<button>` elements (not `<div>` with click handlers)? Same for links (`<a>`).
- Are form fields paired with `<label>`s, or do they rely only on placeholder text? Placeholder-only is a common accessibility failure.

### 4. Alt text and image descriptions

From HTML source:

- Every `<img>` needs an `alt` attribute. Decorative images should have `alt=""` (empty, not missing).
- Alt text should describe the image's function/meaning in context, not its literal appearance. "Photo of a person smiling at a laptop" is weaker than "Customer using the product" if that's the purpose.
- Icon-only buttons need either an `aria-label` or visible text — "icon" alone is not enough.

### 5. Color as the only signal

Never use color alone to convey information:

- Form validation: red border alone isn't enough — pair with an icon and/or text message.
- Status indicators: green dot alone is ambiguous for color-blind users — pair with text or a shape.
- Chart data series: don't rely only on color to distinguish lines/bars — use patterns, labels, or direct data markers too.

### 6. Text sizing and zoom

- Body text under 14–16px on desktop is usually too small. 10–12px text (often seen in footers and legal copy) is a common failure.
- Designs that break when the user zooms to 200% (a WCAG requirement) — you can't always check this from a screenshot, but flag any design relying on absolute pixel sizes that would clearly break at zoom.

### 7. Motion and animation

- Large, sudden, or continuously looping animations can trigger vestibular issues.
- Parallax effects, autoplay video, and persistent spinners are common offenders.
- If you have source, check for `prefers-reduced-motion` media query usage. Its absence with heavy animation is a finding.

### 8. Touch target size

(Covered in layout, repeated here because it's an a11y issue too): minimum 44×44px for touch targets. Small icon buttons are the most common violators.

## Fast diagnostic questions

1. Is there any text on the page that looks faded or hard to read? (Contrast smell.)
2. Is there text overlaying an image or gradient without a solid scrim?
3. Pick a button — does its text clearly stand out against its background?
4. Are any form inputs labeled only with placeholder text (no label above or beside)?
5. Is color the only way to tell apart states (error red, success green, disabled gray) — or is there also a shape/icon/text cue?
6. Is any body text visibly smaller than ~14px?

## How to phrase findings

**Bad:** "Contrast issues."
**Good:** "The helper text under form inputs appears to be approximately `#9ca3af` on `#ffffff`, which is roughly 2.85:1 contrast — below the WCAG AA threshold of 4.5:1 for body text. Darken to at least `#6b7280` (4.7:1) to pass."

**Bad:** "Focus states are missing."
**Good:** "The custom buttons have `outline: none` set in the CSS with no `:focus-visible` replacement. This removes the focus indicator for keyboard users entirely. Add a `:focus-visible` style with a 2px outline offset by 2px, using the primary brand color or a dedicated focus color."

## Scope note

This reference covers accessibility issues that are *observable in a visual review*. A complete accessibility audit also includes screen reader testing, keyboard navigation flows, ARIA usage, and more — all of which are out of scope for a visual review skill. If the user's context demands a full audit, say so clearly and recommend dedicated a11y tooling (axe, Lighthouse, manual screen reader testing).
