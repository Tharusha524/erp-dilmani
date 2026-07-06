import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Autocomplete,
  Box,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect } from "react";
import {
  ImpactSchema,
  fetchImpactUnit,
  getImpactList,
} from "../../api/Sustainability/sustainabilityApi";
import CustomButton from "../../components/CustomButton";
import useIsMobile from "../../customHooks/useIsMobile";
import { useQuery } from "@tanstack/react-query";
import { fetchDivision } from "../../api/divisionApi";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: ImpactSchema;
  onSubmit: (data: ImpactSchema) => void;
};

export default function AddOrEditImpactDialog({
  open,
  handleClose,
  defaultValues,
  onSubmit,
}: DialogProps) {
  const { isTablet } = useIsMobile();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ImpactSchema>({
    defaultValues,
  });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    } else {
      reset();
    }
  }, [defaultValues, reset]);

  const resetForm = () => {
    reset();
  };

  const impactType = watch("impactType");

  const { data: impactTypeData, isFetching: isImpactTypeDataFetching } =
    useQuery({
      queryKey: ["impact-type"],
      queryFn: getImpactList,
    });
  const { data: impactUnitData, isFetching: isImpactUnitDataFetching } =
    useQuery({
      queryKey: ["impact-unit", impactType],
      queryFn: () => fetchImpactUnit(impactType),
      enabled: !!impactType, // Prevents fetching when category is empty
    });

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        handleClose();
      }}
      fullWidth
      fullScreen={isTablet}
      maxWidth={"lg"}
      PaperProps={{
        style: {
          backgroundColor: grey[50],
        },
        component: "form",
      }}
    >
      <DialogTitle
        sx={{
          paddingY: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="div">
          {defaultValues ? "Edit Item" : "Add Benefit and Entitlements"}
        </Typography>
        <IconButton
          aria-label="open drawer"
          onClick={handleClose}
          edge="start"
          sx={{
            color: "#024271",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: { lg: 3, md: 1 },
            padding: "0.5rem",
            borderRadius: "0.3rem",
          }}
        >
          <Controller
            name="impactType"
            control={control}
            defaultValue={defaultValues?.impactType ?? ""}
            {...register("impactType", { required: true })}
            render={({ field }) => (
              <Autocomplete
                {...field}
                onChange={(event, newValue) => field.onChange(newValue)}
                size="small"
                options={
                  impactTypeData?.length
                    ? impactTypeData.map((impact) => impact.impactType)
                    : []
                }
                sx={{ flex: 1, margin: "0.5rem" }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    required
                    error={!!errors.impactType}
                    helperText={errors.impactType && "Required"}
                    label="Impact Type"
                    name="impactType"
                  />
                )}
              />
            )}
          />

          {impactType && (
            <Controller
              name="unit"
              control={control}
              defaultValue={defaultValues?.unit ?? ""}
              {...register("unit", { required: true })}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  onChange={(event, newValue) => field.onChange(newValue)}
                  size="small"
                  options={
                    impactUnitData?.map((impact) => impact.impactUnit) ?? []
                  }
                  sx={{ flex: 1, margin: "0.5rem" }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      required
                      error={!!errors.unit}
                      helperText={errors.unit && "Required"}
                      label="Unit"
                      name="unit"
                    />
                  )}
                />
              )}
            />
          )}

          <TextField
            id="value"
            type="text"
            label="Impact Value"
            error={!!errors.value}
            size="small"
            sx={{ flex: 1, margin: "0.5rem" }}
            {...register("value", { required: true })}
          />
        </Stack>
      </DialogContent>
      <Divider />
      <DialogActions sx={{ padding: "1rem" }}>
        <Button
          onClick={() => {
            resetForm();
            handleClose();
          }}
          sx={{ color: "var(--pallet-blue)" }}
        >
          Cancel
        </Button>
        <CustomButton
          variant="contained"
          sx={{
            backgroundColor: "var(--pallet-blue)",
          }}
          size="medium"
          onClick={handleSubmit((data) => {
            onSubmit(data);
            resetForm();
            handleClose();
          })}
        >
          {defaultValues ? "Update Changes" : "Submit"}
        </CustomButton>
      </DialogActions>
    </Dialog>
  );
}
