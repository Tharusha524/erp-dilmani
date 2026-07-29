import api from "../apiClient";

export type WorkOrderButtonKey = "finish" | "verify" | "reopen" | "hand_over";

export interface WorkOrderButtonAssignment {
  id: number;
  button_key: WorkOrderButtonKey;
  user_id: number;
  user_name: string;
}

const ASSIGNMENT_URL = "/wo-sheet-button-assignments";

export const getWorkOrderButtonAssignments = async (): Promise<WorkOrderButtonAssignment[]> => {
  const response = await api.get(ASSIGNMENT_URL);
  return response.data;
};

export const assignWorkOrderButtonUser = async (buttonKey: WorkOrderButtonKey, userId: number) => {
  const response = await api.post(ASSIGNMENT_URL, { button_key: buttonKey, user_id: userId });
  return response.data;
};

export const unassignWorkOrderButtonUser = async (buttonKey: WorkOrderButtonKey, userId: number) => {
  const response = await api.delete(`${ASSIGNMENT_URL}/${buttonKey}/${userId}`);
  return response.data;
};
