import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import StopIcon from "@mui/icons-material/Stop";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AiChatMessage,
  getAiAgentStatus,
  postAiAgentChat,
} from "../../api/AiAgent/aiAgentApi";
import { getHelpForPath } from "../../help/getHelpForPath";
import { getPageMetaFromPath } from "../../utils/pageMeta";
import useCurrentUser from "../../hooks/useCurrentUser";
import { useAiVoiceAgent } from "../../hooks/useAiVoiceAgent";

const STARTER_PROMPTS = [
  "What should I do now on this screen?",
  "How do I run my business using this ERP?",
  "Explain the sales flow step by step",
  "How do I set up a new company?",
  "What business ideas can grow my revenue?",
];

const STARTER_PROMPTS_SI = [
  "මේ screen එකේ දැන් කරන්න ඕනේ මොනවාද?",
  "ERP එකෙන් business එක run කරන්නේ කොහොමද?",
  "Sales flow එක step by step කියන්න",
  "නව company එකක් setup කරන්නේ කොහොමද?",
  "Revenue වැඩි කරන්න business ideas මොනවාද?",
];

type ChatLanguage = "auto" | "en" | "si";

function MessageBubble({
  message,
  onSpeak,
  canSpeak,
}: {
  message: AiChatMessage;
  onSpeak?: () => void;
  canSpeak?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent={isUser ? "flex-end" : "flex-start"}
      alignItems="flex-start"
    >
      {!isUser && (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: "#667eea",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <SmartToyOutlinedIcon sx={{ fontSize: 16 }} />
        </Box>
      )}
      <Box sx={{ maxWidth: "85%" }}>
        <Box
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: 2,
            bgcolor: isUser ? "#1976d2" : "#f5f5f5",
            color: isUser ? "#fff" : "text.primary",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <Typography variant="body2" lineHeight={1.55}>
            {message.content}
          </Typography>
        </Box>
        {!isUser && canSpeak && onSpeak && (
          <IconButton size="small" onClick={onSpeak} sx={{ mt: 0.25, ml: -0.5 }} aria-label="Read reply aloud">
            <VolumeUpIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
      {isUser && (
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: "#e3f2fd",
            color: "#1976d2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PersonOutlineIcon sx={{ fontSize: 16 }} />
        </Box>
      )}
    </Stack>
  );
}

export default function AiAgentChatPanel() {
  const { pathname } = useLocation();
  const { user } = useCurrentUser();
  const pageMeta = useMemo(() => getPageMetaFromPath(pathname), [pathname]);
  const currentHelp = useMemo(() => getHelpForPath(pathname), [pathname]);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<ChatLanguage>("si");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["ai-agent-status"],
    queryFn: getAiAgentStatus,
    staleTime: 60_000,
  });

  const {
    speechSupported,
    ttsSupported,
    secureContext,
    isListening,
    isTranscribing,
    isSpeaking,
    interimTranscript,
    listeningLang,
    voiceReplyEnabled,
    setVoiceReplyEnabled,
    voiceError,
    setVoiceError,
    speak,
    stopSpeaking,
    toggleListening,
  } = useAiVoiceAgent(language, Boolean(status?.speech_to_text));

  const context = useMemo(
    () => ({
      pathname,
      page_title: currentHelp.title || pageMeta.title,
      module: currentHelp.module,
      user_role: user?.role ?? undefined,
      language,
    }),
    [pathname, currentHelp, pageMeta.title, user?.role, language]
  );

  const starterPrompts = language === "si" ? STARTER_PROMPTS_SI : STARTER_PROMPTS;
  const languageLabel =
    language === "si" ? "සිංහල" : language === "en" ? "English" : "Auto";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!status?.enabled) {
      setError("AI agent is not configured. Add AI_API_KEY to backend .env and restart.");
      return;
    }

    setError(null);
    setInput("");

    const userMessage: AiChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const { reply } = await postAiAgentChat(nextMessages, context);
      setMessages([...nextMessages, { role: "assistant", content: reply }]);
      if (voiceReplyEnabled && ttsSupported) {
        speak(reply);
      }
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reach AI agent.";
      setError(msg);
      setMessages(messages);
      setInput(trimmed);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (transcript: string) => {
    setInput(transcript);
    void sendMessage(transcript);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Stack sx={{ height: "100%", minHeight: 420 }} spacing={1.5}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <SmartToyOutlinedIcon />
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                AI Agent
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                ERP guide — text & voice (English / Sinhala)
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            {ttsSupported && (
              <IconButton
                size="small"
                onClick={() => setVoiceReplyEnabled((v) => !v)}
                sx={{ color: "#fff" }}
                title={voiceReplyEnabled ? "Voice replies on" : "Voice replies off"}
              >
                {voiceReplyEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
              </IconButton>
            )}
            {isSpeaking && (
              <IconButton size="small" onClick={stopSpeaking} sx={{ color: "#fff" }} title="Stop speaking">
                <StopIcon fontSize="small" />
              </IconButton>
            )}
            <IconButton size="small" onClick={() => refetchStatus()} sx={{ color: "#fff" }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
          <Chip
            label={currentHelp.module}
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", height: 22 }}
          />
          {isListening && (
            <Chip
              label={`${listeningLang} — ${language === "si" ? "කතා කරන්න, නවතන්න mic click" : "speaking… click mic to send"}`}
              size="small"
              sx={{ bgcolor: "rgba(244,67,54,0.55)", color: "#fff", height: 22 }}
            />
          )}
          {!isListening && (language === "si" || language === "auto") && status?.speech_to_text && (
            <Chip
              label="Whisper සිංහල"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", height: 22 }}
            />
          )}
          {status?.enabled && (
            <Chip
              label={status.model}
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", height: 22 }}
            />
          )}
          <Chip
            label={languageLabel}
            size="small"
            clickable
            onClick={() =>
              setLanguage((prev) => (prev === "auto" ? "si" : prev === "si" ? "en" : "auto"))
            }
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", height: 22 }}
          />
        </Stack>
      </Box>

      {voiceError && (
        <Alert severity="warning" onClose={() => setVoiceError(null)} sx={{ py: 0.5 }}>
          {voiceError}
        </Alert>
      )}

      {!secureContext && !statusLoading && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          Voice mic/speaker needs <strong>HTTPS</strong> or <strong>localhost</strong>.
          Plain http://192.168.x.x address eken voice work වෙන්නේ නෑ — localhost:5173 use කරන්න.
        </Alert>
      )}

      {!speechSupported && secureContext && !statusLoading && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Voice input works best in Chrome or Edge with internet.
        </Alert>
      )}

      {statusLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}

      {!statusLoading && !status?.enabled && (
        <Alert severity="warning" sx={{ py: 0.5 }}>
          AI agent is not configured. Set <strong>AI_API_KEY</strong> in{" "}
          <code>backend/.env</code> (see <code>AI_API_URL</code>, <code>AI_MODEL</code>) and restart{" "}
          <code>php artisan serve</code>.
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ py: 0.5 }}>
          {error}
          {(error.includes("quota") || error.includes("429")) && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Free fix: get a Groq key at console.groq.com, then in backend/.env set
              AI_API_URL=https://api.groq.com/openai/v1, AI_MODEL=llama-3.3-70b-versatile
            </Typography>
          )}
        </Alert>
      )}

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: "auto",
          minHeight: 200,
          maxHeight: "calc(100vh - 320px)",
          pr: 0.5,
        }}
      >
        {messages.length === 0 ? (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {language === "si" || language === "auto"
                ? "සිංහලෙන් කතා කරන්න: mic click → කතා කරන්න → නවතන්න mic click. AI සිංහලෙන් reply දෙනවා. ඔබ "
                : "Ask by text or voice. You are on "}
              <strong>{currentHelp.title}</strong>
              {language === "si" ? " page එකේ." : "."}
            </Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {language === "si" ? "Try කරන්න:" : "Try asking:"}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {starterPrompts.map((prompt) => (
                <Chip
                  key={prompt}
                  label={prompt}
                  size="small"
                  clickable
                  onClick={() => sendMessage(prompt)}
                  sx={{ maxWidth: "100%", height: "auto", py: 0.5, "& .MuiChip-label": { whiteSpace: "normal" } }}
                />
              ))}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {messages.map((msg, i) => (
              <MessageBubble
                key={`${msg.role}-${i}`}
                message={msg}
                canSpeak={ttsSupported}
                onSpeak={msg.role === "assistant" ? () => speak(msg.content) : undefined}
              />
            ))}
            {loading && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="caption" color="text.secondary">
                  {language === "si" ? "AI සිතමින්…" : "AI is thinking…"}
                </Typography>
              </Stack>
            )}
            {isTranscribing && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="caption" color="text.secondary">
                  {language === "si" ? "සිංහල හඬ තේරුම් කරමින්…" : "Transcribing…"}
                </Typography>
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Stack direction="row" spacing={1} alignItems="flex-end">
        <IconButton
          onClick={() => toggleListening(handleVoiceInput)}
          disabled={loading || !status?.enabled || !secureContext || isTranscribing}
          aria-label={isListening ? "Stop listening" : "Speak your question"}
          title={
            !secureContext
              ? "Voice needs HTTPS or localhost"
              : isListening
                ? language === "si"
                  ? "නවතන්න — message එවන්න mic click"
                  : "Click mic to send"
                : language === "si"
                  ? "සිංහලෙන් කතා කරන්න"
                  : "Click and speak"
          }
          sx={{
            bgcolor: isListening ? "#d32f2f" : "#f5f5f5",
            color: isListening ? "#fff" : secureContext ? "#1976d2" : "#999",
            flexShrink: 0,
            "&:hover": { bgcolor: isListening ? "#c62828" : "#eeeeee" },
            "&.Mui-disabled": { bgcolor: "#eee", color: "#bbb" },
          }}
        >
          {isListening ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder={
            isListening
              ? language === "si" || language === "auto"
                ? "සිංහලෙන් කතා කරන්න… (mic නවතන්න message යවයි)"
                : "Speak now… (click mic to send)"
              : language === "si"
                ? "සිංහලෙන් type කරන්න හෝ mic click කර කතා කරන්න"
                : language === "en"
                  ? "Type or click mic to speak in English"
                  : "සිංහල/English — type හෝ mic"
          }
          value={isListening && interimTranscript ? interimTranscript : input}
          onChange={(e) => {
            if (!isListening) setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={(loading || !status?.enabled) && !isListening}
        />
        <IconButton
          color="primary"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim() || !status?.enabled}
          sx={{ bgcolor: "#1976d2", color: "#fff", "&:hover": { bgcolor: "#1565c0" }, "&.Mui-disabled": { bgcolor: "#ccc" } }}
        >
          <SendIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}
