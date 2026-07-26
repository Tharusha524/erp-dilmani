import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Stack,
  Typography,
} from "@mui/material";
import { NAVIGATION_PERMISSION_TREE } from "../permissions/navigationTree";
import { toEditId } from "../permissions/editPermission";

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

  // Checking "View" just grants/revokes access, same as before. Unchecking it
  // also revokes "Edit" for that page — a page can't be edit-only.
  const handleViewToggle = (viewId: number) => {
    const wasChecked = isChecked(viewId);
    onToggle(viewId);
    if (wasChecked && isChecked(toEditId(viewId))) {
      onToggle(toEditId(viewId));
    }
  };

  // "Edit" can only be granted once "View" is already checked.
  const handleEditToggle = (viewId: number) => {
    if (!isChecked(viewId)) return;
    onToggle(toEditId(viewId));
  };

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
                {submenu.pages.map((page) => {
                  const viewChecked = isChecked(page.id);
                  const editChecked = isChecked(toEditId(page.id));
                  return (
                    <Stack
                      key={`${submenu.label}-${page.label}`}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      flexWrap="wrap"
                    >
                      <FormControlLabel
                        sx={{ minWidth: 280, mr: 0 }}
                        control={
                          <Checkbox
                            size="small"
                            checked={viewChecked}
                            onChange={() => handleViewToggle(page.id)}
                          />
                        }
                        label={page.label}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={editChecked}
                            disabled={!viewChecked}
                            onChange={() => handleEditToggle(page.id)}
                          />
                        }
                        label="Edit"
                      />
                    </Stack>
                  );
                })}
              </FormGroup>
            </Box>
          ))}
        </Box>
      ))}
      {error && <FormHelperText sx={{ color: "red" }}>{error}</FormHelperText>}
    </Box>
  );
}
