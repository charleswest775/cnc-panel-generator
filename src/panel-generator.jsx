import { useState, useCallback, useMemo, useRef } from "react";
import { generateModernMinimalist } from "./generators/modern-minimalist.js";

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
  { id: "modern", name: "Modern Minimalist", icon: "▦", color: "#64748b",
    subStyles: ["slats","rectangular","diamond","honeycomb","chevron","triangle","circles","basketweave","brick"],
    generator: generateModernMinimalist },
];

const SHAPES = [
  { id: "rectangle", name: "Rectangle", icon: "▭" },
  { id: "circle", name: "Circle", icon: "○" },
  { id: "arch", name: "Arch", icon: "⌓" },
  { id: "oval", name: "Oval", icon: "⬭" },
];

// ─── Main Component ──────────────────────────────────────────

export default function PanelGenerator() {
  const [selectedStyle, setSelectedStyle] = useState("modern");
  const [subStyle, setSubStyle] = useState("slats");
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
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
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
