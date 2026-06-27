export default function AlertCard({ card, leaving, onLeft }) {
  const { tipo, prioridad, icono, etiqueta, cuerpo, cita, calculo } = card;

  return (
    <article
      className={`card t-${tipo}${leaving ? " leaving" : ""}`}
      onAnimationEnd={(e) => {
        if (leaving && e.animationName === "sink") onLeft?.();
      }}
    >
      <div className="head">
        <span className="badge">{icono}</span>
        <span className="tag">{etiqueta}</span>
        <span className={`prio ${prioridad}`}>{prioridad.toUpperCase()}</span>
      </div>
      <div className="body">{cuerpo}</div>

      {calculo && (
        <div className="calc">
          {calculo.filas.map((fila, i) => (
            <div className="row" key={i}>
              <span>{fila.etiqueta}</span>
              <b>{fila.valor}</b>
            </div>
          ))}
          <div className="win">
            <span>{calculo.ganancia.etiqueta}</span>
            <span>{calculo.ganancia.valor}</span>
          </div>
        </div>
      )}

      {cita && (
        <div className="quote">
          <span>{cita.etiqueta}</span>
          “{cita.texto}”
        </div>
      )}
    </article>
  );
}
