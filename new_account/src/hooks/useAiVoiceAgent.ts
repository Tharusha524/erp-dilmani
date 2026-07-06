import { useCallback, useEffect, useRef, useState } from "react";
import { postAiAgentTranscribe } from "../api/AiAgent/aiAgentApi";

type VoiceLanguage = "auto" | "en" | "si";

function canUseVoiceApis(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

function resolveWhisperLanguage(language: VoiceLanguage): "si" | "en" | "auto" {
  if (language === "en") return "en";
  return "si";
}

function resolveTtsLang(text: string, language: VoiceLanguage): string {
  if (language === "en") return "en-US";
  if (language === "si") return "si-LK";
  return /[\u0D80-\u0DFF]/.test(text) ? "si-LK" : "en-US";
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const langLower = lang.toLowerCase();
  const langBase = langLower.split("-")[0];

  const ranked = voices
    .map((voice) => {
      const vLang = voice.lang.toLowerCase();
      const name = `${voice.name} ${voice.localService ? "local" : "remote"}`.toLowerCase();
      let score = 0;
      if (vLang === langLower) score += 100;
      if (vLang.startsWith(langBase)) score += 50;
      if (name.includes("sinhala") || name.includes("si-lk")) score += 80;
      return { voice, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score ? ranked[0].voice : voices[0];
}

function pickRecorderMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "audio/webm";
}

async function ensureMicrophoneAccess(language: VoiceLanguage): Promise<string | null> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return language === "si"
      ? "Microphone support නෑ. Chrome/Edge + localhost use කරන්න."
      : "Microphone not available.";
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return null;
  } catch {
    return language === "si"
      ? "Microphone allow කරන්න. Address bar mic icon → Allow."
      : "Microphone permission denied.";
  }
}

export function useAiVoiceAgent(language: VoiceLanguage, cloudSpeechEnabled = false) {
  const [speechSupported, setSpeechSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [secureContext, setSecureContext] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    const secure = canUseVoiceApis();
    const hasMic =
      secure &&
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== "undefined";
    const hasTts = typeof window !== "undefined" && "speechSynthesis" in window;

    setSecureContext(secure);
    setSpeechSupported(hasMic && (cloudSpeechEnabled || hasMic));
    setTtsSupported(hasTts && secure);

    if (hasTts && secure) {
      const loadVoices = () => window.speechSynthesis.getVoices();
      loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    }
  }, [cloudSpeechEnabled]);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !text.trim()) return;
      stopSpeaking();

      const runSpeak = () => {
        const lang = resolveTtsLang(text, language);
        const utterance = new SpeechSynthesisUtterance(text.trim());
        utterance.lang = lang;
        const voice = pickVoice(lang);
        if (voice) utterance.voice = voice;
        utterance.rate = lang.startsWith("si") ? 0.88 : 0.92;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        setTimeout(runSpeak, 300);
      } else {
        setTimeout(runSpeak, 50);
      }
    },
    [language, stopSpeaking, ttsSupported]
  );

  const transcribeRecording = useCallback(
    async (blob: Blob) => {
      setIsTranscribing(true);
      setInterimTranscript(language === "si" ? "සිංහල හඬ තේරුම් කරමින්…" : "Transcribing speech…");

      try {
        const result = await postAiAgentTranscribe(blob, resolveWhisperLanguage(language));
        setInterimTranscript("");
        onTranscriptRef.current(result.text);
      } catch (err: any) {
        const msg =
          err?.data?.message ||
          err?.response?.data?.message ||
          err?.message ||
          (language === "si"
            ? "සිංහල voice තේරුම් කරන්න බැරි වුණා."
            : "Could not transcribe speech.");
        setVoiceError(msg);
        setInterimTranscript("");
      } finally {
        setIsTranscribing(false);
      }
    },
    [language]
  );

  const stopRecording = useCallback(
    async (send: boolean) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsListening(false);
        cleanupStream();
        return;
      }

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      setIsListening(false);

      const mimeType = recorder.mimeType || pickRecorderMimeType();
      const blob = new Blob(chunksRef.current, { type: mimeType });
      cleanupStream();

      if (send && blob.size > 0) {
        if (cloudSpeechEnabled) {
          await transcribeRecording(blob);
        }
      } else {
        setInterimTranscript("");
      }
    },
    [cleanupStream, cloudSpeechEnabled, transcribeRecording]
  );

  const startRecording = useCallback(
    async (onTranscript: (text: string) => void) => {
      if (!canUseVoiceApis()) {
        setVoiceError(
          language === "si"
            ? "Voice එකට localhost හෝ HTTPS ඕනේ. http://localhost:5173 use කරන්න."
            : "Voice needs localhost or HTTPS."
        );
        return;
      }

      if (!cloudSpeechEnabled) {
        setVoiceError(
          language === "si"
            ? "Cloud Sinhala voice setup නෑ. backend .env AI_API_KEY (Groq) check කර restart කරන්න."
            : "Cloud speech not configured."
        );
        return;
      }

      const micError = await ensureMicrophoneAccess(language);
      if (micError) {
        setVoiceError(micError);
        return;
      }

      setVoiceError(null);
      setInterimTranscript("");
      onTranscriptRef.current = onTranscript;
      stopSpeaking();
      cleanupStream();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];

        const mimeType = pickRecorderMimeType();
        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.start(250);
        setIsListening(true);
        setInterimTranscript(
          language === "si"
            ? "සිංහලෙන් කතා කරන්න… (mic නවතන්න message යවයි)"
            : "Speak now… (click mic to send)"
        );
      } catch {
        cleanupStream();
        setVoiceError(
          language === "si" ? "Mic start වෙන්න බැරි වුණා." : "Could not start microphone."
        );
        setIsListening(false);
      }
    },
    [cleanupStream, cloudSpeechEnabled, language, stopSpeaking]
  );

  const toggleListening = useCallback(
    (onTranscript: (text: string) => void) => {
      if (isTranscribing) return;
      if (isListening) {
        void stopRecording(true);
        return;
      }
      void startRecording(onTranscript);
    },
    [isListening, isTranscribing, startRecording, stopRecording]
  );

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      cleanupStream();
      stopSpeaking();
    };
  }, [cleanupStream, stopSpeaking]);

  return {
    speechSupported,
    ttsSupported,
    secureContext,
    cloudSpeechEnabled,
    isListening,
    isTranscribing,
    isSpeaking,
    interimTranscript,
    listeningLang: cloudSpeechEnabled ? "Whisper si" : "si-LK",
    voiceReplyEnabled,
    setVoiceReplyEnabled,
    voiceError,
    setVoiceError,
    speak,
    stopSpeaking,
    toggleListening,
  };
}
