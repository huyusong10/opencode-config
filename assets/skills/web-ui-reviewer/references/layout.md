# Layout & Responsive Behavior

Layout is about where things go and why. Responsive behavior is about whether those decisions hold up when the canvas changes size. Both are judged against the page's purpose — a landing page, a dashboard, a long-form article all have different "right answers."

## What to look for

### 1. Information hierarchy in the layout

Independent of typography, the *positions* of elements communicate importance. Top-left gets seen first in LTR reading contexts; center gets attention; bottom-right is last.

- Does the most important element (hero message, primary CTA, key data point) occupy a position that matches its importance?
- Is there a clear visual entry point, or does the eye have to hunt?
- Are secondary elements subordinated (smaller, lower contrast, further from center), or competing with the primary?

**Common failure:** four "primary" CTAs above the fold. When everything is loud, nothing is loud.

### 2. Content density and whitespace

Whitespace (negative space) is an active design element, not empty leftover. The right density depends on purpose:

- Marketing/editorial pages: generous whitespace, focused content per viewport.
- Tools/dashboards: denser, because the user's task is to compare/scan data.
- Forms: moderate — enough to group fields, not so sparse that users lose the through-line.

Judge density against intent. Flag pages that mismatch:
- A landing page that looks like a tax form (too dense)
- A dashboard with massive whitespace between data points (too sparse, forces scrolling)

### 3. Alignment of structure to content

Does the grid match what the content needs?

- **2-column layouts** work for paired content (image + text, nav + page). They fail when the two columns have wildly different content volumes — one column empty while the other runs long.
- **3-column card grids** work for roughly equal items. They fail when one card's content is 3x longer and the row heights fight to match.
- **Asymmetric layouts** (e.g., 1/3 + 2/3) can be striking but need a reason — the narrow column should serve a different function from the wide one.

### 4. Section breaks and flow

A page is usually read top-to-bottom as a sequence of sections. Each section transition should:

- Be clear (the eye knows it just entered a new zone) — via spacing, background change, or divider.
- Be rhythmic (sections don't all need to be the same height, but jarring size jumps feel arbitrary).
- Have a reason to exist. A section that just repeats the previous one's message in slightly different words is filler; flag it.

### 5. Viewport and breakpoint behavior

You can only judge this if you have multiple screenshots (desktop + mobile, or different widths) or if you have source with media queries. If you only have one screenshot, call out what you *can't* evaluate.

When multiple widths are available:

- **Breakpoints**: does the layout shift at sensible widths, or does it stretch awkwardly and then suddenly snap? Common sensible breakpoints: ~640px, ~768px, ~1024px, ~1280px, ~1536px.
- **Mobile-first thinking**: does the mobile version feel designed, or like a desktop squeezed? Hallmarks of squeeze: tiny touch targets, horizontal scroll, navigation shoved into a hamburger without thought to what's inside.
- **Large screens**: on very wide viewports, does content have a max-width, or does it stretch into 200-character lines? The latter is a classic failure.
- **Stacking order on mobile**: when multi-column layouts collapse, the vertical order should reflect importance. A common bug is a sidebar appearing above main content on mobile.

### 6. Touch target sizes (if evaluating mobile)

Buttons, tap targets, nav items on mobile should be at least 44×44px (Apple's guideline, widely adopted). Smaller and users miss-tap.

- Especially watch out for: small "x" close buttons, icon-only nav, inline text links packed closely.

### 7. Scroll and page length

- Is the page's length appropriate for its content? A landing page running 15 scrolls of fluff is a smell; a landing page trying to cram 10 products above the fold is also a smell.
- Does the page have a clear end, or does it trail off? Footers, final CTAs, and "that's all" signaling matters.
- Are there "false bottoms" — sections that look like the page ends but have more below? Usually happens when a section's background ends and the next section has similar styling but weak signaling.

### 8. Fixed, sticky, and overlapping elements

- Sticky headers: do they take proportionate space, or eat half the viewport?
- Modals/overlays: is the backdrop dim enough to focus attention? Can the modal be dismissed intuitively?
- Floating elements (chat bubbles, cookie banners): do they cover primary content or CTAs? A cookie banner hiding the main CTA is a very common, very bad bug.

## Fast diagnostic questions

1. In a 2-second glance, can you identify the primary action on this page?
2. Does the page have more than 3 elements that are loudly competing for attention?
3. If the viewport were mobile, which elements would break or feel wrong?
4. On the widest viewport, does body text stay within ~75 characters per line, or does it stretch?
5. Are there any elements (cookie banner, chat widget, header) covering content that matters?
6. Does each section feel like it earned its spot, or is there filler?

## How to phrase findings

**Bad:** "The layout feels cluttered."
**Good:** "Above the fold, five elements are competing for primary attention: the headline, two CTAs ('Get started' and 'Learn more'), a product screenshot, and a 'Featured in...' logo strip. Demote at least two — e.g., move the logos below the fold and make 'Learn more' a ghost button to subordinate it to 'Get started'."

**Bad:** "Not responsive enough."
**Good:** "At viewport widths below 768px, the 3-column feature grid stacks into a single column as expected, but the order places the 'Pricing' card first — above 'Features' — which inverts the narrative intent. Re-order the mobile stack to Features → Pricing → FAQ."
