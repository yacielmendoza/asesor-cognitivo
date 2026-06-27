import os

import httpx

from app.providers.base import LLMProvider

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterProvider(LLMProvider):
    def __init__(self) -> None:
        self.api_key = os.environ["OPENROUTER_API_KEY"]
        self.model = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

    async def _complete(self, prompt: str) -> str:
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "model": self.model,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "user", "content": prompt}],
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(OPENROUTER_ENDPOINT, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()
        choices = data.get("choices") or []
        if not choices:
            return "null"
        return choices[0].get("message", {}).get("content", "") or "null"
