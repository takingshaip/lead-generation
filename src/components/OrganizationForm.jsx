import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

export default function OrganizationForm({ onAddOrganization, initialOrganization, isEditing = false, onCancelEdit }) {
  const [name, setName] = useState(initialOrganization?.name || "");
  const [links, setLinks] = useState(initialOrganization?.links || [""]);
  const [nameError, setNameError] = useState("");
  const [includeGeneric, setIncludeGeneric] = useState(initialOrganization?.includeGeneric ?? "yes");
  const [allDesignations, setAllDesignations] = useState(initialOrganization?.allDesignations ?? true);
  const [designations, setDesignations] = useState(initialOrganization?.designations || []);
  const [customDesignations, setCustomDesignations] = useState(initialOrganization?.customDesignations || "");
  const [designationError, setDesignationError] = useState("");

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

  const handleAddLink = () => setLinks([...links, ""]);

  const handleLinkChange = (index, value) => {
    const updatedLinks = [...links];
    updatedLinks[index] = value;
    setLinks(updatedLinks);
  };

  const handleRemoveLink = (index) => {
    if (links.length > 1) {
      const updatedLinks = links.filter((_, i) => i !== index);
      setLinks(updatedLinks);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError("Organization name is required");
      return;
    } else {
      setNameError("");
    }

    if (!allDesignations && designations.length === 0 && !customDesignations.trim()) {
      setDesignationError("Select at least one designation or choose All Designations");
      return;
    } else {
      setDesignationError("");
    }

    const filteredLinks = links.filter((link) => link.trim() !== "");
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

    onAddOrganization({
      name: name.trim(),
      links: filteredLinks.length > 0 ? filteredLinks : [""],
      includeGeneric: includeGeneric === "yes",
      designations: finalDesignations,
      allDesignations,
      customDesignations,
    });

    if (!isEditing) {
      setName("");
      setLinks([""]);
      setIncludeGeneric("yes");
      setAllDesignations(true);
      setDesignations([]);
      setCustomDesignations("");
    } else if (onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Typography variant="h6" gutterBottom>
        {isEditing ? "Edit Organization" : "Add New Organization"}
      </Typography>

      <TextField
        fullWidth
        label="Organization Name *"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (e.target.value.trim()) setNameError("");
        }}
        margin="normal"
        error={!!nameError}
        helperText={nameError}
        required
      />

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
        Links
      </Typography>

      <List>
        {links.map((link, index) => (
          <ListItem
            key={index}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleRemoveLink(index)}
                disabled={links.length === 1}
              >
                <DeleteIcon />
              </IconButton>
            }
            disablePadding
            sx={{ mb: 1 }}
          >
            <ListItemText
              primary={
                <TextField
                  fullWidth
                  label={`Link ${index + 1}`}
                  value={link}
                  onChange={(e) => handleLinkChange(index, e.target.value)}
                  size="small"
                  placeholder="https://example.com"
                />
              }
            />
          </ListItem>
        ))}
      </List>

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddLink}
        sx={{ mb: 2 }}
        disabled={links[links.length - 1] === ""}
      >
        Add Link
      </Button>

      <FormControl fullWidth margin="normal">
        <InputLabel>Include Generic Information</InputLabel>
        <Select
          value={includeGeneric}
          onChange={(e) => setIncludeGeneric(e.target.value)}
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

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        {isEditing && onCancelEdit && (
          <Button onClick={onCancelEdit} color="inherit">
            Cancel
          </Button>
        )}
        <Button type="submit" variant="contained" color="primary">
          {isEditing ? "Save Changes" : "Add Organization"}
        </Button>
      </Box>
    </Box>
  );
}