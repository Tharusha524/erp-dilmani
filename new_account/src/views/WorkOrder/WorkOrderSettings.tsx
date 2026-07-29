import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import StoreIcon from "@mui/icons-material/Store";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import PaletteIcon from "@mui/icons-material/Palette";
import { useNavigate } from "react-router";
import { FormPageLayout } from "../../components/Layout/FormPageLayout";
import DashboardCard from "../../components/DashboardCard";

const CARDS = [
  {
    text: "FACTORY STATUS",
    description: "Manage the Factory status workflow and who can set a status.",
    icon: <PlaylistAddCheckIcon />,
    path: "/workorder/settings/status",
  },
  {
    text: "BUTTON SETTINGS",
    description: "Restrict who can click Finish, Verify, or Re-Open.",
    icon: <TouchAppIcon />,
    path: "/workorder/settings/buttons",
  },
  {
    text: "ADD BRANCH",
    description: "Manage the Branch options on the order sheet.",
    icon: <StoreIcon />,
    path: "/workorder/settings/branches",
  },
  {
    text: "ADD KIND OF FABRIC",
    description: "Manage the Kind of Fabric options on the sheet.",
    icon: <CheckroomIcon />,
    path: "/workorder/settings/fabric-types",
  },
  {
    text: "CHANGE COLOR",
    description: "Customize the Due Date row highlight colors.",
    icon: <PaletteIcon />,
    path: "/workorder/settings/due-date-colors",
  },
];

export default function WorkOrderSettings() {
  const navigate = useNavigate();

  return (
    <FormPageLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Work Order Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose what you'd like to configure.
        </Typography>

        <Grid container spacing={2}>
          {CARDS.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <DashboardCard
                text={card.text}
                description={card.description}
                icon={card.icon}
                onClick={() => navigate(card.path)}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </FormPageLayout>
  );
}
