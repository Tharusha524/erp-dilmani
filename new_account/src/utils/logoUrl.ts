import type { StorageFile } from "./StorageFiles.util";
import { getApiBaseUrl } from "../config/backendConfig";

const COMPANY_LOGO_API_PATH = "company-setup/logo";

export function getCompanyLogoApiUrl(): string {
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  return `${apiBase}/${COMPANY_LOGO_API_PATH}`;
}

function isCompanyLogoApiPath(value: string): boolean {
  const normalized = value.replace(/^\/+/, "");
  return normalized === COMPANY_LOGO_API_PATH;
}

function toAbsoluteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (isCompanyLogoApiPath(trimmed)) {
    return getCompanyLogoApiUrl();
  }

  // Already absolute / data URL — rewrite broken localhost storage links to the API logo route.
  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    if (/localhost|127\.0\.0\.1/i.test(trimmed) && trimmed.includes("/storage/")) {
      return getCompanyLogoApiUrl();
    }
    return trimmed;
  }

  const path = trimmed.replace(/^\//, "");
  const apiBase = getApiBaseUrl().replace(/\/+$/, "");
  const backendBase = apiBase
    .replace(/\/index\.php\/api$/i, "")
    .replace(/\/api$/i, "");

  // Stored path like company_logos/foo.png — serve via API, not /storage (symlink may be wrong).
  if (path.startsWith("company_logos/")) {
    return getCompanyLogoApiUrl();
  }

  if (backendBase) {
    return `${backendBase}/storage/${path}`;
  }

  return `${window.location.origin}/${path}`;
}

export function resolveLogoSrc(
  logo: string | File | StorageFile | undefined
): string | undefined {
  if (!logo) return undefined;
  if (typeof logo === "string") return toAbsoluteUrl(logo);
  if (logo instanceof File) return URL.createObjectURL(logo);
  const direct = logo.imageUrl ?? (logo as { signedUrl?: string }).signedUrl;
  return direct ? toAbsoluteUrl(direct) : undefined;
}
