import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
} from "@mui/material";
import OrganizationForm from "./components/OrganizationForm";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  const [organizations, setOrganizations] = useState([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddOrganization = (organization) => {
    setOrganizations((prev) => [...prev, organization]);
  };

  const handleSubmitToBackend = async () => {
    setMessage("");
    setError("");

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email");
      return;
    } else {
      setEmailError("");
    }

    if (organizations.length === 0) {
      setError("No organizations to submit");
      return;
    }

    const payload = {
      email: email.trim(),
      data: organizations.map((org) => ({
        organizationname: org.name.trim(),
        links: org.links.map((link) => link.trim()).filter((l) => !!l),
      })),
      includeGeneric: organizations[0].includeGeneric,
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
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Success:", result);
      setMessage("Submitted successfully!");
      setOrganizations([]);
      setEmail("");
    } catch (err) {
      console.error("API Error:", {
        message: err.message,
        status: err.response?.status,
        url: `${process.env.REACT_APP_API_URL}/lead-generation/scrape-and-send`,
      });
      setError(`Failed to process request: ${err.message}`);
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
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;