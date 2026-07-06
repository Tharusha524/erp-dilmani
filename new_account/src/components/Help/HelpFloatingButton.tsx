import { Fab, Tooltip, Zoom } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useState } from "react";
import HelpGuideDrawer from "./HelpGuideDrawer";

export default function HelpFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="AI Agent & help guide" placement="left" TransitionComponent={Zoom}>
        <Fab
          color="primary"
          aria-label="Open help guide"
          className="no-print erp-help-fab"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            right: { xs: 16, sm: 24 },
            bottom: { xs: 16, sm: 24 },
            zIndex: 1200,
            boxShadow: "0 4px 20px rgba(25, 118, 210, 0.45)",
          }}
        >
          <HelpOutlineIcon />
        </Fab>
      </Tooltip>

      <HelpGuideDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
