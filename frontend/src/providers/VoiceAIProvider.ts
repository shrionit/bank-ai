
export interface SpeechToTextOptions {
  language?: string;
  filename?: string;
}

export interface TextToSpeechOptions {
  voiceId?: string;
  model?: string;
  format?: "wav" | "mp3";
  sampleRate?: number;
}

export interface VoiceAIProvider {
  speechToText(
    audio: ArrayBuffer,
    options?: SpeechToTextOptions
  ): Promise<string>;

  textToSpeech(
    text: string,
    options?: TextToSpeechOptions
  ): Promise<ArrayBuffer>;
}
