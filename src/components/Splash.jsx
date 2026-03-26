import { useEffect, useState } from "react";

export default function Splash({ onDone }) {
  const [phase, setPhase] = useState(0); // 0=show, 1=fadeout

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1400);
    const t2 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position:"fixed", inset:0, background:"#000", zIndex:999,
      display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column",
      opacity: phase === 1 ? 0 : 1,
      transition:"opacity 0.5s ease",
    }}>
      <style>{`
        @keyframes auraPulse {
          0%   { transform: scale(0.8); opacity: 0; }
          50%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes textUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* aura */}
      <div style={{
        position:"absolute", width:320, height:320,
        background:"radial-gradient(circle, rgba(108,99,255,0.35) 0%, transparent 65%)",
        filter:"blur(50px)",
        animation:"auraPulse 1s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }} />

      {/* logo */}
      <div style={{
        position:"relative", zIndex:1,
        fontSize:52, fontWeight:700, color:"#fff", letterSpacing:-2,
        animation:"textUp 0.6s 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        fontFamily:"-apple-system, 'SF Pro Display', sans-serif",
      }}>fintrack</div>

      <div style={{
        position:"relative", zIndex:1,
        fontSize:13, color:"#636366", marginTop:8, letterSpacing:0.5,
        animation:"textUp 0.6s 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        fontFamily:"-apple-system, sans-serif",
      }}>controle financeiro</div>
    </div>
  );
}
