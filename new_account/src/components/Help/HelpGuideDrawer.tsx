import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  Theme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { useMemo, useState } from "react";
import { useLocation } from "react-router";
import {
  HELP_MODULES,
  SETUP_CHECKLIST,
} from "../../help/helpGuideContent";
import { getHelpForPath, getModuleHelpEntries } from "../../help/getHelpForPath";
import AiAgentChatPanel from "./AiAgentChatPanel";

interface HelpGuideDrawerProps {
  open: boolean;
  onClose: () => void;
}

function HelpSectionBlock({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "#1565c0" }}>
        {title}
      </Typography>
      <List dense disablePadding>
        {items.map((item) => (
          <ListItem key={item} disableGutters sx={{ alignItems: "flex-start", py: 0.35 }}>
            <Typography component="span" sx={{ mr: 1, color: "#1976d2", lineHeight: 1.6 }}>
              •
            </Typography>
            <ListItemText
              primary={item}
              primaryTypographyProps={{ variant: "body2", lineHeight: 1.6 }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

export default function HelpGuideDrawer({ open, onClose }: HelpGuideDrawerProps) {
  const { pathname } = useLocation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("md"));
  const [tab, setTab] = useState(0);
  const currentHelp = useMemo(() => getHelpForPath(pathname), [pathname]);

  const moduleEntries = useMemo(
    () => getModuleHelpEntries(currentHelp.module),
    [currentHelp.module]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{ zIndex: 1400 }}
      PaperProps={{
        sx: {
          width: isMobile ? "100vw" : 480,
          maxWidth: "100%",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <SmartToyOutlinedIcon sx={{ color: "#667eea" }} />
            <Typography variant="h6" fontWeight={700}>
              Help & AI Agent
            </Typography>
          </Stack>
          <IconButton aria-label="Close help" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: "divider", minHeight: 44 }}
        >
          <Tab icon={<SmartToyOutlinedIcon fontSize="small" />} iconPosition="start" label="AI Agent" />
          <Tab icon={<ExploreOutlinedIcon fontSize="small" />} iconPosition="start" label="This page" />
          <Tab icon={<MenuBookOutlinedIcon fontSize="small" />} iconPosition="start" label="Module" />
          <Tab icon={<ChecklistOutlinedIcon fontSize="small" />} iconPosition="start" label="Setup" />
        </Tabs>

        <Box
          sx={{
            flex: 1,
            overflow: tab === 0 ? "hidden" : "auto",
            display: "flex",
            flexDirection: "column",
            px: 2,
            py: 2,
            minHeight: 0,
          }}
        >
          {tab === 0 && <AiAgentChatPanel />}

          {tab === 1 && (
            <Stack spacing={2}>
              <Box>
                <Chip label={currentHelp.module} size="small" color="primary" sx={{ mb: 1 }} />
                <Typography variant="h6" fontWeight={700}>
                  {currentHelp.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {currentHelp.summary}
                </Typography>
              </Box>

              {currentHelp.workflow && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "#e3f2fd",
                    border: "1px solid #bbdefb",
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="#1565c0">
                    TYPICAL WORKFLOW
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {currentHelp.workflow}
                  </Typography>
                </Box>
              )}

              <Divider />

              {currentHelp.sections.map((section) => (
                <HelpSectionBlock key={section.title} title={section.title} items={section.items} />
              ))}
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                {currentHelp.module}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Topics in this module related to your current area:
              </Typography>
              {moduleEntries.map((entry) => (
                <Box
                  key={entry.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: entry.id === currentHelp.id ? "#1976d2" : "divider",
                    bgcolor: entry.id === currentHelp.id ? "#f5faff" : "background.paper",
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={700}>
                    {entry.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {entry.summary}
                  </Typography>
                  {entry.workflow && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.75, color: "#1565c0" }}>
                      {entry.workflow}
                    </Typography>
                  )}
                </Box>
              ))}

              <Divider />

              <Typography variant="subtitle2" fontWeight={700}>
                All modules
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {HELP_MODULES.map((mod) => (
                  <Chip key={mod} label={mod} size="small" variant="outlined" />
                ))}
              </Stack>
            </Stack>
          )}

          {tab === 3 && (
            <Stack spacing={2}>
              <Typography variant="subtitle1" fontWeight={700}>
                New company setup checklist
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete these steps in order before processing live transactions. Then run
                System Diagnostics to verify configuration.
              </Typography>
              <List dense disablePadding>
                {SETUP_CHECKLIST.map((step, index) => (
                  <ListItem key={step} disableGutters sx={{ alignItems: "flex-start", py: 0.5 }}>
                    <Box
                      sx={{
                        minWidth: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "#1976d2",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mr: 1.5,
                        mt: 0.25,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <ListItemText
                      primary={step}
                      primaryTypographyProps={{ variant: "body2", lineHeight: 1.6 }}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
