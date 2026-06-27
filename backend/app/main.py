import logging
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.session import Session

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("asesor.main")

app = FastAPI(title="Asesor Cognitivo Personal — Backend")

allowed_origins = os.environ.get("CORS_ALLOW_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.websocket("/ws/session")
async def ws_session(websocket: WebSocket) -> None:
    await websocket.accept()
    session = Session(websocket)
    try:
        while True:
            message = await websocket.receive()
            if message.get("type") == "websocket.disconnect":
                break
            data_bytes = message.get("bytes")
            data_text = message.get("text")
            try:
                if data_bytes is not None:
                    await session.handle_audio_chunk(data_bytes)
                elif data_text is not None:
                    await session.handle_text_message(data_text)
            except Exception:
                # Nunca tirar la sesión completa por un mensaje problemático:
                # se registra y se sigue escuchando.
                logger.exception("Error procesando mensaje de la sesión")
    except WebSocketDisconnect:
        pass
