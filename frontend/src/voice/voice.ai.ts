
import { CartesiaVoiceAIProvider } from "../providers/CartesiaVoiceAIProvider";

export const voiceAI = new CartesiaVoiceAIProvider({
  apiKey: import.meta.env.VITE_CARTESIA_API_KEY,
  voiceId: import.meta.env.VITE_CARTESIA_VOICE_ID,
});