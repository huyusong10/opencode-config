# Typography & Readability

Typography carries more of a UI's "quality feel" than any other element. A page with boring layout but beautiful typography often reads as polished; the reverse almost never does.

## What to look for

### 1. Type scale

A good design uses a limited, ratio-based scale — commonly 5–7 sizes stepping up in a consistent ratio (1.2, 1.25, 1.333, 1.5). Ad-hoc designs have 15+ sizes that drift randomly.

- Identify each distinct font size on the page. Body, small text, UI labels, h1–h3, captions. Count them.
- Are the jumps between sizes meaningful? A 14px body next to a 15px heading doesn't create hierarchy — it just looks like a mistake.
- Does the largest size (usually a hero headline) earn its size? Big type for big ideas; not for "Subscribe to our newsletter."

**If source available:** grep for `font-size` values. More than ~8 distinct values is a smell.

### 2. Hierarchy

Hierarchy is how the eye knows what to read first, second, third. It's created by size, weight, color, and spacing — not any one of these alone.

- Can you tell, at a glance (before reading), what the most important element on the screen is?
- Can you tell what's a heading vs. a subheading vs. body vs. caption without reading the content?
- Is there a level of hierarchy being skipped? (e.g., hero → tiny body text, no intermediate tier — feels abrupt.)
- Are there *too many* levels? More than 4–5 active levels on one page overwhelms.

### 3. Line length

Research-backed: **45–75 characters per line** for body text. Too wide and the eye loses its place returning to the next line; too narrow and rhythm breaks.

- Flag any body paragraph that runs the full width of a wide viewport without a max-width constraint.
- Flag any column that's so narrow the text wraps every 3–4 words.

### 4. Line height (leading)

- Body text: 1.4–1.7× font size is the safe range. Below 1.3 feels cramped; above 1.8 feels disconnected.
- Headings: tighter, usually 1.0–1.25. Large display type at 1.5 looks like a typo.
- UI labels (buttons, form labels): tight, often 1.0–1.2.

Wrong line height is one of the most common subtle issues — it doesn't trigger a specific complaint from users, but it makes text feel harder to read.

### 5. Font weight and contrast

- Weight differences need to be meaningful. 400 (regular) and 500 (medium) often look almost identical — either go 400 vs 600, or pick one.
- Don't use italic for emphasis in UI text — it's hard to read on screen. Bold is better.
- Never use all-caps for paragraphs. Fine for short labels; painful for anything longer.

### 6. Font pairing

If more than one typeface is used:

- Does the pairing have a clear role split? (e.g., serif for headings, sans for body.) Or does it look arbitrary?
- Do the two faces have compatible x-heights and proportions? A tall-x-height sans paired with a delicate serif often clashes.
- Three or more faces on one page is almost never right. Flag it.

### 7. Color of text

- Body text on white/light background should rarely be pure black (#000) — pure black is too harsh. Very dark gray (#1a1a1a to #333) is easier on the eye.
- Body text on dark background should rarely be pure white — a slightly warm off-white is gentler.
- Be wary of light gray body text (e.g., #999 on white). Looks "modern" at a glance, fails contrast, and ages poorly.

### 8. Text treatment details (signals of care)

These are the things separating junior work from senior work:

- **Hanging quotation marks** — quotes that hang outside the text block for optical alignment. Rare but a mark of craft.
- **Proper hyphens, en-dashes, em-dashes** — `-` vs `–` vs `—` used correctly. Flag hyphens used for ranges (1-5 should be 1–5).
- **Smart quotes** (" " vs " " and ' vs '). Straight quotes in body copy are a tell.
- **Non-breaking spaces** before single-syllable orphans at line ends (hard to check from screenshot, but check source).
- **Ligatures** (fi, fl) — rare to flag but worth noting if broken.

## Fast diagnostic questions

1. Count the distinct font sizes on the page. Is it ≤8 or 15+?
2. Can you rank the top-3 most important elements on the screen in a 2-second glance?
3. Pick a paragraph of body text. Count the characters in a line. Is it in 45–75?
4. Does any heading look the same size as body text but bold? (That's not hierarchy — that's emphasis.)
5. Is any all-caps text longer than a few words?
6. Are the quote marks straight (") or curly ("")?

## How to phrase findings

**Bad:** "Typography could use work."
**Good:** "The page uses 11 distinct font sizes (13, 14, 15, 16, 17, 18, 20, 22, 24, 32, 48). Consolidating to a scale of 6 — e.g., 14, 16, 20, 24, 32, 48 — would create clearer hierarchy and feel more designed."

**Bad:** "The hierarchy is unclear."
**Good:** "The h2 section headers (20px, weight 500) are only marginally distinct from the body paragraph lead-in (18px, weight 500). Either bump the h2 to 24px or shift to weight 700 to give sections a clearer anchor."
