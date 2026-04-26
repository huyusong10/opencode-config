# Visual Consistency

Consistency is the difference between a design and a collection of design decisions. Users don't consciously notice consistency — they notice its absence, and they experience that absence as "something feels off."

## What to look for

### 1. Color system

A coherent UI uses a small, intentional palette. Ad-hoc UIs accumulate colors as different people touch them.

- **Count distinct colors**: primary, neutrals, semantic (success/warning/error), maybe one accent. More than 12–15 distinct colors on a single page (excluding images) is a smell.
- **Check shade consistency**: if the design uses a blue, is it the same blue everywhere, or are there three near-identical blues (#2563eb, #2962ff, #1e5ebd)?
- **Semantic color usage**: is red consistently used for errors/destructive actions, or does it appear on a random "Buy now" button? Users learn color meanings; breaking them costs trust.
- **If source available**: grep for hex codes and rgb()/hsl() values. Count unique colors. Compare against any CSS variables defined — if variables exist and are defined, any hardcoded hex that duplicates them is a finding.

### 2. Border radius

Radius is one of the strongest carriers of visual character. A design that's pill-shaped, squared, or lightly rounded should stay in that family throughout.

- Inventory all radii on the page: buttons, inputs, cards, images, modals.
- Flag combinations that shouldn't coexist: e.g., sharp-cornered cards alongside fully-pill buttons, unless there's a clear reason.
- Nested elements: a 4px-radius button inside an 8px-radius card looks fine; the inner radius should usually be equal to or smaller than the outer, and the math can be "outer radius minus padding" for concentric alignment.

### 3. Shadows and elevation

If the design uses shadows to convey depth, they should form a consistent elevation system (usually 3–5 levels, each subtly more prominent). Random shadows applied per-element is a classic tell of incohesion.

- Count distinct shadow treatments. Is there a system, or is each component rolling its own?
- Are shadows directionally consistent? If the "light source" is top-left for one element, it shouldn't be bottom-right for another on the same page.
- Are shadow colors tinted consistently? (Pure black shadows often look harsh; tinted shadows — e.g., with the primary brand color at very low opacity — feel more intentional.)

### 4. Borders and dividers

- Are border weights consistent? 1px everywhere is fine; a 2px here, 1.5px there looks sloppy.
- Is there a clear reason for each divider, or are they over-used? Heavy divider use often points at weak spacing — the divider is compensating for insufficient whitespace.
- Border color: typically one or two "border grays" in the palette. More than three is excessive.

### 5. Interactive element styles

This is where inconsistency most commonly surfaces because interactive elements accumulate over time:

- **Buttons**: count distinct button styles. Primary, secondary, ghost — that's a reasonable system. Seven button styles that differ slightly in padding, radius, color is a problem.
- **Links**: should have a consistent color + underline treatment across the page. Inline links in body copy that are styled differently from links in the footer is a smell (sometimes intentional, sometimes just drift).
- **Inputs**: height, border radius, focus treatment should match across text inputs, selects, textareas.
- **Hover/focus/active states**: if you can observe them, check they're applied consistently. Buttons that change opacity on hover vs. buttons that darken vs. buttons that don't change at all — on the same page — is a clear finding.

### 6. Iconography

- Is the icon set stylistically unified? Filled icons mixed with outline icons reads as random unless clearly intentional.
- Are icon weights (stroke thickness) consistent? A 1.5px stroke icon next to a 2.5px stroke icon looks broken.
- Are icon sizes proportional to their context? 16px icons next to 14px text is fine; 24px icons next to 12px text is jarring.

### 7. Imagery and illustrations

If the page mixes photography and illustration, or multiple illustration styles, or stock photos with different color treatments — flag it. Consistency in imagery includes:

- Color grading / filter consistency across photos
- Illustration style (flat vs. 3D, line weight, color palette)
- Aspect ratios of image containers
- Same treatment (crop, radius, shadow) for images in the same context (e.g., blog post thumbnails all 16:9 with 8px radius)

## Fast diagnostic questions

1. How many distinct blues (or whatever the primary is) appear on this page? Should be 1, or a tight set of tints/shades.
2. Pick two buttons from different sections. Are they the same height, same radius, same padding?
3. Do the cards/panels on this page all have the same shadow, or do they vary?
4. Are the icons from a single family (stroke, fill, size), or mixed?
5. Do links in body text look different from links in the navigation? If so, is that intentional?

## How to phrase findings

**Bad:** "The visual style isn't unified."
**Good:** "The page uses three distinct button styles for what appear to be primary actions: a solid-blue-with-4px-radius in the hero, a solid-blue-with-8px-radius in the pricing section, and a gradient-blue-with-pill-shape in the footer. Unify to a single primary button treatment."

**Bad:** "Shadows are inconsistent."
**Good:** "Cards in the 'Features' section use a soft `0 4px 12px rgba(0,0,0,0.08)` shadow; cards in the 'Testimonials' section use a harder `0 2px 4px rgba(0,0,0,0.25)`. Either pick one as the 'elevated card' style or define a clear reason (e.g., testimonials are 'at rest', features are 'highlighted')."
