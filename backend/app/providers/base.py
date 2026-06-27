import json
import logging
from abc import ABC, abstractmethod
from typing import Optional

from pydantic import ValidationError

from app.schemas import AlertCard

logger = logging.getLogger("asesor.providers")


class LLMProvider(ABC):
    """Interfaz común. Cambiar de proveedor es solo elegir LLM_PROVIDER en el entorno;
    el resto del sistema (Session) solo conoce este contrato."""

    @abstractmethod
    async def _complete(self, prompt: str) -> str:
        """Devuelve el texto crudo generado por el modelo (idealmente JSON o 'null')."""

    async def analyze(self, history: list[str], scenario: str, latest: str, speaker: str) -> Optional[AlertCard]:
        from app.providers.prompt import build_prompt

        prompt = build_prompt(history=history, scenario=scenario, latest=latest, speaker=speaker)
        try:
            raw = await self._complete(prompt)
        except Exception:
            logger.exception("Fallo al consultar el LLM provider")
            return None
        return self._parse(raw)

    @staticmethod
    def _parse(raw: str) -> Optional[AlertCard]:
        text = raw.strip()
        if text.startswith("```"):
            text = text.strip("`")
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()
        if not text or text.lower() == "null":
            return None
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Respuesta del LLM no es JSON válido: %r", text[:200])
            return None
        if data is None:
            return None
        try:
            return AlertCard.model_validate(data)
        except ValidationError:
            logger.warning("Respuesta del LLM no cumple el esquema AlertCard: %r", text[:200])
            return None
