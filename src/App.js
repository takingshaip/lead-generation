import React, { useState, useEffect } from "react";
// Standard React and Material UI imports ONLY
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
  Grid,
  createTheme,
  ThemeProvider as MuiThemeProvider,
  CssBaseline,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Delete as DeleteIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";

// --- Configuration (No Firebase) ---
// Use a placeholder ID since we are not using Firebase auth
const placeholderUserId = 'user-' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9));
const appId = 'local-lead-app'; // Placeholder app ID
const STATIC_LOGIN = {
  email: process.env.REACT_APP_LOGIN_EMAIL,
  password: process.env.REACT_APP_LOGIN_PASSWORD,
};

// Helper function for exponential backoff retry logic
const fetchWithRetry = async (url, options) => {
  const maxRetries = 3;
  let delayTime = 1000; 

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
 
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 400 || response.status === 404) {
        return response;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        await delay(delayTime);
        delayTime *= 2;
      }
    }
  }
  throw new Error('Failed to fetch after retries');
};


// --- COMPONENTS DEFINED INLINE ---

// 1. ThemeProvider Component
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

const ThemeProvider = ({ children }) => {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

// 2. OrganizationForm Component
const OrganizationForm = ({ onAddOrganization, initialOrganization, isEditing, onCancelEdit }) => {
  const [name, setName] = useState("");
  const [links, setLinks] = useState([""]); 
  const [error, setError] = useState("");

  useEffect(() => {
    // Populate form if editing
    if (initialOrganization) {
      setName(initialOrganization.name || "");
      setLinks(initialOrganization.links && initialOrganization.links.length > 0 ? [initialOrganization.links[0]] : [""]);
    } else if (!isEditing) {
      // Reset form if starting a new addition and not editing
      resetForm();
    }
  }, [initialOrganization, isEditing]);

  const resetForm = () => {
    setName("");
    setLinks([""]);
    setError("");
  };

  const handleLinkChange = (value) => {
    setLinks([value]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Organization Name is required");
      return;
    }
    
    const singleLink = links[0] ? links[0].trim() : "";
    if (!singleLink) {
      setError("A URL (Where) is required");
      return;
    }

    onAddOrganization({
      name: name.trim(),
      links: [singleLink],
    });
    
    if (!isEditing) {
      resetForm();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        {isEditing ? "Edit Organization" : "Add Organization"}
      </Typography>
      
      <TextField
        fullWidth
        label="Organization Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
        required
      />

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
        URL (The "Where" to find the organization)
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="Organization URL (e.g., https://example.com)"
          value={links[0] || ""} 
          onChange={(e) => handleLinkChange(e.target.value)}
          size="small"
          placeholder="https://example.com"
          required
        />
      </Box>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        {isEditing && (
          <Button variant="outlined" color="inherit" onClick={onCancelEdit} startIcon={<ClearIcon />}>
            Cancel
          </Button>
        )}
        <Button variant="contained" color="primary" type="submit">
          {isEditing ? "Update" : "Add"}
        </Button>
      </Stack>
    </Box>
  );
};

// --- MAIN APP COMPONENT ---

function App() {
  const [organizations, setOrganizations] = useState([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  
  // Options
  const [includeGeneric, setIncludeGeneric] = useState(true);
  const [findAddress, setFindAddress] = useState(false);
  
  // Designation States
  const [allDesignations, setAllDesignations] = useState(true);
  const [designations, setDesignations] = useState([]);
  const [customDesignations, setCustomDesignations] = useState("");
  const [designationError, setDesignationError] = useState("");

  // File Upload States
  const [fileError, setFileError] = useState("");
  const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);

  // Editing States
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Use a simple state for "authentication" readiness
  const isAuthReady = true; // Always ready since we removed Firebase

  // Load XLSX from CDN dynamically (required for XLSX file parsing)
  useEffect(() => {
    if (typeof window.XLSX !== 'undefined') {
      setIsXlsxLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.async = true;
    script.onload = () => setIsXlsxLoaded(true);
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
         document.body.removeChild(existingScript);
      }
    };
  }, []);

  const designationOptions = [
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Dean",
    "Head",
    "Principal",
    "HOD",
    "CEO",
    "Director",
    "Manager",
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
      setSnackbarMessage("Organization updated.");
    } else {
      setOrganizations((prev) => [...prev, organization]);
      setSnackbarMessage("Organization added.");
    }
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
  };

  const handleEditOrganization = (index) => {
    setEditingIndex(index);
    setEditingOrganization(organizations[index]);
  };

  const handleDeleteOrganization = (index) => {
    setOrganizations((prev) => prev.filter((_, i) => i !== index));
    setSnackbarMessage("Organization removed.");
    setSnackbarSeverity("warning");
    setOpenSnackbar(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingOrganization(null);
  };

  // Function to download a sample CSV file
  const downloadSampleFile = () => {
    const csvContent =
      "OrganizationName,URL\n" +
      "Example University,https://www.exampleuniversity.edu\n" +
      "Global Tech Corp,https://www.globaltech.com";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'organization_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = null; // Clear file input

    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      setFileError("Please upload a CSV or XLSX file");
      setSnackbarMessage("Please upload a CSV or XLSX file");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setFileError("");

    const reader = new FileReader();
    reader.onload = (e) => {
      let data = [];
      const fileType = file.name.endsWith(".csv") ? "csv" : "xlsx";

      if (fileType === "csv") {
        const text = e.target.result;
        const rows = text.split("\n").map((row) => row.trim()).filter((row) => row);
        if (rows.length < 2) {
           setFileError("File is empty or only contains headers.");
           setSnackbarMessage("File is empty or only contains headers.");
           setSnackbarSeverity("error");
           setOpenSnackbar(true);
           return;
        }
        const headers = rows[0].split(",").map((header) => header.trim().toLowerCase());

        const nameHeaderIndex = headers.findIndex(h => h.includes('organizationname') || h.includes('name'));
        const urlHeaderIndex = headers.findIndex(h => h.includes('url') || h.includes('link'));

        if (nameHeaderIndex === -1 || urlHeaderIndex === -1) {
          setFileError("CSV must contain columns similar to 'OrganizationName' and 'URL'");
          setSnackbarMessage("CSV must contain columns similar to 'OrganizationName' and 'URL'");
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
          return;
        }

        data = rows.slice(1).map((row) => {
          const values = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(",").map((v) => v.trim());
          
          const orgName = values[nameHeaderIndex] ? values[nameHeaderIndex].replace(/^"|"$/g, '').trim() : '';
          const orgUrl = values[urlHeaderIndex] ? values[urlHeaderIndex].replace(/^"|"$/g, '').trim() : '';
          
          return {
            name: orgName,
            links: orgUrl ? [orgUrl] : [""],
          };
        }).filter((org) => org.name && org.links[0]); 
      } else if (fileType === "xlsx") {
        if (!isXlsxLoaded || typeof window.XLSX === 'undefined') {
           setFileError("XLSX parser is still loading. Please try again in a moment.");
           setSnackbarMessage("XLSX parser is still loading. Please try again in a moment.");
           setSnackbarSeverity("warning");
           setOpenSnackbar(true);
           return;
        }
        
        try {
            const workbook = window.XLSX.read(e.target.result, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (!rows || rows.length < 2) {
                 setFileError("File is empty or only contains headers.");
                 setSnackbarMessage("File is empty or only contains headers.");
                 setSnackbarSeverity("error");
                 setOpenSnackbar(true);
                 return;
            }

            const headers = rows[0].map((header) => String(header).toLowerCase().trim());
            
            const nameHeader = headers.find(h => h.includes('organizationname') || h.includes('name'));
            const urlHeader = headers.find(h => h.includes('url') || h.includes('link'));

            if (!nameHeader || !urlHeader) {
              setFileError("XLSX must contain columns similar to 'OrganizationName' and 'URL'");
              setSnackbarMessage("XLSX must contain columns similar to 'OrganizationName' and 'URL'");
              setSnackbarSeverity("error");
              setOpenSnackbar(true);
              return;
            }

            data = rows.slice(1).map((row) => {
              const org = {};
              headers.forEach((header, index) => {
                org[headers[index]] = row[index] || "";
              });

              const orgName = org[nameHeader] || '';
              const orgUrl = org[urlHeader] || '';

              return {
                name: String(orgName).trim(),
                links: orgUrl ? [String(orgUrl).trim()] : [""],
              };
            }).filter((org) => org.name && org.links[0]); 
        } catch (err) {
            console.error("XLSX Parsing Error:", err);
            setFileError("Failed to parse XLSX file");
            setSnackbarMessage("Failed to parse XLSX file");
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            return;
        }
      }

      if (data.length === 0) {
        setFileError("No valid organizations found in file");
        setSnackbarMessage("No valid organizations found in file");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
      
      setOrganizations((prev) => [...prev, ...data]);
      setSnackbarMessage(`${data.length} organizations imported successfully.`);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
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
    // Basic check to ensure a protocol is present
    return url.startsWith("http://") || url.startsWith("https://");
  };

  const handleSubmitToBackend = async () => {
    setMessage("");
    setError("");
    setFileError("");
    setLoading(true);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      setSnackbarMessage("Please enter a valid email");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    } else {
      setEmailError("");
    }

    if (organizations.length === 0) {
      setError("No organizations to submit");
      setSnackbarMessage("No organizations to submit");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    if (!allDesignations) {
      // Only validate if "All Designations" is NOT selected
      if (designations.length === 0 && !customDesignations.trim()) {
        setDesignationError("Select at least one designation or enter a custom designation.");
        setSnackbarMessage("Select at least one designation or enter a custom designation.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      } else {
        setDesignationError("");
      }
    } else {
      setDesignationError("");
    }

    // Prepare organizations for the backend
    const validOrganizations = organizations
      .map((org) => ({
        organizationname: org.name.trim(),
        links: org.links
          .map((link) => link.trim())
          .filter((link) => link && isValidUrl(link)),
      }))
      .filter((org) => org.organizationname && org.links.length > 0);

    if (validOrganizations.length === 0) {
      setError("No valid organizations with proper URLs to submit. Ensure URLs start with http/https.");
      setSnackbarMessage("No valid organizations with proper URLs to submit.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setLoading(false);
      return;
    }

    // Prepare designations for the backend
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
      
    // The endpoint path provided in the previous interaction
    const API_ENDPOINT = `${process.env.REACT_APP_API_URL}/lead-generation/scrape-and-send`; 

    setSnackbarMessage("Submitting request and processing organizations...");
    setSnackbarSeverity("info");
    setOpenSnackbar(true);

    const payload = {
      email: email.trim(),
      data: validOrganizations,
      includeGeneric,
      findAddress,
      designations: finalDesignations, // <-- send as array, not string
    };

    try {
      const response = await fetchWithRetry(API_ENDPOINT, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          'X-App-Id': appId, 
          'Authorization': `Bearer anonymous`, // Simple anonymous token since Firebase is removed
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(result.message || "Request submitted successfully. Check your email for the CSV file.");
        setOpenSnackbar(false); 
        setOpenSuccessDialog(true);
        
        // Reset form on success
        setOrganizations([]);
        setEmail("");
        setIncludeGeneric(true);
        setFindAddress(false);
        setAllDesignations(true);
        setDesignations([]);
        setCustomDesignations("");
        setEditingIndex(null);
        setEditingOrganization(null);
      } else {
        setError(result.error || `Submission failed with status: ${response.status}`);
        setSnackbarMessage(result.error || "Submission failed.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
      
    } catch (err) {
      console.error("API Error:", err);
      setError(`Failed to process request: ${err.message}`);
      setSnackbarMessage(`Failed to process request: ${err.message}`);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const normalizedEmail = loginEmail.trim().toLowerCase();
    const normalizedStaticEmail = STATIC_LOGIN.email.toLowerCase();
    if (normalizedEmail === normalizedStaticEmail && loginPassword === STATIC_LOGIN.password) {
      setIsAuthenticated(true);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
    } else {
      setLoginError("Invalid email or password.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <ThemeProvider>
        <Container maxWidth="sm">
          <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
            <Paper elevation={3} sx={{ p: 4, width: "100%" }}>
              <Typography variant="h5" gutterBottom align="center">
                Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
                Enter the static credentials to access the tool.
              </Typography>
              <Box component="form" onSubmit={handleLoginSubmit}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginError) setLoginError("");
                  }}
                  margin="normal"
                  required
                />
                {loginError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {loginError}
                  </Alert>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  fullWidth
                  sx={{ mt: 3 }}
                >
                  Sign In
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Intelligent Lead Generation Tool
          </Typography>

          {/* User ID Placeholder (no Firebase needed) */}
          <Box sx={{ mb: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              User ID: {placeholderUserId} (Local Session)
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button variant="outlined" color="inherit" size="small" onClick={handleLogout}>
              Logout
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Delivery Email *"
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

          {/* File Upload and Sample CSV Download */}
          <Paper elevation={1} sx={{ p: 2, my: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Import Organizations via File (CSV or XLSX)
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                accept=".csv,.xlsx"
                style={{ display: "none" }}
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                disabled={!isXlsxLoaded}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  color="primary"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={!isXlsxLoaded}
                >
                  {isXlsxLoaded ? "Upload File" : "Loading file parser..."}
                </Button>
              </label>
              <Button
                variant="outlined"
                color="info"
                onClick={downloadSampleFile}
                startIcon={<DownloadIcon />}
              >
                Sample File
              </Button>
            </Box>
            {fileError && (
              <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
                {fileError}
              </Typography>
            )}
             {!isXlsxLoaded && (
              <Typography color="text.secondary" variant="caption" sx={{ mt: 1, display: 'block' }}>
                Loading spreadsheet library (xlsx)...
              </Typography>
            )}
          </Paper>

          {/* Designation Selection (What position holder emails to find) */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Designation Filters (Whose emails to search for)
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={allDesignations}
                  onChange={(e) => setAllDesignations(e.target.checked)}
                />
              }
              label="All Designations (Searches for general contacts. Recommended if uncertain.)"
              sx={{ mb: 1 }}
            />

            {!allDesignations && (
              <>
                <FormControl fullWidth margin="normal" error={!!designationError}>
                  <InputLabel>Select Common Designations</InputLabel>
                  <Select
                    multiple
                    value={designations}
                    onChange={(e) => {
                      setDesignations(e.target.value);
                      if (e.target.value.length > 0 || customDesignations.trim()) {
                        setDesignationError("");
                      }
                    }}
                    label="Select Common Designations"
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {designationOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Custom Designations (comma-separated, e.g., Registrar,President)"
                  value={customDesignations}
                  onChange={(e) => {
                    setCustomDesignations(e.target.value);
                    if (e.target.value.trim() || designations.length > 0) {
                      setDesignationError("");
                    }
                  }}
                  margin="normal"
                  error={!!designationError}
                  helperText={designationError}
                />
              </>
            )}
          </Paper>
          
          {/* Add/Edit Organization */}
          <Paper elevation={3} sx={{ p: 3, my: 4 }}>
            <OrganizationForm
              onAddOrganization={handleAddOrganization}
              initialOrganization={editingOrganization}
              isEditing={editingIndex !== null}
              onCancelEdit={handleCancelEdit}
            />
          </Paper>


          {/* Organization Options */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Include Generic Contacts (info@, sales@, etc.)</InputLabel>
                <Select
                  value={includeGeneric ? "yes" : "no"}
                  onChange={(e) => setIncludeGeneric(e.target.value === "yes")}
                  label="Include Generic Contacts (info@, sales@, etc.)"
                >
                  <MenuItem value="yes">Yes</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" sx={{ display: 'flex', justifyContent: 'center', height: '100%' }}>
                 <FormControlLabel
                  control={
                    <Checkbox
                      checked={findAddress}
                      onChange={(e) => setFindAddress(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationIcon sx={{ mr: 1, fontSize: 20, color: 'text.secondary' }} />
                      <Typography>Find Physical Address (Requires more processing time)</Typography>
                    </Box>
                  }
                />
              </FormControl>
            </Grid>
          </Grid>

          {/* Organization Listing - The place where you see your added organizations */}
          {organizations.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, mb: 4, mt: 4, bgcolor: 'grey.50' }}>
              <Typography variant="h6" gutterBottom color="primary">
                Organizations Ready for Scrape ({organizations.length})
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                {organizations.map((org, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, borderBottom: '1px solid #eee', display: "flex", alignItems: "center" }}>
                    <Typography sx={{ flexGrow: 1, fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: 'bold' }}>{org.name}</span>: <a href={org.links[0]} target="_blank" rel="noopener noreferrer" style={{color: theme.palette.primary.main, textDecoration: 'none'}}>{org.links[0]}</a>
                    </Typography>
                    <IconButton
                      onClick={() => handleEditOrganization(index)}
                      color="primary"
                      size="small"
                      aria-label={`Edit ${org.name}`}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                     <IconButton
                      onClick={() => handleDeleteOrganization(index)}
                      color="secondary"
                      size="small"
                      aria-label={`Delete ${org.name}`}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Submit Button */}
          <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSubmitToBackend}
              disabled={organizations.length === 0 || loading || !isAuthReady}
              size="large"
              sx={{ width: '100%', maxWidth: 300 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Submit & Get CSV"}
            </Button>
          </Box>

          {/* Status Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {/* Snackbar for Notifications */}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
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

          {/* Success Dialog */}
          <Dialog
            open={openSuccessDialog}
            onClose={handleSuccessDialogClose}
            aria-labelledby="success-dialog-title"
          >
            <DialogTitle id="success-dialog-title">Request Submitted</DialogTitle>
            <DialogContent>
              <Typography>Your lead generation request has been successfully submitted for processing. The results will be delivered to your email: <span style={{fontWeight: 'bold'}}>{email}</span>.</Typography>
              <Typography sx={{mt: 1, fontStyle: 'italic', fontSize: '0.9rem'}}>Note: Processing time depends on the number of organizations.</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleSuccessDialogClose} color="primary">
                Got It
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
