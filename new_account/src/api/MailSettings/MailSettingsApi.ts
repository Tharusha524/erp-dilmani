import api from "../apiClient";

export type MailSettings = {
  mailEnabled: boolean;
  mailHost: string;
  mailPort: number;
  mailScheme: string;
  mailUsername: string;
  passwordConfigured: boolean;
  mailFromAddress: string;
  mailFromName: string;
  deliverable: boolean;
};

export type UpdateMailSettingsPayload = {
  mailEnabled: boolean;
  mailHost: string;
  mailPort: number;
  mailScheme: string;
  mailUsername: string;
  mailPassword?: string;
  mailFromAddress: string;
  mailFromName: string;
};

export async function getMailSettings(): Promise<MailSettings> {
  const response = await api.get<MailSettings>("/mail-settings");
  return response.data;
}

export async function updateMailSettings(
  payload: UpdateMailSettingsPayload
): Promise<{ message: string; settings: MailSettings }> {
  const response = await api.put<{ message: string; settings: MailSettings }>(
    "/mail-settings",
    payload
  );
  return response.data;
}

export async function sendMailSettingsTest(to: string): Promise<{ message: string; to: string }> {
  const response = await api.post<{ message: string; to: string }>("/mail-settings/test", { to });
  return response.data;
}
