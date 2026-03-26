import { useState } from "react";
import { fmt } from "../data/seed";

const RAINBOW = [
  "#ff453a", "#ff9f0a", "#ffd60a", "#32d74b",
  "#64d2ff", "#6c63ff", "#bf5af2",
];

export default function RainbowChart({ data }) {
  const [visible, setVisible] = useState(true);

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R_OUTER = 90;
  const R_INNER = 58;
  const GAP = 0.025; // radians gap between slices

  // build arcs
  let cursor = -Math.PI; // start left (half donut)
  const totalAngle = Math.PI; // semicircle

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * totalAngle;
    const start = cursor + GAP / 2;
    const end = cursor + angle - GAP / 2;
    cursor += angle;

    const x1 = CX + R_OUTER * Math.cos(start);
    const y1 = CY + R_OUTER * Math.sin(start);
    const x2 = CX + R_OUTER * Math.cos(end);
    const y2 = CY + R_OUTER * Math.sin(end);
    const x3 = CX + R_INNER * Math.cos(end);
    const y3 = CY + R_INNER * Math.sin(end);
    const x4 = CX + R_INNER * Math.cos(start);
    const y4 = CY + R_INNER * Math.sin(start);
    const large = angle > Math.PI ? 1 : 0;

    const path = `M ${x1} ${y1} A ${R_OUTER} ${R_OUTER} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${R_INNER} ${R_INNER} 0 ${large} 0 ${x4} ${y4} Z`;

    return { ...d, path, color: RAINBOW[i % RAINBOW.length] };
  });

  return (
    <div style={{
      background:"linear-gradient(135deg,#111 0%,#0d0d0f 100%)",
      border:"1px solid #1c1c1e", borderRadius:24,
      padding:"20px 20px 12px", marginBottom:20,
      animation: visible ? "none" : "none",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:visible ? 16 : 0 }}>
        <div style={{ fontSize:12, color:"#636366", fontWeight:500 }}>Distribuicao de gastos</div>
        <button
          onClick={() => setVisible(v => !v)}
          style={{
            background:"#1c1c1e", border:"none", color:"#636366",
            fontSize:11, fontWeight:600, padding:"4px 12px",
            borderRadius:8, cursor:"pointer", fontFamily:"inherit",
            transition:"all 0.2s"
          }}
        >{visible ? "Ocultar" : "Ver grafico"}</button>
      </div>

      <div style={{
        overflow:"hidden",
        maxHeight: visible ? 320 : 0,
        transition:"max-height 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}>
        {/* SVG donut */}
        <div style={{ display:"flex", justifyContent:"center" }}>
          <svg width={SIZE} height={SIZE / 2 + 16} viewBox={`0 0 ${SIZE} ${SIZE / 2 + 16}`} style={{ overflow:"visible" }}>
            {slices.map((s, i) => (
              <path key={i} d={s.path} fill={s.color} opacity={0.9} />
            ))}
            {/* center label */}
            <text x={CX} y={CY - 4} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="-apple-system,sans-serif">
              {fmt(total)}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fill="#636366" fontSize="10" fontFamily="-apple-system,sans-serif">
              total gastos
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display:"flex", flexWrap:"wrap", gap:"8px 16px", marginTop:8 }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:s.color, flexShrink:0 }} />
              <span style={{ fontSize:11, color:"#ebebf5" }}>{s.label}</span>
              <span style={{ fontSize:11, color:"#636366" }}>{Math.round((s.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
