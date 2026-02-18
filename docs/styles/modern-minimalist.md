# Style Prompt: Modern Minimalist Geometric

## For use in Claude Code — Dynamic Metal Panel Pattern Generation

---

## Style Overview

Modern Minimalist Geometric panels use **simple, repeating geometric primitives** — straight lines, basic polygons, and circles — arranged in strict, uniform grids or tessellations. The aesthetic is clean, architectural, and restrained. There is **no ornamentation, no curves that aren't perfect arcs, and no organic shapes**. Every element is mathematically predictable. The visual interest comes entirely from **repetition, spacing, and the interplay of positive/negative space** (metal vs. cut-away void).

These patterns are the workhorse of commercial and residential decorative metalwork — privacy screens, balcony railings, room dividers, facade cladding, and fencing.

---

## Core Design Principles

1. **Uniform repetition**: A single unit cell (tile) repeats across the entire panel. There is no variation between cells — every instance of the tile is identical.
2. **Strict grid alignment**: Tiles snap to a regular grid — rectangular, offset/brick-lay, hexagonal, or diagonal. No freehand placement.
3. **Structural connectivity (CRITICAL — read carefully)**: When a CNC laser or plasma cutter cuts a **closed path** (any shape that forms a complete loop), the material inside that closed path **physically separates and falls out**. It drops through the slat bed and becomes scrap. This has two consequences:

   **a) No floating metal islands**: If a piece of metal is completely surrounded by cuts on all sides, it is not connected to the rest of the panel. It will fall out. Every piece of remaining metal must have an unbroken physical connection back to the panel frame through other uncut metal.

   **b) Nested shapes require bridges**: If you want a shape to appear INSIDE a cutout (e.g., a small circle inside a larger hexagonal cutout, or concentric rings), you **must** add **bridges** (also called tabs or ties). A bridge is a short segment of uncut metal that spans across the outer cutout to physically connect the inner shape to the surrounding panel. Without bridges, the outer cut completes a closed loop, the entire region (including the inner shapes) drops out, and the inner detail is lost on the shop floor.

   **Example — the stencil rule**: Think of the letter "O" cut from a stencil. The center oval island would fall out without the two small tabs connecting it to the frame. Every closed-loop cutout that contains an interior element needs this same treatment. The letter "D" needs one bridge to hold the inner void. "B" needs two. And so on.

   **Bridge design guidelines**:
   - Minimum 2 bridges per island (for stability; 3-4 for larger islands)
   - Bridge width ≥ minimum web width (typically 3mm / 0.125")
   - Distribute bridges evenly around the island (e.g., at 12 and 6 o'clock, or at 120° spacing for 3 bridges)
   - Bridges should be perpendicular to the cut line they span for maximum strength
   - Bridges interrupt the outer closed cut path — they are segments where the cutter does NOT cut

   **Design-first approach**: Rather than adding bridges as an afterthought, prefer designing patterns where connectivity is inherent. For example:
   - Instead of a circle inside a hexagon, use **concentric arcs** (partial circles, not closed) that naturally connect to the hex walls
   - Instead of nested closed shapes, use **radial spokes** that connect inner elements to outer boundaries
   - Use **partial cuts** — shapes that are intentionally not fully closed, leaving natural connection points
   
   **Validation rule**: After generating any pattern, check every closed cut loop. If any closed loop contains geometry inside it, either (a) add bridges or (b) redesign that element to avoid fully closed inner regions.
4. **No overlapping or coincident geometry (CRITICAL — applies to ALL styles)**: Cut lines and shapes must **never overlap, touch, or share edges**. This is a distinct problem from intersecting lines and has several forms:

   **a) Shared edges between adjacent cutouts**: When two cutout shapes share an edge (e.g., two rectangles side by side with no gap), the metal web between them has **zero width** — meaning there is no metal there at all. The two cutouts merge into one larger hole. This commonly happens with:
   - **Brick patterns** where adjacent bricks in the same row share a vertical edge
   - **Any tessellation** where cutout shapes are defined independently per cell and the shared boundary gets drawn twice or collapses to zero width

   **The fix**: Cutout shapes are NOT the cells themselves. The **cell is the repeating unit of the grid** (including its share of the web). The **cutout is the cell MINUS the web width on all sides**. For every cutout, inset (shrink) the shape from the cell boundary by **half the web width** on every edge. This guarantees that adjacent cutouts always have a full web-width of solid metal between them.

   **Example — Brick pattern**:
   - Cell = 3" wide × 1.5" tall, web = 0.125"
   - Cutout = cell inset by 0.0625" (half web) on all sides = 2.875" × 1.375" rectangle
   - Two adjacent bricks in the same row: their cutouts are separated by 0.125" (0.0625" gap on each side of the shared cell boundary)


   **b) Coincident lines (double-cut)**: When the same line segment or arc is generated twice (e.g., once for cell A's right edge and once for cell B's left edge), the cutter traces that path twice. This causes:
   - Excessive heat buildup and material warping
   - Wider-than-intended kerf
   - Potential burn-through on thin material

   **The fix**: Either (1) use the inset approach above so edges never coincide, or (2) deduplicate — after generating all geometry, remove any line segments or arcs that are identical or overlap within a tolerance (e.g., endpoints within 0.01mm).

   **c) Intersecting cut paths**: Two cut lines that cross each other at any point. The intersection point gets cut from two directions, causing the same heat/kerf problems. **No cut path should cross any other cut path.**

   **Validation rule**: After generating the full pattern, verify:
   1. No two line segments share endpoints AND overlap in direction (coincident)
   2. No two line segments intersect at any interior point
   3. The minimum distance between any two non-connected cut paths ≥ minimum web width
   4. No circle or arc overlaps with or touches any other circle, arc, or line

5. **Consistent stroke/web width**: The remaining metal between cuts (called "webs" or "bridges") should maintain a **minimum consistent width** throughout the pattern. For laser cutting, this is typically ≥ 1/8" (3mm). For plasma, ≥ 3/16" (5mm). This parameter should be user-configurable. **This is enforced by the inset rule in Principle 4** — if every cutout is inset from its cell boundary by half the web width, the webs are automatically correct.
6. **Border/margin**: The pattern should be inset from the panel frame by a configurable margin. The margin region is solid metal connecting the pattern to the frame.
7. **Symmetry**: Patterns are typically symmetric on at least one axis (often both X and Y), though offset/brick-lay grids may only have translational symmetry.

---

## Sub-Pattern Types

When generating a Modern Minimalist pattern, randomly select ONE of the following sub-types (or let the user choose). Each is described with its geometric construction:

### 1. Horizontal/Vertical Slats (Linear)
- **Description**: Parallel horizontal or vertical bars of equal width separated by equal-width slots. The simplest possible pattern.
- **Construction**: Alternating solid bars and void strips. Bars run the full width (horizontal) or full height (vertical) of the panel.
- **Parameters**: bar_width, slot_width, orientation (horizontal | vertical | alternating_sections)
- **Variation**: Staggered slats — bars are broken into segments with offset gaps, creating a brick-lay rhythm. Each bar segment is the same length; gaps align on alternating rows.
- **Variation**: Tapered slats — slot width gradually increases or decreases from one edge to the other, creating a gradient density effect.

### 2. Rectangular Grid / Lattice
- **Description**: A grid of rectangular cutouts separated by uniform-width webs, like a window grid or waffle pattern.
- **Construction**: Horizontal and vertical lines at regular intervals define a grid. The intersection webs are the metal; the rectangles between them are cut out.
- **Parameters**: cell_width, cell_height, web_width
- **Variation**: Nested rectangles — each cell contains a smaller concentric rectangle. **Bridges are mandatory**: 4 short uncut spans (one per side, at midpoints) connect the inner rectangle to the outer cell walls. Without these bridges, the inner rectangle falls out with the surrounding cutout. The bridges also create a visual cross/plus motif as a secondary design element.
- **Variation**: Alternating cell sizes — two different cell sizes alternate in a checkerboard arrangement.

### 3. Diamond / Diagonal Grid
- **Description**: The rectangular grid rotated 45°. Diamond-shaped cutouts in a regular array.
- **Construction**: Two sets of parallel lines at +45° and -45° create a diamond tessellation. The intersecting webs are the metal.
- **Parameters**: diamond_width (measured corner to corner on the horizontal axis), diamond_height (vertical axis), web_width
- **Variation**: Elongated diamonds — height ≠ width, creating tall narrow or wide flat diamond shapes.
- **Variation**: Double diamond — a smaller diamond cutout nested inside each larger diamond. **Bridges are mandatory**: 4 bridges at the cardinal points (top, bottom, left, right) connect the metal between the inner and outer diamonds to the surrounding web. Without bridges, the outer diamond cut creates a closed loop and the entire interior (including the inner diamond shape) falls out as one piece.

### 4. Hexagonal Grid (Honeycomb)
- **Description**: Regular hexagonal cutouts in a honeycomb tessellation.
- **Construction**: Regular hexagons packed in the standard honeycomb arrangement (each hexagon shares edges with 6 neighbors). The shared edges are the metal webs.
- **Parameters**: hex_radius (center to vertex), web_width
- **Variation**: Partial hexagons — alternate hexagons are left as solid metal (not cut), creating a checkerboard-like density.
- **Variation**: Hexagon with center dot — a small circular cutout at the center of each hexagonal cell. **Bridges are mandatory**: the hexagonal cutout is a closed loop, so a circle "inside" it would just fall out with the hex piece. Instead, implement this as the hex cutout interrupted by 3 radial bridges (at 120° spacing) connecting a central solid disc to the surrounding hex web. The circle is then cut inside the disc area. Alternatively, use 3 short arcs instead of a full circle to avoid a second closed-loop problem inside the disc.

### 5. Chevron / Herringbone
- **Description**: Rows of V-shapes (chevrons) stacked vertically. Adjacent rows may point in the same or alternating directions.
- **Construction**: Each chevron is two angled line segments meeting at a point. Chevrons in a row share endpoints. Rows stack vertically with consistent spacing.
- **Parameters**: chevron_width, chevron_height (depth of the V), row_spacing, direction_mode (all_same | alternating)
- **Variation**: Nested chevrons — 2-3 concentric chevrons per cell, getting smaller toward the center. **Bridge note**: since chevrons are open shapes (not closed loops) that share a common opening direction, inner chevrons naturally remain connected through the open end. Ensure the open ends of all nested chevrons face the same direction and connect to the adjacent row's metal web.
- **Variation**: Broken chevron — each arm of the V is split into 2 segments with a small gap, creating a dashed effect.

### 6. Triangle Tessellation
- **Description**: Equilateral or isosceles triangles tessellated across the panel. Alternating triangles point up and down.
- **Construction**: Standard triangular grid. Each triangle is a cutout; the shared edges are metal webs.
- **Parameters**: triangle_side_length, web_width
- **Variation**: Alternate solid/void — every other triangle is left as solid metal, creating a pinwheel-like density.
- **Variation**: Subdivided — each triangle is subdivided into 4 smaller triangles (Sierpinski-style, 1 iteration only), with the center triangle cut out and the 3 corner triangles solid.

### 7. Interlocking Circles / Rings
- **Description**: Regular array of circular cutouts. Circles do not overlap; they sit in a grid with uniform spacing.
- **Construction**: Circles of identical radius placed at regular grid points (square grid or offset/hex-packed grid). The metal between circles forms the web.
- **Parameters**: circle_radius, grid_type (square | hex_packed), spacing (center-to-center distance)
- **Variation**: Concentric rings — each circle position has 2-3 concentric ring cutouts. **Bridges are mandatory at every level**: each ring is a closed loop, so without bridges every ring and everything inside it falls out. Use 3-4 radial bridges per ring, aligned so bridges at each level line up radially (creating a spoke effect). The outermost ring bridges connect to the surrounding grid web; inner ring bridges connect to the metal band of the next ring out. This creates a target/bullseye with radial spokes — a strong visual motif.
- **Variation**: Mixed sizes — two different circle sizes alternate in a regular pattern.

### 8. Interlocking Squares (Basket Weave)
- **Description**: Pairs of rectangles arranged in alternating horizontal/vertical orientation, resembling a woven basket or parquet floor.
- **Construction**: The panel is divided into square super-cells. Each super-cell contains 2-3 horizontal rectangles or 2-3 vertical rectangles. Adjacent super-cells alternate between horizontal and vertical orientation.
- **Parameters**: cell_size, rect_count (2 or 3 per cell), web_width
- **Variation**: Rotated squares — instead of basket weave, squares are rotated 45° within each cell. **Bridges are mandatory**: 4 diagonal bridges connect each rotated square's corners to the parent cell's corners, preventing the rotated square island from falling out. This naturally creates an 8-pointed star negative space motif at each cell intersection.

### 9. Offset Brick Pattern
- **Description**: Rectangular cutouts arranged in a running bond (brick-lay) pattern where each row is offset by half a cell width.
- **Construction**: Standard rectangular grid but even rows are shifted horizontally by half the cell width. **Critical: apply Principle 4 (no overlapping geometry)**. Each brick CELL defines the grid position and size. The brick CUTOUT is the cell inset by half the web width on all four sides. This prevents adjacent bricks from sharing edges. In a running bond layout, the offset means vertical webs in alternating rows don't align — that's correct and expected; what matters is that every cutout rectangle is smaller than its cell by the web inset amount.
- **Parameters**: brick_width, brick_height, web_width
- **Variation**: Soldier course accent — every Nth row uses tall, narrow bricks (rotated 90°) as a horizontal accent band. Same inset rules apply to the rotated bricks.

---

## Generation Algorithm (Pseudocode)

```
function generateModernMinimalist(panel_width, panel_height, params):
    1. Select sub-pattern type (random or user-specified)
    2. Select variation (random or user-specified) 
    3. Calculate unit cell dimensions based on params and panel size
    4. Determine grid layout:
       - How many columns and rows of cells fit within the panel (minus margins)
       - Whether offset/stagger applies
    5. For each grid position (row, col):
       - Calculate cell origin (x, y), applying offset if needed
       - Calculate cutout geometry by insetting from cell boundary by half web_width
       - Generate the geometry for the inset cutout (NOT the cell boundary)
       - All geometry is LINE segments and CIRCLE/ARC entities (DXF-compatible)
    6. Deduplicate and validate geometry:
       a. Remove any duplicate line segments (same endpoints within tolerance)
       b. Verify no two cut paths intersect or overlap
       c. Verify minimum distance between non-connected cut paths ≥ web_width
    7. Clip all geometry to the panel boundary (minus margin)
    8. Add frame outline on a separate layer
    9. Validate structural connectivity:
       a. Identify all closed cut paths (loops)
       b. For each closed loop, check if any geometry exists inside it
       c. If inner geometry found: verify bridges exist spanning the outer loop 
          to connect inner features to outer metal
       d. If no bridges: either add them automatically or flag an error
       e. Verify all metal regions connect back to the frame (flood-fill test)
    10. Return geometry as arrays of:
       - lines: [[x1, y1, x2, y2], ...]
       - circles: [[cx, cy, radius], ...]
       - arcs: [[cx, cy, radius, start_angle, end_angle], ...]
```

---

## Critical Fabrication Constraints (enforce these)

- **NO FLOATING ISLANDS (most common failure)**: Any closed cut loop causes everything inside it to physically fall out. If your pattern has a shape inside another shape (nested rectangles, concentric circles, center dots inside hexagons, etc.), the inner shape WILL BE LOST unless bridges connect it to the outer metal. Always add bridges or redesign to use open paths (arcs, partial shapes) instead of nested closed paths. **Test every design by asking: "If I trace each closed cut path, does anything inside it need to stay attached?"**
- **Minimum web width**: Never generate webs thinner than the user-specified minimum (default 3mm / 0.125"). Check all gaps between adjacent cuts.
- **NO OVERLAPPING OR COINCIDENT GEOMETRY**: See Core Principle 4. Every cutout must be inset from its cell boundary by half the web width. No cut line should be drawn twice, no two cut paths should touch or intersect. This is the most common cause of failed patterns in tessellations (brick, honeycomb, etc.).
- **Minimum cutout size**: Cutouts smaller than ~2mm (0.08") may not cut cleanly. Enforce a minimum feature size.
- **Corner relief**: Sharp interior corners (< 90°) should have a small relief radius to prevent stress cracking. Add a tiny arc (radius = material_thickness / 2) at sharp interior corners.
- **Tab/bridge support for large cutouts**: For very large cutouts (where the waste piece is heavy enough to shift during cutting), add small tabs (bridges) to hold the waste piece in place until cutting is complete. Tabs are short uncut segments along a cut line, typically 1-3mm wide. These are cosmetic tabs meant to be snapped off after cutting — distinct from structural bridges that are permanent parts of the design.

---

## DXF Output Notes

- All pattern geometry goes on a layer named `PATTERN`
- Frame/border geometry goes on a layer named `FRAME`  
- Use only LINE, CIRCLE, and ARC entities (universal compatibility)
- Coordinates should be in real-world units (inches or mm) matching the user's specification
- Y-axis is typically inverted for CNC: DXF Y=0 is at the bottom. Generate geometry with Y increasing upward.
- Use POLYLINE or LWPOLYLINE for connected paths when possible to reduce file size and improve CAM path planning
