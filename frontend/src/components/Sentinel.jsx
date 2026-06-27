export default function Sentinel({ scenario, live }) {
  return (
    <header className="sentinel">
      <div className={`pulse${live ? "" : " idle"}`} aria-hidden="true">
        <span className="ring r2" />
        <span className="ring r3" />
        <span className="core" />
      </div>
      <div className="sentinel-text">
        <span className="lbl">Asesor Cognitivo</span>
        <span className="scn">{scenario || "Detectando escenario…"}</span>
      </div>
      <span className={`live-chip${live ? "" : " off"}`}>
        <span className="dot" />
        {live ? "EN VIVO" : "EN PAUSA"}
      </span>
    </header>
  );
}
