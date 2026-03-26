export default function Modal({ title, onClose, onSave, children }) {
  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 }}
      onClick={onClose}
    >
      <div
        style={{
          background:"#111", borderRadius:"24px 24px 0 0",
          padding:"28px 24px 48px", width:"100%", maxWidth:560,
          borderTop:"1px solid #2c2c2e",
          animation:"slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
        <div style={{ width:36, height:4, background:"#3a3a3c", borderRadius:2, margin:"0 auto 24px" }} />
        <div style={{ fontSize:17, fontWeight:600, color:"#fff", marginBottom:24 }}>{title}</div>
        {children}
        <div style={{ display:"flex", gap:12, marginTop:24 }}>
          <button onClick={onClose} style={{ flex:1, background:"#2c2c2e", border:"none", color:"#ebebf5", borderRadius:14, padding:"14px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Cancelar</button>
          <button onClick={onSave}  style={{ flex:1, background:"#6c63ff", border:"none", color:"#fff",     borderRadius:14, padding:"14px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
