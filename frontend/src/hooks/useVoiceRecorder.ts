import { useEffect, useRef, useState } from "react";

export interface VoiceRecording {
  id: string;
  buffer: ArrayBuffer;
  mimeType: string;
  createdAt: Date;
  duration: number;
}

export function useVoiceRecorder() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [volume, setVolume] = useState(0);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const SILENCE_DURATION = 1500;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  function startRecording(stream: MediaStream) {
    if (mediaRecorderRef.current?.state === "recording") {
      return;
    }

    const recorder = new MediaRecorder(stream);

    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recordingStartRef.current = Date.now();

    recorder.start();

    mediaRecorderRef.current = recorder;
    console.log("Recording started");
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state !== "recording") {
      return;
    }

    recorder.onstop = async () => {
      const blob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType,
      });

      const duration = recordingStartRef.current
        ? (Date.now() - recordingStartRef.current) / 1000
        : 0;

      const buffer = await blob.arrayBuffer();

      const recording: VoiceRecording = {
        id: crypto.randomUUID(),
        buffer,
        mimeType: recorder.mimeType,
        createdAt: new Date(),
        duration,
      };

      setRecordings((previous) => [...previous, recording]);

      audioChunksRef.current = [];
      recordingStartRef.current = null;

      console.log("Recording saved:", recording);
    };

    recorder.stop();
  }

  async function startListening() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const audioContext = new AudioContext();

      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);

      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 2048;

      source.connect(analyser);

      setAnalyser(analyser);

      const buffer = new Float32Array(analyser.fftSize);

      const threshold = 0.02;

      function analyze() {
        analyser.getFloatTimeDomainData(buffer);

        let sum = 0;

        for (const sample of buffer) {
          sum += sample * sample;
        }

        const rms = Math.sqrt(sum / buffer.length);
        const speaking = rms > threshold;

        const now = performance.now();

        if (speaking) {
          silenceStartRef.current = null;

          if (mediaRecorderRef.current?.state !== "recording") {
            startRecording(streamRef.current!);
          }
        } else {
          if (mediaRecorderRef.current?.state === "recording") {
            if (silenceStartRef.current === null) {
              silenceStartRef.current = now;
            }

            const silenceDuration = now - silenceStartRef.current;

            if (silenceDuration >= SILENCE_DURATION) {
              stopRecording();
              silenceStartRef.current = null;
            }
          }
        }

        setVolume(rms);
        setIsSpeaking(speaking);

        animationRef.current = requestAnimationFrame(analyze);
      }

      setIsListening(true);

      analyze();
    } catch (error) {
      console.error("Microphone error:", error);
    }
  }

  function stopListening() {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());

    audioContextRef.current?.close();

    audioContextRef.current = null;
    streamRef.current = null;

    setIsListening(false);
    setAnalyser(null);
    setIsSpeaking(false);
    setVolume(0);
  }

  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());

      audioContextRef.current?.close();
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    volume,
    analyser,
    recordings,
    startListening,
    stopListening,
  };
}