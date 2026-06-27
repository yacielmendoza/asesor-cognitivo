import os

import httpx

from app.providers.base import LLMProvider

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiProvider(LLMProvider):
    def __init__(self) -> None:
        self.api_key = os.environ["GEMINI_API_KEY"]
        self.model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

    async def _complete(self, prompt: str) -> str:
        url = GEMINI_ENDPOINT.format(model=self.model)
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
            },
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, params={"key": self.api_key}, json=payload)
            response.raise_for_status()
            data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return "null"
        parts = candidates[0].get("content", {}).get("parts", [])
        return "".join(part.get("text", "") for part in parts) or "null"
