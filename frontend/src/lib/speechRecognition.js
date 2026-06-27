// Transcripción en vivo vía Web Speech API del navegador (Chrome/Edge).
// El backend nunca recibe audio crudo para STT: solo texto ya transcrito,
// manteniendo el diseño stateless y simple para el MVP.
export function isSpeechRecognitionSupported() {
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function createSpeechRecognizer({ lang = "es-ES", onResult, onError } = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognizer = new SpeechRecognition();
  recognizer.lang = lang;
  recognizer.continuous = true;
  recognizer.interimResults = true;

  recognizer.onresult = (event) => {
    const result = event.results[event.results.length - 1];
    const texto = result[0].transcript.trim();
    if (!texto) return;
    onResult({ texto, esFinal: result.isFinal });
  };

  recognizer.onerror = (event) => {
    // "no-speech" ocurre constantemente en silencio normal; no es un error real.
    if (event.error === "no-speech") return;
    onError?.(event.error);
  };

  recognizer.onend = () => {
    // Algunos navegadores cierran la sesión de reconocimiento tras un silencio;
    // se reinicia automáticamente mientras la captura siga activa.
    if (recognizer._shouldRestart) {
      recognizer.start();
    }
  };

  return {
    start() {
      recognizer._shouldRestart = true;
      recognizer.start();
    },
    stop() {
      recognizer._shouldRestart = false;
      recognizer.stop();
    },
  };
}
