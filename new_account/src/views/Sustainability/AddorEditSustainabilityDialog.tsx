import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
  Alert,
  Autocomplete,
  Box,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import CloseIcon from "@mui/icons-material/Close";
import { grey } from "@mui/material/colors";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Sustainability,
  getAdditionalSDGList,
  getAlignmentSDGList,
  getMaterialityissuesList,
  getMaterialitytypeList,
  getPillarList,
  getSdgValueList,
} from "../../api/Sustainability/sustainabilityApi";
import useIsMobile from "../../customHooks/useIsMobile";
import DescriptionIcon from "@mui/icons-material/Description";
import theme from "../../theme";
import CustomButton from "../../components/CustomButton";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddorEditImpactDialog from "./AddorEditImpactDialog";
import { fetchDivision } from "../../api/divisionApi";
import { useQuery } from "@tanstack/react-query";
import DifferenceIcon from "@mui/icons-material/Difference";
import ArchiveIcon from "@mui/icons-material/Archive";
import ImageIcon from "@mui/icons-material/Image";
import RichTextComponent from "../../components/RichTextComponent";
import { ExistingFileItemsEdit } from "../../components/ExistingFileItemsEdit";
import DropzoneComponent from "../../components/DropzoneComponent";
import { StorageFile } from "../../utils/StorageFiles.util";
import DatePickerComponent from "../../components/DatePickerComponent";
import AutoCheckBox from "../../components/AutoCheckbox";

type DialogProps = {
  open: boolean;
  handleClose: () => void;
  defaultValues?: Sustainability;
  onSubmit?: (data: Sustainability) => void;
};

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}

export default function AddOrEditSustainabilityDialog({
  open,
  handleClose,
  defaultValues,
  onSubmit,
}: DialogProps) {
  const { isMobile, isTablet } = useIsMobile();
  const [files, setFiles] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const [openAddOrEditImpactDialog, setOpenAddOrEditImpactDialog] =
    useState(false);
  const [selectedImpactDocument, setSelectedImpactDocument] =
    useState<Sustainability>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<Sustainability>({
    reValidateMode: "onChange",
    mode: "onChange",
  });

  const watchImpacts = watch("impactDetails");
  const [materialityType, setMaterialityType] = useState([]);
  const [materialityIssue, setMaterialityIssue] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [additionalSdg, SetAdditionalSdg] = useState([]);

  const [existingFiles, setExistingFiles] = useState<StorageFile[]>(
    defaultValues?.documents as StorageFile[]
  );
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    } else {
      reset();
    }
  }, [defaultValues, reset]);

  const resetForm = () => {
    reset();
    setFiles([]);
  };

  const handleCreateSustainability = (data: Sustainability) => {
    const submitData: Partial<Sustainability> = data;
    submitData.id = defaultValues?.id ?? uuidv4();
    submitData.documents = files;
    onSubmit(submitData as Sustainability);
    resetForm();
  };

  const { data: divisionData, isFetching: isDivisionDataFetching } = useQuery({
    queryKey: ["divisions"],
    queryFn: fetchDivision,
  });

  const { data: aditionalSDGData, isFetching: isAddditionalSDGFetching } =
    useQuery({
      queryKey: ["additional-sdg"],
      queryFn: getAdditionalSDGList,
    });

  const { data: aligmentSDGData, isFetching: isAligmentSDGDataFetching } =
    useQuery({
      queryKey: ["alignment-SDG"],
      queryFn: getAlignmentSDGList,
    });

  const {
    data: materialityIssueData,
    isFetching: isMaterialityIssueDataFetching,
  } = useQuery({
    queryKey: ["materiality-issues"],
    queryFn: getMaterialityissuesList,
  });

  const {
    data: materialityTypeData,
    isFetching: isMaterialityTypeDataFetching,
  } = useQuery({
    queryKey: ["materiality-type"],
    queryFn: getMaterialitytypeList,
  });

  const { data: pillarsData, isFetching: isPillarsDataFetching } = useQuery({
    queryKey: ["pillars"],
    queryFn: getPillarList,
  });

  const { data: sdgValueData, isFetching: isSdgValueDataFetching } = useQuery({
    queryKey: ["sdg-value"],
    queryFn: getSdgValueList,
  });

  const isGeneralDetailsValid = useMemo(() => {
    return (
      !errors.title &&
      !errors.materialityType &&
      !errors.materialityIssue &&
      !errors.pillars
    );
  }, [
    errors.title,
    errors.materialityType,
    errors.materialityIssue,
    errors.pillars,
  ]);

  const isSDGDetailsValid = useMemo(() => {
    return (
      !errors.sdg &&
      !errors.additionalSdg &&
      !errors.alignmentSdg &&
      !errors.griStandards
    );
  }, [
    errors.sdg,
    errors.additionalSdg,
    errors.alignmentSdg,
    errors.griStandards,
  ]);

  const isOtherDetailsValid = useMemo(() => {
    return !errors.organizer && !errors.volunteer && !errors.priority;
  }, [errors.organizer, errors.volunteer, errors.priority]);

  const triggerGeneralDetailsSection = () => {
    trigger(["title", "materialityType", "materialityIssue", "pillars"]);
  };

  const triggerSGDDetailsSection = () => {
    trigger(["sdg", "additionalSdg", "alignmentSdg", "griStandards"]);
  };

  const triggerotherSection = () => {
    trigger(["organizer", "volunteer", "priority"]);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    if (activeTab === 0) {
      triggerGeneralDetailsSection();
    } else if (activeTab === 1) {
      triggerSGDDetailsSection();
    } else if (activeTab === 2) {
      triggerotherSection();
    }
    setActiveTab(newValue);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          resetForm();
          handleClose();
        }}
        fullScreen={true}
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
            {defaultValues
              ? "Edit Sustainability Report"
              : "Create Sustainability Report"}
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
          {Object.keys(errors).length > 0 && (
            <Alert
              severity="error"
              style={{ marginLeft: "1rem", marginRight: "1rem" }}
            >
              Please make sure to fill all the required fields with valid data
            </Alert>
          )}
          <Stack
            sx={{
              display: "flex",
              flexDirection: isTablet ? "column" : "row",
              padding: "1rem",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                backgroundColor: "#fff",
                flex: { lg: 3, md: 1 },
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                padding: "0.5rem",
                borderRadius: "0.3rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  flexDirection: "column",
                  marginX: "0.5rem",
                  marginY: "1rem",
                }}
              >
                <Typography variant="body2" component="div">
                  <b>Date</b>
                </Typography>
                <Typography variant="body2" component="div">
                  {new Date().toDateString()}
                </Typography>
              </Box>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                indicatorColor="secondary"
                TabIndicatorProps={{
                  style: {
                    backgroundColor:
                      isGeneralDetailsValid &&
                      isOtherDetailsValid &&
                      isSDGDetailsValid
                        ? "var(--pallet-blue)"
                        : "var(--pallet-red)",
                    height: "3px",
                  },
                }}
                sx={{
                  backgroundColor: "var(--pallet-lighter-grey)",
                  color: "var(--pallet-blue)",
                  width: "100%",
                }}
                textColor="inherit"
                variant="scrollable"
                scrollButtons={true}
              >
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isGeneralDetailsValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <DescriptionIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        General Details
                      </Typography>
                      {!isGeneralDetailsValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(0)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isSDGDetailsValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <DifferenceIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        SDG details
                      </Typography>
                      {!isSDGDetailsValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(1)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: isOtherDetailsValid
                          ? "var(--pallet-blue)"
                          : "var(--pallet-red)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <DescriptionIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Others
                      </Typography>
                      {!isOtherDetailsValid && (
                        <Typography
                          variant="subtitle1"
                          sx={{ ml: "0.3rem", color: "var(--pallet-red)" }}
                        >
                          *
                        </Typography>
                      )}
                    </Box>
                  }
                  {...a11yProps(2)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: "var(--pallet-blue)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ArchiveIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Activity Impacts
                      </Typography>
                    </Box>
                  }
                  {...a11yProps(3)}
                />
                <Tab
                  label={
                    <Box
                      sx={{
                        color: "var(--pallet-blue)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <ImageIcon fontSize="small" />
                      <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                        Gallery
                      </Typography>
                    </Box>
                  }
                  {...a11yProps(4)}
                />
              </Tabs>
              <TabPanel value={activeTab} index={0} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#fff",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <TextField
                    id="title"
                    required
                    type="text"
                    label="Tilte"
                    error={!!errors.title}
                    size="small"
                    sx={{ flex: 1, margin: "0.5rem" }}
                    {...register("title", { required: true })}
                  />
                  <Stack
                    gap={1}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "#fff",
                      flex: { lg: 3, md: 1 },
                      borderRadius: "0.3rem",
                    }}
                  >
                    <Box
                      sx={{
                        margin: "0.5rem",
                        width: "100%",
                      }}
                    >
                      <AutoCheckBox
                        control={control}
                        required={true}
                        name="materialityType"
                        label="Materiality Type"
                        options={materialityTypeData}
                        selectedValues={materialityType}
                        setSelectedValues={setMaterialityType}
                        getOptionLabel={(option) => option.materialityType}
                        getOptionValue={(option) => option.materialityType}
                        placeholder="Materiality Type"
                        limitTags={2}
                      />
                    </Box>
                    <Box
                      sx={{
                        margin: "0.5rem",
                        width: "100%",
                      }}
                    >
                      <AutoCheckBox
                        control={control}
                        required={true}
                        name="materialityIssue"
                        label="Materiality Issue"
                        options={materialityIssueData}
                        selectedValues={materialityIssue}
                        setSelectedValues={setMaterialityIssue}
                        getOptionLabel={(option) => option.materialityIssue}
                        getOptionValue={(option) => option.materialityIssue}
                        placeholder="Materiality Issue"
                        limitTags={2}
                      />
                    </Box>
                  </Stack>

                  <Stack
                    gap={1}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "#fff",
                      flex: { lg: 3, md: 1 },
                      borderRadius: "0.3rem",
                    }}
                  >
                    <Box
                      sx={{
                        margin: "0.5rem",
                        width: "100%",
                      }}
                    >
                      <AutoCheckBox
                        control={control}
                        required={true}
                        name="pillars"
                        label="Pillars"
                        options={pillarsData}
                        selectedValues={pillars}
                        setSelectedValues={setPillars}
                        getOptionLabel={(option) => option.pillarName}
                        getOptionValue={(option) => option.pillarName}
                        placeholder="Pillars"
                        limitTags={2}
                      />
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 1);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={1} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#fff",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <Controller
                    name="sdg"
                    control={control}
                    defaultValue={defaultValues?.sdg ?? ""}
                    {...register("sdg", { required: true })}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        onChange={(event, newValue) => field.onChange(newValue)}
                        size="small"
                        options={
                          sdgValueData?.length
                            ? sdgValueData.map((sdg) => sdg.sdg)
                            : []
                        }
                        sx={{ flex: 1, margin: "0.5rem" }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            error={!!errors.sdg}
                            helperText={errors.sdg && "Required"}
                            label="SDG"
                            name="sdg"
                          />
                        )}
                      />
                    )}
                  />

                  <Stack
                    gap={1}
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "#fff",
                      flex: { lg: 3, md: 1 },
                      borderRadius: "0.3rem",
                    }}
                  >
                    <Box
                      sx={{
                        margin: "0.5rem",
                        width: "100%",
                      }}
                    >
                      <AutoCheckBox
                        control={control}
                        required={true}
                        name="additionalSdg"
                        label="Additional SDGs"
                        options={aditionalSDGData}
                        selectedValues={additionalSdg}
                        setSelectedValues={SetAdditionalSdg}
                        getOptionLabel={(option) => option.name}
                        getOptionValue={(option) => option.name}
                        placeholder="Choose Additional SDGs"
                        limitTags={2}
                      />
                    </Box>
                  </Stack>
                  <Controller
                    name="alignmentSdg"
                    control={control}
                    defaultValue={defaultValues?.alignmentSdg ?? ""}
                    {...register("alignmentSdg", { required: true })}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        onChange={(event, newValue) => field.onChange(newValue)}
                        size="small"
                        options={
                          aligmentSDGData?.length
                            ? aligmentSDGData.map((division) => division.name)
                            : []
                        }
                        sx={{ flex: 1, margin: "0.5rem" }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            error={!!errors.alignmentSdg}
                            helperText={errors.alignmentSdg && "Required"}
                            label="Alignment With SDGs"
                            name="alignmentSdg"
                          />
                        )}
                      />
                    )}
                  />
                  <TextField
                    id="griStandards"
                    type="text"
                    required
                    label="GRI Standards and Sub-Standards"
                    error={!!errors.griStandards}
                    size="small"
                    sx={{ flex: 1, margin: "0.5rem" }}
                    {...register("griStandards", { required: true })}
                  />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 0);
                      }}
                      endIcon={<ArrowBackIcon />}
                    >
                      Previous
                    </CustomButton>
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                        marginLeft: "0.5rem",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 2);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={2} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#fff",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <Stack
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      backgroundColor: "#fff",
                      flex: { lg: 3, md: 1 },
                      borderRadius: "0.3rem",
                    }}
                  >
                    <TextField
                      id="organizer"
                      required
                      type="text"
                      label="Organizer"
                      error={!!errors.organizer}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("organizer", { required: true })}
                    />

                    <TextField
                      id="volunteer"
                      required
                      type="text"
                      label="Volunteera Participated"
                      error={!!errors.volunteer}
                      size="small"
                      sx={{ flex: 1, margin: "0.5rem" }}
                      {...register("volunteer", { required: true })}
                    />
                  </Stack>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                    }}
                  >
                    <Controller
                      control={control}
                      name={"priority"}
                      render={({ field }) => {
                        return (
                          <RichTextComponent
                            onChange={(e) => field.onChange(e)}
                            placeholder={
                              field.value ?? "Why This is a Priority"
                            }
                          />
                        );
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                    }}
                  >
                    <Controller
                      control={control}
                      name={"contributing"}
                      render={({ field }) => {
                        return (
                          <RichTextComponent
                            onChange={(e) => field.onChange(e)}
                            placeholder={
                              field.value ?? "Who are the Contributors"
                            }
                          />
                        );
                      }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                      marginTop: "1.2rem",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 1);
                      }}
                      endIcon={<ArrowBackIcon />}
                    >
                      Previous
                    </CustomButton>
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                        marginLeft: "0.5rem",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 3);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={3} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#fff",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  <TableContainer
                    component={Paper}
                    elevation={2}
                    sx={{
                      overflowX: "auto",
                      maxWidth: isMobile ? "88vw" : "100%",
                    }}
                  >
                    <Box
                      sx={{
                        padding: theme.spacing(2),
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        variant="contained"
                        sx={{ backgroundColor: "var(--pallet-blue)" }}
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedImpactDocument(null);
                          setOpenAddOrEditImpactDialog(true);
                        }}
                      >
                        Create Impact
                      </Button>
                    </Box>
                    <Table aria-label="simple table">
                      <TableHead
                        sx={{
                          backgroundColor: "var(--pallet-lighter-grey)",
                        }}
                      >
                        <TableRow>
                          <TableCell align="center">Impact Type</TableCell>
                          <TableCell align="center">Unit</TableCell>
                          <TableCell align="center">Value</TableCell>
                          <TableCell align="center"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {watchImpacts?.length > 0 ? (
                          watchImpacts?.map((row) => (
                            <TableRow
                              key={`${row.id}`}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: 0,
                                },
                                cursor: "pointer",
                              }}
                              onClick={() => {
                                console.log("row");
                              }}
                            >
                              <TableCell
                                component="th"
                                scope="row"
                                align="center"
                              >
                                {row.impactType}
                              </TableCell>
                              <TableCell align="center">{row.unit}</TableCell>
                              <TableCell align="center">{row.value}</TableCell>
                              <TableCell align="center">
                                <IconButton
                                  onClick={() => {
                                    setSelectedImpactDocument(row);
                                    setOpenAddOrEditImpactDialog(true);
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  onClick={() => {
                                    setValue(
                                      "impactDetails",
                                      (watchImpacts ?? []).filter(
                                        (item) => item.id !== row.id
                                      )
                                    );
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={11} align="center">
                              <Typography variant="body2">
                                No Records found
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                      justifyContent: "flex-end",
                      marginTop: "1.2rem",
                    }}
                  >
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 2);
                      }}
                      endIcon={<ArrowBackIcon />}
                    >
                      Previous
                    </CustomButton>
                    <CustomButton
                      variant="contained"
                      sx={{
                        backgroundColor: "var(--pallet-blue)",
                        marginLeft: "0.5rem",
                      }}
                      size="medium"
                      onClick={() => {
                        handleTabChange(null, 4);
                      }}
                      endIcon={<ArrowForwardIcon />}
                    >
                      Next
                    </CustomButton>
                  </Box>
                </Stack>
              </TabPanel>
              <TabPanel value={activeTab} index={4} dir={theme.direction}>
                <Stack
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "#fff",
                    flex: { lg: 3, md: 1 },
                    borderRadius: "0.3rem",
                  }}
                >
                  {defaultValues && (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "row",
                          margin: "0.5rem",
                        }}
                      >
                        <Typography variant="body2" component="div">
                          <b>Evidence</b>
                        </Typography>
                        <Typography variant="body2" component="div">
                          {` ${defaultValues?.documents}`}
                        </Typography>
                      </Box>

                      <ExistingFileItemsEdit
                        label="Existing evidence"
                        files={existingFiles}
                        sx={{ marginY: "1rem" }}
                        handleRemoveItem={(file) => {
                          if (file.gsutil_uri) {
                            setFilesToRemove([
                              ...filesToRemove,
                              file.gsutil_uri,
                            ]);
                            setExistingFiles(
                              existingFiles.filter(
                                (f) => f.gsutil_uri !== file.gsutil_uri
                              )
                            );
                          }
                        }}
                      />
                    </>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      margin: "0.5rem",
                    }}
                  >
                    <DropzoneComponent
                      files={files}
                      setFiles={setFiles}
                      dropzoneLabel={"Drop Your Evidence Here"}
                    />
                  </Box>
                </Stack>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    margin: "0.5rem",
                    justifyContent: "flex-end",
                    marginTop: "1.2rem",
                  }}
                >
                  <CustomButton
                    variant="contained"
                    sx={{
                      backgroundColor: "var(--pallet-blue)",
                    }}
                    size="medium"
                    onClick={() => {
                      setActiveTab(3);
                    }}
                    endIcon={<ArrowBackIcon />}
                  >
                    Previous
                  </CustomButton>
                </Box>
              </TabPanel>
            </Box>
            <Box
              sx={{
                display: "flex",
                flex: { lg: 1, md: 1 },
                flexDirection: "column",
                backgroundColor: "#fff",
                boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                padding: "1rem",
                borderRadius: "0.3rem",
                marginY: isTablet ? "0.5rem" : 0,
                marginLeft: isTablet ? 0 : "0.5rem",
                height: "fit-content",
              }}
            >
              <Box sx={{ margin: "0.5rem" }}>
                <Controller
                  control={control}
                  {...register("timeLines", { required: true })}
                  name={"timeLines"}
                  render={({ field }) => {
                    return (
                      <Box sx={{ flex: 1, margin: "0.5rem" }}>
                        <DatePickerComponent
                          onChange={(e) => field.onChange(e)}
                          value={
                            field.value ? new Date(field.value) : undefined
                          }
                          label="Date of Join"
                          error={errors?.timeLines ? "Required" : ""}
                        />
                      </Box>
                    );
                  }}
                />
              </Box>

              <Box sx={{ margin: "1rem", width: "full" }}>
                <TextField
                  id="projectLocation"
                  type="text"
                  label="Project Location"
                  error={!!errors.location}
                  required
                  size="small"
                  sx={{ width: "100%" }}
                  {...register("location", { required: true })}
                />
              </Box>

              <Box sx={{ margin: "0.5rem" }}>
                <Controller
                  name="division"
                  control={control}
                  defaultValue={defaultValues?.division ?? null}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      onChange={(event, newValue) => field.onChange(newValue)}
                      size="small"
                      options={
                        divisionData?.length
                          ? divisionData.map(
                              (division) => division.divisionName
                            )
                          : []
                      }
                      sx={{ flex: 1, margin: "0.5rem" }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          required
                          error={!!errors.division}
                          helperText={errors.division && "Required"}
                          label="Division"
                          name="division"
                        />
                      )}
                    />
                  )}
                />
              </Box>
            </Box>
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
              handleCreateSustainability(data);
            })}
          >
            {defaultValues ? "Update Changes" : "Submit Item"}
          </CustomButton>
        </DialogActions>
      </Dialog>
      {openAddOrEditImpactDialog && (
        <AddorEditImpactDialog
          open={openAddOrEditImpactDialog}
          handleClose={() => setOpenAddOrEditImpactDialog(false)}
          onSubmit={(data) => {
            if (selectedImpactDocument) {
              setValue("impactDetails", [
                ...(watchImpacts ?? []).map((item) => {
                  if (item.id === selectedImpactDocument.id) {
                    return {
                      ...data,
                      id: selectedImpactDocument.id,
                      uploadDate: new Date(),
                    };
                  }
                  return item;
                }),
              ]);
            } else {
              setValue("impactDetails", [...(watchImpacts ?? []), { ...data }]);
            }
            setOpenAddOrEditImpactDialog(false);
            setSelectedImpactDocument(null);
          }}
          defaultValues={selectedImpactDocument}
        />
      )}
    </>
  );
}
