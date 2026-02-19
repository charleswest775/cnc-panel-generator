# Style Prompt: Sacred Geometry / Mandala

## For use in Claude Code — Dynamic Metal Panel Pattern Generation

---

## Style Overview

Sacred Geometry and Mandala panels use **mathematically precise constructions rooted in ancient geometric traditions** — circles, arcs, polygons, and spirals arranged with strict radial symmetry or proportional relationships (particularly the golden ratio φ ≈ 1.618). The aesthetic is spiritual, meditative, and highly detailed. These patterns create extraordinary light-and-shadow effects when used as lamps, screens, or wall art.

This style divides into two layout modes:
- **Centered compositions** — A single large mandala or sacred geometry figure dominates the panel, radiating from the center. Used for wall art, lamp shades, and feature panels.
- **Tiled compositions** — A sacred geometry motif is used as a repeating tile across the panel, similar to how Islamic/Moroccan patterns work. Used for privacy screens, railings, and larger panels.

The choice between centered and tiled should be user-configurable.

---

## Core Design Principles

All principles from the shared fabrication rules apply (structural connectivity, no overlapping geometry, minimum web width, etc.). The following are ADDITIONAL principles specific to this style:

1. **Radial symmetry**: Most sacred geometry patterns exhibit rotational symmetry. The symmetry order (number of identical sectors) is a key parameter. Common orders: 6 (Flower of Life), 8 (many mandalas), 9 (Sri Yantra has 9 interlocking triangles), 12 (zodiac mandalas), and any multiple of the golden angle.

2. **Construction from circles and their intersections**: Many sacred geometry figures are constructed by drawing circles and using their intersection points to define subsequent geometry. The generator should follow this construction sequence rather than trying to draw the final shape directly. This ensures mathematical accuracy.

3. **Positive vs. negative space — the metal IS the pattern**: In metal fabrication, the remaining metal after cutting IS the visible design. The cut-away voids are the negative space. When implementing a Flower of Life, for example, the circle outlines are the metal webs and the petal-shaped regions between overlapping circles are the cut-away voids. Think of it as: **the lines you draw in the design become thin strips of metal; the enclosed areas between lines become holes**.

4. **Line weight = web width**: Every line in the design will be fabricated as a strip of metal with a physical width (the web width). Two lines that appear to "cross" in a drawing actually create a physical metal intersection/junction of that width. Account for this — lines that meet or cross must form structurally sound junctions.

5. **Proportional relationships**: Sacred geometry is built on specific mathematical ratios. The generator should preserve these exactly:
   - Golden ratio: φ = (1 + √5) / 2 ≈ 1.618
   - √2 ≈ 1.414 (diagonal of unit square)
   - √3 ≈ 1.732 (height of equilateral triangle with side = 2)
   - √5 ≈ 2.236 (diagonal of 1×2 rectangle)

---

## Sub-Pattern Types

### 1. Flower of Life
- **Description**: Overlapping circles arranged so that the center of each circle falls on the circumference of surrounding circles, creating a field of petal-shaped intersections. The foundational sacred geometry pattern from which many others are derived.
- **Construction**:
  1. Draw a central circle of radius R
  2. Place 6 circles of the same radius R with centers equally spaced on the circumference of the first circle (at 0°, 60°, 120°, 180°, 240°, 300°)
  3. For each pair of adjacent circles, their intersection points become centers for the next ring of circles
  4. Repeat outward for N rings (user-configurable, typically 2-4 rings)

- **Fabrication approach**: Do NOT draw complete overlapping circles (this would create massive overlapping/coincident geometry problems). Instead:
  1. Compute ALL intersection points between all circles
  2. For each circle, break it into arc segments between consecutive intersection points
  3. Each arc segment is an individual cut path
  4. The petal-shaped enclosed regions (formed by pairs of arcs) are the CUTOUT VOIDS
  5. The arcs themselves represent the metal web paths
  6. **Critical**: Where two circles intersect, there is ONE shared boundary (two arcs meeting at the same points). Draw each arc ONCE only — no coincident arcs. Offset arcs by half web_width to create the actual cut paths on either side of the metal web centerline.

- **Parameters**: base_radius (R), num_rings, web_width
- **Variation**: Partial Flower — only complete the petals within a circular or hexagonal boundary, leaving the outer edge clean
- **Variation**: Flower of Life with Seed highlighted — the central 7 circles (Seed of Life) have thicker webs or additional decorative rings

### 2. Metatron's Cube
- **Description**: 13 circles (Fruit of Life arrangement) with straight lines connecting every circle center to every other circle center, forming a complex web that contains projections of all 5 Platonic solids.
- **Construction**:
  1. Start with the Fruit of Life: 13 circles arranged as the first 2 rings of the Flower of Life pattern (1 center + 6 inner ring + 6 outer ring, where outer ring centers are at the intersection points of inner ring circles)
  2. Draw straight lines connecting every circle center to every other circle center (13 choose 2 = 78 lines)
  3. The circles themselves are secondary — they can be included as decorative rings or omitted

- **Fabrication approach**:
  1. Generate all 78 connecting lines
  2. Many lines will intersect at points OTHER than the circle centers — these intersections are fine as long as they don't create coincident segments
  3. Remove any duplicate or overlapping line segments (some center-to-center lines may partially overlap)
  4. Where lines cross, they form physical metal junctions — verify each junction is structurally sound (minimum web width at crossing points)
  5. The circles (if included) should be broken into arcs at intersection points with the straight lines, following the same approach as Flower of Life
  6. **Check for floating islands**: The dense network of lines creates many small enclosed regions. Verify every enclosed region either (a) is a cutout void or (b) is connected to adjacent metal. With 78 lines, most regions will be inherently connected, but verify.

- **Parameters**: base_radius, include_circles (bool), web_width
- **Variation**: Simplified — only connect each center to its nearest neighbors rather than ALL others, creating a cleaner design
- **Variation**: Platonic highlight — emphasize the lines that form one specific Platonic solid (cube, tetrahedron, octahedron, icosahedron, dodecahedron) with thicker webs while keeping the rest thinner

### 3. Sri Yantra
- **Description**: 9 interlocking triangles (4 pointing up, 5 pointing down) arranged around a central point (bindu), surrounded by concentric lotus petal rings and a square frame (bhupura) with 4 gates. One of the most complex sacred geometry figures.
- **Construction — inside out**:
  1. **Bindu**: Central point (may be a small circle cutout or solid dot with bridges)
  2. **9 Triangles**: The defining feature. 4 upward-pointing triangles and 5 downward-pointing triangles. Their intersections create 43 smaller triangles. The precise vertex positions are defined by specific proportional relationships — this is NOT freehand.

     The triangles are constructed within a circle of radius R. Vertex positions (simplified, using the "optimal" Sri Yantra construction):
     - The triangles are defined by horizontal lines at specific heights within the circle
     - Each horizontal line intersects the circle at two points, defining the base of a triangle
     - The apex of each triangle falls on the vertical center axis or on another horizontal line
     - The key constraint: all 9 triangles must form EXACTLY 43 small triangles with no extraneous intersections. Use a published set of Sri Yantra coordinates.

  3. **Lotus petals**: 2 rings of stylized lotus petals (typically 8 inner + 16 outer) surrounding the triangles
  4. **Bhupura**: Square frame with T-shaped gates on each side

- **Fabrication approach**:
  1. The 9 interlocking triangles create 43 sub-triangles plus surrounding regions
  2. Every line is a triangle SIDE (straight line segment). Lines cross at many points. Compute all intersection points first.
  3. **DO NOT draw 9 complete triangles** — this creates massive overlapping lines where triangles share edges or segments. Instead:
     - Compute all intersection points between all triangle sides
     - Break each triangle side into individual segments between consecutive intersection points
     - Draw each segment ONCE
  4. Each of the 43 small triangles is a potential cutout void OR a metal region. In a traditional Sri Yantra panel, alternating triangles are cut vs. solid (like a checkerboard pattern mapped onto the triangle mesh). Choose a pattern that maintains structural connectivity.
  5. **Bridge requirement**: Many of the 43 small triangles will be islands if cut as voids. Use bridges or a checkerboard-solid approach to ensure connectivity.
  6. The lotus petals are petal-shaped cutout voids separated by metal webs. Each petal is bounded by two arcs. Draw each arc once.

- **Parameters**: outer_radius, num_petal_rings, include_bhupura (bool), web_width
- **Variation**: Simplified Sri Yantra — fewer triangles (e.g., 5 instead of 9) for a less dense pattern
- **Variation**: Open Sri Yantra — the triangles are outline-only (all small triangles are void) with bridges at key intersections to maintain connectivity

### 4. Radial Mandala (Generative)
- **Description**: A symmetrical radial design built from concentric rings, each containing a different repeating motif (petals, arcs, dots, teardrops, triangles). This is the most flexible sub-pattern — it can generate infinite unique mandalas by randomizing the motif in each ring.
- **Construction**:
  1. Define a center point and a maximum radius
  2. Divide the radius into N concentric rings (ring count is configurable, typically 3-8)
  3. Choose a symmetry order S (how many times the motif repeats per ring). Common: 6, 8, 10, 12, 16
  4. For each ring, select ONE motif type from the motif library (below) and repeat it S times around the ring
  5. Each ring may use the same or different symmetry order, but they should be multiples of a base (e.g., base=6, rings use 6, 12, 6, 24) to maintain visual coherence

  **Motif library for ring fill:**
  - **Radial lines (spokes)**: Straight lines from inner ring radius to outer ring radius, evenly spaced. Simple and structural — these also serve as bridges connecting rings.
  - **Petal arcs**: Two arcs meeting at points on the inner and outer ring boundaries, creating a petal/leaf shape. The petal is the cutout void; the arcs are the metal.
  - **Teardrop**: A petal narrowing to a point at the inner ring. Constructed from two arcs meeting at a point on the inner radius and a rounded end on the outer radius.
  - **Triangular teeth**: Isosceles triangles alternating point-in and point-out along the ring, like a saw blade or crown motif.
  - **Diamond/rhombus**: Small diamond shapes spaced evenly within the ring. Each diamond is a cutout void with metal web around it.
  - **Concentric arc bands**: The ring is subdivided into thinner concentric sub-rings separated by thin circular cutout slots. Requires radial bridge spokes to connect sub-rings.
  - **Keyhole**: A circle on the outer portion of the ring connected to a narrow slot extending toward the inner ring, resembling a keyhole. The circle and slot are the cutout void.
  - **Interlocking arcs**: Overlapping arcs creating a woven or chain-mail appearance within the ring.

  **Ring-to-ring connectivity**: Every ring must be physically connected to adjacent rings. The simplest method is radial spokes (from the spoke motif) that span multiple rings. Alternatively, motifs can be designed to inherently touch or bridge across ring boundaries. **At minimum, include S radial spokes spanning all rings from center to outermost ring** — these guarantee structural integrity and can be integrated as a design element.

- **Parameters**: max_radius, num_rings, symmetry_order, ring_motifs (array of motif selections), web_width
- **Randomization**: For random generation, pick num_rings randomly (3-8), pick symmetry_order from [6, 8, 10, 12, 16], then for each ring randomly select a motif from the library. Always include radial spokes spanning all rings.

### 5. Golden Ratio / Fibonacci Spiral
- **Description**: A spiral based on the golden ratio, typically constructed from quarter-circle arcs within a sequence of golden rectangles, or as a continuous logarithmic spiral. Often combined with concentric golden-ratio-spaced circles.
- **Construction — Golden Rectangle spiral**:
  1. Start with a golden rectangle (aspect ratio φ:1)
  2. Divide it into a square and a smaller golden rectangle
  3. In the square, draw a quarter-circle arc from one corner to the opposite corner
  4. Repeat: divide the remaining golden rectangle into square + golden rectangle, draw quarter arc
  5. Continue for N iterations (typically 6-10)
  6. The result is the Fibonacci spiral composed of quarter-circle arcs

- **Fabrication approach**:
  1. The spiral itself is a sequence of arc segments — these become metal web paths
  2. The square subdivision lines are additional metal webs (straight line segments)
  3. The areas between the spiral arcs and the subdivision lines are the cutout voids
  4. Each cutout void is bounded by arcs and lines — verify no islands
  5. Add a circular or rectangular panel border

- **Parameters**: starting_size, num_iterations, web_width, panel_shape
- **Variation**: Double spiral — two interleaved Fibonacci spirals (one clockwise, one counterclockwise) creating a yin-yang-like composition
- **Variation**: Fibonacci circles — concentric circles with radii following the Fibonacci sequence (1, 1, 2, 3, 5, 8, 13...) × base_unit, connected by radial spokes. Simple and elegant.
- **Variation**: Phi grid — a rectangular panel divided by lines at golden ratio intervals both horizontally and vertically, creating a grid of rectangles in golden proportions. Cut alternating rectangles as voids in a checkerboard pattern.

### 6. Torus / Tube Torus (2D Projection)
- **Description**: A 3D torus (donut shape) projected into 2D, creating a pattern of overlapping elliptical loops that form a woven, interlocking appearance. Also known as the tube torus in sacred geometry.
- **Construction**:
  1. Define N circles (typically 6-12) of the same radius
  2. Space them evenly around a central circle, with each circle tilted at a different angle
  3. In 2D projection, each tilted circle becomes an ellipse
  4. The overlapping ellipses create the woven torus appearance
  5. Where ellipses cross, compute intersection points

- **Fabrication approach**:
  1. This pattern has many overlapping elliptical arcs — use the same arc-decomposition approach as Flower of Life
  2. Compute ALL intersection points between all ellipses
  3. Break each ellipse into arc segments between consecutive intersections
  4. Draw each arc segment once
  5. Determine which enclosed regions are voids vs. metal
  6. **Weaving effect**: To create the illusion of overlapping loops (over-under weaving), alternate which arcs are drawn in regions where two ellipses cross. This is done by selectively omitting short arc segments to suggest one loop passing behind another. The omitted segments create small voids that imply depth.
  7. **Bridge requirement**: The weaving breaks some loops into disconnected arcs — add bridges where needed to maintain structural connectivity

- **Parameters**: num_loops, torus_major_radius, torus_minor_radius (or loop_radius), web_width
- **Variation**: Simple tube torus — fewer loops (6) for a cleaner look
- **Variation**: Dense tube torus — more loops (12-24) for a detailed, woven appearance

---

## Centered vs. Tiled Layout

### Centered Composition
- The pattern is a single figure centered on the panel
- Outer margin of solid metal connects to the panel frame
- Best for: wall art, feature panels, lamp faces, door inserts
- The pattern should be scaled to fit within the panel with a configurable margin
- For non-circular panel shapes (rectangle, arch), the mandala is centered and clipped to the panel boundary with solid metal fill outside the pattern's outer ring

### Tiled Composition
- The pattern motif repeats across the panel in a grid (square, hex, or brick-lay depending on the motif's shape)
- Best for: privacy screens, railings, larger panels, fence sections
- **Critical**: Apply all Principle 4 rules (no overlapping geometry between adjacent tiles). Each tile's geometry must be independently inset from its cell boundary.
- The Flower of Life naturally tiles. Others (Mandala, Sri Yantra, Golden Spiral) work best as centered compositions or tiled within circular or hexagonal cells.
- **Tile-to-tile connectivity**: Ensure the metal web at tile edges lines up with neighboring tiles so the panel is one connected piece.

---

## Critical Fabrication Notes Specific to This Style

1. **Arc decomposition is mandatory for overlapping-circle patterns**: Flower of Life and Tube Torus involve overlapping circles/ellipses. NEVER draw complete overlapping circles. Always decompose into individual arc segments at intersection points and draw each segment exactly once.

2. **Many small regions = many potential islands**: Complex patterns like Sri Yantra and Metatron's Cube create dozens of small enclosed regions. Each one must either be a void (falls out) or connected metal. A checkerboard-solid approach (alternating void/solid) often works well and creates visual contrast.

3. **Radial spokes solve most connectivity problems**: In radial/mandala patterns, a set of evenly-spaced spokes from center to edge guarantees that all concentric rings and motifs stay connected. Make spokes a design feature (they enhance the mandala aesthetic) rather than an afterthought.

4. **Curves in DXF**: True circles and arcs are native DXF entities (CIRCLE, ARC). For ellipses (used in Tube Torus), use the ELLIPSE entity or approximate with polyline arcs. Do NOT approximate circles with line segments unless the CAM software requires it — most modern CNC controllers handle native arcs.

5. **Shadow casting**: Sacred geometry panels are frequently used for lamps and light features. The pattern of voids (light passes through) vs. metal (shadow) creates the visual effect. Consider this when deciding which regions are voids vs. solid — the light pattern on the wall IS the art.

---

## Generation Algorithm (Pseudocode)

```
function generateSacredGeometry(panel_width, panel_height, params):
    1. Select sub-pattern type (random or user-specified)
    2. Select layout mode (centered or tiled)
    3. If centered:
       a. Calculate maximum pattern radius that fits within panel (minus margin)
       b. Generate the base sacred geometry figure at the panel center
    4. If tiled:
       a. Calculate cell grid (hex or square depending on pattern)
       b. For each cell, generate one instance of the pattern inset by half web_width
    5. For overlapping-circle patterns (Flower of Life, Tube Torus):
       a. Generate all circle/ellipse definitions
       b. Compute ALL pairwise intersection points
       c. Break each circle/ellipse into arc segments between consecutive intersection points
       d. Remove duplicate/coincident arcs
       e. Classify each enclosed region as void or metal
    6. For line-based patterns (Metatron's Cube, Sri Yantra):
       a. Generate all line segments
       b. Compute ALL pairwise intersection points
       c. Break each line into sub-segments between consecutive intersection points
       d. Remove duplicate/coincident segments
       e. Classify each enclosed region as void or metal
    7. For generative mandala:
       a. Generate concentric ring boundaries
       b. Generate radial spokes spanning all rings
       c. For each ring, generate the selected motif repeated S times
       d. Verify ring-to-ring connectivity via spokes
    8. Clip all geometry to panel boundary
    9. Add frame outline on FRAME layer
    10. Validate:
        a. No coincident or overlapping geometry
        b. No floating islands
        c. Minimum web width maintained everywhere
        d. All metal regions connect back to frame
    11. Return geometry as lines, circles, arcs
```

---

## DXF Output Notes

- All pattern geometry goes on a layer named `PATTERN`
- Frame/border geometry goes on a layer named `FRAME`
- Bridge geometry goes on a layer named `BRIDGES` (optional — allows user to control bridge visibility)
- Use LINE, CIRCLE, ARC, and ELLIPSE entities as appropriate
- Coordinates in real-world units (inches or mm)
- Y-axis: Y=0 at bottom, increasing upward (standard DXF/CNC orientation)
