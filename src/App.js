import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Upload as UploadIcon, Edit as EditIcon } from "@mui/icons-material";
import OrganizationForm from "./components/OrganizationForm";
import { ThemeProvider } from "./components/ThemeProvider";
import * as XLSX from "xlsx";

function App() {
  const [organizations, setOrganizations] = useState([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const [includeGeneric, setIncludeGeneric] = useState(true);
  const [allDesignations, setAllDesignations] = useState(true);
  const [designations, setDesignations] = useState([]);
  const [customDesignations, setCustomDesignations] = useState("");
  const [designationError, setDesignationError] = useState("");
  const [fileError, setFileError] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);

  const designationOptions = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Dean",
    "Head",
    "Principal",
    "HOD",
    "CEO",
  ];

  const handleAddOrganization = (organization) => {
    if (editingIndex !== null) {
      setOrganizations((prev) =>
        prev.map((org, index) =>
          index === editingIndex ? organization : org
        )
      );
      setEditingIndex(null);
      setEditingOrganization(null);
    } else {
      setOrganizations((prev) => [...prev, organization]);
    }
  };

  const handleEditOrganization = (index) => {
    setEditingIndex(index);
    setEditingOrganization(organizations[index]);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingOrganization(null);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      setFileError("Please upload a CSV or XLSX file");
      setSnackbarMessage("Please upload a CSV or XLSX file");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      let data = [];
      if (file.name.endsWith(".csv")) {
        const text = e.target.result;
        const rows = text.split("\n").map((row) => row.trim()).filter((row) => row);
        const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());

        if (!headers.includes("organizationname") || !headers.includes("url")) {
          setFileError("CSV must contain 'organizationname' and 'url' columns");
          setSnackbarMessage("CSV must contain 'organizationname' and 'url' columns");
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
          return;
        }

        data = rows.slice(1).map((row) => {
          const values = row.split(",").map((value) => value.trim());
          const org = {};
          headers.forEach((header, index) => {
            org[header] = values[index] || "";
          });
          return {
            name: org.organizationname,
            links: org.url ? [org.url] : [""],
          };
        }).filter((org) => org.name);
      } else if (file.name.endsWith(".xlsx")) {
        const workbook = XLSX.read(e.target.result, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = rows[0].map((header) => header.toLowerCase().trim());
        if (!headers.includes("organizationname") || !headers.includes("url")) {
          setFileError("XLSX must contain 'organizationname' and 'url' columns");
          setSnackbarMessage("XLSX must contain 'organizationname' and 'url' columns");
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
          return;
        }

        data = rows.slice(1).map((row) => {
          const org = {};
          headers.forEach((header, index) => {
            org[header] = row[index] || "";
          });
          return {
            name: org.organizationname,
            links: org.url ? [org.url] : [""],
          };
        }).filter((org) => org.name);
      }

      if (data.length === 0) {
        setFileError("No valid organizations found in file");
        setSnackbarMessage("No valid organizations found in file");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      setFileError("");
      setOrganizations((prev) => [...prev, ...data]);
    };

    reader.onerror = () => {
      setFileError("Error reading file");
      setSnackbarMessage("Error reading file");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    };

    if (file.name.endsWith(".xlsx")) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleSuccessDialogClose = () => {
    setOpenSuccessDialog(false);
  };

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmitToBackend = async () => {
    setMessage("");
    setError("");
    setFileError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      setSnackbarMessage("Please enter a valid email");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    } else {
      setEmailError("");
    }

    if (organizations.length === 0) {
      setError("No organizations to submit");
      setSnackbarMessage("No organizations to submit");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    if (!allDesignations && designations.length === 0 && !customDesignations.trim()) {
      setDesignationError("Select at least one designation or choose All Designations");
      setSnackbarMessage("Select at least one designation or choose All Designations");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    } else {
      setDesignationError("");
    }

    const validOrganizations = organizations
      .map((org) => ({
        organizationname: org.name.trim(),
        organizationName: org.name.trim(),
        links: org.links
          .map((link) => link.trim())
          .filter((link) => link && isValidUrl(link)),
      }))
      .filter((org) => org.organizationname && org.links.length > 0);

    if (validOrganizations.length === 0) {
      setError("No valid organizations with URLs to submit");
      setSnackbarMessage("No valid organizations with URLs to submit");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    const finalDesignations = allDesignations
      ? ["all"]
      : [
        ...new Set([
          ...designations,
          ...customDesignations
            .split(",")
            .map((d) => d.trim())
            .filter((d) => d),
        ]),
      ];

    setSnackbarMessage("Processing your request...");
    setSnackbarSeverity("info");
    setOpenSnackbar(true);

    const payload = {
      email: email.trim(),
      data: validOrganizations,
      includeGeneric,
      designations: finalDesignations,
    };

    console.log("Payload being sent:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/lead-generation/scrape-and-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend Error Response:", errorData);
        throw new Error(`Server error: ${response.status} ${response.statusText}${errorData.error ? ` - ${errorData.error}` : ""}`);
      }

      const result = await response.json();
      console.log("Success:", result);
      setMessage("Submitted successfully!");
      setOrganizations([]);
      setEmail("");
      setIncludeGeneric(true);
      setAllDesignations(true);
      setDesignations([]);
      setCustomDesignations("");
      setEditingIndex(null);
      setEditingOrganization(null);
      setOpenSnackbar(false);
      setOpenSuccessDialog(true);
    } catch (err) {
      console.error("API Error:", {
        message: err.message,
        status: err.response?.status,
        url: `${process.env.REACT_APP_API_URL}/lead-generation/scrape-and-send`,
      });
      setError(`Failed to process request: ${err.message}`);
      setSnackbarMessage(`Failed to process request: ${err.message}`);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  return (
    <ThemeProvider>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Organization Manager
          </Typography>

          <TextField
            fullWidth
            label="Email *"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
                setEmailError("");
              }
            }}
            margin="normal"
            error={!!emailError}
            helperText={emailError}
            required
          />

          <Box sx={{ my: 2 }}>
            <input
              accept=".csv,.xlsx"
              style={{ display: "none" }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                color="primary"
                component="span"
                startIcon={<UploadIcon />}
              >
                Upload File
              </Button>
            </label>
            {fileError && (
              <Typography color="error" variant="caption" sx={{ ml: 2 }}>
                {fileError}
              </Typography>
            )}
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel>Include Generic Information</InputLabel>
            <Select
              value={includeGeneric ? "yes" : "no"}
              onChange={(e) => setIncludeGeneric(e.target.value === "yes")}
              label="Include Generic Information"
            >
              <MenuItem value="yes">Yes</MenuItem>
              <MenuItem value="no">No</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={allDesignations}
                onChange={(e) => setAllDesignations(e.target.checked)}
              />
            }
            label="All Designations"
            sx={{ mt: 2, mb: 1 }}
          />

          {!allDesignations && (
            <>
              <FormControl fullWidth margin="normal" error={!!designationError}>
                <InputLabel>Select Designations</InputLabel>
                <Select
                  multiple
                  value={designations}
                  onChange={(e) => {
                    setDesignations(e.target.value);
                    if (e.target.value.length > 0 || customDesignations.trim()) {
                      setDesignationError("");
                    }
                  }}
                  label="Select Designations"
                  renderValue={(selected) => selected.join(", ")}
                >
                  {designationOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                {designationError && (
                  <Typography color="error" variant="caption">
                    {designationError}
                  </Typography>
                )}
              </FormControl>

              <TextField
                fullWidth
                label="Custom Designations (comma-separated)"
                value={customDesignations}
                onChange={(e) => {
                  setCustomDesignations(e.target.value);
                  if (e.target.value.trim() || designations.length > 0) {
                    setDesignationError("");
                  }
                }}
                margin="normal"
                placeholder="e.g., Registrar,Director"
              />
            </>
          )}

          <Paper elevation={3} sx={{ p: 3, mb: 4, mt: 2 }}>
            <OrganizationForm
              onAddOrganization={handleAddOrganization}
              initialOrganization={editingOrganization}
              isEditing={editingIndex !== null}
              onCancelEdit={handleCancelEdit}
            />
          </Paper>

          {organizations.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Added Organizations
              </Typography>
              {organizations.map((org, index) => (
                <Box key={index} sx={{ mb: 1, display: "flex", alignItems: "center" }}>
                  <Typography sx={{ flexGrow: 1 }}>
                    {org.name} - Links: {org.links.join(", ")}
                  </Typography>
                  <IconButton
                    onClick={() => handleEditOrganization(index)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmitToBackend}
              disabled={organizations.length === 0}
            >
              Submit
            </Button>
          </Box>

          {message && (
            <Typography color="success.main" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

          <Snackbar
            open={openSnackbar}
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={handleSnackbarClose}
              severity={snackbarSeverity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>

          <Dialog
            open={openSuccessDialog}
            onClose={handleSuccessDialogClose}
            aria-labelledby="success-dialog-title"
          >
            <DialogTitle id="success-dialog-title">Success</DialogTitle>
            <DialogContent>
              <Typography>Processing complete! Email sent successfully.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleSuccessDialogClose} color="primary">
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;