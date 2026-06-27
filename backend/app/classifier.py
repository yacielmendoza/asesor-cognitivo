"""Clasificador heurístico de escenario. Es deliberadamente simple (keywords):
solo decide qué "etiqueta de contexto" mostrar en la barra centinela; el
análisis táctico real lo hace el LLMProvider con el historial completo."""

_SCENARIOS: list[tuple[list[str], str]] = [
    (["kwh", "tarifa", "factura eléctrica", "plan de energía", "electricidad"], "Negociación · Plan de energía"),
    (["póliza", "poliza", "cobertura", "deducible", "siniestro"], "Negociación · Seguros"),
    (["deuda", "mora", "cobranza", "pago atrasado", "vencido"], "Cobranza · Deuda"),
    (["tarjeta", "préstamo", "prestamo", "crédito", "credito", "cuenta bancaria"], "Servicios financieros"),
    (["no funciona", "soporte técnico", "reiniciar", "error", "sin servicio"], "Soporte técnico"),
    (["suscripción", "suscripcion", "plan mensual", "membresía", "membresia"], "Retención · Suscripción"),
]

DEFAULT_SCENARIO = "Conversación general"


def classify(history_text: str) -> str:
    lower = history_text.lower()
    for keywords, label in _SCENARIOS:
        if any(keyword in lower for keyword in keywords):
            return label
    return DEFAULT_SCENARIO
