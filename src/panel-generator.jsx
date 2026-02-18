import { useState, useCallback, useMemo, useRef } from "react";

// Seeded PRNG
function createRNG(seed) {
  let s = Math.abs(seed | 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── Pattern Generators ───────────────────────────────────────
// Each returns { lines: [[x1,y1,x2,y2],...], circles: [[cx,cy,r],...], arcs: [[cx,cy,r,sa,ea],...] }

function generateGeometricGrid(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const gridType = params.subStyle || "hexagonal";
  const density = params.density || 0.5;
  const cellSize = Math.min(w, h) * (0.04 + (1 - density) * 0.06);

  if (gridType === "hexagonal") {
    const cols = Math.ceil(w / (cellSize * 1.5)) + 1;
    const rows = Math.ceil(h / (cellSize * Math.sqrt(3) * 0.5)) + 1;
    const margin = cellSize * 0.5;
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        if (rng() > 0.75) continue;
        const cx = col * cellSize * 1.5 + margin;
        const cy = row * cellSize * Math.sqrt(3) + (col % 2 ? cellSize * Math.sqrt(3) * 0.5 : 0) + margin;
        const r = cellSize * 0.55;
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i;
          const a2 = (Math.PI / 3) * ((i + 1) % 6);
          lines.push([cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2)]);
        }
        if (rng() > 0.5) {
          circles.push([cx, cy, r * 0.3]);
        }
      }
    }
  } else if (gridType === "triangular") {
    const size = cellSize * 1.2;
    const rowH = size * Math.sqrt(3) * 0.5;
    const rows = Math.ceil(h / rowH) + 2;
    const cols = Math.ceil(w / size) + 2;
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * size + (row % 2 ? size * 0.5 : 0);
        const y = row * rowH;
        if (rng() > 0.8) continue;
        const up = (row + col) % 2 === 0;
        const h2 = rowH;
        if (up) {
          lines.push([x, y + h2, x + size * 0.5, y]);
          lines.push([x + size * 0.5, y, x + size, y + h2]);
          lines.push([x, y + h2, x + size, y + h2]);
        } else {
          lines.push([x, y, x + size * 0.5, y + h2]);
          lines.push([x + size * 0.5, y + h2, x + size, y]);
          lines.push([x, y, x + size, y]);
        }
      }
    }
  } else {
    // rectangular with diamond insets
    const size = cellSize * 1.4;
    const cols = Math.ceil(w / size) + 1;
    const rows = Math.ceil(h / size) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        lines.push([x, y, x + size, y]);
        lines.push([x, y, x, y + size]);
        if (rng() > 0.3) {
          const inset = size * (0.15 + rng() * 0.2);
          const cx = x + size * 0.5, cy = y + size * 0.5;
          lines.push([cx, cy - inset, cx + inset, cy]);
          lines.push([cx + inset, cy, cx, cy + inset]);
          lines.push([cx, cy + inset, cx - inset, cy]);
          lines.push([cx - inset, cy, cx, cy - inset]);
        }
      }
    }
  }
  return { lines, circles, arcs: [] };
}

function generateMandala(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const cx = w / 2, cy = h / 2;
  const maxR = Math.min(w, h) * 0.45;
  const rings = 4 + Math.floor(rng() * 4);
  const density = params.density || 0.5;
  const baseSymmetry = [6, 8, 10, 12, 16][Math.floor(rng() * 5)];

  // Concentric rings
  for (let i = 1; i <= rings; i++) {
    const r = (maxR * i) / rings;
    circles.push([cx, cy, r]);

    const petals = baseSymmetry * (1 + Math.floor(rng() * 2));
    const innerR = r * (0.6 + rng() * 0.3);
    const petalType = Math.floor(rng() * 3);

    for (let j = 0; j < petals; j++) {
      const angle = (Math.PI * 2 * j) / petals + (rng() * 0.1);
      const nextAngle = (Math.PI * 2 * (j + 1)) / petals;

      if (petalType === 0) {
        // Lines from inner to outer ring
        lines.push([
          cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle),
          cx + r * Math.cos(angle), cy + r * Math.sin(angle)
        ]);
      } else if (petalType === 1) {
        // Diamond petals
        const midR = (innerR + r) * 0.5;
        const midAngle = (angle + nextAngle) * 0.5;
        const spread = (nextAngle - angle) * 0.3;
        lines.push([
          cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle),
          cx + midR * Math.cos(angle - spread), cy + midR * Math.sin(angle - spread)
        ]);
        lines.push([
          cx + midR * Math.cos(angle - spread), cy + midR * Math.sin(angle - spread),
          cx + r * Math.cos(angle), cy + r * Math.sin(angle)
        ]);
        lines.push([
          cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle),
          cx + midR * Math.cos(angle + spread), cy + midR * Math.sin(angle + spread)
        ]);
        lines.push([
          cx + midR * Math.cos(angle + spread), cy + midR * Math.sin(angle + spread),
          cx + r * Math.cos(angle), cy + r * Math.sin(angle)
        ]);
      } else {
        // Dot pattern
        const dotR = (r - innerR) * 0.15;
        const dotDist = (innerR + r) * 0.5;
        circles.push([cx + dotDist * Math.cos(angle), cy + dotDist * Math.sin(angle), dotR]);
        lines.push([
          cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle),
          cx + r * Math.cos(angle), cy + r * Math.sin(angle)
        ]);
      }
    }
  }

  // Flower of life elements
  if (density > 0.4) {
    const flowerR = maxR * 0.2;
    for (let i = 0; i < baseSymmetry; i++) {
      const a = (Math.PI * 2 * i) / baseSymmetry;
      circles.push([cx + flowerR * Math.cos(a), cy + flowerR * Math.sin(a), flowerR]);
    }
    circles.push([cx, cy, flowerR]);
  }

  return { lines, circles, arcs: [] };
}

function generateArtDeco(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const arcs = [];
  const density = params.density || 0.5;

  const fanCount = 2 + Math.floor(rng() * 3);
  const fanW = w / fanCount;

  for (let f = 0; f < fanCount; f++) {
    const baseCx = fanW * f + fanW * 0.5;
    const baseCy = h;
    const fanR = Math.min(fanW, h) * (0.7 + rng() * 0.3);
    const rays = 5 + Math.floor(rng() * 8);
    const startAngle = -Math.PI;
    const endAngle = 0;

    // Fan arcs
    const arcCount = 3 + Math.floor(rng() * 3);
    for (let a = 1; a <= arcCount; a++) {
      const r = (fanR * a) / arcCount;
      const segments = 32;
      for (let s = 0; s < segments; s++) {
        const a1 = startAngle + (endAngle - startAngle) * (s / segments);
        const a2 = startAngle + (endAngle - startAngle) * ((s + 1) / segments);
        lines.push([
          baseCx + r * Math.cos(a1), baseCy + r * Math.sin(a1),
          baseCx + r * Math.cos(a2), baseCy + r * Math.sin(a2)
        ]);
      }
    }

    // Fan rays
    for (let r = 0; r < rays; r++) {
      const angle = startAngle + (endAngle - startAngle) * (r / (rays - 1));
      lines.push([baseCx, baseCy, baseCx + fanR * Math.cos(angle), baseCy + fanR * Math.sin(angle)]);
    }

    // Chevron decorations between fans
    if (f < fanCount - 1) {
      const chevX = fanW * (f + 1);
      const chevCount = 3 + Math.floor(rng() * 4);
      const chevH = h / (chevCount + 1);
      for (let c = 0; c < chevCount; c++) {
        const cy = chevH * (c + 0.5);
        const chevSize = fanW * 0.15;
        for (let v = 0; v < 3; v++) {
          const offset = v * chevSize * 0.4;
          lines.push([chevX - chevSize + offset, cy - chevSize + offset, chevX, cy - chevSize * 2 + offset]);
          lines.push([chevX, cy - chevSize * 2 + offset, chevX + chevSize - offset, cy - chevSize + offset]);
        }
      }
    }
  }

  // Top border sunburst
  const sunCx = w * 0.5, sunCy = 0;
  const sunR = Math.min(w, h) * 0.25;
  const sunRays = 12 + Math.floor(rng() * 12);
  for (let r = 0; r < sunRays; r++) {
    const angle = (Math.PI * r) / (sunRays - 1);
    const len = sunR * (0.7 + rng() * 0.3);
    lines.push([sunCx, sunCy, sunCx + len * Math.cos(angle), sunCy + len * Math.sin(angle)]);
  }

  // Geometric border
  const borderInset = Math.min(w, h) * 0.05;
  const stepSize = borderInset * 0.5;
  // Stepped corner elements
  const corners = [[0, 0], [w, 0], [w, h], [0, h]];
  corners.forEach(([cx, cy]) => {
    for (let s = 1; s <= 3; s++) {
      const size = borderInset * s * 0.8;
      const sx = cx === 0 ? 1 : -1;
      const sy = cy === 0 ? 1 : -1;
      lines.push([cx + sx * size, cy, cx + sx * size, cy + sy * size]);
      lines.push([cx + sx * size, cy + sy * size, cx, cy + sy * size]);
    }
  });

  return { lines, circles, arcs };
}

function generateJapanese(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const subStyle = params.subStyle || "asanoha";
  const cellSize = Math.min(w, h) * 0.08;

  if (subStyle === "asanoha") {
    // Hemp leaf / star pattern
    const size = cellSize * 1.5;
    const h2 = size * Math.sqrt(3) * 0.5;
    const cols = Math.ceil(w / size) + 2;
    const rows = Math.ceil(h / h2) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const offset = row % 2 ? size * 0.5 : 0;
        const cx = col * size + offset;
        const cy = row * h2;

        // Draw the asanoha unit
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + Math.PI / 6;
          const px = cx + size * 0.5 * Math.cos(a);
          const py = cy + size * 0.5 * Math.sin(a);
          lines.push([cx, cy, px, py]);
        }

        // Cross elements
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI / 3) * i + Math.PI / 6;
          const na = a + Math.PI;
          lines.push([
            cx + size * 0.5 * Math.cos(a), cy + size * 0.5 * Math.sin(a),
            cx + size * 0.5 * Math.cos(na), cy + size * 0.5 * Math.sin(na)
          ]);
        }
      }
    }
  } else if (subStyle === "seigaiha") {
    // Wave pattern
    const r = cellSize * 1.2;
    const cols = Math.ceil(w / r) + 2;
    const rows = Math.ceil(h / (r * 0.5)) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const offset = row % 2 ? r * 0.5 : 0;
        const cx = col * r + offset;
        const cy = row * r * 0.5;

        for (let ring = 1; ring <= 3; ring++) {
          const rr = (r * ring) / 3 * 0.5;
          const segments = 16;
          for (let s = 0; s < segments; s++) {
            const a1 = Math.PI + (Math.PI * s) / segments;
            const a2 = Math.PI + (Math.PI * (s + 1)) / segments;
            lines.push([
              cx + rr * Math.cos(a1), cy + rr * Math.sin(a1),
              cx + rr * Math.cos(a2), cy + rr * Math.sin(a2)
            ]);
          }
        }
      }
    }
  } else {
    // Kumiko-inspired diamond
    const size = cellSize * 2;
    const cols = Math.ceil(w / size) + 1;
    const rows = Math.ceil(h / size) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * size;
        const y = row * size;
        const cx = x + size * 0.5;
        const cy = y + size * 0.5;

        // Outer square
        lines.push([x, y, x + size, y]);
        lines.push([x + size, y, x + size, y + size]);
        lines.push([x + size, y + size, x, y + size]);
        lines.push([x, y + size, x, y]);

        // Inner diamond
        lines.push([cx, y, x + size, cy]);
        lines.push([x + size, cy, cx, y + size]);
        lines.push([cx, y + size, x, cy]);
        lines.push([x, cy, cx, y]);

        // Inner elements
        if (rng() > 0.3) {
          const ir = size * 0.15;
          for (let i = 0; i < 4; i++) {
            const a = (Math.PI / 2) * i + Math.PI / 4;
            lines.push([cx, cy, cx + ir * Math.cos(a), cy + ir * Math.sin(a)]);
          }
        }
      }
    }
  }

  return { lines, circles, arcs: [] };
}

function generateVoronoi(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const density = params.density || 0.5;
  const numPoints = Math.floor(15 + density * 40);

  // Generate random seed points
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    points.push([rng() * w, rng() * h]);
  }

  // Compute Voronoi via brute force edge detection
  // For each pair of points, find the perpendicular bisector
  // and clip to the region where it separates the two nearest points
  const step = Math.min(w, h) * 0.01;

  // Sample-based approach: scan grid and detect cell boundaries
  const res = Math.max(2, Math.floor(Math.min(w, h) / 80));
  const grid = [];
  const cols = Math.ceil(w / res);
  const rows = Math.ceil(h / res);

  for (let gy = 0; gy < rows; gy++) {
    grid[gy] = [];
    for (let gx = 0; gx < cols; gx++) {
      const px = gx * res + res * 0.5;
      const py = gy * res + res * 0.5;
      let minD = Infinity, minI = 0;
      for (let i = 0; i < points.length; i++) {
        const d = (px - points[i][0]) ** 2 + (py - points[i][1]) ** 2;
        if (d < minD) { minD = d; minI = i; }
      }
      grid[gy][gx] = minI;
    }
  }

  // Extract edges from grid
  for (let gy = 0; gy < rows - 1; gy++) {
    for (let gx = 0; gx < cols - 1; gx++) {
      const c = grid[gy][gx];
      if (gx < cols - 1 && grid[gy][gx + 1] !== c) {
        const x = (gx + 1) * res;
        lines.push([x, gy * res, x, (gy + 1) * res]);
      }
      if (gy < rows - 1 && grid[gy + 1][gx] !== c) {
        const y = (gy + 1) * res;
        lines.push([gx * res, y, (gx + 1) * res, y]);
      }
    }
  }

  // Add small circles at seed points
  points.forEach(([px, py]) => {
    circles.push([px, py, Math.min(w, h) * 0.008]);
  });

  return { lines, circles, arcs: [] };
}

function generateMoroccan(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const size = Math.min(w, h) * 0.1;
  const cols = Math.ceil(w / size) + 1;
  const rows = Math.ceil(h / size) + 1;

  // 8-pointed star tessellation
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * size + size * 0.5;
      const cy = row * size + size * 0.5;
      const r = size * 0.48;
      const innerR = r * 0.4;

      // 8-pointed star
      const pts = 8;
      for (let i = 0; i < pts; i++) {
        const a1 = (Math.PI * 2 * i) / pts - Math.PI / 8;
        const a2 = (Math.PI * 2 * (i + 0.5)) / pts - Math.PI / 8;
        const a3 = (Math.PI * 2 * (i + 1)) / pts - Math.PI / 8;

        const outerX1 = cx + r * Math.cos(a1);
        const outerY1 = cy + r * Math.sin(a1);
        const innerX = cx + innerR * Math.cos(a2);
        const innerY = cy + innerR * Math.sin(a2);
        const outerX2 = cx + r * Math.cos(a3);
        const outerY2 = cy + r * Math.sin(a3);

        lines.push([outerX1, outerY1, innerX, innerY]);
        lines.push([innerX, innerY, outerX2, outerY2]);
      }

      // Inner geometry
      if (rng() > 0.2) {
        const ir = innerR * 0.6;
        for (let i = 0; i < 4; i++) {
          const a = (Math.PI / 2) * i;
          lines.push([cx + ir * Math.cos(a), cy + ir * Math.sin(a),
            cx + ir * Math.cos(a + Math.PI / 2), cy + ir * Math.sin(a + Math.PI / 2)]);
        }
      }
    }
  }

  // Connecting grid lines
  for (let row = 0; row <= rows; row++) {
    lines.push([0, row * size, w, row * size]);
  }
  for (let col = 0; col <= cols; col++) {
    lines.push([col * size, 0, col * size, h]);
  }

  return { lines, circles, arcs: [] };
}

function generateAbstractOrganic(w, h, seed, params) {
  const rng = createRNG(seed);
  const lines = [];
  const circles = [];
  const density = params.density || 0.5;
  const numFlows = 8 + Math.floor(density * 15);

  // Simple noise-like flowing curves
  for (let f = 0; f < numFlows; f++) {
    let x = rng() * w;
    let y = rng() * h;
    let angle = rng() * Math.PI * 2;
    const stepLen = Math.min(w, h) * 0.02;
    const steps = 30 + Math.floor(rng() * 60);
    const freq = 0.005 + rng() * 0.02;
    const phase = rng() * 100;

    for (let s = 0; s < steps; s++) {
      const nx = x + stepLen * Math.cos(angle);
      const ny = y + stepLen * Math.sin(angle);
      if (nx > 0 && nx < w && ny > 0 && ny < h) {
        lines.push([x, y, nx, ny]);
      }
      x = nx;
      y = ny;
      // Curl the angle using pseudo-noise
      angle += Math.sin(x * freq + phase) * 0.3 + Math.cos(y * freq + phase * 0.7) * 0.3;
    }
  }

  // Organic circles / bubbles
  const numBubbles = Math.floor(5 + density * 20);
  for (let b = 0; b < numBubbles; b++) {
    const cx = rng() * w;
    const cy = rng() * h;
    const r = Math.min(w, h) * (0.01 + rng() * 0.04);
    circles.push([cx, cy, r]);
  }

  return { lines, circles, arcs: [] };
}

// ─── Clipping ─────────────────────────────────────────────────

function isInsidePanel(x, y, w, h, shape) {
  if (shape === "rectangle") return x >= 0 && x <= w && y >= 0 && y <= h;
  if (shape === "circle") {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  }
  if (shape === "arch") {
    if (y > h * 0.6) return x >= 0 && x <= w;
    const cx = w / 2, cy = h * 0.6;
    const rx = w / 2, ry = h * 0.6;
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  }
  if (shape === "oval") {
    const cx = w / 2, cy = h / 2;
    return ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2 <= 1;
  }
  return true;
}

function clipLinesToPanel(pattern, w, h, shape) {
  if (shape === "rectangle") return pattern;
  const clipped = { lines: [], circles: [], arcs: pattern.arcs || [] };

  pattern.lines.forEach(([x1, y1, x2, y2]) => {
    if (isInsidePanel(x1, y1, w, h, shape) && isInsidePanel(x2, y2, w, h, shape)) {
      clipped.lines.push([x1, y1, x2, y2]);
    } else if (isInsidePanel(x1, y1, w, h, shape) || isInsidePanel(x2, y2, w, h, shape)) {
      clipped.lines.push([x1, y1, x2, y2]); // partial - include for now
    }
  });

  pattern.circles.forEach(([cx, cy, r]) => {
    if (isInsidePanel(cx, cy, w, h, shape)) {
      clipped.circles.push([cx, cy, r]);
    }
  });

  return clipped;
}

// ─── Frame Path ───────────────────────────────────────────────

function getFramePath(w, h, shape) {
  if (shape === "rectangle") return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  if (shape === "circle") {
    const r = Math.min(w, h) / 2;
    const cx = w / 2, cy = h / 2;
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  }
  if (shape === "arch") {
    const archH = h * 0.6;
    return `M 0 ${h} L 0 ${archH} A ${w / 2} ${archH} 0 0 1 ${w} ${archH} L ${w} ${h} Z`;
  }
  if (shape === "oval") {
    const rx = w / 2, ry = h / 2;
    const cx = w / 2, cy = h / 2;
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} Z`;
  }
  return "";
}

function getFrameLines(w, h, shape) {
  const lines = [];
  const circles = [];
  if (shape === "rectangle") {
    lines.push([0, 0, w, 0], [w, 0, w, h], [w, h, 0, h], [0, h, 0, 0]);
  } else if (shape === "circle") {
    const r = Math.min(w, h) / 2;
    circles.push([w / 2, h / 2, r]);
  } else if (shape === "oval") {
    // Approximate with segments
    const cx = w / 2, cy = h / 2, rx = w / 2, ry = h / 2;
    const segs = 64;
    for (let i = 0; i < segs; i++) {
      const a1 = (Math.PI * 2 * i) / segs;
      const a2 = (Math.PI * 2 * (i + 1)) / segs;
      lines.push([cx + rx * Math.cos(a1), cy + ry * Math.sin(a1), cx + rx * Math.cos(a2), cy + ry * Math.sin(a2)]);
    }
  } else if (shape === "arch") {
    const archH = h * 0.6;
    lines.push([0, h, 0, archH]);
    lines.push([w, archH, w, h]);
    lines.push([w, h, 0, h]);
    const cx = w / 2, rx = w / 2, ry = archH;
    const segs = 32;
    for (let i = 0; i < segs; i++) {
      const a1 = Math.PI + (Math.PI * i) / segs;
      const a2 = Math.PI + (Math.PI * (i + 1)) / segs;
      lines.push([cx + rx * Math.cos(a1), archH + ry * Math.sin(a1), cx + rx * Math.cos(a2), archH + ry * Math.sin(a2)]);
    }
  }
  return { lines, circles };
}

// ─── DXF Export ───────────────────────────────────────────────

function generateDXF(pattern, frameData, w, h, unit) {
  const scale = unit === "inches" ? 1 : 25.4;
  let dxf = `0\nSECTION\n2\nHEADER\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nTABLES\n`;
  dxf += `0\nTABLE\n2\nLAYER\n`;
  dxf += `0\nLAYER\n2\nFRAME\n70\n0\n62\n1\n`;
  dxf += `0\nLAYER\n2\nPATTERN\n70\n0\n62\n3\n`;
  dxf += `0\nENDTAB\n0\nENDSEC\n`;
  dxf += `0\nSECTION\n2\nENTITIES\n`;

  const addLine = (x1, y1, x2, y2, layer) => {
    dxf += `0\nLINE\n8\n${layer}\n10\n${(x1 * scale).toFixed(4)}\n20\n${(y1 * scale).toFixed(4)}\n30\n0.0\n11\n${(x2 * scale).toFixed(4)}\n21\n${(y2 * scale).toFixed(4)}\n31\n0.0\n`;
  };

  const addCircle = (cx, cy, r, layer) => {
    dxf += `0\nCIRCLE\n8\n${layer}\n10\n${(cx * scale).toFixed(4)}\n20\n${(cy * scale).toFixed(4)}\n30\n0.0\n40\n${(r * scale).toFixed(4)}\n`;
  };

  // Frame
  frameData.lines.forEach(([x1, y1, x2, y2]) => addLine(x1, y1, x2, y2, "FRAME"));
  frameData.circles.forEach(([cx, cy, r]) => addCircle(cx, cy, r, "FRAME"));

  // Pattern
  pattern.lines.forEach(([x1, y1, x2, y2]) => addLine(x1, y1, x2, y2, "PATTERN"));
  pattern.circles.forEach(([cx, cy, r]) => addCircle(cx, cy, r, "PATTERN"));

  dxf += `0\nENDSEC\n0\nEOF\n`;
  return dxf;
}

// ─── Style Definitions ───────────────────────────────────────

const STYLES = [
  { id: "geometric", name: "Minimalist Geometric", icon: "⬡", color: "#3b82f6",
    subStyles: ["hexagonal", "triangular", "rectangular"], generator: generateGeometricGrid },
  { id: "mandala", name: "Sacred Geometry / Mandala", icon: "✿", color: "#8b5cf6",
    subStyles: null, generator: generateMandala },
  { id: "artdeco", name: "Art Deco", icon: "◈", color: "#f59e0b",
    subStyles: null, generator: generateArtDeco },
  { id: "japanese", name: "Japanese", icon: "❋", color: "#ef4444",
    subStyles: ["asanoha", "seigaiha", "kumiko"], generator: generateJapanese },
  { id: "moroccan", name: "Moroccan / Islamic", icon: "✦", color: "#10b981",
    subStyles: null, generator: generateMoroccan },
  { id: "voronoi", name: "Voronoi / Computational", icon: "◌", color: "#06b6d4",
    subStyles: null, generator: generateVoronoi },
  { id: "organic", name: "Abstract Organic", icon: "≈", color: "#ec4899",
    subStyles: null, generator: generateAbstractOrganic },
];

const SHAPES = [
  { id: "rectangle", name: "Rectangle", icon: "▭" },
  { id: "circle", name: "Circle", icon: "○" },
  { id: "arch", name: "Arch", icon: "⌓" },
  { id: "oval", name: "Oval", icon: "⬭" },
];

// ─── Main Component ──────────────────────────────────────────

export default function PanelGenerator() {
  const [selectedStyle, setSelectedStyle] = useState("geometric");
  const [subStyle, setSubStyle] = useState("hexagonal");
  const [panelShape, setPanelShape] = useState("rectangle");
  const [panelWidth, setPanelWidth] = useState(24);
  const [panelHeight, setPanelHeight] = useState(36);
  const [unit, setUnit] = useState("inches");
  const [seed, setSeed] = useState(42);
  const [density, setDensity] = useState(0.5);
  const [showFrame, setShowFrame] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const svgRef = useRef(null);

  const style = STYLES.find(s => s.id === selectedStyle);

  const viewW = 400;
  const aspect = panelHeight / panelWidth;
  const viewH = viewW * aspect;

  const pattern = useMemo(() => {
    if (!style) return { lines: [], circles: [], arcs: [] };
    const raw = style.generator(viewW, viewH, seed, { subStyle, density });
    return clipLinesToPanel(raw, viewW, viewH, panelShape);
  }, [selectedStyle, subStyle, panelShape, seed, density, viewW, viewH]);

  const frameData = useMemo(() => getFrameLines(viewW, viewH, panelShape), [panelShape, viewW, viewH]);
  const framePath = useMemo(() => getFramePath(viewW, viewH, panelShape), [panelShape, viewW, viewH]);

  const regenerate = () => setSeed(Math.floor(Math.random() * 100000));

  const exportDXF = () => {
    const scaleX = panelWidth / viewW;
    const scaleY = panelHeight / viewH;
    // Scale pattern to real dimensions
    const scaled = {
      lines: pattern.lines.map(([x1, y1, x2, y2]) => [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY]),
      circles: pattern.circles.map(([cx, cy, r]) => [cx * scaleX, cy * scaleY, r * scaleX]),
      arcs: []
    };
    const scaledFrame = {
      lines: frameData.lines.map(([x1, y1, x2, y2]) => [x1 * scaleX, y1 * scaleY, x2 * scaleX, y2 * scaleY]),
      circles: frameData.circles.map(([cx, cy, r]) => [cx * scaleX, cy * scaleY, r * scaleX]),
    };
    const dxf = generateDXF(scaled, scaledFrame, panelWidth, panelHeight, unit);
    const blob = new Blob([dxf], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `panel_${selectedStyle}_${seed}.dxf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSVG = () => {
    if (!svgRef.current) return;
    const svgData = svgRef.current.outerHTML;
    const blob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `panel_${selectedStyle}_${seed}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bg = darkMode ? "#1a1a2e" : "#f8f9fa";
  const fg = darkMode ? "#e0e0e0" : "#1a1a1a";
  const cardBg = darkMode ? "#16213e" : "#ffffff";
  const borderColor = darkMode ? "#2a2a4a" : "#dee2e6";
  const patternColor = darkMode ? "#00d4ff" : "#2563eb";
  const frameColor = darkMode ? "#ff6b35" : "#dc2626";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: bg, color: fg, minHeight: "100vh", padding: "20px" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, background: "linear-gradient(135deg, #00d4ff, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Metal Panel Pattern Generator
        </h1>
        <p style={{ fontSize: 13, opacity: 0.6, margin: "6px 0 0" }}>Generate decorative patterns for CNC laser & plasma cutting</p>
      </div>

      <div style={{ display: "flex", gap: 20, maxWidth: 1100, margin: "0 auto", flexWrap: "wrap" }}>
        {/* Left Panel - Controls */}
        <div style={{ flex: "1 1 320px", minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Style Selection */}
          <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: `1px solid ${borderColor}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, opacity: 0.7, margin: "0 0 12px" }}>Pattern Style</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {STYLES.map(s => (
                <button key={s.id} onClick={() => { setSelectedStyle(s.id); if (s.subStyles) setSubStyle(s.subStyles[0]); }}
                  style={{
                    padding: "10px 8px", borderRadius: 8, border: `2px solid ${selectedStyle === s.id ? s.color : borderColor}`,
                    background: selectedStyle === s.id ? `${s.color}18` : "transparent", cursor: "pointer", color: fg,
                    fontSize: 12, fontWeight: selectedStyle === s.id ? 600 : 400, textAlign: "left", transition: "all 0.2s"
                  }}>
                  <span style={{ fontSize: 18, marginRight: 6 }}>{s.icon}</span>
                  {s.name}
                </button>
              ))}
            </div>

            {/* Sub-style */}
            {style?.subStyles && (
              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase" }}>Variation</label>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {style.subStyles.map(ss => (
                    <button key={ss} onClick={() => setSubStyle(ss)}
                      style={{
                        padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                        border: `1px solid ${subStyle === ss ? style.color : borderColor}`,
                        background: subStyle === ss ? `${style.color}25` : "transparent", color: fg
                      }}>{ss}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel Configuration */}
          <div style={{ background: cardBg, borderRadius: 12, padding: 16, border: `1px solid ${borderColor}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, opacity: 0.7, margin: "0 0 12px" }}>Panel Shape & Size</h3>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {SHAPES.map(s => (
                <button key={s.id} onClick={() => setPanelShape(s.id)}
                  style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer",
                    border: `2px solid ${panelShape === s.id ? "#8b5cf6" : borderColor}`,
                    background: panelShape === s.id ? "#8b5cf620" : "transparent", color: fg,
                    fontSize: 11, textAlign: "center"
                  }}>
                  <div style={{ fontSize: 20 }}>{s.icon}</div>
                  {s.name}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, opacity: 0.6 }}>Width ({unit})</label>
                <input type="number" value={panelWidth} onChange={e => setPanelWidth(Math.max(1, +e.target.value))}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: `1px solid ${borderColor}`, background: bg, color: fg, fontSize: 14, marginTop: 4 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, opacity: 0.6 }}>Height ({unit})</label>
                <input type="number" value={panelHeight} onChange={e => setPanelHeight(Math.max(1, +e.target.value))}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: `1px solid ${borderColor}`, background: bg, color: fg, fontSize: 14, marginTop: 4 }} />
              </div>
              <div style={{ flex: 0.7 }}>
                <label style={{ fontSize: 11, opacity: 0.6 }}>Units</label>
                <select value={unit} onChange={e => setUnit(e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: 6, border: `1px solid ${borderColor}`, background: bg, color: fg, fontSize: 13, marginTop: 4 }}>
                  <option value="inches">in</option>
                  <option value="mm">mm</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, opacity: 0.6 }}>Pattern Density</label>
              <input type="range" min="0.1" max="1" step="0.05" value={density}
                onChange={e => setDensity(+e.target.value)}
                style={{ width: "100%", marginTop: 4, accentColor: style?.color || "#8b5cf6" }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={regenerate}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", color: "#fff",
                fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
              🎲 Randomize
            </button>
            <button onClick={exportDXF}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff",
                fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
              }}>
              📐 Export DXF
            </button>
          </div>
          <button onClick={exportSVG}
            style={{
              padding: "10px", borderRadius: 10, border: `1px solid ${borderColor}`, cursor: "pointer",
              background: "transparent", color: fg, fontSize: 13, fontWeight: 500
            }}>
            Export SVG
          </button>

          {/* Options */}
          <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={showFrame} onChange={e => setShowFrame(e.target.checked)} />
              Show frame
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
              Dark mode
            </label>
            <span style={{ opacity: 0.5, marginLeft: "auto" }}>Seed: {seed}</span>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div style={{ flex: "1 1 450px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            background: cardBg, borderRadius: 16, padding: 24, border: `1px solid ${borderColor}`,
            width: "100%", display: "flex", flexDirection: "column", alignItems: "center"
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
              Preview — {panelWidth}×{panelHeight} {unit}
            </div>

            <svg ref={svgRef} viewBox={`-10 -10 ${viewW + 20} ${viewH + 20}`}
              width={Math.min(viewW + 20, 460)} height={Math.min(viewH + 20, 600)}
              style={{ background: darkMode ? "#0a0a1a" : "#fff", borderRadius: 8, border: `1px solid ${borderColor}` }}>

              {/* Clip path for panel shape */}
              <defs>
                <clipPath id="panelClip">
                  <path d={framePath} />
                </clipPath>
              </defs>

              {/* Pattern */}
              <g clipPath="url(#panelClip)">
                {pattern.lines.map(([x1, y1, x2, y2], i) => (
                  <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={patternColor} strokeWidth={1} opacity={0.8} />
                ))}
                {pattern.circles.map(([cx, cy, r], i) => (
                  <circle key={`c${i}`} cx={cx} cy={cy} r={r}
                    stroke={patternColor} strokeWidth={1} fill="none" opacity={0.8} />
                ))}
              </g>

              {/* Frame */}
              {showFrame && (
                <path d={framePath} fill="none" stroke={frameColor} strokeWidth={2.5} />
              )}

              {/* Info */}
              <text x={viewW / 2} y={viewH + 14} textAnchor="middle" fill={fg} fontSize={9} opacity={0.4}>
                {style?.name} • {panelWidth}×{panelHeight}{unit === "inches" ? '"' : "mm"} • seed:{seed}
              </text>
            </svg>

            <div style={{ marginTop: 12, fontSize: 11, opacity: 0.5, textAlign: "center" }}>
              {pattern.lines.length} lines • {pattern.circles.length} circles
              <br />
              <span style={{ color: patternColor }}>■</span> Pattern (PATTERN layer) &nbsp;
              <span style={{ color: frameColor }}>■</span> Frame (FRAME layer)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
