import { z } from "zod";
import { StorageFileSchema } from "../../utils/StorageFiles.util";
import { getCompanies, updateCompany } from "../CompanySetup/CompanySetupApi";

export const ColorPalletSchema = z.object({
  palletId: z.number(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  buttonColor: z.string(),
});
export type ColorPallet = z.infer<typeof ColorPalletSchema>;

export const OrganizationSchema = z.object({
  id: z.number(),
  organizationName: z.string(),
  organizationFactoryName: z.string(),
  logoUrl: z.array(z.union([z.instanceof(File), StorageFileSchema])).optional(),
  insightDescription: z.string(),
  colorPallet: z.array(ColorPalletSchema),
  insightImage: z
    .array(z.union([z.instanceof(File), StorageFileSchema]))
    .optional(),
  created_at: z.date(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

const DEFAULT_ORG: Organization = {
  id: 1,
  organizationName: "Grow Ledger",
  organizationFactoryName: "Grow Ledger",
  logoUrl: [],
  insightDescription: "",
  colorPallet: [],
  created_at: new Date(),
};

function mapCompanyToOrganization(company: Record<string, unknown>): Organization {
  const logo = company.company_logo_url as string | undefined;
  return {
    id: Number(company.id ?? 1),
    organizationName: String(company.name ?? DEFAULT_ORG.organizationName),
    organizationFactoryName: String(company.name ?? DEFAULT_ORG.organizationFactoryName),
    logoUrl: logo
      ? [
          {
            imageUrl: logo,
            fileName: "company-logo.png",
            gsutil_uri: logo,
          },
        ]
      : [],
    insightDescription: String(company.website ?? ""),
    colorPallet: [],
    created_at: company.created_at ? new Date(String(company.created_at)) : new Date(),
  };
}

/** Uses company-setup (this ERP has no /api/organizations route). */
export async function getOrganization(): Promise<Organization> {
  try {
    const list = await getCompanies();
    if (!Array.isArray(list) || !list.length) {
      return DEFAULT_ORG;
    }
    return mapCompanyToOrganization(list[0] as Record<string, unknown>);
  } catch {
    return DEFAULT_ORG;
  }
}

export const updateOrganization = async (organization: Organization) => {
  if (!organization.id) {
    throw new Error("Company record must have an ID for an update.");
  }

  const formData = new FormData();
  formData.append("name", organization.organizationName);
  if (organization.insightDescription) {
    formData.append("website", organization.insightDescription);
  }

  if (Array.isArray(organization.logoUrl)) {
    const logo = organization.logoUrl[0];
    if (logo instanceof File) {
      formData.append("new_company_logo", logo);
    }
  }

  return updateCompany(organization.id, formData);
};
