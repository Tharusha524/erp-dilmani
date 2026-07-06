import React, { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import theme from "../../../../theme";
import { createSalesGroup } from "../../../../api/SalesMaintenance/salesService";
import { useQueryClient } from "@tanstack/react-query";
import AddedConfirmationModal from "../../../../components/AddedConfirmationModal";
import ErrorModal from "../../../../components/ErrorModal";
import useFormPersist from "../../../../hooks/useFormPersist";
import { getFriendlyApiErrorMessage } from "../../../../utils/apiErrorMessage";
interface SalesGroupFormData {
  groupName: string;
}

export default function AddSalesGroupsForm() {
  const [open, setOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData, clearFormData] = useFormPersist<SalesGroupFormData>(
    "sales-group-form",  // unique key for this form
    { groupName: "" }
  );

  const [error, setError] = useState<string>("");
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const queryClient = useQueryClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ groupName: value });
  };

  const validate = () => {
    if (!formData.groupName.trim()) {
      setError("Group Name is required");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (validate()) {
      try {
        await createSalesGroup({ name: formData.groupName });
        queryClient.invalidateQueries({ queryKey: ["salesGroups"] });
        // Clear form data from localStorage on successful submission
        clearFormData();
        setOpen(true);
      } catch (error) {
        console.error(error);
        setErrorMessage(
          getFriendlyApiErrorMessage(error) || "Failed to add Sales Group. Please try again."
        );
        setErrorOpen(true);
      }
    }
  };

  return (
    <Stack alignItems="center" sx={{ mt: 4, px: isMobile ? 2 : 0 }}>
      <Paper
        sx={{
          p: theme.spacing(3),
          maxWidth: "500px",
          width: "100%",
          boxShadow: 2,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ mb: 3, textAlign: isMobile ? "center" : "left" }}
        >
          Sales Group Setup
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Group Name"
            name="groupName"
            size="small"
            fullWidth
            value={formData.groupName}
            onChange={handleInputChange}
            error={!!error}
            helperText={error}
          />
        </Stack>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 2 : 0,
          }}
        >
          <Button onClick={() => {
            // Ask user if they want to save the data for later or discard it
            if (formData.groupName && !confirm("Do you want to save your progress for later?")) {
              clearFormData();
            }
            window.history.back();
          }}>Back</Button>

          <Button
            variant="contained"
            fullWidth={isMobile}
            sx={{ backgroundColor: "var(--pallet-blue)" }}
            onClick={handleSubmit}
          >
            Add New
          </Button>
        </Box>
      </Paper>
      <AddedConfirmationModal
        open={open}
        title="Success"
        content="Sales Group has been added successfully!"
        addFunc={async () => { }}
        handleClose={() => setOpen(false)}
        onSuccess={() => {
          // Form was already cleared on successful submission
          window.history.back();
        }}
      />

      <ErrorModal
        open={errorOpen}
        onClose={() => setErrorOpen(false)}
        message={errorMessage}
      />
    </Stack>
  );
}
