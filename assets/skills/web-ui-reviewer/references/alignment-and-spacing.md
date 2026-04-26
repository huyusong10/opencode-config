# Alignment & Spacing

This is the foundation. When alignment and spacing are wrong, nothing else matters — the eye registers "this is amateur work" before it reads a single word. When they're right, almost everything else is forgivable.

## What to look for

### 1. Grid discipline

A professional UI sits on a grid. You don't need to see the grid to verify this — you look for whether edges of related elements line up.

- **Vertical alignment**: do left edges of text blocks, images, cards line up with each other down the page? Or do they stagger arbitrarily?
- **Horizontal alignment**: within a row, do elements share a baseline (text) or a center line (icons + labels)?
- **Column consistency**: if the layout has columns, are they the same width when they're supposed to be, and do they break at sensible widths?

**Red flag:** elements that are *almost* aligned — off by 2–8px. This is more damaging than elements that are obviously in different columns, because the eye perceives it as "wrong" without being able to say why.

### 2. Spacing rhythm

Good design uses a small set of spacing values (a "spacing scale") repeated throughout — commonly powers of 2 or multiples of 4/8. Bad design has spacing that looks picked at random.

- Count distinct gap sizes between adjacent elements. More than 6–8 distinct values on one page is usually a smell.
- Look for adjacent gaps that are *slightly* different — e.g., 12px between some items, 14px between others. Either make them the same or make them meaningfully different (12 vs 24).
- Check that vertical rhythm (space between sections, between paragraph and heading, etc.) feels consistent within the same context.

**If source is available:** grep for `margin`, `padding`, `gap` values. Count the unique ones. A design system usually has 4–8 tokens; raw CSS often has 30+. That discrepancy is the finding.

### 3. Relational spacing (proximity)

Things that belong together should be closer to each other than to things they don't belong with. This is Gestalt 101 but routinely violated.

- A label and its input should have less space between them than either has to the next field.
- A section heading should be closer to its section than to the preceding section.
- Caption below image: less space than the gap to the next image.

**Red flag:** uniform spacing everywhere. Equal spacing between label-input pairs and between separate form fields forces the eye to group them wrong.

### 4. Edge and container spacing

- Content shouldn't touch the viewport edge on desktop (needs breathing room — usually at least 16–24px on small screens, more on large).
- Cards/containers shouldn't have content kissing their inner edges (consistent inner padding).
- Elements inside a card should respect the same inner grid as the page — not drift to their own offset.

### 5. Optical vs mathematical alignment

Some elements need to be *optically* aligned, not *mathematically* aligned, to look right. The eye doesn't trust the bounding box — it trusts the visual weight.

- **Icons with text**: usually need to be nudged 1–2px off center to look centered.
- **Circles next to squares**: the circle often needs to be slightly larger to read as the same size.
- **Text in buttons**: often needs more padding on one side to look balanced (e.g., uppercase has more weight at the top).

You probably can't judge this precisely from a screenshot, but you can flag "the icon looks slightly off-center in this button" as a Minor finding and let the developer correct.

## Fast diagnostic questions

Work through these when reviewing:

1. If I drew a vertical line through the left edge of the hero headline, does the subheadline fall on it? The primary button?
2. Count the distinct horizontal indentations from the left edge. Is it 2–3, or is it 8+?
3. Are the gaps between cards in a grid uniform, or do some have an extra pixel or two?
4. Does the spacing above a heading feel about 1.5–2x the spacing below it? (The heading should attach to the content that follows it, not float equidistant.)
5. Are form labels closer to their inputs than to the field above?

## How to phrase findings

**Bad:** "Spacing is inconsistent."
**Good:** "The gap between the feature cards is 24px, but the gap between the last card and the section below is also 24px — this makes the cards feel like they belong to the next section. Increase the section-bottom gap to 64–80px."

**Bad:** "The hero is misaligned."
**Good:** "The hero headline's left edge is at x=120, but the CTA button below it is at x=128 — an 8px drift. Either align the CTA to 120, or indent it deliberately (e.g., 160) so the offset reads as intentional."
