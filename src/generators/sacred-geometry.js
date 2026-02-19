// Sacred Geometry / Mandala Pattern Generator
// 6 sub-patterns with CENTERED and TILED layout modes

// ─── Constants ────────────────────────────────────────────────────

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618
const SQRT2 = Math.sqrt(2);
const SQRT3 = Math.sqrt(3);

// ─── RNG ──────────────────────────────────────────────────────────

function createRNG(seed) {
  let s = Math.abs(seed | 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── Geometry Utilities ───────────────────────────────────────────

// Circle-circle intersection points
function circleIntersection(cx1, cy1, r1, cx2, cy2, r2) {
  const dx = cx2 - cx1;
  const dy = cy2 - cy1;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // No intersection
  if (dist > r1 + r2 || dist < Math.abs(r1 - r2) || dist < 0.001) {
    return [];
  }

  // Circles are identical
  if (dist < 0.001 && Math.abs(r1 - r2) < 0.001) {
    return [];
  }

  const a = (r1 * r1 - r2 * r2 + dist * dist) / (2 * dist);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  const px = cx1 + (a * dx) / dist;
  const py = cy1 + (a * dy) / dist;

  const ix1 = px + (h * dy) / dist;
  const iy1 = py - (h * dx) / dist;
  const ix2 = px - (h * dy) / dist;
  const iy2 = py + (h * dx) / dist;

  if (h < 0.001) {
    return [[ix1, iy1]]; // Single tangent point
  }

  return [[ix1, iy1], [ix2, iy2]];
}

// Line-line intersection
function lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4) {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.001) return null; // Parallel

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
  }
  return null;
}

// Angle between two points
function angle(cx, cy, px, py) {
  return Math.atan2(py - cy, px - cx);
}

// Normalize angle to [0, 2π]
function normalizeAngle(a) {
  while (a < 0) a += Math.PI * 2;
  while (a >= Math.PI * 2) a -= Math.PI * 2;
  return a;
}

// Arc decomposition for overlapping circles
function decomposeCirclesIntoArcs(circles) {
  const arcs = [];

  // For each circle, find all intersection points with other circles
  for (let i = 0; i < circles.length; i++) {
    const [cx, cy, r] = circles[i];
    const intersections = [];

    // Find all intersections with other circles
    for (let j = 0; j < circles.length; j++) {
      if (i === j) continue;
      const [cx2, cy2, r2] = circles[j];
      const points = circleIntersection(cx, cy, r, cx2, cy2, r2);
      points.forEach(p => {
        const ang = angle(cx, cy, p[0], p[1]);
        intersections.push({ angle: normalizeAngle(ang), point: p });
      });
    }

    // Sort intersections by angle
    intersections.sort((a, b) => a.angle - b.angle);

    // Create arcs between consecutive intersections
    if (intersections.length === 0) {
      // Full circle with no intersections
      arcs.push({ type: 'circle', cx, cy, r });
    } else {
      for (let k = 0; k < intersections.length; k++) {
        const startAngle = intersections[k].angle;
        const endAngle = intersections[(k + 1) % intersections.length].angle;

        arcs.push({
          type: 'arc',
          cx, cy, r,
          startAngle,
          endAngle: endAngle < startAngle ? endAngle + Math.PI * 2 : endAngle
        });
      }
    }
  }

  return arcs;
}

// ─── Pattern Generators ───────────────────────────────────────────

// 1. Flower of Life
function generateFlowerOfLife(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.min(w, h) * 0.4 * (0.8 + density * 0.2);
  const numRings = 2 + Math.floor(rng() * 2); // 2-3 rings
  const baseR = maxRadius / (numRings + 1);

  const circles = [];
  const visited = new Set();

  const addCircle = (x, y) => {
    const key = `${x.toFixed(2)},${y.toFixed(2)}`;
    if (!visited.has(key)) {
      visited.add(key);
      circles.push([x, y, baseR]);
    }
  };

  // Center circle
  addCircle(cx, cy);

  // Rings
  for (let ring = 1; ring <= numRings; ring++) {
    const ringRadius = baseR * ring;
    const count = 6 * ring;
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count;
      addCircle(cx + ringRadius * Math.cos(ang), cy + ringRadius * Math.sin(ang));
    }
  }

  // Decompose into arcs
  const arcData = decomposeCirclesIntoArcs(circles);
  const lines = [];
  const arcs = [];

  // Convert to proper arc format: [cx, cy, r, startAngle, endAngle]
  arcData.forEach(arc => {
    if (arc.type === 'circle') {
      // Full circle - use circle entity instead
      arcs.push([arc.cx, arc.cy, arc.r, 0, Math.PI * 2]);
    } else if (arc.type === 'arc') {
      arcs.push([arc.cx, arc.cy, arc.r, arc.startAngle, arc.endAngle]);
    }
  });

  return { lines, circles: [], arcs, fills: [] };
}

// 2. Star Wars (originally mislabelled as Metatron's Cube — all-to-all connect pattern)
function generateStarWars(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.35 * (0.8 + density * 0.2);

  // 13 centers: center + inner ring of 6 + outer ring of 6 offset by 30°
  const centers = [[cx, cy]];

  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI * 2 * i) / 6;
    centers.push([cx + radius * Math.cos(ang), cy + radius * Math.sin(ang)]);
  }
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI * 2 * i) / 6 + Math.PI / 6;
    centers.push([cx + radius * Math.cos(ang), cy + radius * Math.sin(ang)]);
  }

  const lines = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      lines.push([centers[i][0], centers[i][1], centers[j][0], centers[j][1]]);
    }
  }

  return { lines, circles: [], arcs: [], fills: [] };
}

// 2b. Metatron's Cube (correct — Fruit of Life: 13 equal circles, all centers connected)
function generateMetatronsCube(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  // R = circle radius = center-to-center spacing so adjacent circles are tangent
  // Outermost extent is 3R from center; fit within ~90% of half the shortest side
  const R = Math.min(w, h) * 0.16 * (0.8 + density * 0.2);

  // 13 centers: Fruit of Life
  //   - center
  //   - inner ring: 6 at distance R (angles 0°, 60°, ...)
  //   - outer ring: 6 at distance 2R (same angles as inner ring)
  const centers = [[cx, cy]];
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI * 2 * i) / 6;
    centers.push([cx + R * Math.cos(ang), cy + R * Math.sin(ang)]);
  }
  for (let i = 0; i < 6; i++) {
    const ang = (Math.PI * 2 * i) / 6;
    centers.push([cx + 2 * R * Math.cos(ang), cy + 2 * R * Math.sin(ang)]);
  }

  // All 78 connecting lines (every center to every other center)
  const lines = [];
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      lines.push([centers[i][0], centers[i][1], centers[j][0], centers[j][1]]);
    }
  }

  // 13 equal circles (radius R) at each center
  const circles = centers.map(([x, y]) => [x, y, R]);

  return { lines, circles, arcs: [], fills: [] };
}

// 3. Sri Yantra (Simplified)
function generateSriYantra(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.35 * (0.8 + density * 0.2);
  const lines = [];

  // Simplified: 5 triangles instead of 9 for clarity
  const triangles = [
    // Upward triangles
    [[cx, cy - radius * 0.8], [cx - radius * 0.7, cy + radius * 0.5], [cx + radius * 0.7, cy + radius * 0.5]],
    [[cx, cy - radius * 0.4], [cx - radius * 0.5, cy + radius * 0.3], [cx + radius * 0.5, cy + radius * 0.3]],
    // Downward triangles
    [[cx - radius * 0.6, cy - radius * 0.5], [cx, cy + radius * 0.6], [cx + radius * 0.6, cy - radius * 0.5]],
  ];

  // Draw triangle edges
  triangles.forEach(tri => {
    for (let i = 0; i < 3; i++) {
      const [x1, y1] = tri[i];
      const [x2, y2] = tri[(i + 1) % 3];
      lines.push([x1, y1, x2, y2]);
    }
  });

  // Add outer circle using circle entity
  const circles = [[cx, cy, radius]];

  return { lines, circles, arcs: [], fills: [] };
}

// 4. Radial Mandala (Generative)
function generateRadialMandala(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  const maxRadius = Math.min(w, h) * 0.4 * (0.8 + density * 0.2);
  const numRings = 3 + Math.floor(rng() * 4); // 3-6 rings
  const symmetryOrder = [6, 8, 10, 12, 16][Math.floor(rng() * 5)];

  const lines = [];
  const circles = [];

  // Radial spokes spanning all rings (structural)
  for (let i = 0; i < symmetryOrder; i++) {
    const ang = (Math.PI * 2 * i) / symmetryOrder;
    lines.push([
      cx,
      cy,
      cx + maxRadius * Math.cos(ang),
      cy + maxRadius * Math.sin(ang)
    ]);
  }

  // Ring boundaries - use circles for full rings
  for (let ring = 1; ring <= numRings; ring++) {
    const ringR = (maxRadius * ring) / numRings;
    circles.push([cx, cy, ringR]);
  }

  // Add arcs array for potential arc-based motifs
  const arcs = [];

  for (let ring = 1; ring <= numRings; ring++) {
    const ringR = (maxRadius * ring) / numRings;

    // Add motif in each ring segment
    const motif = Math.floor(rng() * 4); // Random motif per ring
    const innerR = ring > 1 ? (maxRadius * (ring - 1)) / numRings : 0;

    for (let i = 0; i < symmetryOrder; i++) {
      const ang = (Math.PI * 2 * i) / symmetryOrder;
      const nextAng = (Math.PI * 2 * (i + 1)) / symmetryOrder;
      const midAng = (ang + nextAng) / 2;

      if (motif === 0) {
        // Petal arc
        const r1 = innerR + (ringR - innerR) * 0.3;
        const r2 = innerR + (ringR - innerR) * 0.7;
        lines.push([
          cx + r1 * Math.cos(midAng - 0.2),
          cy + r1 * Math.sin(midAng - 0.2),
          cx + r2 * Math.cos(midAng),
          cy + r2 * Math.sin(midAng)
        ]);
        lines.push([
          cx + r2 * Math.cos(midAng),
          cy + r2 * Math.sin(midAng),
          cx + r1 * Math.cos(midAng + 0.2),
          cy + r1 * Math.sin(midAng + 0.2)
        ]);
      } else if (motif === 1) {
        // Small circle
        const circR = (ringR - innerR) * 0.2;
        const circMidR = (innerR + ringR) / 2;
        circles.push([
          cx + circMidR * Math.cos(midAng),
          cy + circMidR * Math.sin(midAng),
          circR
        ]);
      } else if (motif === 2) {
        // Triangle
        const midR = (innerR + ringR) / 2;
        const triSize = (ringR - innerR) * 0.3;
        const tx = cx + midR * Math.cos(midAng);
        const ty = cy + midR * Math.sin(midAng);
        const pts = [];
        for (let t = 0; t < 3; t++) {
          const ta = midAng + (Math.PI * 2 * t) / 3;
          pts.push([tx + triSize * Math.cos(ta), ty + triSize * Math.sin(ta)]);
        }
        for (let t = 0; t < 3; t++) {
          lines.push([...pts[t], ...pts[(t + 1) % 3]]);
        }
      }
    }
  }

  return { lines, circles, arcs, fills: [] };
}

// 5. Golden Ratio / Fibonacci Spiral
function generateGoldenSpiral(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  const size = Math.min(w, h) * 0.4 * (0.8 + density * 0.2);
  const iterations = 6 + Math.floor(rng() * 3); // 6-8 iterations

  const lines = [];
  const arcs = [];
  let x = cx - size / 2;
  let y = cy - size / (2 * PHI);
  let curW = size;
  let curH = size / PHI;
  let dir = 0; // 0=right, 1=down, 2=left, 3=up

  for (let i = 0; i < iterations; i++) {
    // Divide current rectangle
    const squareSize = Math.min(curW, curH);

    // Draw quarter circle arc in the square
    let arcCX, arcCY, startAngle;

    if (dir === 0) { // Right
      arcCX = x;
      arcCY = y + squareSize;
      startAngle = -Math.PI / 2;
      // Division line
      lines.push([x + squareSize, y, x + squareSize, y + curH]);
    } else if (dir === 1) { // Down
      arcCX = x + squareSize;
      arcCY = y + curH;
      startAngle = Math.PI;
      lines.push([x, y + curH - squareSize, x + curW, y + curH - squareSize]);
    } else if (dir === 2) { // Left
      arcCX = x + curW;
      arcCY = y;
      startAngle = Math.PI / 2;
      lines.push([x + curW - squareSize, y, x + curW - squareSize, y + curH]);
    } else { // Up
      arcCX = x;
      arcCY = y;
      startAngle = 0;
      lines.push([x, y + squareSize, x + curW, y + squareSize]);
    }

    // Add spiral arc as proper arc (quarter circle)
    const endAngle = startAngle + Math.PI / 2;
    arcs.push([arcCX, arcCY, squareSize, startAngle, endAngle]);

    // Update for next iteration
    if (dir === 0) {
      x += squareSize;
      curW -= squareSize;
    } else if (dir === 1) {
      curH -= squareSize;
    } else if (dir === 2) {
      y += squareSize;
      curH -= squareSize;
    } else {
      x += squareSize;
      curW -= squareSize;
    }

    dir = (dir + 1) % 4;
  }

  // Outer boundary - use circle
  const boundR = size * 0.7;
  const circles = [[cx, cy, boundR]];

  return { lines, circles, arcs, fills: [] };
}

// 6. Torus / Tube Torus
function generateTorus(w, h, rng, density, layoutMode) {
  const cx = w / 2;
  const cy = h / 2;
  const majorR = Math.min(w, h) * 0.3 * (0.8 + density * 0.2);
  const numLoops = 6 + Math.floor(rng() * 4); // 6-9 loops
  const loopR = majorR * 0.4;

  const lines = [];
  const arcs = [];

  // Create overlapping circles (simplified torus projection)
  for (let i = 0; i < numLoops; i++) {
    const ang = (Math.PI * 2 * i) / numLoops;
    const loopCX = cx + majorR * Math.cos(ang);
    const loopCY = cy + majorR * Math.sin(ang);

    // Draw each loop with gaps for weaving effect using arcs
    const segs = 6; // Number of gaps around the circle
    const gapAngle = Math.PI / 12; // Size of each gap

    for (let s = 0; s < segs; s++) {
      const segStart = (Math.PI * 2 * s) / segs + gapAngle / 2;
      const segEnd = (Math.PI * 2 * (s + 1)) / segs - gapAngle / 2;

      // Skip some segments for weaving effect
      const skip = i % 2 === 0 && s % 2 === 0;
      if (!skip) {
        arcs.push([loopCX, loopCY, loopR, segStart, segEnd]);
      }
    }
  }

  return { lines, circles: [], arcs, fills: [] };
}

// ─── Main Entry Point ─────────────────────────────────────────────

const SUBPATTERN_MAP = {
  floweroflife: generateFlowerOfLife,
  metatron: generateMetatronsCube,
  starwars: generateStarWars,
  sriyantra: generateSriYantra,
  mandala: generateRadialMandala,
  fibonacci: generateGoldenSpiral,
  torus: generateTorus,
};

export function generateSacredGeometry(w, h, seed, params) {
  const rng = createRNG(seed);
  const subStyle = params.subStyle || "floweroflife";
  const density = params.density || 0.5;
  const layoutMode = params.layoutMode || "centered"; // "centered" or "tiled"

  const gen = SUBPATTERN_MAP[subStyle];
  if (!gen) return { lines: [], circles: [], arcs: [] };

  const result = gen(w, h, rng, density, layoutMode);

  // Margin clip
  const margin = Math.min(w, h) * 0.03;
  const x0 = margin, y0 = margin, x1 = w - margin, y1 = h - margin;

  result.lines = result.lines.filter(([lx1, ly1, lx2, ly2]) =>
    !(lx1 < x0 && lx2 < x0) && !(lx1 > x1 && lx2 > x1) &&
    !(ly1 < y0 && ly2 < y0) && !(ly1 > y1 && ly2 > y1)
  );

  result.circles = result.circles.filter(([cx, cy, r]) =>
    cx + r > x0 && cx - r < x1 && cy + r > y0 && cy - r < y1
  );

  // Deduplicate
  result.lines = deduplicateLines(result.lines);
  result.circles = deduplicateCircles(result.circles);

  return result;
}

// ─── Deduplication ────────────────────────────────────────────────

function deduplicateLines(lines, tolerance = 0.01) {
  const seen = new Set();
  const result = [];
  const round = (v) => Math.round(v / tolerance) * tolerance;

  for (const seg of lines) {
    const [x1, y1, x2, y2] = seg;
    const a = `${round(x1)},${round(y1)},${round(x2)},${round(y2)}`;
    const b = `${round(x2)},${round(y2)},${round(x1)},${round(y1)}`;
    if (!seen.has(a) && !seen.has(b)) {
      seen.add(a);
      result.push(seg);
    }
  }
  return result;
}

function deduplicateCircles(circles, tolerance = 0.01) {
  const seen = new Set();
  const result = [];
  const round = (v) => Math.round(v / tolerance) * tolerance;

  for (const circ of circles) {
    const key = `${round(circ[0])},${round(circ[1])},${round(circ[2])}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(circ);
    }
  }
  return result;
}
