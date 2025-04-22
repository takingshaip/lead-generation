import { useState } from "react";
import { Container, Typography, Box, Paper, Button, TextField } from "@mui/material";
import OrganizationForm from "./components/OrganizationForm.jsx";
import OrganizationList from "./components/OrganizationList.jsx";
import CSVUploader from "./components/CSVUploader.jsx";
import { ThemeProvider } from "./components/ThemeProvider.jsx";

function App() {
  const [organizations, setOrganizations] = useState([]);
  const [email, setEmail] = useState("");

  const handleAddOrganization = (organization) => {
    setOrganizations((prev) => [...prev, organization]);
  };

  const handleCSVUpload = (csvData) => {
    console.log("Received from uploader:", csvData);
    setOrganizations((prev) => [...prev, ...csvData]);
  };


  const handleDeleteOrganization = (index) => {
    const updated = [...organizations];
    updated.splice(index, 1);
    setOrganizations(updated);
  };

  const handleEditOrganization = (index, updatedOrganization) => {
    const updated = [...organizations];
    updated[index] = updatedOrganization;
    setOrganizations(updated);
  };

  const handleSubmitToBackend = async () => {
    if (!email.trim()) {
      alert("Email is required.");
      return;
    }

    if (organizations.length === 0) {
      alert("No organizations to submit.");
      return;
    }

    // Group by organization name
    const grouped = {};
    organizations.forEach((org) => {
      const name = org.name.trim();
      if (!name) return;
      if (!grouped[name]) grouped[name] = new Set();
      org.links.forEach((link) => {
        if (link.trim()) grouped[name].add(link.trim());
      });
    });

    const payload = {
      email: email.trim(),
      data: organizations.map((org) => ({
        organizationname: org.name.trim(),
        links: org.links.map((link) => link.trim()).filter((l) => !!l),
      })),
    };


    try {
      console.log(process.env.REACT_APP_API_URL);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/lead-generation/scrape-and-send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Server error: ${response.statusText}`);

      const result = await response.json();
      console.log("Success:", result);
      alert("Submitted successfully!");
      setOrganizations([]);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Submission failed. Check the console.");
    }
  };

  return (
    <ThemeProvider>
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Organization Manager
          </Typography>

          {/* Global email input */}
          <TextField
            fullWidth
            label="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />

          <CSVUploader onCSVUpload={handleCSVUpload} />

          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <OrganizationForm onAddOrganization={handleAddOrganization} />
          </Paper>

          <OrganizationList
            organizations={organizations}
            onDeleteOrganization={handleDeleteOrganization}
            onEditOrganization={handleEditOrganization}
          />

          <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" color="secondary" onClick={handleSubmitToBackend}>
              Submit
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
