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
import { DrawerContentItem } from "../../components/ViewDataDrawer";
import { format } from "date-fns";
import { useState } from "react";
import theme from "../../theme";
import useIsMobile from "../../customHooks/useIsMobile";
import TextSnippetIcon from "@mui/icons-material/TextSnippet";
import ListIcon from "@mui/icons-material/List";
import { Document } from "../../api/documentApi";
import HistoryIcon from "@mui/icons-material/History";
import { FileItemsViewer } from "../../components/FileItemsViewer";
import { StorageFile } from "../../utils/StorageFiles.util";

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

function ViewDocumentContent({ document }: { document: Document }) {
  const [activeTab, setActiveTab] = useState(0);
  const { isTablet } = useIsMobile();

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
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
            label="Reference"
            value={document.id}
            sx={{ flex: 1 }}
          />
          <DrawerContentItem
            label="Reported Date"
            value={
              document.createdDate
                ? format(new Date(document.createdDate), "yyyy-MM-dd")
                : "N/A"
            }
            sx={{ flex: 1 }}
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
                  <TextSnippetIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Current Document
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
                  <HistoryIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Document History
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
                  <ListIcon fontSize="small" />
                  <Typography variant="body2" sx={{ ml: "0.3rem" }}>
                    Activity Stream
                  </Typography>
                </Box>
              }
              {...a11yProps(1)}
            />
          </Tabs>
        </AppBar>
        <TabPanel value={activeTab} index={0} dir={theme.direction}>
          <Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "column" : "row",
                justifyContent: "space-between",
              }}
            >
              <DrawerContentItem
                label="Document Type"
                value={document.documentType}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Division"
                value={document.division}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "column" : "row",
                justifyContent: "space-between",
              }}
            >
              <DrawerContentItem
                label="Issuing Authority"
                value={document.issuingAuthority}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Document Number"
                value={document.documentNumber}
                sx={{ flex: 1 }}
              />
            </Box>{" "}
            <DrawerContentItem
              label="Title"
              value={document.title}
              sx={{ flex: 1 }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "column" : "row",
                justifyContent: "space-between",
              }}
            >
              <DrawerContentItem
                label="Document Owner"
                value={document.documentOwner}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Document Reviewer"
                value={document.documentReviewer}
                sx={{ flex: 1 }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: isTablet ? "column" : "row",
                justifyContent: "space-between",
              }}
            >
              <DrawerContentItem
                label="Physical Location"
                value={document.physicalLocation}
                sx={{ flex: 1 }}
              />
              <DrawerContentItem
                label="Version Number"
                value={document.versionNumber}
                sx={{ flex: 1 }}
              />
            </Box>
            <DrawerContentItem
              label="Remarks"
              value={document.remarks}
              sx={{ flex: 1 }}
            />
            <Box>
              <FileItemsViewer
                label="Document Files"
                files={document.document as StorageFile[]}
                sx={{ marginY: "1rem" }}
              />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={1} dir={theme.direction}>
          <Table aria-label="document history table">
            <TableHead
              sx={{
                backgroundColor: "var(--pallet-lighter-blue)",
              }}
            >
              <TableRow>
                <TableCell>Document Number</TableCell>
                <TableCell align="center">Issue Date</TableCell>
                <TableCell align="center">Expiry Date</TableCell>
                <TableCell align="center">Notify Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {document?.documentHistory?.length > 0 ? (
                document?.documentHistory.map((row) => (
                  <TableRow
                    key={`${row.expiryDate}${row.issuedDate}${row.notifyDate}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell component="th" align="center" scope="row">
                      {row.documentNumber}
                    </TableCell>
                    <TableCell align="center">
                      {row.issuedDate?.toDateString()}
                    </TableCell>
                    <TableCell align="center">
                      {row.expiryDate?.toDateString()}
                    </TableCell>
                    <TableCell align="center">
                      {row.notifyDate?.toDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2">
                      No document history found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabPanel>
        <TabPanel value={activeTab} index={2} dir={theme.direction}>
          <Table aria-label="activity stream table">
            <TableHead
              sx={{
                backgroundColor: "var(--pallet-lighter-blue)",
              }}
            >
              <TableRow>
                <TableCell align="center">Time</TableCell>
                <TableCell align="center">User</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {document?.activityStream?.length > 0 ? (
                document?.activityStream.map((row) => (
                  <TableRow
                    key={`${row.action}${row.date}${row.user}`}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      cursor: "pointer",
                    }}
                  >
                    <TableCell align="center" component="th" scope="row">
                      {row.date?.toDateString()}
                    </TableCell>
                    <TableCell align="center">{row.user}</TableCell>
                    <TableCell align="center">{row.action}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2">
                      No document activity found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
        <DrawerContentItem label="Reported By" value={document.createdBy} />
        <DrawerContentItem
          label="Issued Date"
          value={
            document.issuedDate
              ? format(new Date(document.issuedDate), "yyyy-MM-dd")
              : "N/A"
          }
        />
        <DrawerContentItem
          label="Expiry Date"
          value={
            document.expiryDate
              ? format(new Date(document.expiryDate), "yyyy-MM-dd")
              : "N/A"
          }
        />
        <DrawerContentItem
          label="Notify Date"
          value={
            document.notifyDate
              ? format(new Date(document.notifyDate), "yyyy-MM-dd")
              : "N/A"
          }
        />
      </Box>
    </Stack>
  );
}

export default ViewDocumentContent;
