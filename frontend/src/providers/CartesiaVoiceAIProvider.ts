
import Cartesia from "@cartesia/cartesia-js";

import type {
  VoiceAIProvider,
  SpeechToTextOptions,
  TextToSpeechOptions,
} from "./VoiceAIProvider";

interface CartesiaVoiceAIConfig {
  apiKey: string;
  voiceId: string;
  sttModel?: string;
  ttsModel?: string;
}

export class CartesiaVoiceAIProvider implements VoiceAIProvider {
  private client: Cartesia;

  private readonly sttModel: string;
  private readonly ttsModel: string;
  private readonly voiceId: string;

  constructor(config: CartesiaVoiceAIConfig) {
    this.client = new Cartesia({
      apiKey: config.apiKey,
    });

    this.sttModel = config.sttModel ?? "ink-whisper";
    this.ttsModel = config.ttsModel ?? "sonic-3.6";
    this.voiceId = config.voiceId;
  }

  async speechToText(
    audio: ArrayBuffer,
    options: SpeechToTextOptions = {}
  ): Promise<string> {
    const filename = options.filename ?? "recording.wav";

    const mimeType = filename.endsWith(".mp3")
      ? "audio/mpeg"
      : filename.endsWith(".webm")
        ? "audio/webm"
        : "audio/wav";

    const file = new File([audio], filename, {
      type: mimeType,
    });

    const response = await this.client.stt.transcribe({
      model: this.sttModel,
      file,
      language: options.language ?? "en",
    });

    return response.text;
  }

  async textToSpeech(
    text: string,
    options: TextToSpeechOptions = {}
  ): Promise<ArrayBuffer> {
    if (!text.trim()) {
      throw new Error("Text cannot be empty");
    }

    const format = options?.format ?? "wav";

    const response = await this.client.tts.generate({
      model_id: options?.model ?? this.ttsModel,
      transcript: text,

      // SDK v4 accepts a voice ID directly.
      voice: options?.voiceId ?? this.voiceId,

      output_format:
        format === "wav"
          ? {
              container: "wav" as const,
              encoding: "pcm_s16le" as const,
              sample_rate: (options?.sampleRate ?? 44100) as 8000 | 16000 | 22050 | 24000 | 44100 | 48000,
            }
          : {
              container: "mp3" as const,
              sample_rate: (options?.sampleRate ?? 44100) as 8000 | 16000 | 22050 | 24000 | 44100 | 48000,
              bit_rate: 128000,
            },

      language: "en",
    });

    return await response.arrayBuffer();
  }
}
