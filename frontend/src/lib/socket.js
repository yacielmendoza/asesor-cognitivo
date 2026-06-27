const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/session";

export function connectSession({ onMessage, onOpen, onClose } = {}) {
  const socket = new WebSocket(WS_URL);
  socket.binaryType = "arraybuffer";

  socket.onopen = () => onOpen?.();
  socket.onclose = () => onClose?.();
  socket.onmessage = (event) => {
    if (typeof event.data !== "string") return;
    try {
      onMessage?.(JSON.parse(event.data));
    } catch {
      // ignora mensajes no-JSON
    }
  };

  return {
    socket,
    sendAudioChunk(buffer) {
      if (socket.readyState === WebSocket.OPEN) socket.send(buffer);
    },
    sendTranscript({ speaker, texto, esFinal }) {
      if (socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ type: "transcript", speaker, texto, es_final: esFinal }));
    },
    close() {
      socket.close();
    },
  };
}
