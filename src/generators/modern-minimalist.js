// Modern Minimalist Geometric Pattern Generator
// 10 sub-patterns with variations selected by seeded RNG

function createRNG(seed) {
  let s = Math.abs(seed | 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ─── Sub-pattern generators ──────────────────────────────────

function generateSlats(w, h, rng, density) {
  const lines = [];
  const cellSize = Math.min(w, h) * (0.03 + (1 - density) * 0.05);
  const barWidth = cellSize * 0.6;
  const slotWidth = cellSize * 0.4;
  const pitch = barWidth + slotWidth;
  const variation = rng() < 0.5 ? "staggered" : "tapered";
  const horizontal = rng() < 0.5;

  if (variation === "staggered") {
    const segLen = Math.min(w, h) * (0.08 + (1 - density) * 0.12);
    const webGap = slotWidth * 0.08; // small inset so adjacent segments don't share edges
    if (horizontal) {
      const rows = Math.ceil(h / pitch) + 1;
      for (let r = 0; r < rows; r++) {
        const y1 = r * pitch + barWidth; // start after the bar (in the slot region)
        const y2 = y1 + slotWidth;       // slot height, not bar height
        const offset = (r % 2) * segLen * 0.5;
        const cols = Math.ceil(w / segLen) + 2;
        for (let c = -1; c < cols; c++) {
          const x1 = c * segLen + offset + webGap;
          const x2 = x1 + segLen * 0.85 - webGap * 2;
          // Rectangle cutout (the slot between bar segments)
          lines.push([x1, y1, x2, y1]);
          lines.push([x2, y1, x2, y2]);
          lines.push([x2, y2, x1, y2]);
          lines.push([x1, y2, x1, y1]);
        }
      }
    } else {
      const cols = Math.ceil(w / pitch) + 1;
      for (let c = 0; c < cols; c++) {
        const x1 = c * pitch + barWidth; // start after the bar (in the slot region)
        const x2 = x1 + slotWidth;       // slot width, not bar width
        const offset = (c % 2) * segLen * 0.5;
        const rows = Math.ceil(h / segLen) + 2;
        for (let r = -1; r < rows; r++) {
          const y1 = r * segLen + offset + webGap;
          const y2 = y1 + segLen * 0.85 - webGap * 2;
          lines.push([x1, y1, x2, y1]);
          lines.push([x2, y1, x2, y2]);
          lines.push([x2, y2, x1, y2]);
          lines.push([x1, y2, x1, y1]);
        }
      }
    }
  } else {
    // Tapered — slot width varies from thin to wide across the panel
    if (horizontal) {
      const rows = Math.ceil(h / pitch) + 1;
      for (let r = 0; r < rows; r++) {
        const frac = r / Math.max(1, rows - 1);
        const slot = slotWidth * (0.3 + frac * 1.4);
        const y1 = r * pitch;
        const y2 = y1 + slot;
        lines.push([0, y1, w, y1]);
        lines.push([0, y2, w, y2]);
      }
    } else {
      const cols = Math.ceil(w / pitch) + 1;
      for (let c = 0; c < cols; c++) {
        const frac = c / Math.max(1, cols - 1);
        const slot = slotWidth * (0.3 + frac * 1.4);
        const x1 = c * pitch;
        const x2 = x1 + slot;
        lines.push([x1, 0, x1, h]);
        lines.push([x2, 0, x2, h]);
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

function generateRectangular(w, h, rng, density) {
  const lines = [];
  const cellSize = Math.min(w, h) * (0.05 + (1 - density) * 0.07);
  const webWidth = cellSize * 0.15;
  const variation = rng() < 0.5 ? "nested" : "alternating";

  const cols = Math.ceil(w / cellSize) + 1;
  const rows = Math.ceil(h / cellSize) + 1;
  const bridgeW = webWidth; // bridge width = web width

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize + webWidth / 2;
      const y = r * cellSize + webWidth / 2;
      const cw = cellSize - webWidth;
      const ch = cellSize - webWidth;

      if (variation === "nested") {
        const mx = x + cw / 2, my = y + ch / 2;
        const bh = bridgeW / 2; // half bridge width

        // Outer rectangle with 4 bridge gaps (one per side midpoint)
        // Top side: gap at midpoint
        lines.push([x, y, mx - bh, y]);
        lines.push([mx + bh, y, x + cw, y]);
        // Right side: gap at midpoint
        lines.push([x + cw, y, x + cw, my - bh]);
        lines.push([x + cw, my + bh, x + cw, y + ch]);
        // Bottom side: gap at midpoint
        lines.push([x + cw, y + ch, mx + bh, y + ch]);
        lines.push([mx - bh, y + ch, x, y + ch]);
        // Left side: gap at midpoint
        lines.push([x, y + ch, x, my + bh]);
        lines.push([x, my - bh, x, y]);

        // Inner nested rectangle with matching gaps
        const inset = cw * 0.25;
        const ix = x + inset, iy = y + inset;
        const iw = cw - inset * 2, ih = ch - inset * 2;
        if (iw > 0 && ih > 0) {
          const imx = ix + iw / 2, imy = iy + ih / 2;
          // Top side
          lines.push([ix, iy, imx - bh, iy]);
          lines.push([imx + bh, iy, ix + iw, iy]);
          // Right side
          lines.push([ix + iw, iy, ix + iw, imy - bh]);
          lines.push([ix + iw, imy + bh, ix + iw, iy + ih]);
          // Bottom side
          lines.push([ix + iw, iy + ih, imx + bh, iy + ih]);
          lines.push([imx - bh, iy + ih, ix, iy + ih]);
          // Left side
          lines.push([ix, iy + ih, ix, imy + bh]);
          lines.push([ix, imy - bh, ix, iy]);
        }
      } else {
        // Alternating sizes — single closed cutouts, no nesting issue
        const isSmall = (r + c) % 2 === 0;
        const scale = isSmall ? 0.6 : 1.0;
        const aw = cw * scale;
        const ah = ch * scale;
        const ax = x + (cw - aw) / 2;
        const ay = y + (ch - ah) / 2;
        lines.push([ax, ay, ax + aw, ay]);
        lines.push([ax + aw, ay, ax + aw, ay + ah]);
        lines.push([ax + aw, ay + ah, ax, ay + ah]);
        lines.push([ax, ay + ah, ax, ay]);
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

function generateDiamond(w, h, rng, density) {
  const lines = [];
  const cellSize = Math.min(w, h) * (0.06 + (1 - density) * 0.08);
  const variation = rng() < 0.5 ? "elongated" : "double";

  const dw = cellSize;
  const dh = variation === "elongated" ? cellSize * 1.6 : cellSize;
  const cols = Math.ceil(w / dw) + 2;
  const rows = Math.ceil(h / (dh * 0.5)) + 2;
  const inset = cellSize * 0.08;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * dw + (r % 2 ? dw * 0.5 : 0);
      const cy = r * dh * 0.5;
      const hw = dw * 0.5 - inset;
      const hh = dh * 0.5 - inset;

      if (variation === "double") {
        // Bridge gaps at the 4 cardinal vertices (top, right, bottom, left).
        // Each diamond side is drawn stopping short of bridge vertices.
        // The fraction 'g' controls how far from the vertex the gap extends along each side.
        const g = 0.12;
        const s = 0.5; // inner diamond scale

        // Outer diamond — 4 sides, each with gaps near bridge vertices
        // Vertices: T=(cx, cy-hh), R=(cx+hw, cy), B=(cx, cy+hh), L=(cx-hw, cy)
        // Side T→R: start g along from T, end g back from R
        lines.push([cx + hw * g, cy - hh + hh * g, cx + hw * (1 - g), cy - hh * g]);
        // Side R→B
        lines.push([cx + hw * (1 - g), cy + hh * g, cx + hw * g, cy + hh * (1 - g)]);
        // Side B→L
        lines.push([cx - hw * g, cy + hh * (1 - g), cx - hw * (1 - g), cy + hh * g]);
        // Side L→T
        lines.push([cx - hw * (1 - g), cy - hh * g, cx - hw * g, cy - hh * (1 - g)]);

        // Inner diamond — same gap pattern
        const ihw = hw * s, ihh = hh * s;
        lines.push([cx + ihw * g, cy - ihh + ihh * g, cx + ihw * (1 - g), cy - ihh * g]);
        lines.push([cx + ihw * (1 - g), cy + ihh * g, cx + ihw * g, cy + ihh * (1 - g)]);
        lines.push([cx - ihw * g, cy + ihh * (1 - g), cx - ihw * (1 - g), cy + ihh * g]);
        lines.push([cx - ihw * (1 - g), cy - ihh * g, cx - ihw * g, cy - ihh * (1 - g)]);
        // Uncut metal at the 4 cardinal points forms the bridges — no lines needed there.
      } else {
        // Elongated — single diamond cutout, no nesting issue
        lines.push([cx, cy - hh, cx + hw, cy]);
        lines.push([cx + hw, cy, cx, cy + hh]);
        lines.push([cx, cy + hh, cx - hw, cy]);
        lines.push([cx - hw, cy, cx, cy - hh]);
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

function generateHoneycomb(w, h, rng, density) {
  const lines = [];
  const circles = [];
  const hexR = Math.min(w, h) * (0.03 + (1 - density) * 0.05);
  const variation = rng() < 0.5 ? "partial" : "centerdot";

  const hexW = hexR * Math.sqrt(3);
  const hexH = hexR * 2;
  const cols = Math.ceil(w / hexW) + 2;
  const rows = Math.ceil(h / (hexH * 0.75)) + 2;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * hexW + (r % 2 ? hexW * 0.5 : 0);
      const cy = r * hexH * 0.75;

      if (variation === "partial" && (r + c) % 2 === 0) continue;

      const webWidth = hexR * 0.15;
      const inR = hexR - webWidth / 2;

      if (variation === "centerdot") {
        // Hex with 3 bridge gaps at 120° spacing (sides 0, 2, 4) connecting
        // a central solid disc to the surrounding web. The bridge is the uncut
        // gap in the hex outline — radial spokes of metal.
        const bridgeFrac = 0.25; // fraction of each side that is a gap
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i - Math.PI / 6;
          const a2 = (Math.PI / 3) * ((i + 1) % 6) - Math.PI / 6;
          const x1 = cx + inR * Math.cos(a1), y1 = cy + inR * Math.sin(a1);
          const x2 = cx + inR * Math.cos(a2), y2 = cy + inR * Math.sin(a2);

          if (i % 2 === 0) {
            // Bridge side — gap in the middle, draw two short segments at ends
            const bf = bridgeFrac / 2;
            lines.push([x1, y1, x1 + (x2 - x1) * (0.5 - bf), y1 + (y2 - y1) * (0.5 - bf)]);
            lines.push([x1 + (x2 - x1) * (0.5 + bf), y1 + (y2 - y1) * (0.5 + bf), x2, y2]);
          } else {
            // Full side — no bridge needed
            lines.push([x1, y1, x2, y2]);
          }
        }

        // Center dot as 3 arcs (~100° each) instead of a full closed circle.
        // Gaps align with the 3 bridge spoke directions.
        const dotR = hexR * 0.2;
        const arcSpan = Math.PI * 2 / 3 * 0.85; // each arc slightly less than 120°
        const segs = 6; // segments per arc
        for (let b = 0; b < 3; b++) {
          const bridgeAngle = (Math.PI / 3) * (b * 2) - Math.PI / 6 + Math.PI / 6; // midpoint angle of bridge sides
          const arcStart = bridgeAngle + (Math.PI * 2 / 3 - arcSpan) / 2;
          for (let s = 0; s < segs; s++) {
            const sa = arcStart + (arcSpan * s) / segs;
            const ea = arcStart + (arcSpan * (s + 1)) / segs;
            lines.push([
              cx + dotR * Math.cos(sa), cy + dotR * Math.sin(sa),
              cx + dotR * Math.cos(ea), cy + dotR * Math.sin(ea)
            ]);
          }
        }
      } else {
        // Partial or standard — simple closed hex cutouts, no nesting issue
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i - Math.PI / 6;
          const a2 = (Math.PI / 3) * ((i + 1) % 6) - Math.PI / 6;
          lines.push([
            cx + inR * Math.cos(a1), cy + inR * Math.sin(a1),
            cx + inR * Math.cos(a2), cy + inR * Math.sin(a2)
          ]);
        }
      }
    }
  }

  return { lines, circles, arcs: [] };
}

function generateChevron(w, h, rng, density) {
  const lines = [];
  const cellSize = Math.min(w, h) * (0.05 + (1 - density) * 0.07);
  const variation = rng() < 0.5 ? "nested" : "broken";

  const chevW = cellSize * 1.5;
  const chevH = cellSize;
  const cols = Math.ceil(w / chevW) + 2;
  const rows = Math.ceil(h / chevH) + 2;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * chevW;
      const y = r * chevH;
      const dir = r % 2 === 0 ? 1 : -1;
      const tipY = y + chevH * 0.5 * dir;

      if (variation === "nested") {
        for (let n = 0; n < 3; n++) {
          const scale = 1 - n * 0.28;
          const sw = chevW * 0.5 * scale;
          const sh = chevH * 0.5 * scale * dir;
          const cx = x + chevW * 0.5;
          const cy = y;
          lines.push([cx - sw, cy, cx, cy + sh]);
          lines.push([cx, cy + sh, cx + sw, cy]);
        }
      } else {
        // Broken/dashed chevron
        const cx = x + chevW * 0.5;
        const gap = 0.15;
        // Left arm — two segments with gap
        const lx1 = x, ly1 = y;
        const mx = cx, my = tipY;
        lines.push([lx1, ly1, lx1 + (mx - lx1) * (0.5 - gap), ly1 + (my - ly1) * (0.5 - gap)]);
        lines.push([lx1 + (mx - lx1) * (0.5 + gap), ly1 + (my - ly1) * (0.5 + gap), mx, my]);
        // Right arm
        const rx1 = x + chevW, ry1 = y;
        lines.push([rx1, ry1, rx1 + (mx - rx1) * (0.5 - gap), ry1 + (my - ry1) * (0.5 - gap)]);
        lines.push([rx1 + (mx - rx1) * (0.5 + gap), ry1 + (my - ry1) * (0.5 + gap), mx, my]);
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

function generateTriangle(w, h, rng, density) {
  const lines = [];
  const size = Math.min(w, h) * (0.05 + (1 - density) * 0.07);
  const variation = rng() < 0.5 ? "alternate" : "subdivided";

  const rowH = size * Math.sqrt(3) * 0.5;
  const cols = Math.ceil(w / size) + 2;
  const rows = Math.ceil(h / rowH) + 2;
  const inset = size * 0.06;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * size + (r % 2 ? size * 0.5 : 0);
      const y = r * rowH;
      const up = (r + c) % 2 === 0;

      if (variation === "alternate" && (r + c) % 2 === 0) continue;

      if (up) {
        const x0 = x + size * 0.5, y0 = y + inset;
        const x1 = x + inset,       y1 = y + rowH - inset;
        const x2 = x + size - inset, y2 = y + rowH - inset;

        if (variation === "subdivided") {
          // Subdivide into 4, cut center only
          const mx01 = (x0 + x1) / 2, my01 = (y0 + y1) / 2;
          const mx12 = (x1 + x2) / 2, my12 = (y1 + y2) / 2;
          const mx02 = (x0 + x2) / 2, my02 = (y0 + y2) / 2;
          lines.push([mx01, my01, mx02, my02]);
          lines.push([mx02, my02, mx12, my12]);
          lines.push([mx12, my12, mx01, my01]);
        } else {
          lines.push([x0, y0, x2, y2]);
          lines.push([x2, y2, x1, y1]);
          lines.push([x1, y1, x0, y0]);
        }
      } else {
        const x0 = x + size * 0.5, y0 = y + rowH - inset;
        const x1 = x + inset,       y1 = y + inset;
        const x2 = x + size - inset, y2 = y + inset;

        if (variation === "subdivided") {
          const mx01 = (x0 + x1) / 2, my01 = (y0 + y1) / 2;
          const mx12 = (x1 + x2) / 2, my12 = (y1 + y2) / 2;
          const mx02 = (x0 + x2) / 2, my02 = (y0 + y2) / 2;
          lines.push([mx01, my01, mx02, my02]);
          lines.push([mx02, my02, mx12, my12]);
          lines.push([mx12, my12, mx01, my01]);
        } else {
          lines.push([x0, y0, x2, y2]);
          lines.push([x2, y2, x1, y1]);
          lines.push([x1, y1, x0, y0]);
        }
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

function generateCircles(w, h, rng, density) {
  const lines = [];
  const circles = [];
  const cellSize = Math.min(w, h) * (0.04 + (1 - density) * 0.06);
  const variation = rng() < 0.5 ? "concentric" : "mixed";
  const hexPacked = rng() < 0.5;

  const cols = Math.ceil(w / cellSize) + 2;
  const rows = Math.ceil(h / (hexPacked ? cellSize * 0.866 : cellSize)) + 2;
  const numSpokes = 4; // radial bridges per ring
  const spokeGap = 0.12; // radians of gap per spoke (half on each side)

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * cellSize + (hexPacked && r % 2 ? cellSize * 0.5 : 0);
      const cy = r * (hexPacked ? cellSize * 0.866 : cellSize);

      if (variation === "concentric") {
        // Concentric rings drawn as arcs with gaps at spoke positions.
        // Spokes are uncut radial strips connecting each ring outward.
        const webWidth = cellSize * 0.12;
        const outerR = cellSize / 2 - webWidth / 2;
        const radii = [outerR, outerR * 0.6];
        if (rng() > 0.5) radii.push(outerR * 0.3);

        for (let ri = 0; ri < radii.length; ri++) {
          const ringR = radii[ri];
          // Draw ring as numSpokes arcs, each spanning between spoke gaps
          for (let sp = 0; sp < numSpokes; sp++) {
            const spokeAngle = (Math.PI * 2 * sp) / numSpokes;
            const nextSpokeAngle = (Math.PI * 2 * (sp + 1)) / numSpokes;
            const arcStart = spokeAngle + spokeGap;
            const arcEnd = nextSpokeAngle - spokeGap;
            const arcSpan = arcEnd - arcStart;
            const segs = Math.max(4, Math.ceil(arcSpan / 0.3));
            for (let s = 0; s < segs; s++) {
              const a1 = arcStart + (arcSpan * s) / segs;
              const a2 = arcStart + (arcSpan * (s + 1)) / segs;
              lines.push([
                cx + ringR * Math.cos(a1), cy + ringR * Math.sin(a1),
                cx + ringR * Math.cos(a2), cy + ringR * Math.sin(a2)
              ]);
            }
          }
        }
      } else {
        // Mixed sizes — single circle cutouts, no nesting issue
        const webWidth = cellSize * 0.12;
        const maxRadius = cellSize / 2 - webWidth / 2;
        const isLarge = (r + c) % 2 === 0;
        const radius = isLarge ? maxRadius : maxRadius * 0.6;
        circles.push([cx, cy, radius]);
      }
    }
  }

  return { lines, circles, arcs: [] };
}

function generateBasketweave(w, h, rng, density) {
  const lines = [];
  const cellSize = Math.min(w, h) * (0.06 + (1 - density) * 0.08);
  const variation = rng() < 0.5 ? "weave" : "rotated";
  const webWidth = cellSize * 0.1;

  const cols = Math.ceil(w / cellSize) + 1;
  const rows = Math.ceil(h / cellSize) + 1;

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const isHorizontal = (r + c) % 2 === 0;

      if (variation === "weave") {
        const rectCount = 2;
        if (isHorizontal) {
          const rh = (cellSize - webWidth * (rectCount + 1)) / rectCount;
          for (let i = 0; i < rectCount; i++) {
            const ry = y + webWidth + i * (rh + webWidth);
            const rx = x + webWidth;
            const rw = cellSize - webWidth * 2;
            lines.push([rx, ry, rx + rw, ry]);
            lines.push([rx + rw, ry, rx + rw, ry + rh]);
            lines.push([rx + rw, ry + rh, rx, ry + rh]);
            lines.push([rx, ry + rh, rx, ry]);
          }
        } else {
          const rw2 = (cellSize - webWidth * (rectCount + 1)) / rectCount;
          for (let i = 0; i < rectCount; i++) {
            const rx = x + webWidth + i * (rw2 + webWidth);
            const ry = y + webWidth;
            const rh2 = cellSize - webWidth * 2;
            lines.push([rx, ry, rx + rw2, ry]);
            lines.push([rx + rw2, ry, rx + rw2, ry + rh2]);
            lines.push([rx + rw2, ry + rh2, rx, ry + rh2]);
            lines.push([rx, ry + rh2, rx, ry]);
          }
        }
      } else {
        // Rotated squares — diamond cutout with 4 bridge gaps at cardinal
        // points (top, right, bottom, left vertices). Uncut metal at each
        // vertex connects the rotated square island to the cell corners,
        // creating an 8-pointed star negative space motif.
        const ccx = x + cellSize / 2;
        const ccy = y + cellSize / 2;
        const half = cellSize * 0.35;
        const g = 0.15; // gap fraction near each vertex

        // Vertices: T=(ccx, ccy-half), R=(ccx+half, ccy), B=(ccx, ccy+half), L=(ccx-half, ccy)
        // Each side drawn stopping short of both vertices by g fraction
        // Side T→R
        lines.push([ccx + half * g, ccy - half * (1 - g), ccx + half * (1 - g), ccy - half * g]);
        // Side R→B
        lines.push([ccx + half * (1 - g), ccy + half * g, ccx + half * g, ccy + half * (1 - g)]);
        // Side B→L
        lines.push([ccx - half * g, ccy + half * (1 - g), ccx - half * (1 - g), ccy + half * g]);
        // Side L→T
        lines.push([ccx - half * (1 - g), ccy - half * g, ccx - half * g, ccy - half * (1 - g)]);
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

function generateBrick(w, h, rng, density) {
  const lines = [];
  const brickW = Math.min(w, h) * (0.08 + (1 - density) * 0.1);
  const brickH = brickW * 0.45;
  const webWidth = brickW * 0.1;
  const variation = rng() < 0.5 ? "standard" : "soldier";
  const soldierInterval = 4 + Math.floor(rng() * 3);

  const cols = Math.ceil(w / brickW) + 2;
  const rows = Math.ceil(h / brickH) + 2;

  for (let r = -1; r < rows; r++) {
    const isSoldier = variation === "soldier" && r % soldierInterval === 0;
    const offset = (!isSoldier && r % 2 === 1) ? brickW * 0.5 : 0;

    if (isSoldier) {
      // Soldier course — tall narrow bricks (clamped to row height)
      const sBrickW = brickH;
      const sBrickH = Math.min(brickW * 0.6, brickH);
      const sCols = Math.ceil(w / sBrickW) + 2;
      for (let c = -1; c < sCols; c++) {
        const x = c * sBrickW + webWidth / 2;
        const y = r * brickH + webWidth / 2;
        const bw = sBrickW - webWidth;
        const bh = sBrickH - webWidth;
        lines.push([x, y, x + bw, y]);
        lines.push([x + bw, y, x + bw, y + bh]);
        lines.push([x + bw, y + bh, x, y + bh]);
        lines.push([x, y + bh, x, y]);
      }
    } else {
      for (let c = -1; c < cols; c++) {
        const x = c * brickW + offset + webWidth / 2;
        const y = r * brickH + webWidth / 2;
        const bw = brickW - webWidth;
        const bh = brickH - webWidth;
        lines.push([x, y, x + bw, y]);
        lines.push([x + bw, y, x + bw, y + bh]);
        lines.push([x + bw, y + bh, x, y + bh]);
        lines.push([x, y + bh, x, y]);
      }
    }
  }

  return { lines, circles: [], arcs: [] };
}

// ─── Deduplication utility ────────────────────────────────────

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

// ─── Main entry point ────────────────────────────────────────

const SUBPATTERN_MAP = {
  slats: generateSlats,
  rectangular: generateRectangular,
  diamond: generateDiamond,
  honeycomb: generateHoneycomb,
  chevron: generateChevron,
  triangle: generateTriangle,
  circles: generateCircles,
  basketweave: generateBasketweave,
  brick: generateBrick,
};

export function generateModernMinimalist(w, h, seed, params) {
  const rng = createRNG(seed);
  const subStyle = params.subStyle || "slats";
  const density = params.density || 0.5;

  const gen = SUBPATTERN_MAP[subStyle];
  if (!gen) return { lines: [], circles: [], arcs: [] };

  const result = gen(w, h, rng, density);

  // Margin clip — filter out geometry fully outside the panel margin
  const margin = Math.min(w, h) * 0.03;
  const x0 = margin, y0 = margin, x1 = w - margin, y1 = h - margin;

  result.lines = result.lines.filter(([lx1, ly1, lx2, ly2]) =>
    !(lx1 < x0 && lx2 < x0) && !(lx1 > x1 && lx2 > x1) &&
    !(ly1 < y0 && ly2 < y0) && !(ly1 > y1 && ly2 > y1)
  );

  result.circles = result.circles.filter(([cx, cy, r]) =>
    cx + r > x0 && cx - r < x1 && cy + r > y0 && cy - r < y1
  );

  // Deduplicate coincident geometry
  result.lines = deduplicateLines(result.lines);
  result.circles = deduplicateCircles(result.circles);

  return result;
}
