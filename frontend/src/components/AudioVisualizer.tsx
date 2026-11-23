import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  /** Pass the analyser from useVoiceRecorder or useVoicePlayer. Bars only draw when set. */
  analyser: AnalyserNode | null;
  barCount?: number;
  width?: number;
  height?: number;
  className?: string;
}

const VOICE_MAX_HZ = 4000;

export default function AudioVisualizer({
  analyser,
  barCount = 32,
  width = 240,
  height = 48,
  className,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const slot = width / barCount;
    const barWidth = Math.max(2, slot * 0.6);
    const color = getComputedStyle(canvas).color;

    ctx.clearRect(0, 0, width, height);

    // Baseline: a row of dots when there is no audio source
    if (!analyser) {
      ctx.fillStyle = color;
      for (let i = 0; i < barCount; i++) {
        ctx.beginPath();
        ctx.arc(i * slot + slot / 2, height / 2, barWidth / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }

    // Only the voice range of the spectrum is interesting
    const binCount = analyser.frequencyBinCount;
    const nyquist = analyser.context.sampleRate / 2;
    const usableBins = Math.max(
      barCount,
      Math.floor((VOICE_MAX_HZ / nyquist) * binCount)
    );
    const binsPerBar = usableBins / barCount;

    const data = new Uint8Array(binCount);

    let frame = 0;

    function draw() {
      analyser!.getByteFrequencyData(data);
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = color;

      for (let i = 0; i < barCount; i++) {
        const start = Math.floor(i * binsPerBar);
        const end = Math.max(start + 1, Math.floor((i + 1) * binsPerBar));

        let sum = 0;
        for (let j = start; j < end; j++) sum += data[j];

        const level = sum / (end - start) / 255; // 0..1
        const barHeight = Math.max(barWidth, level * height);

        const x = i * slot + (slot - barWidth) / 2;
        const y = (height - barHeight) / 2;

        ctx!.beginPath();
        ctx!.roundRect(x, y, barWidth, barHeight, barWidth / 2);
        ctx!.fill();
      }

      frame = requestAnimationFrame(draw);
    }

    draw();

    return () => cancelAnimationFrame(frame);
  }, [analyser, barCount, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width, height, display: "block" }}
      aria-hidden="true"
    />
  );
}