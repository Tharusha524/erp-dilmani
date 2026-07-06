import React from "react";
import { Alert, Typography, Box } from "@mui/material";
import type { ScreenCopy } from "../utils/moduleHubCopy";

type Props = {
  copy: ScreenCopy | null | undefined;
};

/** Info panel — module purpose, steps, and GL notes */
export default function ModuleScreenDescription({ copy }: Props) {
  if (!copy) {
    return null;
  }

  return (
    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
        {copy.title}
      </Typography>
      <Typography variant="body2" paragraph sx={{ mb: copy.bullets.length ? 1 : 0 }}>
        {copy.summary}
      </Typography>
      {copy.bullets.length > 0 && (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {copy.bullets.map((line) => (
            <Typography component="li" variant="body2" key={line} sx={{ mb: 0.25 }}>
              {line}
            </Typography>
          ))}
        </Box>
      )}
      {copy.glNote && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          {copy.glNote}
        </Typography>
      )}
    </Alert>
  );
}
