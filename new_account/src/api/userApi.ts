import api from "./apiClient";
import { z } from "zod";
import { PermissionKeysObjectSchema } from "../views/Administration/SectionList";
import { StorageFileSchema } from "../utils/StorageFiles.util";

export const userRoleSchema = z.object({
  id: z.number(),
  userType: z.string(),
  description: z.string().optional(),
  permissionObject: PermissionKeysObjectSchema,
  created_at: z.string(),
});

export type UserRole = z.infer<typeof userRoleSchema>;

export const userTypeSchema = z.object({
  id: z.number(),
  userType: z.string(),
  description: z.string().optional(),
  permissionObject: PermissionKeysObjectSchema,
  created_at: z.string(),
});

export const userLevelSchema = z.object({
  id: z.string(),
  levelId: z.string(),
  levelName: z.string().optional(),
  created_at: z.string(),
});

export type UserLevel = z.infer<typeof userLevelSchema>;

export type UserType = z.infer<typeof userTypeSchema>;

export const userSchema = z.object({
  id: z.number(),
  email: z.string(),
  userTypeId: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  telephone: z.string(),
  emailVerifiedAt: z.string().nullable(),
  role: z.string(),
  roleId: z.string(),
  gender: z.string(),
  availability: z.boolean(),
  responsibleSection: z.array(z.string()),
  userType: userTypeSchema,
  userLevel: userLevelSchema,
  profileImage: z
    .array(z.union([z.instanceof(File), StorageFileSchema]))
    .optional(),
  image: z.string().optional(), // Path to stored image
  image_url: z.string().optional(), // Full URL to access image
  status: z.string(),
  isCompanyEmployee: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  department: z.string(),
  assignedFactory: z.array(z.string()),
  employeeNumber: z.string(),
  jobPosition: z.string(),
  assigneeLevel: z.string(),
  permissionObject: PermissionKeysObjectSchema,
});

export type User = z.infer<typeof userSchema>;

export const passwordResetSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
  newPassword_confirmation: z.string(),
});

export type PasswordReset = z.infer<typeof passwordResetSchema>;

export async function login({ email, password }: { email: string; password: string }) {
  const res = await api.post("/login", { email, password });
  return res.data as { access_token: string; user: User };
}

export async function userPasswordReset(data: PasswordReset) {
  const res = await api.post(`/user-change-password`, data);
  return res.data;
}

export async function registerUser({
  name,
  email,
  telephoneNumber: telephone,
  password,
  confirmPassword: password_confirmation,
  isCompanyEmployee,
  department,
  jobPosition,
  assignedFactory,
  employeeNumber,
}: {
  email: string;
  password: string;
  name: string;
  telephoneNumber: string;
  confirmPassword: string;
  isCompanyEmployee: boolean;
  jobPosition: string;
  department: string;
  assignedFactory: string[];
  employeeNumber: string;
}) {
  const res = await api.post("/register", {
    email,
    password,
    name,
    telephone,
    password_confirmation,
    isCompanyEmployee,
    jobPosition,
    department,
    assignedFactory,
    employeeNumber,
  });
  return res.data;
}

export async function validateUser(): Promise<User> {
  const res = await api.get("/user");
  return res.data;
}

export async function fetchAllUsers() {
  const res = await api.get("/all-users");
  return res.data;
}

export async function forgotPassword({ email }: { email: string }) {
  const res = await api.post("/forgot-password", {
    email,
  });
  return res.data;
}

export async function otpVerification({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  const res = await api.post("/reset-password", {
    email,
    otp,
  });
  return res.data;
}

export async function resetPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const res = await api.post("/change-password", {
    email,
    password,
  });
  return res.data;
}

export async function fetchAllAssigneeLevel() {
  const res = await api.get("/assignee-level");
  return res.data;
}

export async function updateUserType({
  id,
  userTypeId,
  assigneeLevel,
  department,
  availability,
  jobPosition,
  assignedFactory,
  responsibleSection,
}: {
  id: number;
  userTypeId: number;
  assigneeLevel: string;
  department: string;
  availability: boolean;
  jobPosition: string;
  assignedFactory: string[];
  responsibleSection: string[];
}) {
  const parsedAssignedFactory = Array.isArray(assignedFactory)
    ? assignedFactory
    : JSON.parse(assignedFactory || "[]");
  const parsedResponsibleSection = Array.isArray(responsibleSection)
    ? responsibleSection
    : JSON.parse(responsibleSection || "[]");

  const res = await api.post(`/users/${id}/update`, {
    userType: userTypeId.toString(),
    assigneeLevel: assigneeLevel.toString(),
    department,
    availability,
    jobPosition,
    assignedFactory: parsedAssignedFactory,
    responsibleSection: parsedResponsibleSection,
  });

  return res.data;
}

//assignee by the responsible section
export async function fetchHazardRiskAssignee() {
  const res = await api.get("/hazard-risks-assignee");
  return res.data;
}

export async function fetchAccidentAssignee() {
  const res = await api.get("/accidents-assignee");
  return res.data;
}

export async function fetchIncidentAssignee() {
  const res = await api.get("/incidents-assignee");
  return res.data;
}

export async function fetchMedicineRequestAssignee() {
  const res = await api.get("/medicine-request-assignee");
  return res.data;
}

export async function fetchInternalAuditAssignee() {
  const res = await api.get("/internal-audit-assignee");
  return res.data;
}

export async function fetchExternalAuditAssignee() {
  const res = await api.get("/external-audit-assignee");
  return res.data;
}

export async function updateUserProfileImage({
  id,
  imageFile,
}: {
  id: number;
  imageFile: File;
}) {
  const formData = new FormData();
  formData.append("profileImage[0]", imageFile); // Backend expects an array

  const res = await api.post(`/user/${id}/profile-update`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function updateUserProfileDetails({
  id,
  first_name,
  last_name,
  email,
  telephone,
}: {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  telephone?: string;
}) {
  const data: any = {};
  if (first_name !== undefined) data.first_name = first_name;
  if (last_name !== undefined) data.last_name = last_name;
  if (email !== undefined) data.email = email;
  if (telephone !== undefined) data.telephone = telephone;

  const res = await api.post(`/user/${id}/profile-update`, data);

  return res.data;
}

export async function resetProfileEmail({ currentEmail, id }: { currentEmail: string, id: number }) {
  const res = await api.post(`/user/${id}/email-change`, {
    currentEmail,
  });
  return res.data;
}

export async function resetProfileEmailVerification({ otp, id }: { otp: string, id: number }) {
  const res = await api.post(`/user/${id}/email-change-verify`, {
    otp,
  });
  return res.data;
}

export async function resetProfileEmailConfirm({ newEmail, id }: { newEmail: string, id: number }) {
  const res = await api.post(`/user/${id}/email-change-confirm`, {
    newEmail,
  });
  return res.data;
}





