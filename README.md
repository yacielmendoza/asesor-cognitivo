# Asesor Cognitivo Personal

Copiloto silencioso que escucha una llamada en tiempo real y muestra alertas tácticas en
pantalla (detección de manipulación, sugerencias de respuesta, cálculos de negociación en
vivo). **Nunca habla por el usuario**: solo observa y sugiere.

## Principios

- Solo observa y sugiere; nunca emite voz ni actúa en nombre del usuario.
- Stateless por defecto: no se persiste audio ni transcripciones.
- Cambiar de proveedor LLM (Gemini ↔ OpenRouter) es solo una variable de entorno.

## Arquitectura

- `backend/` — FastAPI. Expone `ws://localhost:8000/ws/session`. Recibe transcripciones
  (texto, generadas en el navegador con Web Speech API) y chunks de audio PCM16, clasifica
  el escenario de la llamada con heurísticas y consulta a un `LLMProvider` (Gemini u
  OpenRouter) para generar tarjetas de alerta validadas con Pydantic.
- `frontend/` — React + Vite. Captura audio del micrófono (`getUserMedia` + `AudioWorklet`
  → PCM16 16kHz mono) y lo envía por WebSocket; transcribe en vivo con la Web Speech API del
  navegador; renderiza el HUD (barra centinela, cinta de transcripción, stream de alertas)
  replicando `prototipo/index.html`.

## Cómo correrlo

1. Copia `.env.example` a `.env` y completa al menos una API key:

   ```bash
   cp .env.example .env
   ```

   - `LLM_PROVIDER=gemini` + `GEMINI_API_KEY=...` (obtenla en https://aistudio.google.com/app/apikey), o
   - `LLM_PROVIDER=openrouter` + `OPENROUTER_API_KEY=...` (obtenla en https://openrouter.ai/keys)

2. Levanta todo:

   ```bash
   docker compose up --build
   ```

3. Abre `http://localhost:5173` en **Chrome o Edge** (la Web Speech API no funciona en
   Firefox/Safari), concede permiso de micrófono y pulsa "▶ Iniciar".

### Desarrollo local sin Docker

```bash
# backend
cd backend && python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
LLM_PROVIDER=gemini GEMINI_API_KEY=xxx uvicorn app.main:app --reload

# frontend (otra terminal)
cd frontend && npm install && npm run dev
```

## Notas del MVP

- La transcripción se hace en el navegador (Web Speech API); el backend no transcribe audio.
  El audio PCM16 enviado por WebSocket se descarta tras contarlo (no se persiste).
- El botón "🎙️ Su voz / Tu voz" en el pie marca a quién atribuir la próxima frase transcrita,
  ya que el micrófono capta ambas voces si la llamada está en altavoz.
