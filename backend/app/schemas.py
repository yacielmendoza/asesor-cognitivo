"""Contratos de datos del WebSocket. Toda alerta generada por un provider se
valida contra AlertCard antes de salir hacia el cliente: si no calza con el
esquema, se descarta en silencio (el asesor nunca debe romper la sesión)."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

TipoAlerta = Literal["alerta", "sugerencia", "pregunta", "calculo"]
Prioridad = Literal["alta", "media", "baja"]
Hablante = Literal["agente", "yo"]


class Cita(BaseModel):
    etiqueta: str
    texto: str


class CalculoFila(BaseModel):
    etiqueta: str
    valor: str


class CalculoGanancia(BaseModel):
    etiqueta: str
    valor: str


class Calculo(BaseModel):
    filas: list[CalculoFila] = Field(default_factory=list)
    ganancia: CalculoGanancia


class AlertCard(BaseModel):
    tipo: TipoAlerta
    prioridad: Prioridad
    icono: str
    etiqueta: str
    cuerpo: str
    cita: Optional[Cita] = None
    calculo: Optional[Calculo] = None


class TranscriptIn(BaseModel):
    """Mensaje JSON entrante: una frase transcrita en el navegador (Web Speech API)."""

    type: Literal["transcript"] = "transcript"
    speaker: Hablante
    texto: str
    es_final: bool = True


class ScenarioEvent(BaseModel):
    type: Literal["scenario"] = "scenario"
    etiqueta: str


class RibbonEvent(BaseModel):
    type: Literal["ribbon"] = "ribbon"
    who: str
    said: str


class AlertEvent(BaseModel):
    type: Literal["alert"] = "alert"
    card: AlertCard
