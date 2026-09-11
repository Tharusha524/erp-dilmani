import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompanies, fetchCompanyLogoBlob } from "../api/CompanySetup/CompanySetupApi";
import { resolveLogoSrc } from "../utils/logoUrl";

export interface CompanyHeaderInfo {
  name: string;
  address: string;
  domicile: string;
  phone_number: string;
  fax_number: string;
  email_address: string;
  official_company_number: string;
  GSTNo: string;
  company_logo_url: string | null;
  company_logo_available?: boolean;
  new_company_logo?: string | null;
  company_logo_on_views?: boolean;
  company_logo_on_reports?: boolean;
}

function resolveCompanyLogo(company: CompanyHeaderInfo | null): string | null {
  if (!company) return null;

  if (company.company_logo_available === false) {
    return null;
  }

  const fromUrl = resolveLogoSrc(company.company_logo_url ?? undefined);
  if (fromUrl) return fromUrl;

  const stored = company.new_company_logo?.trim();
  if (stored) {
    return resolveLogoSrc(stored) ?? null;
  }

  return null;
}

function shouldLoadLogo(
  company: CompanyHeaderInfo | null,
  forPrint?: boolean
): boolean {
  if (!company?.new_company_logo?.trim()) return false;
  if (company.company_logo_available === false) return false;
  if (forPrint) return true;
  return Boolean(company.company_logo_on_views);
}

export function useCompanyHeader(options?: { forPrint?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["company-setup-header"],
    queryFn: async () => {
      try {
        return await getCompanies();
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const company =
    Array.isArray(data) && data.length > 0 ? (data[0] as CompanyHeaderInfo) : null;

  const wantsLogo = shouldLoadLogo(company, options?.forPrint);

  const {
    data: logoBlobUrl,
    isLoading: logoBlobLoading,
    isFetched: logoBlobFetched,
  } = useQuery({
    queryKey: ["company-logo-blob"],
    // A data: URI (not a blob: object URL) — React Query caches this value
    // for 30 minutes and reuses it across every page that mounts this hook
    // (print, view, etc.). blob: URLs don't survive that: revoking one on
    // unmount (needed to avoid leaking memory) kills it for every other
    // page still holding the same cached URL string, so the logo goes
    // missing the moment you navigate away and back. A data: URI has no
    // such lifecycle — it's just a string, nothing to revoke, ever.
    queryFn: async () => {
      const blob = await fetchCompanyLogoBlob();
      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("Empty logo");
      }
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    },
    enabled: wantsLogo,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const directLogoUrl = useMemo(() => resolveCompanyLogo(company), [company]);

  const logoUrl = logoBlobUrl ?? directLogoUrl;

  const showLogo = useMemo(() => {
    if (!logoUrl) return false;
    if (options?.forPrint) return true;
    return Boolean(company?.company_logo_on_views);
  }, [logoUrl, company?.company_logo_on_views, options?.forPrint]);

  const logoReady = useMemo(() => {
    if (isLoading) return false;
    if (!wantsLogo) return true;
    return logoBlobFetched && !logoBlobLoading;
  }, [isLoading, wantsLogo, logoBlobFetched, logoBlobLoading]);

  return {
    company,
    logoUrl,
    isLoading,
    logoReady,
    showLogo: Boolean(logoUrl && showLogo),
  };
}
