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
} from "@mui/material";
import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";

export default function OrganizationForm({ onAddOrganization, initialOrganization, isEditing = false, onCancelEdit }) {
  const [name, setName] = useState(initialOrganization?.name || "");
  const [links, setLinks] = useState(initialOrganization?.links || [""]);
  const [nameError, setNameError] = useState("");

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

    const filteredLinks = links.filter((link) => link.trim() !== "");

    onAddOrganization({
      name: name.trim(),
      links: filteredLinks.length > 0 ? filteredLinks : [""],
    });

    if (!isEditing) {
      setName("");
      setLinks([""]);
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