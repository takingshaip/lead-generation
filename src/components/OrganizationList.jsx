import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Link,
  Divider,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import OrganizationForm from "./OrganizationForm";

export default function OrganizationList({ organizations, onDeleteOrganization, onEditOrganization }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);

  const handleToggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleStartEditing = (index) => {
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleSaveEdit = (organization) => {
    if (editingIndex !== null) {
      onEditOrganization(editingIndex, organization);
      setEditingIndex(null);
    }
  };

  if (organizations.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No organizations added yet. Use the form above to add your first organization.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Organizations
      </Typography>

      {organizations.map((org, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          {editingIndex === index ? (
            <CardContent>
              <OrganizationForm
                onAddOrganization={handleSaveEdit}
                initialOrganization={org}
                isEditing={true}
                onCancelEdit={handleCancelEdit}
              />
            </CardContent>
          ) : (
            <>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6" component="div">
                    {org.name}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleExpand(index)}
                      aria-expanded={expandedIndex === index}
                      aria-label="show more"
                    >
                      {expandedIndex === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Box>
                </Box>

                <Collapse in={expandedIndex === index} timeout="auto" unmountOnExit>
                  <List dense>
                    {org.links.map((link, linkIndex) => (
                      <ListItem key={linkIndex} disablePadding>
                        <ListItemText
                          primary={
                            <Link
                              href={link.startsWith("http") ? link : `https://${link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                            >
                              {link}
                            </Link>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </CardContent>

              <Divider />

              <CardActions>
                <Button size="small" startIcon={<EditIcon />} onClick={() => handleStartEditing(index)}>
                  Edit
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDeleteOrganization(index)}
                >
                  Delete
                </Button>
              </CardActions>
            </>
          )}
        </Card>
      ))}
    </Box>
  );
}