// Convierte el audio capturado (Float32, [-1,1]) a PCM16 little-endian y lo
// emite en chunks hacia el hilo principal para enviarlo por WebSocket.
const CHUNK_SAMPLES = 2048;

class PCM16Worklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        this._buffer.push(channel[i]);
      }
      while (this._buffer.length >= CHUNK_SAMPLES) {
        const slice = this._buffer.splice(0, CHUNK_SAMPLES);
        const pcm16 = new Int16Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          const sample = Math.max(-1, Math.min(1, slice[i]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
      }
    }
    return true;
  }
}

registerProcessor("pcm16-worklet", PCM16Worklet);
