import api from "./apiClient";
import { z } from "zod";
import { InternalAuditSchema } from "./AuditAndInspection/internalAudit";
import { ExternalAuditSchema } from "./ExternalAudit/externalAuditApi";

export const DateRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export type DateRange = z.infer<typeof DateRangeSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  audit: z.union([InternalAuditSchema, ExternalAuditSchema]),
});

export type AuditEvents = z.infer<typeof AuditEventSchema>;

export async function getCalendarAudits({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  const res = await api.get(`/audit-calender/${start}/${end}/calender`);
  return res.data;
}

