import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  BUSINESS_CATEGORY_META,
  BUSINESS_MODEL_PLAYBOOK,
  BusinessAdviceBlock,
  getBusinessConsulting,
  getOwnerActionNow,
} from "../../help/businessConsulting";

function AdviceBlockCard({ block }: { block: BusinessAdviceBlock }) {
  const meta = BUSINESS_CATEGORY_META[block.category];

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: `1px solid ${meta.color}33`,
        borderRadius: "12px !important",
        mb: 1,
        "&:before": { display: "none" },
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: meta.color }} />}
        sx={{ bgcolor: meta.bg, minHeight: 48 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ fontSize: 18 }}>{meta.icon}</Typography>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: meta.color }}>
            {meta.label}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 1, pb: 1.5 }}>
        {block.title && (
          <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" sx={{ mb: 1 }}>
            {block.title}
          </Typography>
        )}
        <Stack spacing={0.75}>
          {block.items.map((item, i) => (
            <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{ color: meta.color, minWidth: 18, mt: 0.2 }}
              >
                {i + 1}.
              </Typography>
              <Typography variant="body2" lineHeight={1.55}>
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

interface BusinessConsultingPanelProps {
  onNavigate?: () => void;
}

export default function BusinessConsultingPanel({ onNavigate }: BusinessConsultingPanelProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const consulting = useMemo(() => getBusinessConsulting(pathname), [pathname]);
  const actionNow = useMemo(() => getOwnerActionNow(pathname), [pathname]);

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          background: "linear-gradient(135deg, #0f766e 0%, #115e59 50%, #134e4a 100%)",
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <BusinessCenterOutlinedIcon sx={{ fontSize: 28, mt: 0.25 }} />
          <Box>
            <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: 1 }}>
              AI Business Consulting
            </Typography>
            <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
              {consulting.headline}
            </Typography>
            <Chip
              label={consulting.businessArea}
              size="small"
              sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600 }}
            />
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          border: "2px solid #0f766e",
          bgcolor: "#f0fdfa",
        }}
      >
        <Typography variant="caption" fontWeight={700} color="#0f766e">
          WHAT TO DO NOW
        </Typography>
        <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
          {actionNow}
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
        {consulting.ownerSummary}
      </Typography>

      <Divider />

      <Typography variant="subtitle2" fontWeight={700}>
        Owner playbook for this area
      </Typography>

      {consulting.blocks.map((block) => (
        <AdviceBlockCard key={block.category} block={block} />
      ))}

      <Divider />

      <Stack direction="row" alignItems="center" spacing={1}>
        <TrendingUpOutlinedIcon sx={{ color: "#0f766e" }} />
        <Typography variant="subtitle2" fontWeight={700}>
          Business model ideas
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        How different businesses typically use this ERP:
      </Typography>

      {BUSINESS_MODEL_PLAYBOOK.map((play) => (
        <Box
          key={play.model}
          sx={{
            p: 1.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "#fafafa",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} color="#0f766e">
            {play.model}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.75 }}>
            <strong>Setup:</strong> {play.setup}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.35 }}>
            <strong>Flow:</strong> {play.flow}
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.35 }}>
            <strong>Watch:</strong> {play.kpi}
          </Typography>
        </Box>
      ))}

      <Button
        variant="outlined"
        fullWidth
        onClick={() => {
          navigate("/setup/maintenance/system-diagnostics");
          onNavigate?.();
        }}
        sx={{ textTransform: "none", fontWeight: 600, borderColor: "#0f766e", color: "#0f766e" }}
      >
        Check business readiness — System Diagnostics
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic", textAlign: "center" }}>
        Advice updates based on the module you are working in.
      </Typography>
    </Stack>
  );
}
