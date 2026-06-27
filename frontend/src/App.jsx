import { useCallback, useEffect, useRef, useState } from "react";
import Sentinel from "./components/Sentinel.jsx";
import Ribbon from "./components/Ribbon.jsx";
import Legend from "./components/Legend.jsx";
import AlertStream from "./components/AlertStream.jsx";
import { createSpeechRecognizer, isSpeechRecognitionSupported } from "./lib/speechRecognition.js";
import { connectSession } from "./lib/socket.js";

const MAX_VISIBLE_ALERTS = 6;

export default function App() {
  const [scenario, setScenario] = useState("");
  const [ribbon, setRibbon] = useState({ who: "Agente", said: "" });
  const [alerts, setAlerts] = useState([]);
  const [live, setLive] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [speakerOverride, setSpeakerOverride] = useState("agente");
  const [error, setError] = useState("");

  const sessionRef = useRef(null);
  const recognizerRef = useRef(null);
  const speakerRef = useRef(speakerOverride);
  speakerRef.current = speakerOverride;

  const triggerFlash = useCallback(() => {
    setFlashOn(false);
    requestAnimationFrame(() => {
      setFlashOn(true);
      setTimeout(() => setFlashOn(false), 1400);
    });
  }, []);

  const handleMessage = useCallback(
    (event) => {
      if (event.type === "scenario") {
        setScenario(event.etiqueta);
      } else if (event.type === "ribbon") {
        setRibbon({ who: event.who, said: event.said });
      } else if (event.type === "alert") {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setAlerts((prev) => {
          let next = [...prev, { id, card: event.card, leaving: false }];
          if (next.length > MAX_VISIBLE_ALERTS) {
            const idx = next.findIndex((a) => a.card.prioridad !== "alta");
            if (idx !== -1) next[idx] = { ...next[idx], leaving: true };
          }
          return next;
        });
        if (event.card.prioridad === "alta") triggerFlash();
      }
    },
    [triggerFlash]
  );

  const dismiss = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const stop = useCallback(() => {
    recognizerRef.current?.stop();
    sessionRef.current?.close();
    recognizerRef.current = null;
    sessionRef.current = null;
    setLive(false);
  }, []);

  const start = useCallback(async () => {
    setError("");
    if (!isSpeechRecognitionSupported()) {
      setError("Este navegador no soporta reconocimiento de voz (usa Chrome o Edge).");
      return;
    }
    try {
      const session = connectSession({
        onMessage: handleMessage,
        onClose: () => setLive(false),
      });
      sessionRef.current = session;

      recognizerRef.current = createSpeechRecognizer({
        onResult: ({ texto, esFinal }) => {
          setRibbon({ who: speakerRef.current === "yo" ? "Tú" : "Agente", said: texto });
          session.sendTranscript({ speaker: speakerRef.current, texto, esFinal });
        },
        onError: (code) => {
          const messages = {
            "not-allowed": "Permiso de micrófono denegado.",
            "audio-capture": "No se detecta micrófono.",
            network: "Error de red en el reconocimiento de voz.",
          };
          setError(messages[code] || `Error de reconocimiento de voz: ${code}`);
        },
      });
      recognizerRef.current.start();

      setLive(true);
    } catch (err) {
      setError("No se pudo acceder al micrófono: " + err.message);
      stop();
    }
  }, [handleMessage, stop]);

  useEffect(() => () => stop(), [stop]);

  const device = useRef(null);

  return (
    <main className={`device${flashOn ? " alert-flash" : ""}`} ref={device} aria-label="Asesor Cognitivo en vivo">
      <Sentinel scenario={scenario} live={live} />
      <Ribbon who={ribbon.who} said={ribbon.said} />
      <Legend />
      <AlertStream alerts={alerts} onDismiss={dismiss} />
      <footer className="foot">
        <span className="hint">
          El asesor solo observa y sugiere.
          <br />
          Tú llevas la conversación.
          {error && (
            <>
              <br />
              <span style={{ color: "var(--coral-dim)" }}>{error}</span>
            </>
          )}
        </span>
        <button
          type="button"
          className={`toggle-btn${speakerOverride === "yo" ? " active" : ""}`}
          onClick={() => setSpeakerOverride((s) => (s === "yo" ? "agente" : "yo"))}
          aria-pressed={speakerOverride === "yo"}
        >
          {speakerOverride === "yo" ? "🎙️ Tu voz" : "🎙️ Su voz"}
        </button>
        <button type="button" className="replay" onClick={live ? stop : start}>
          {live ? "■ Detener" : "▶ Iniciar"}
        </button>
      </footer>
    </main>
  );
}
