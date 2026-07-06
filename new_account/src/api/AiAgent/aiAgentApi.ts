import api, { ApiRequestConfig } from "../apiClient";

export interface AiChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiAgentContext {
  pathname?: string;
  page_title?: string;
  module?: string;
  user_role?: string;
  language?: "en" | "si" | "auto";
}

export interface AiAgentStatus {
  enabled: boolean;
  model: string;
  provider: string;
  speech_to_text?: boolean;
  whisper_model?: string;
}

export interface AiAgentTranscribeResponse {
  text: string;
  model: string;
  language: string;
}

export interface AiAgentChatResponse {
  reply: string;
  model: string;
}

export const getAiAgentStatus = async (): Promise<AiAgentStatus> => {
  const { data } = await api.get<AiAgentStatus>("ai-agent/status", {
    skipErrorDialog: true,
  } as ApiRequestConfig);
  return data;
};

export const postAiAgentChat = async (
  messages: AiChatMessage[],
  context: AiAgentContext
): Promise<AiAgentChatResponse> => {
  const { data } = await api.post<AiAgentChatResponse>(
    "ai-agent/chat",
    { messages, context },
    { skipErrorDialog: true } as ApiRequestConfig
  );
  return data;
};

export const postAiAgentTranscribe = async (
  audio: Blob,
  language: "si" | "en" | "auto" = "si"
): Promise<AiAgentTranscribeResponse> => {
  const formData = new FormData();
  formData.append("audio", audio, "recording.webm");
  formData.append("language", language);

  const { data } = await api.post<AiAgentTranscribeResponse>(
    "ai-agent/transcribe",
    formData,
    {
      skipErrorDialog: true,
      headers: { "Content-Type": "multipart/form-data" },
    } as ApiRequestConfig
  );
  return data;
};
