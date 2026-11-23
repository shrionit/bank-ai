import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi, type ChatMessage } from "./api/chatApi";
import ChatHeader from "./components/ChatHeader";
import ChatInputArea from "./components/ChatInputArea";
import MessageContainer from "./components/MessageContainer";
import { useVoicePlayer } from "./hooks/useVoicePlayer";
import { useVoiceRecorder, type VoiceRecording } from "./hooks/useVoiceRecorder";
import { voiceAI } from "./voice/voice.ai";

export default function App() {
  const {
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    recordings,
    analyser: recAnalyzer,
  } = useVoiceRecorder();

  const {
    play,
    stop,
    isPlaying,
    playingId,
    analyser: playerAnalyzer,
  } = useVoicePlayer();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | undefined>(() =>
    new URLSearchParams(window.location.search).get("sessionId") || undefined
  );
  const lastProcessedRecordingRef = useRef<string | null>(null);

  // Load initial dummy history from mock API layer
  useEffect(() => {
    chatApi.getInitialHistory().then((history) => {
      setMessages(history);
    });
  }, []);

  // Stop TTS if user speaks
  useEffect(() => {
    if (isSpeaking && isPlaying) {
      stop();
    }
  }, [isSpeaking, isPlaying, stop]);

  // Dispatch message to the chat API and receive a session-aware response
  const dispatchUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      type: "text",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const result = await chatApi.sendMessage(text.trim(), sessionId);
      setSessionId(result.sessionId);
      const url = new URL(window.location.href);
      url.searchParams.set("sessionId", result.sessionId);
      window.history.replaceState(window.history.state, "", url);
      await handlePlayTTS(result.message.text, result.message.id);
      setMessages((prev) => [...prev, result.message]);
    } catch (err) {
      console.error("Failed to send message via API:", err);
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId]);

  // Handle STT recording from Cartesia
  const convertToText = useCallback(
    async (recording: VoiceRecording) => {
      try {
        setIsProcessing(true);
        const text = await voiceAI.speechToText(recording.buffer);
        if (text && text.trim()) {
          await dispatchUserMessage(text.trim());
        }
      } catch (err) {
        console.error("Transcription error:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatchUserMessage]
  );

  useEffect(() => {
    if (recordings.length > 0) {
      const recent = recordings.at(-1);
      if (recent && recent.id !== lastProcessedRecordingRef.current) {
        lastProcessedRecordingRef.current = recent.id;
        convertToText(recent);
      }
    }
  }, [recordings, convertToText]);

  // Handle manual send from textarea
  const handleSend = () => {
    const textToSend = input.trim();
    if (!textToSend) return;
    setInput("");
    dispatchUserMessage(textToSend);
  };

  // Handle TTS play using Cartesia
  const handlePlayTTS = async (text: string, messageId: string) => {
    try {
      const audioBuffer = await voiceAI.textToSpeech(text);
      await play(messageId, audioBuffer);
    } catch (err) {
      console.error("TTS playback error:", err);
    }
  };

  const handleStopTTS = () => {
    stop();
  };

  const handleReset = async () => {
    stop();
    setSessionId(undefined);
    const url = new URL(window.location.href);
    url.searchParams.delete("sessionId");
    window.history.replaceState(window.history.state, "", url);

    const history = await chatApi.getInitialHistory();
    setMessages(history);
  };

  const currentAnalyser = isPlaying ? playerAnalyzer : recAnalyzer;

  return (
    <div className="flex h-screen w-full flex-col bg-[#1f1f1f] text-zinc-100 font-sans antialiased">
      <ChatHeader onReset={handleReset} />

      <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <MessageContainer
          messages={messages}
          playingId={playingId}
          onPlayTTS={handlePlayTTS}
          onStopTTS={handleStopTTS}
          isProcessing={isProcessing}
        />
      </main>

      <footer className="shrink-0">
        <ChatInputArea
          input={input}
          setInput={setInput}
          onSend={handleSend}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isPlaying={isPlaying}
          onStartListening={startListening}
          onStopListening={stopListening}
          analyser={currentAnalyser}
          disabled={isProcessing}
        />
      </footer>
    </div>
  );
}
