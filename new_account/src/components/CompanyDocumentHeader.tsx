import { Box, Stack, Typography } from "@mui/material";
import { useCompanyHeader } from "../hooks/useCompanyHeader";

type CompanyDocumentHeaderProps = {
  /** Smaller logo and text for transaction print templates. */
  compact?: boolean;
};

function compactAddressLines(address: string, domicile?: string): string {
  const parts = address
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (domicile && !parts.some((p) => p.toLowerCase() === domicile.toLowerCase())) {
    parts.push(domicile.trim());
  }
  return parts.join(", ");
}

/** Company branding for on-screen print / document views. */
export default function CompanyDocumentHeader({ compact = false }: CompanyDocumentHeaderProps) {
  const { company, logoUrl, showLogo } = useCompanyHeader({ forPrint: true });

  if (!company) return null;

  if (compact) {
    const addressLine = compactAddressLines(company.address ?? "", company.domicile);
    const contactLine = [
      company.phone_number && `Tel: ${company.phone_number}`,
      company.fax_number && `Fax: ${company.fax_number}`,
      company.email_address,
    ]
      .filter(Boolean)
      .join(" · ");
    const regLine = [
      company.official_company_number && `Co. No: ${company.official_company_number}`,
      company.GSTNo && `GST: ${company.GSTNo}`,
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <Box
        className="company-document-header company-document-header--compact"
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.75,
          mb: 0,
          pb: 0,
        }}
      >
        {showLogo && logoUrl && (
          <Box
            component="img"
            src={logoUrl}
            alt=""
            sx={{
              maxHeight: 36,
              maxWidth: 88,
              width: "auto",
              height: "auto",
              objectFit: "contain",
              flexShrink: 0,
              display: "block",
            }}
          />
        )}
        <Stack spacing={0} sx={{ minWidth: 0, lineHeight: 1.2 }}>
          <Typography
            component="div"
            sx={{
              fontWeight: 700,
              fontSize: "0.7rem",
              lineHeight: 1.2,
              color: "#1a1a2e",
            }}
          >
            {company.name}
          </Typography>
          {addressLine && (
            <Typography
              component="div"
              sx={{ fontSize: "0.58rem", lineHeight: 1.25, color: "#444", mt: 0.2 }}
            >
              {addressLine}
            </Typography>
          )}
          {contactLine && (
            <Typography
              component="div"
              sx={{ fontSize: "0.58rem", lineHeight: 1.25, color: "#444", mt: 0.15 }}
            >
              {contactLine}
            </Typography>
          )}
          {regLine && (
            <Typography
              component="div"
              sx={{ fontSize: "0.58rem", lineHeight: 1.25, color: "#666", mt: 0.1 }}
            >
              {regLine}
            </Typography>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      className="company-document-header"
      sx={{
        display: "flex",
        gap: 2,
        mb: 2,
        pb: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        "@media print": { mb: 1 },
      }}
    >
      {showLogo && logoUrl && (
        <Box
          component="img"
          src={logoUrl}
          alt=""
          sx={{ maxHeight: 72, maxWidth: 180, objectFit: "contain", display: "block" }}
        />
      )}
      <Stack spacing={0.25} sx={{ fontSize: "0.85rem" }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {company.name}
        </Typography>
        {company.address && <Typography whiteSpace="pre-line">{company.address}</Typography>}
        {company.domicile && <Typography>{company.domicile}</Typography>}
        {company.phone_number && <Typography>Tel: {company.phone_number}</Typography>}
        {company.fax_number && <Typography>Fax: {company.fax_number}</Typography>}
        {company.email_address && <Typography>{company.email_address}</Typography>}
        {company.official_company_number && (
          <Typography>Co. No: {company.official_company_number}</Typography>
        )}
        {company.GSTNo && <Typography>GST: {company.GSTNo}</Typography>}
      </Stack>
    </Box>
  );
}
