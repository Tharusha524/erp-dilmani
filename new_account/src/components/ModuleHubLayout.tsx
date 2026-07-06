import React from "react";
import { Grid, Stack } from "@mui/material";
import DashboardCard from "./DashboardCard";
import ModuleScreenDescription from "./ModuleScreenDescription";
import {
  hubCardDescription,
  hubIntro,
  type HubSectionKey,
} from "../utils/moduleHubCopy";

export type ModuleHubItem = {
  text: string;
  icon: React.ReactElement;
  path: string;
  description?: string;
};

type Props = {
  hubKey: HubSectionKey;
  items: ModuleHubItem[];
  onItemClick: (item: ModuleHubItem) => void;
};

/** Standard module menu — intro panel + description cards */
export default function ModuleHubLayout({ hubKey, items, onItemClick }: Props) {
  const intro = hubIntro(hubKey);

  return (
    <Stack
      sx={{
        minHeight: "100vh",
        backgroundColor: (theme) =>
          theme.palette.mode === "dark" ? "background.default" : "#f4f6f8",
        p: { xs: 2, md: 3 },
      }}
      spacing={2}
    >
      {intro && <ModuleScreenDescription copy={intro} />}
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} lg={4} key={item.path + item.text}>
            <DashboardCard
              text={item.text}
              description={item.description ?? hubCardDescription(item.path)}
              icon={item.icon}
              onClick={() => onItemClick(item)}
            />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
