import os

from app.providers.base import LLMProvider


def get_provider() -> LLMProvider:
    """Único punto de selección de proveedor: lee LLM_PROVIDER del entorno.
    Cambiar de Gemini a OpenRouter (o viceversa) no requiere tocar código."""
    name = os.environ.get("LLM_PROVIDER", "gemini").strip().lower()
    if name == "gemini":
        from app.providers.gemini import GeminiProvider

        return GeminiProvider()
    if name == "openrouter":
        from app.providers.openrouter import OpenRouterProvider

        return OpenRouterProvider()
    raise ValueError(f"LLM_PROVIDER desconocido: {name!r} (usa 'gemini' u 'openrouter')")
