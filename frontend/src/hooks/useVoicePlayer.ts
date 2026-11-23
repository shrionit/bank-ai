import { useEffect, useRef, useState } from "react";

export function useVoicePlayer() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  // Guards against a slow decode finishing after a newer play/stop call
  const playTokenRef = useRef(0);

  function stop() {
    playTokenRef.current++;

    const source = sourceRef.current;
    sourceRef.current = null;

    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
      source.disconnect();
    }

    setPlayingId(null);
    setAnalyser(null);
  }

  async function play(id: string, buffer: ArrayBuffer) {
    stop();
    const token = playTokenRef.current;

    try {
      const audioContext = (audioContextRef.current ??= new AudioContext());

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      // decodeAudioData detaches the buffer it is given, so pass a copy
      const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));

      if (token !== playTokenRef.current) return;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;

      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;

      source.connect(analyserNode);
      analyserNode.connect(audioContext.destination);

      source.onended = () => {
        if (sourceRef.current !== source) return;
        sourceRef.current = null;
        source.disconnect();
        setPlayingId(null);
        setAnalyser(null);
      };

      sourceRef.current = source;
      setAnalyser(analyserNode);
      setPlayingId(id);

      source.start();
    } catch (error) {
      console.error("Playback error:", error);
      if (token === playTokenRef.current) {
        setPlayingId(null);
        setAnalyser(null);
      }
    }
  }

  useEffect(() => {
    return () => {
      playTokenRef.current++;
      sourceRef.current?.stop();
      audioContextRef.current?.close();
      sourceRef.current = null;
      audioContextRef.current = null;
    };
  }, []);

  return {
    playingId,
    isPlaying: playingId !== null,
    analyser,
    play,
    stop,
  };
}