import AlertCard from "./AlertCard.jsx";

export default function AlertStream({ alerts, onDismiss }) {
  return (
    <section className="stream" aria-live="polite" aria-label="Alertas del asesor">
      <div className="stream-inner">
        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            card={alert.card}
            leaving={alert.leaving}
            onLeft={() => onDismiss(alert.id)}
          />
        ))}
      </div>
    </section>
  );
}
