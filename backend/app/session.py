"""Orquestación de una sesión WebSocket: recibe audio (descartado tras usarlo,
nunca persistido) y transcripciones del navegador, clasifica el escenario y
consulta al LLMProvider para emitir tarjetas de alerta validadas."""
import json
import logging

from fastapi import WebSocket
from pydantic import ValidationError

from app.classifier import classify
from app.providers.base import LLMProvider
from app.providers.factory import get_provider
from app.schemas import AlertEvent, RibbonEvent, ScenarioEvent, TranscriptIn

logger = logging.getLogger("asesor.session")

HISTORY_WINDOW = 8


class Session:
    def __init__(self, websocket: WebSocket, provider: LLMProvider | None = None) -> None:
        self.ws = websocket
        self.history: list[str] = []
        self.scenario: str | None = None
        self.audio_bytes_received = 0
        if provider is not None:
            self.provider = provider
        else:
            try:
                self.provider = get_provider()
            except Exception:
                # Configuración de LLM ausente o inválida: la sesión sigue viva
                # (transcripción y escenario funcionan) pero sin generar alertas.
                logger.exception("No se pudo inicializar el LLMProvider; sesión sin alertas")
                self.provider = None

    async def handle_audio_chunk(self, data: bytes) -> None:
        """Audio PCM16 crudo. Stateless por diseño: solo se cuenta, no se guarda ni
        se reenvía. Queda como punto de extensión para VAD o STT server-side futuro."""
        self.audio_bytes_received += len(data)

    async def handle_text_message(self, raw: str) -> None:
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            return
        if payload.get("type") != "transcript":
            return
        try:
            transcript = TranscriptIn.model_validate(payload)
        except ValidationError:
            return

        await self._send_ribbon(transcript.speaker, transcript.texto)
        if not transcript.es_final:
            return

        self.history.append(transcript.texto)
        new_scenario = classify(" ".join(self.history))
        if new_scenario != self.scenario:
            self.scenario = new_scenario
            await self._send(ScenarioEvent(etiqueta=new_scenario))

        if self.provider is None:
            return

        card = await self.provider.analyze(
            history=self.history[-HISTORY_WINDOW:-1],
            scenario=self.scenario or "Conversación general",
            latest=transcript.texto,
            speaker=transcript.speaker,
        )
        if card is not None:
            await self._send(AlertEvent(card=card))

    async def _send_ribbon(self, speaker: str, texto: str) -> None:
        who = "Agente" if speaker == "agente" else "Tú"
        await self._send(RibbonEvent(who=who, said=texto))

    async def _send(self, event) -> None:
        await self.ws.send_text(event.model_dump_json())
