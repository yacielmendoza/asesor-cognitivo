export default function Ribbon({ who, said }) {
  return (
    <div className="ribbon">
      <span className="who">{who || "Agente"}</span>
      <span className="said">{said || "Conectando…"}</span>
    </div>
  );
}
