import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Paper, Stack } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import { useSnackbar } from "notistack";
import PageTitle from "../PageTitle";
import Breadcrumb from "../BreadCrumb";
import EmailTransactionDialog from "./EmailTransactionDialog";
import { useAutoPrint } from "../../hooks/useAutoPrint";
import { useCompanyHeader } from "../../hooks/useCompanyHeader";
import { sendTransactionDocumentEmail } from "../../api/Documents/TransactionDocumentEmailApi";
import {
  downloadElementAsPdf,
  generateElementAsPdfBlob,
  sanitizePdfFilename,
} from "../../utils/downloadTransactionPrintPdf";
import {
  buildDefaultEmailBody,
  buildDefaultEmailSubject,
  canSharePdfFiles,
  emailTransactionDocument,
} from "../../utils/emailTransactionDocument";
import "../../styles/transactionPrint.css";

export type TransactionPrintPageProps = {
  pageTitle: string;
  breadcrumbs?: { title: string; href?: string }[];
  onBack: () => void;
  autoPrint?: boolean;
  ready?: boolean;
  pdfFileName?: string;
  emailSubject?: string;
  emailBody?: string;
  emailTo?: string;
  printContent: ReactNode;
  screenExtras?: ReactNode;
  extraActions?: ReactNode;
};

export default function TransactionPrintPage({
  pageTitle,
  breadcrumbs = [],
  onBack,
  autoPrint = false,
  ready = true,
  pdfFileName,
  emailSubject,
  emailBody,
  emailTo,
  printContent,
  screenExtras,
  extraActions,
}: TransactionPrintPageProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { logoReady } = useCompanyHeader({ forPrint: true });
  useAutoPrint(Boolean(autoPrint && ready && logoReady));

  const shareAvailable = canSharePdfFiles();
  const resolvedPdfBaseName = sanitizePdfFilename(pdfFileName ?? pageTitle);
  const resolvedSubject = emailSubject ?? buildDefaultEmailSubject(pageTitle);
  const resolvedBody = emailBody ?? buildDefaultEmailBody(pageTitle);

  const pdfAttachmentName = useMemo(
    () => (resolvedPdfBaseName.endsWith(".pdf") ? resolvedPdfBaseName : `${resolvedPdfBaseName}.pdf`),
    [resolvedPdfBaseName]
  );

  const handleDownloadPdf = useCallback(async () => {
    const element = printRef.current;
    if (!element) {
      enqueueSnackbar("Document not ready for PDF export", { variant: "warning" });
      return;
    }

    setDownloading(true);
    try {
      await downloadElementAsPdf(element, resolvedPdfBaseName);
      enqueueSnackbar("PDF downloaded", { variant: "success" });
    } catch (error) {
      console.error("PDF download failed:", error);
      enqueueSnackbar("Failed to download PDF. Try Print → Save as PDF.", {
        variant: "error",
      });
    } finally {
      setDownloading(false);
    }
  }, [resolvedPdfBaseName, enqueueSnackbar]);

  const handleSendEmail = useCallback(
    async (to: string, subject: string, body: string) => {
      const element = printRef.current;
      if (!element) {
        enqueueSnackbar("Document not ready for email", { variant: "warning" });
        return;
      }

      setSendingEmail(true);
      try {
        const blob = await generateElementAsPdfBlob(element);
        const result = await sendTransactionDocumentEmail({
          to,
          subject,
          body,
          pdf: blob,
          pdfFileName: pdfAttachmentName,
          documentTitle: pageTitle,
        });
        enqueueSnackbar(result.message || `Email sent with PDF to ${to}`, {
          variant: result.delivered === false ? "warning" : "success",
        });
        setEmailDialogOpen(false);
      } catch (error) {
        console.error("Send email failed:", error);
        const apiError = error as {
          data?: { message?: string; errors?: Record<string, string[]>; setup_path?: string };
        };
        const validationMsg = apiError?.data?.errors
          ? Object.values(apiError.data.errors).flat()[0]
          : undefined;
        const message =
          validationMsg ||
          apiError?.data?.message ||
          "Could not send email. Configure SMTP under Setup → Company Setup → Email Setup.";
        enqueueSnackbar(message, {
          variant: "error",
          action: apiError?.data?.setup_path ? (
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate("/setup/companysetup/email-setup")}
            >
              Email Setup
            </Button>
          ) : undefined,
        });
      } finally {
        setSendingEmail(false);
      }
    },
    [pdfAttachmentName, pageTitle, enqueueSnackbar, navigate]
  );

  const handleShareEmail = useCallback(async () => {
    const element = printRef.current;
    if (!element) return;

    setSendingEmail(true);
    try {
      await emailTransactionDocument({
        element,
        documentTitle: pageTitle,
        pdfFileName: resolvedPdfBaseName,
        emailSubject: resolvedSubject,
        emailBody: resolvedBody,
        recipient: emailTo,
        client: "share",
      });
      enqueueSnackbar("PDF shared — choose Gmail or your email app", { variant: "success" });
    } catch (error) {
      console.error("Share failed:", error);
      enqueueSnackbar("Share not available on this device", { variant: "warning" });
    } finally {
      setSendingEmail(false);
    }
  }, [pageTitle, resolvedPdfBaseName, resolvedSubject, resolvedBody, emailTo, enqueueSnackbar]);

  const handleOpenGmail = useCallback(async () => {
    const element = printRef.current;
    if (!element) return;

    setSendingEmail(true);
    try {
      await emailTransactionDocument({
        element,
        documentTitle: pageTitle,
        pdfFileName: resolvedPdfBaseName,
        emailSubject: resolvedSubject,
        emailBody: resolvedBody,
        recipient: emailTo,
        client: "gmail",
      });
      enqueueSnackbar("Gmail opened — attach the downloaded PDF if needed", {
        variant: "info",
      });
    } catch (error) {
      console.error("Open Gmail failed:", error);
    } finally {
      setSendingEmail(false);
    }
  }, [pageTitle, resolvedPdfBaseName, resolvedSubject, resolvedBody, emailTo, enqueueSnackbar]);

  const busy = downloading || sendingEmail;

  return (
    <>
      <Stack spacing={2} className="transaction-print-page">
        <Box
          className="no-print"
          sx={{
            p: 2,
            boxShadow: 2,
            borderRadius: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <PageTitle title={pageTitle} />
            {breadcrumbs.length > 0 && <Breadcrumb breadcrumbs={breadcrumbs} />}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {extraActions}
            <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBack}>
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={
                downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />
              }
              onClick={() => void handleDownloadPdf()}
              disabled={!ready || busy}
            >
              Download PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={
                sendingEmail ? <CircularProgress size={18} color="inherit" /> : <EmailIcon />
              }
              onClick={() => setEmailDialogOpen(true)}
              disabled={!ready || busy}
            >
              Email
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              onClick={() => window.print()}
              disabled={!ready || busy}
            >
              Print
            </Button>
          </Stack>
        </Box>

        <Paper
          ref={printRef}
          className="print-document"
          elevation={2}
          sx={{
            p: { xs: 1.5, sm: 2, md: 2.5 },
            "@media print": { elevation: 0, p: 0 },
          }}
        >
          {printContent}
        </Paper>

        {screenExtras && <Box className="no-print">{screenExtras}</Box>}
      </Stack>

      <EmailTransactionDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSend={handleSendEmail}
        initialTo={emailTo ?? ""}
        initialSubject={resolvedSubject}
        initialBody={resolvedBody}
        sending={sendingEmail}
        shareAvailable={shareAvailable}
        onShare={() => void handleShareEmail()}
        onOpenGmail={() => void handleOpenGmail()}
      />
    </>
  );
}
