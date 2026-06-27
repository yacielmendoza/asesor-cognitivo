// getUserMedia + AudioWorklet → PCM16 16kHz mono, en chunks listos para WebSocket.
export async function startAudioCapture(onChunk) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
  });

  const audioContext = new AudioContext({ sampleRate: 16000 });
  await audioContext.audioWorklet.addModule("/audio-worklet.js");

  const source = audioContext.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(audioContext, "pcm16-worklet");
  node.port.onmessage = (event) => onChunk(event.data);
  source.connect(node);

  return {
    stop() {
      node.port.onmessage = null;
      source.disconnect();
      node.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close();
    },
  };
}
