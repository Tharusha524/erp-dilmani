import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Typography,
} from "@mui/material";
import { NAVIGATION_PERMISSION_TREE } from "../permissions/navigationTree";

interface PermissionsChecklistProps {
  selectedIds: number[];
  onToggle: (id: number) => void;
  error?: string;
  title?: string;
}

export default function PermissionsChecklist({
  selectedIds,
  onToggle,
  error,
  title = "Permissions",
}: PermissionsChecklistProps) {
  const isChecked = (id: number) => selectedIds.includes(id);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {NAVIGATION_PERMISSION_TREE.map((module) => (
        <Box key={module.label} sx={{ mb: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {module.label}
          </Typography>
          {module.submenus.map((submenu) => (
            <Box key={submenu.label} sx={{ pl: 2 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                {submenu.label}
              </Typography>
              <FormGroup sx={{ pl: 2 }}>
                {submenu.pages.map((page) => (
                  <FormControlLabel
                    key={`${submenu.label}-${page.label}`}
                    control={
                      <Checkbox
                        size="small"
                        checked={isChecked(page.id)}
                        onChange={() => onToggle(page.id)}
                      />
                    }
                    label={page.label}
                  />
                ))}
              </FormGroup>
            </Box>
          ))}
        </Box>
      ))}
      {error && <FormHelperText sx={{ color: "red" }}>{error}</FormHelperText>}
    </Box>
  );
}
