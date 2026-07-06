import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  AiSuggestion,
  getAiSuggestions,
  SUGGESTION_TYPE_COLORS,
  SUGGESTION_TYPE_LABELS,
} from "../../help/aiSuggestions";

function SuggestionCard({
  suggestion,
  onNavigate,
}: {
  suggestion: AiSuggestion;
  onNavigate: (path: string) => void;
}) {
  const colors = SUGGESTION_TYPE_COLORS[suggestion.type];

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.75 }}>
        <Chip
          label={SUGGESTION_TYPE_LABELS[suggestion.type]}
          size="small"
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 700,
            bgcolor: colors.accent,
            color: "#fff",
          }}
        />
        {suggestion.priority === "high" && (
          <Chip label="Priority" size="small" variant="outlined" sx={{ height: 22, fontSize: 10 }} />
        )}
      </Stack>

      <Typography variant="subtitle2" fontWeight={700} sx={{ color: colors.accent }}>
        {suggestion.title}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.55 }}>
        {suggestion.message}
      </Typography>

      {suggestion.path && (
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          onClick={() => onNavigate(suggestion.path!)}
          sx={{ mt: 1, textTransform: "none", fontWeight: 600, color: colors.accent }}
        >
          Go there
        </Button>
      )}
    </Box>
  );
}

interface AiSuggestionsPanelProps {
  onNavigate?: () => void;
  compact?: boolean;
}

export default function AiSuggestionsPanel({
  onNavigate,
  compact = false,
}: AiSuggestionsPanelProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const suggestions = useMemo(() => getAiSuggestions(pathname), [pathname]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  if (compact) {
    const top = suggestions[0];
    if (!top) return null;

    const colors = SUGGESTION_TYPE_COLORS[top.type];
    return (
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: colors.bg,
          border: `1px dashed ${colors.border}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <AutoAwesomeIcon sx={{ fontSize: 20, color: colors.accent, mt: 0.25 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} color={colors.accent}>
              AI suggestion
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {top.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {top.message}
            </Typography>
            {top.path && (
              <Button
                size="small"
                onClick={() => handleNavigate(top.path!)}
                sx={{ mt: 0.5, p: 0, minWidth: 0, textTransform: "none", fontWeight: 600 }}
              >
                Go there →
              </Button>
            )}
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#fff",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              AI Suggestions
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Smart tips based on the screen you are on
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" alignItems="center" spacing={0.75}>
        <LightbulbOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary">
          {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""} for this area
        </Typography>
      </Stack>

      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onNavigate={handleNavigate}
        />
      ))}

      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
        Suggestions update automatically when you change pages.
      </Typography>
    </Stack>
  );
}
