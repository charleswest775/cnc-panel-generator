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

function generateSlats(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const fills = [];
  const cellSize = Math.min(w, h) * 0.06; // Constant grid spacing
  const barWidth = cellSize * (0.5 + rng() * 0.2); // Constant bar width
  const slotWidth = cellSize * (0.3 + rng() * 0.2); // Base slot width (will be scaled)
  const pitch = barWidth + slotWidth;
  const variation = rng() < 0.5 ? "staggered" : "tapered";
  const horizontal = rng() < 0.5;

  if (variation === "staggered") {
    const segLen = Math.min(w, h) * (0.15 + rng() * 0.05); // Constant segment length
    const webGap = slotWidth * (0.08 + rng() * 0.06); // Constant web gap
    if (horizontal) {
      const rows = Math.ceil(h / pitch) + 1;
      for (let r = 0; r < rows; r++) {
        const y1 = r * pitch + barWidth;
        const maxSlotH = slotWidth;
        const scaledSlotH = maxSlotH * scale;
        const yOffset = (maxSlotH - scaledSlotH) / 2;
        const y1Scaled = y1 + yOffset;
        const y2Scaled = y1Scaled + scaledSlotH;
        const offset = (r % 2) * segLen * 0.5;
        const cols = Math.ceil(w / segLen) + 2;
        for (let c = -1; c < cols; c++) {
          const x1 = c * segLen + offset + webGap;
          const x2 = x1 + segLen * 0.85 - webGap * 2;
          // Rectangle cutout (the slot between bar segments)
          lines.push([x1, y1Scaled, x2, y1Scaled]);
          lines.push([x2, y1Scaled, x2, y2Scaled]);
          lines.push([x2, y2Scaled, x1, y2Scaled]);
          lines.push([x1, y2Scaled, x1, y1Scaled]);
          fills.push({ type: 'rect', x: x1, y: y1Scaled, width: x2 - x1, height: y2Scaled - y1Scaled });
        }
      }
    } else {
      const cols = Math.ceil(w / pitch) + 1;
      for (let c = 0; c < cols; c++) {
        const x1 = c * pitch + barWidth;
        const maxSlotW = slotWidth;
        const scaledSlotW = maxSlotW * scale;
        const xOffset = (maxSlotW - scaledSlotW) / 2;
        const x1Scaled = x1 + xOffset;
        const x2Scaled = x1Scaled + scaledSlotW;
        const offset = (c % 2) * segLen * 0.5;
        const rows = Math.ceil(h / segLen) + 2;
        for (let r = -1; r < rows; r++) {
          const y1 = r * segLen + offset + webGap;
          const y2 = y1 + segLen * 0.85 - webGap * 2;
          lines.push([x1Scaled, y1, x2Scaled, y1]);
          lines.push([x2Scaled, y1, x2Scaled, y2]);
          lines.push([x2Scaled, y2, x1Scaled, y2]);
          lines.push([x1Scaled, y2, x1Scaled, y1]);
          fills.push({ type: 'rect', x: x1Scaled, y: y1, width: x2Scaled - x1Scaled, height: y2 - y1 });
        }
      }
    }
  } else {
    // Tapered — slot width varies from thin to wide across the panel (no fills for open slots)
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

  return { lines, circles: [], arcs: [], fills };
}

function generateRectangular(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const fills = [];
  const cellSize = Math.min(w, h) * (0.10 + rng() * 0.02); // Constant grid
  const webWidth = cellSize * (0.12 + rng() * 0.06); // Constant web width
  const variation = rng() < 0.5 ? "nested" : "alternating";

  const cols = Math.ceil(w / cellSize) + 1;
  const rows = Math.ceil(h / cellSize) + 1;
  const bridgeW = Math.max(minBridgeGap, webWidth); // Ensure min bridge gap

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize + webWidth / 2;
      const y = r * cellSize + webWidth / 2;
      const cw = cellSize - webWidth;
      const ch = cellSize - webWidth;

      if (variation === "nested") {
        // Scale both outer and inner rectangles
        const maxCw = cw * scale;
        const maxCh = ch * scale;
        const offsetX = (cw - maxCw) / 2;
        const offsetY = (ch - maxCh) / 2;
        const sx = x + offsetX, sy = y + offsetY;
        const mx = sx + maxCw / 2, my = sy + maxCh / 2;
        const bh = bridgeW / 2; // half bridge width

        // Outer rectangle with 4 bridge gaps (one per side midpoint)
        lines.push([sx, sy, mx - bh, sy]);
        lines.push([mx + bh, sy, sx + maxCw, sy]);
        lines.push([sx + maxCw, sy, sx + maxCw, my - bh]);
        lines.push([sx + maxCw, my + bh, sx + maxCw, sy + maxCh]);
        lines.push([sx + maxCw, sy + maxCh, mx + bh, sy + maxCh]);
        lines.push([mx - bh, sy + maxCh, sx, sy + maxCh]);
        lines.push([sx, sy + maxCh, sx, my + bh]);
        lines.push([sx, my - bh, sx, sy]);

        // Inner nested rectangle - fill this one
        const inset = maxCw * 0.25;
        const ix = sx + inset, iy = sy + inset;
        const iw = maxCw - inset * 2, ih = maxCh - inset * 2;
        if (iw > 0 && ih > 0) {
          const imx = ix + iw / 2, imy = iy + ih / 2;
          lines.push([ix, iy, imx - bh, iy]);
          lines.push([imx + bh, iy, ix + iw, iy]);
          lines.push([ix + iw, iy, ix + iw, imy - bh]);
          lines.push([ix + iw, imy + bh, ix + iw, iy + ih]);
          lines.push([ix + iw, iy + ih, imx + bh, iy + ih]);
          lines.push([imx - bh, iy + ih, ix, iy + ih]);
          lines.push([ix, iy + ih, ix, imy + bh]);
          lines.push([ix, imy - bh, ix, iy]);
          fills.push({ type: 'rect', x: ix, y: iy, width: iw, height: ih });
        }
      } else {
        // Alternating sizes — scale rectangles
        const isSmall = (r + c) % 2 === 0;
        const sizeVariation = isSmall ? 0.6 : 1.0;
        const aw = cw * scale * sizeVariation;
        const ah = ch * scale * sizeVariation;
        const ax = x + (cw - aw) / 2;
        const ay = y + (ch - ah) / 2;
        lines.push([ax, ay, ax + aw, ay]);
        lines.push([ax + aw, ay, ax + aw, ay + ah]);
        lines.push([ax + aw, ay + ah, ax, ay + ah]);
        lines.push([ax, ay + ah, ax, ay]);
        fills.push({ type: 'rect', x: ax, y: ay, width: aw, height: ah });
      }
    }
  }

  return { lines, circles: [], arcs: [], fills };
}

function generateDiamond(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const fills = [];
  const cellSize = Math.min(w, h) * (0.12 + rng() * 0.02); // Constant grid
  const variation = rng() < 0.5 ? "elongated" : "double";

  const dw = cellSize * (0.95 + rng() * 0.1);
  const dh = variation === "elongated" ? cellSize * (1.5 + rng() * 0.3) : cellSize;
  const cols = Math.ceil(w / dw) + 2;
  const rows = Math.ceil(h / (dh * 0.5)) + 2;
  const inset = cellSize * 0.08; // Constant inset

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * dw + (r % 2 ? dw * 0.5 : 0);
      const cy = r * dh * 0.5;
      const maxHw = (dw * 0.5 - inset) * scale;
      const maxHh = (dh * 0.5 - inset) * scale;

      if (variation === "double") {
        // Scale both diamonds, ensure min bridge gap
        const bridgeGapFrac = Math.max(0.10, minBridgeGap / (maxHw * 2));
        const s = 0.5; // inner diamond scale

        // Outer diamond with bridge gaps
        lines.push([cx + maxHw * bridgeGapFrac, cy - maxHh + maxHh * bridgeGapFrac, cx + maxHw * (1 - bridgeGapFrac), cy - maxHh * bridgeGapFrac]);
        lines.push([cx + maxHw * (1 - bridgeGapFrac), cy + maxHh * bridgeGapFrac, cx + maxHw * bridgeGapFrac, cy + maxHh * (1 - bridgeGapFrac)]);
        lines.push([cx - maxHw * bridgeGapFrac, cy + maxHh * (1 - bridgeGapFrac), cx - maxHw * (1 - bridgeGapFrac), cy + maxHh * bridgeGapFrac]);
        lines.push([cx - maxHw * (1 - bridgeGapFrac), cy - maxHh * bridgeGapFrac, cx - maxHw * bridgeGapFrac, cy - maxHh * (1 - bridgeGapFrac)]);

        // Inner diamond with bridge gaps - fill this one
        const ihw = maxHw * s, ihh = maxHh * s;
        lines.push([cx + ihw * bridgeGapFrac, cy - ihh + ihh * bridgeGapFrac, cx + ihw * (1 - bridgeGapFrac), cy - ihh * bridgeGapFrac]);
        lines.push([cx + ihw * (1 - bridgeGapFrac), cy + ihh * bridgeGapFrac, cx + ihw * bridgeGapFrac, cy + ihh * (1 - bridgeGapFrac)]);
        lines.push([cx - ihw * bridgeGapFrac, cy + ihh * (1 - bridgeGapFrac), cx - ihw * (1 - bridgeGapFrac), cy + ihh * bridgeGapFrac]);
        lines.push([cx - ihw * (1 - bridgeGapFrac), cy - ihh * bridgeGapFrac, cx - ihw * bridgeGapFrac, cy - ihh * (1 - bridgeGapFrac)]);
        fills.push({
          type: 'polygon',
          points: [
            [cx, cy - ihh],
            [cx + ihw, cy],
            [cx, cy + ihh],
            [cx - ihw, cy]
          ]
        });
      } else {
        // Elongated — scale diamond
        lines.push([cx, cy - maxHh, cx + maxHw, cy]);
        lines.push([cx + maxHw, cy, cx, cy + maxHh]);
        lines.push([cx, cy + maxHh, cx - maxHw, cy]);
        lines.push([cx - maxHw, cy, cx, cy - maxHh]);
        fills.push({
          type: 'polygon',
          points: [
            [cx, cy - maxHh],
            [cx + maxHw, cy],
            [cx, cy + maxHh],
            [cx - maxHw, cy]
          ]
        });
      }
    }
  }

  return { lines, circles: [], arcs: [], fills };
}

function generateHoneycomb(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const circles = [];
  const arcs = [];
  const fills = [];
  const hexR = Math.min(w, h) * (0.06 + rng() * 0.015); // Constant grid
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

      const webWidth = hexR * 0.15; // Constant web width
      const maxInR = (hexR - webWidth / 2) * scale;

      if (variation === "centerdot") {
        // Scale hex and center dot, ensure min bridge gap
        const sideLength = maxInR * Math.sqrt(3);
        const bridgeFrac = Math.max(0.20, minBridgeGap / sideLength);

        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i - Math.PI / 6;
          const a2 = (Math.PI / 3) * ((i + 1) % 6) - Math.PI / 6;
          const x1 = cx + maxInR * Math.cos(a1), y1 = cy + maxInR * Math.sin(a1);
          const x2 = cx + maxInR * Math.cos(a2), y2 = cy + maxInR * Math.sin(a2);

          if (i % 2 === 0) {
            // Bridge side — gap in the middle
            const bf = bridgeFrac / 2;
            lines.push([x1, y1, x1 + (x2 - x1) * (0.5 - bf), y1 + (y2 - y1) * (0.5 - bf)]);
            lines.push([x1 + (x2 - x1) * (0.5 + bf), y1 + (y2 - y1) * (0.5 + bf), x2, y2]);
          } else {
            lines.push([x1, y1, x2, y2]);
          }
        }

        // Center dot - scale with hex
        const dotR = hexR * 0.2 * scale;
        const arcSpan = Math.PI * 2 / 3 * 0.85;
        for (let b = 0; b < 3; b++) {
          const bridgeAngle = (Math.PI / 3) * (b * 2) - Math.PI / 6 + Math.PI / 6;
          const arcStart = bridgeAngle + (Math.PI * 2 / 3 - arcSpan) / 2;
          const arcEnd = arcStart + arcSpan;
          arcs.push([cx, cy, dotR, arcStart, arcEnd]);
        }
        fills.push({ type: 'circle', cx, cy, r: dotR });
      } else {
        // Partial — scale hexagons
        for (let i = 0; i < 6; i++) {
          const a1 = (Math.PI / 3) * i - Math.PI / 6;
          const a2 = (Math.PI / 3) * ((i + 1) % 6) - Math.PI / 6;
          lines.push([
            cx + maxInR * Math.cos(a1), cy + maxInR * Math.sin(a1),
            cx + maxInR * Math.cos(a2), cy + maxInR * Math.sin(a2)
          ]);
        }
      }
    }
  }

  return { lines, circles, arcs, fills };
}

function generateChevron(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const cellSize = Math.min(w, h) * (0.10 + rng() * 0.02); // Constant grid
  const variation = rng() < 0.5 ? "nested" : "broken";

  const chevW = cellSize * (1.4 + rng() * 0.3);
  const chevH = cellSize * (0.9 + rng() * 0.2);
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
          const nestScale = 1 - n * 0.28;
          const sw = chevW * 0.5 * nestScale * scale;
          const sh = chevH * 0.5 * nestScale * scale * dir;
          const cx = x + chevW * 0.5;
          const cy = y;
          lines.push([cx - sw, cy, cx, cy + sh]);
          lines.push([cx, cy + sh, cx + sw, cy]);
        }
      } else {
        // Broken/dashed chevron - scale the chevron
        const cx = x + chevW * 0.5;
        const gap = 0.15;
        const lx1 = x + chevW * 0.5 * (1 - scale), ly1 = y;
        const rx1 = x + chevW - chevW * 0.5 * (1 - scale), ry1 = y;
        const mx = cx, my = y + (tipY - y) * scale;
        lines.push([lx1, ly1, lx1 + (mx - lx1) * (0.5 - gap), ly1 + (my - ly1) * (0.5 - gap)]);
        lines.push([lx1 + (mx - lx1) * (0.5 + gap), ly1 + (my - ly1) * (0.5 + gap), mx, my]);
        lines.push([rx1, ry1, rx1 + (mx - rx1) * (0.5 - gap), ry1 + (my - ry1) * (0.5 - gap)]);
        lines.push([rx1 + (mx - rx1) * (0.5 + gap), ry1 + (my - ry1) * (0.5 + gap), mx, my]);
      }
    }
  }

  return { lines, circles: [], arcs: [], fills: [] };
}

function generateTriangle(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const fills = [];
  const size = Math.min(w, h) * 0.10; // Constant grid
  const variation = rng() < 0.5 ? "alternate" : "subdivided";

  const rowH = size * Math.sqrt(3) * 0.5;
  const cols = Math.ceil(w / size) + 2;
  const rows = Math.ceil(h / rowH) + 2;
  const inset = size * 0.06; // Constant inset

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const x = c * size + (r % 2 ? size * 0.5 : 0);
      const y = r * rowH;
      const up = (r + c) % 2 === 0;

      if (variation === "alternate" && (r + c) % 2 === 0) continue;

      if (up) {
        const cx = x + size * 0.5, cy = y + rowH * 0.67;
        const baseX0 = x + size * 0.5, baseY0 = y + inset;
        const baseX1 = x + inset, baseY1 = y + rowH - inset;
        const baseX2 = x + size - inset, baseY2 = y + rowH - inset;
        // Scale from centroid
        const x0 = cx + (baseX0 - cx) * scale, y0 = cy + (baseY0 - cy) * scale;
        const x1 = cx + (baseX1 - cx) * scale, y1 = cy + (baseY1 - cy) * scale;
        const x2 = cx + (baseX2 - cx) * scale, y2 = cy + (baseY2 - cy) * scale;

        if (variation === "subdivided") {
          const mx01 = (x0 + x1) / 2, my01 = (y0 + y1) / 2;
          const mx12 = (x1 + x2) / 2, my12 = (y1 + y2) / 2;
          const mx02 = (x0 + x2) / 2, my02 = (y0 + y2) / 2;
          lines.push([mx01, my01, mx02, my02]);
          lines.push([mx02, my02, mx12, my12]);
          lines.push([mx12, my12, mx01, my01]);
          fills.push({
            type: 'polygon',
            points: [[mx01, my01], [mx02, my02], [mx12, my12]]
          });
        } else {
          lines.push([x0, y0, x2, y2]);
          lines.push([x2, y2, x1, y1]);
          lines.push([x1, y1, x0, y0]);
          fills.push({
            type: 'polygon',
            points: [[x0, y0], [x2, y2], [x1, y1]]
          });
        }
      } else {
        const cx = x + size * 0.5, cy = y + rowH * 0.33;
        const baseX0 = x + size * 0.5, baseY0 = y + rowH - inset;
        const baseX1 = x + inset, baseY1 = y + inset;
        const baseX2 = x + size - inset, baseY2 = y + inset;
        // Scale from centroid
        const x0 = cx + (baseX0 - cx) * scale, y0 = cy + (baseY0 - cy) * scale;
        const x1 = cx + (baseX1 - cx) * scale, y1 = cy + (baseY1 - cy) * scale;
        const x2 = cx + (baseX2 - cx) * scale, y2 = cy + (baseY2 - cy) * scale;

        if (variation === "subdivided") {
          const mx01 = (x0 + x1) / 2, my01 = (y0 + y1) / 2;
          const mx12 = (x1 + x2) / 2, my12 = (y1 + y2) / 2;
          const mx02 = (x0 + x2) / 2, my02 = (y0 + y2) / 2;
          lines.push([mx01, my01, mx02, my02]);
          lines.push([mx02, my02, mx12, my12]);
          lines.push([mx12, my12, mx01, my01]);
          fills.push({
            type: 'polygon',
            points: [[mx01, my01], [mx02, my02], [mx12, my12]]
          });
        } else {
          lines.push([x0, y0, x2, y2]);
          lines.push([x2, y2, x1, y1]);
          lines.push([x1, y1, x0, y0]);
          fills.push({
            type: 'polygon',
            points: [[x0, y0], [x2, y2], [x1, y1]]
          });
        }
      }
    }
  }

  return { lines, circles: [], arcs: [], fills };
}

function generateCircles(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const circles = [];
  const arcs = [];
  const fills = [];
  const cellSize = Math.min(w, h) * (0.08 + rng() * 0.02); // Constant grid
  const variation = rng() < 0.5 ? "concentric" : "mixed";
  const hexPacked = rng() < 0.5;
  const sizeVariation = 0.8 + rng() * 0.4; // random size multiplier

  const cols = Math.ceil(w / cellSize) + 2;
  const rows = Math.ceil(h / (hexPacked ? cellSize * 0.866 : cellSize)) + 2;
  const numSpokes = 4; // radial bridges per ring
  const webWidth = cellSize * 0.12; // Constant web width

  for (let r = -1; r < rows; r++) {
    for (let c = -1; c < cols; c++) {
      const cx = c * cellSize + (hexPacked && r % 2 ? cellSize * 0.5 : 0);
      const cy = r * (hexPacked ? cellSize * 0.866 : cellSize);

      if (variation === "concentric") {
        // Concentric rings with radial bridges - scale rings, enforce min bridge gap
        const maxRadius = (cellSize / 2 - webWidth / 2) * sizeVariation;
        const scaledMaxRadius = maxRadius * scale;
        const radii = [scaledMaxRadius, scaledMaxRadius * 0.6];
        if (rng() > 0.5) radii.push(scaledMaxRadius * 0.3);

        // Calculate spoke gap in radians to ensure minimum physical gap
        const avgRadius = scaledMaxRadius * 0.7;
        const minGapRadians = Math.max(0.08, minBridgeGap / avgRadius);

        for (let ri = 0; ri < radii.length; ri++) {
          const ringR = radii[ri];
          // Draw ring as numSpokes arcs, each spanning between spoke gaps
          for (let sp = 0; sp < numSpokes; sp++) {
            const spokeAngle = (Math.PI * 2 * sp) / numSpokes;
            const nextSpokeAngle = (Math.PI * 2 * (sp + 1)) / numSpokes;
            const arcStart = spokeAngle + minGapRadians;
            const arcEnd = nextSpokeAngle - minGapRadians;
            arcs.push([cx, cy, ringR, arcStart, arcEnd]);
          }
        }
        // No fills for concentric (bridged rings)
      } else {
        // Mixed sizes — scale circles
        const maxRadius = (cellSize / 2 - webWidth / 2) * sizeVariation;
        const scaledMaxRadius = maxRadius * scale;
        const isLarge = (r + c) % 2 === 0;
        const radius = isLarge ? scaledMaxRadius : scaledMaxRadius * 0.6;
        circles.push([cx, cy, radius]);
        fills.push({ type: 'circle', cx, cy, r: radius });
      }
    }
  }

  return { lines, circles, arcs, fills };
}

function generateBasketweave(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const fills = [];
  const cellSize = Math.min(w, h) * (0.12 + rng() * 0.02); // Constant grid
  const variation = rng() < 0.5 ? "weave" : "rotated";
  const webWidth = cellSize * (0.12 + rng() * 0.04); // Constant web width

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
          const maxRh = (cellSize - webWidth * (rectCount + 1)) / rectCount;
          const scaledRh = maxRh * scale;
          for (let i = 0; i < rectCount; i++) {
            const baseRy = y + webWidth + i * (maxRh + webWidth);
            const ryOffset = (maxRh - scaledRh) / 2;
            const ry = baseRy + ryOffset;
            const rx = x + webWidth;
            const maxRw = cellSize - webWidth * 2;
            const scaledRw = maxRw * scale;
            const rxOffset = (maxRw - scaledRw) / 2;
            lines.push([rx + rxOffset, ry, rx + rxOffset + scaledRw, ry]);
            lines.push([rx + rxOffset + scaledRw, ry, rx + rxOffset + scaledRw, ry + scaledRh]);
            lines.push([rx + rxOffset + scaledRw, ry + scaledRh, rx + rxOffset, ry + scaledRh]);
            lines.push([rx + rxOffset, ry + scaledRh, rx + rxOffset, ry]);
            fills.push({ type: 'rect', x: rx + rxOffset, y: ry, width: scaledRw, height: scaledRh });
          }
        } else {
          const maxRw2 = (cellSize - webWidth * (rectCount + 1)) / rectCount;
          const scaledRw2 = maxRw2 * scale;
          for (let i = 0; i < rectCount; i++) {
            const baseRx = x + webWidth + i * (maxRw2 + webWidth);
            const rxOffset = (maxRw2 - scaledRw2) / 2;
            const rx = baseRx + rxOffset;
            const ry = y + webWidth;
            const maxRh2 = cellSize - webWidth * 2;
            const scaledRh2 = maxRh2 * scale;
            const ryOffset = (maxRh2 - scaledRh2) / 2;
            lines.push([rx, ry + ryOffset, rx + scaledRw2, ry + ryOffset]);
            lines.push([rx + scaledRw2, ry + ryOffset, rx + scaledRw2, ry + ryOffset + scaledRh2]);
            lines.push([rx + scaledRw2, ry + ryOffset + scaledRh2, rx, ry + ryOffset + scaledRh2]);
            lines.push([rx, ry + ryOffset + scaledRh2, rx, ry + ryOffset]);
            fills.push({ type: 'rect', x: rx, y: ry + ryOffset, width: scaledRw2, height: scaledRh2 });
          }
        }
      } else {
        // Rotated squares — scale diamond, ensure min bridge gap
        const ccx = x + cellSize / 2;
        const ccy = y + cellSize / 2;
        const maxHalf = cellSize * 0.35 * scale;
        const bridgeGapFrac = Math.max(0.12, minBridgeGap / (maxHalf * 2));

        lines.push([ccx + maxHalf * bridgeGapFrac, ccy - maxHalf * (1 - bridgeGapFrac), ccx + maxHalf * (1 - bridgeGapFrac), ccy - maxHalf * bridgeGapFrac]);
        lines.push([ccx + maxHalf * (1 - bridgeGapFrac), ccy + maxHalf * bridgeGapFrac, ccx + maxHalf * bridgeGapFrac, ccy + maxHalf * (1 - bridgeGapFrac)]);
        lines.push([ccx - maxHalf * bridgeGapFrac, ccy + maxHalf * (1 - bridgeGapFrac), ccx - maxHalf * (1 - bridgeGapFrac), ccy + maxHalf * bridgeGapFrac]);
        lines.push([ccx - maxHalf * (1 - bridgeGapFrac), ccy - maxHalf * bridgeGapFrac, ccx - maxHalf * bridgeGapFrac, ccy - maxHalf * (1 - bridgeGapFrac)]);
        fills.push({
          type: 'polygon',
          points: [
            [ccx, ccy - maxHalf],
            [ccx + maxHalf, ccy],
            [ccx, ccy + maxHalf],
            [ccx - maxHalf, ccy]
          ]
        });
      }
    }
  }

  return { lines, circles: [], arcs: [], fills };
}

function generateBrick(w, h, rng, scale, minBridgeGap) {
  const lines = [];
  const fills = [];
  const brickW = Math.min(w, h) * (0.15 + rng() * 0.03); // Constant grid
  const brickH = brickW * (0.4 + rng() * 0.1);
  const webWidth = brickW * (0.12 + rng() * 0.04); // Constant web width
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
        const maxBw = sBrickW - webWidth;
        const maxBh = sBrickH - webWidth;
        // Scale brick dimensions
        const bw = maxBw * scale;
        const bh = maxBh * scale;
        const offsetX = (maxBw - bw) / 2;
        const offsetY = (maxBh - bh) / 2;
        lines.push([x + offsetX, y + offsetY, x + offsetX + bw, y + offsetY]);
        lines.push([x + offsetX + bw, y + offsetY, x + offsetX + bw, y + offsetY + bh]);
        lines.push([x + offsetX + bw, y + offsetY + bh, x + offsetX, y + offsetY + bh]);
        lines.push([x + offsetX, y + offsetY + bh, x + offsetX, y + offsetY]);
        fills.push({ type: 'rect', x: x + offsetX, y: y + offsetY, width: bw, height: bh });
      }
    } else {
      for (let c = -1; c < cols; c++) {
        const x = c * brickW + offset + webWidth / 2;
        const y = r * brickH + webWidth / 2;
        const maxBw = brickW - webWidth;
        const maxBh = brickH - webWidth;
        // Scale brick dimensions
        const bw = maxBw * scale;
        const bh = maxBh * scale;
        const offsetX = (maxBw - bw) / 2;
        const offsetY = (maxBh - bh) / 2;
        lines.push([x + offsetX, y + offsetY, x + offsetX + bw, y + offsetY]);
        lines.push([x + offsetX + bw, y + offsetY, x + offsetX + bw, y + offsetY + bh]);
        lines.push([x + offsetX + bw, y + offsetY + bh, x + offsetX, y + offsetY + bh]);
        lines.push([x + offsetX, y + offsetY + bh, x + offsetX, y + offsetY]);
        fills.push({ type: 'rect', x: x + offsetX, y: y + offsetY, width: bw, height: bh });
      }
    }
  }

  return { lines, circles: [], arcs: [], fills };
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
  const scale = params.scale || 0.5;
  const minBridgeGap = params.minBridgeGap || 2;

  const gen = SUBPATTERN_MAP[subStyle];
  if (!gen) return { lines: [], circles: [], arcs: [], fills: [] };

  const result = gen(w, h, rng, scale, minBridgeGap);

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
