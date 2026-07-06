import {
  AppBar,
  Box,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from "@mui/material";
import { useState } from "react";
import useIsMobile from "../../customHooks/useIsMobile";
import { DrawerContentItem } from "../../components/ViewDataDrawer";
import theme from "../../theme";
import DescriptionIcon from "@mui/icons-material/Description";
import { format } from "date-fns";
import { FileItemsViewer } from "../../components/FileItemsViewer";
import ImageIcon from "@mui/icons-material/Image";
import ArchiveIcon from "@mui/icons-material/Archive";
import { StorageFile } from "../../utils/StorageFiles.util";
import { Sustainability } from "../../api/Sustainability/sustainabilityApi";
import MultiDrawerContent from "../../components/MultiDrawerContent";
import DifferenceIcon from "@mui/icons-material/Difference";

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

function ViewMaternityRegisterContent({
  sustainability,
}: {
  sustainability: Sustainability;
}) {
  const [activeTab, setActiveTab] = useState(0);
  const { isTablet } = useIsMobile();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    console.log("event", event);
    setActiveTab(newValue);
  };
  return (
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
            p: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <DrawerContentItem
            label="Reference Number"
            value={sustainability.referenceNumber}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Project Time Line"
            value={
              sustainability.timeLines
                ? format(sustainability.timeLines, "MM-dd-yyyy")
                : "N/A"
            }
          />
        </Box>
        <AppBar position="static">
          <Tabs
            value={activeTab}
            onChange={handleChange}
            indicatorColor="secondary"
            TabIndicatorProps={{
              style: { backgroundColor: "var(--pallet-blue)", height: "3px" },
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
                    color: "var(--pallet-blue)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <DescriptionIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    General Details
                  </Typography>
                </Box>
              }
              {...a11yProps(0)}
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
                  <DifferenceIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    SDG Details
                  </Typography>
                </Box>
              }
              {...a11yProps(1)}
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
                  <DescriptionIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Others
                  </Typography>
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
        </AppBar>
        <TabPanel value={activeTab} index={0} dir={theme.direction}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1, flexDirection: isTablet ? "column" : "row" }}>
              <DrawerContentItem
                label="Title"
                value={sustainability.title}
                sx={{ flex: 1 }}
              />
              <MultiDrawerContent
                label="Materiality Type"
                value={sustainability.materialityType}
                sx={{ flex: 1 }}
              />

              <MultiDrawerContent
                label="Materiality Issue"
                value={sustainability.materialityIssue}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ flex: 1, flexDirection: isTablet ? "column" : "row" }}>
              <MultiDrawerContent
                label="Pillars"
                value={sustainability.pillars}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={1} dir={theme.direction}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ flex: 1, flexDirection: isTablet ? "column" : "row" }}>
              <DrawerContentItem
                label="SDG"
                value={sustainability.sdg}
                sx={{ flex: 1 }}
              />
              <MultiDrawerContent
                label="Additional SDGs"
                value={sustainability.additionalSdg}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Alignment SDG"
                value={sustainability.alignmentSdg}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box sx={{ flex: 1, flexDirection: isTablet ? "column" : "row" }}>
              <DrawerContentItem
                label="GRI Standards"
                value={sustainability.griStandards}
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={2} dir={theme.direction}>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <DrawerContentItem
              label="Organizer"
              value={sustainability.organizer}
              sx={{ flex: 1 }}
            />
            <DrawerContentItem
              label="Volunteer"
              value={sustainability.volunteer}
              sx={{ flex: 1 }}
            />
            <DrawerContentItem
              label="Priority"
              value={sustainability.priority}
              sx={{ flex: 1 }}
            />
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={3} dir={theme.direction}>
          <Table aria-label="activity stream table">
            <TableHead
              sx={{
                backgroundColor: "var(--pallet-lighter-grey)",
              }}
            >
              <TableRow>
                <TableCell align="center">Impact Type</TableCell>
                <TableCell align="center">Unit</TableCell>
                <TableCell align="center">Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sustainability?.impactDetails?.length > 0 ? (
                sustainability?.impactDetails?.map((row) => (
                  <TableRow
                    key={`${row.id}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell align="center" component="th" scope="row">
                      {row.impactType}
                    </TableCell>
                    <TableCell align="center">{row.unit}</TableCell>
                    <TableCell align="center">{row.value}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2">No Records found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabPanel>
        <TabPanel value={activeTab} index={4} dir={theme.direction}>
          <FileItemsViewer
            label=""
            files={sustainability.documents as StorageFile[]}
            sx={{ marginY: "1rem" }}
          />
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
        <DrawerContentItem
          label="Project Location"
          value={sustainability.location}
        />
        <DrawerContentItem label="Division" value={sustainability.division} />
      </Box>
    </Stack>
  );
}

export default ViewMaternityRegisterContent;
