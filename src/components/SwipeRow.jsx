import { useRef, useState } from "react";

export default function SwipeRow({ children, onEdit, onDelete, onToggle, toggleLabel, toggleColor }) {
  const startX = useRef(null);
  const startY = useRef(null);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);

  const ACTION_W = onToggle ? 180 : 120;
  const THRESHOLD = 55;

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setAnimating(false);
  }

  function onTouchMove(e) {
    const dx = e.touches[0].clientX - startX.current;
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dy > 12 && Math.abs(dx) < dy) return;
    e.preventDefault();
    const base = open ? -ACTION_W : 0;
    const raw = base + dx;
    const clamped = Math.max(-ACTION_W, Math.min(0, raw));
    currentX.current = clamped;
    setOffset(clamped);
  }

  function onTouchEnd() {
    setAnimating(true);
    if (currentX.current < -THRESHOLD) {
      setOffset(-ACTION_W);
      setOpen(true);
    } else {
      setOffset(0);
      setOpen(false);
    }
  }

  function close() {
    setAnimating(true);
    setOffset(0);
    setOpen(false);
  }

  function handleDelete() { close(); setTimeout(onDelete, 220); }
  function handleEdit()   { close(); setTimeout(onEdit, 220); }
  function handleToggle() { close(); onToggle && onToggle(); }

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>
      {/* Actions */}
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:ACTION_W, display:"flex" }}>
        {onToggle && (
          <button onClick={handleToggle} style={{
            flex:1, border:"none", background: toggleColor || "#636366",
            color:"#fff", fontSize:12, fontWeight:600,
            cursor:"pointer", fontFamily:"inherit",
          }}>{toggleLabel || "Toggle"}</button>
        )}
        <button onClick={handleEdit} style={{
          width:60, border:"none", background:"#3a3a3c",
          color:"#fff", fontSize:12, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit",
        }}>Editar</button>
        <button onClick={handleDelete} style={{
          width:60, border:"none", background:"#ff453a",
          color:"#fff", fontSize:12, fontWeight:600,
          cursor:"pointer", fontFamily:"inherit",
        }}>Deletar</button>
      </div>

      {/* Content */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${offset}px)`,
          transition: animating ? "transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          background:"#000",
          touchAction:"pan-y",
          userSelect:"none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
