import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

const ApparelOrderSheet = () => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  };

  const renderSizeGrid = (
    title: string,
    sizes: string[]
  ) => (
    <Box mt={3}>
      <Typography variant="subtitle2" gutterBottom fontWeight="bold" align="center">
        {title}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {sizes.map((size) => (
                <TableCell key={size} align="center" sx={{ fontWeight: "bold" }}>
                  {size}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {sizes.map((size) => (
                <TableCell key={`${title}-${size}`} align="center" padding="none">
                  <TextField variant="outlined" size="small" type="number" fullWidth inputProps={{ min: 0, style: { textAlign: 'center' } }} />
                </TableCell>
              ))}
              <TableCell align="center" padding="none">
                <TextField variant="outlined" size="small" type="number" fullWidth InputProps={{ readOnly: true }} inputProps={{ style: { textAlign: 'center', fontWeight: 'bold' } }} />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: "1200px", margin: "0 auto" }}>
        <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
          DILMANI APPAREL - ORDER SHEET
        </Typography>

        <Divider sx={{ my: 3 }} />

        {/* Header Information */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Date" type="date" InputLabelProps={{ shrink: true }} size="small" margin="normal" />
            <TextField fullWidth label="Customer" size="small" margin="normal" />
            <TextField fullWidth label="Kind of Fabric" size="small" margin="normal" />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Delivery Date" type="date" InputLabelProps={{ shrink: true }} size="small" margin="normal" />
            <TextField fullWidth label="Contact No" size="small" margin="normal" />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Design Upload Section */}
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                height: 300,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
              component="label"
            >
              <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, setFrontImage)} />
              {frontImage ? (
                <img src={frontImage} alt="Front Design" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <>
                  <CloudUploadIcon color="action" sx={{ fontSize: 60, mb: 1 }} />
                  <Typography color="textSecondary">Upload Front Design</Typography>
                </>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                height: 300,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
              component="label"
            >
              <input type="file" hidden accept="image/*" onChange={(e) => handleImageUpload(e, setBackImage)} />
              {backImage ? (
                <img src={backImage} alt="Back Design" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <>
                  <CloudUploadIcon color="action" sx={{ fontSize: 60, mb: 1 }} />
                  <Typography color="textSecondary">Upload Back Design</Typography>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Size Grids */}
        {renderSizeGrid("GENTS SIZE", ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"])}
        {renderSizeGrid("LADIES SIZE", ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"])}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            {renderSizeGrid("BOYS SIZE", ["4", "5", "6", "7"])}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderSizeGrid("PRESCHOOL SIZE", ["S", "M", "L", "XL"])}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Remarks and Pricing Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>REMARK</Typography>
            <TextField fullWidth multiline rows={8} variant="outlined" placeholder="Enter any additional remarks here..." />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>ITEMS</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>PRICES</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {["ELDERS", "PRESCHOOL", "BOYS", "SHORTS", "BOTTOM", "SKINEE", "JACKET"].map((item) => (
                    <TableRow key={item}>
                      <TableCell>{item}</TableCell>
                      <TableCell padding="none">
                        <TextField size="small" type="number" fullWidth variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={12} md={3}>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }} colSpan={2}>EMBROIDER DETAILS :</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {["FRONT", "BACK", "SLEEVES", "OTHERS"].map((item) => (
                    <TableRow key={item}>
                      <TableCell>{item}</TableCell>
                      <TableCell padding="none">
                        <TextField size="small" fullWidth variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>TOTAL PRICE</TableCell>
                    <TableCell padding="none"><TextField size="small" type="number" fullWidth variant="outlined" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>ADVANCE</TableCell>
                    <TableCell padding="none"><TextField size="small" type="number" fullWidth variant="outlined" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>BALANCE</TableCell>
                    <TableCell padding="none"><TextField size="small" type="number" fullWidth variant="outlined" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button variant="contained" color="primary" size="large">
            Convert to Sales Order
          </Button>
        </Box>

      </Paper>
    </Box>
  );
};

export default ApparelOrderSheet;
