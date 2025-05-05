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
} from "@mui/material";
import OrganizationForm from "./components/OrganizationForm";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  const [organizations, setOrganizations] = useState([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  const handleAddOrganization = (organization) => {
    setOrganizations((prev) => [...prev, organization]);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setOpenSnackbar(false);
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

    // Show start notification
    setSnackbarMessage("Processing your request...");
    setSnackbarSeverity("info");
    setOpenSnackbar(true);

    const payload = {
      email: email.trim(),
      data: validOrganizations,
      includeGeneric: organizations[0].includeGeneric === "yes",
      designations: organizations[0].designations,
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
      // Show completion notification
      setSnackbarMessage("Processing complete! Email sent.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
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

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <OrganizationForm onAddOrganization={handleAddOrganization} />
          </Paper>

          {organizations.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Added Organizations
              </Typography>
              {organizations.map((org, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography>
                    {org.name} - Links: {org.links.join(", ")} | Generic: {org.includeGeneric ? "Yes" : "No"} | Designations: {org.allDesignations ? "All" : org.designations.join(", ")}{org.customDesignations ? `, ${org.customDesignations}` : ""}
                  </Typography>
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
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;