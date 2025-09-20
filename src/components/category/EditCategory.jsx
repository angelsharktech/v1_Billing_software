import {
  Alert,
  Box,
  Button,
  Modal,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  getAllCategories,
  updateCategory,
} from "../../services/CategoryService";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  minWidth: 400,
};

const EditCategory = ({ edit, data, handleCloseEdit, refresh }) => {
  const { webuser } = useAuth();
  const [categories, setCategories] = useState([]);
  // Consistent state shape: use 'name' and 'slug'
  const [formData, setFormData] = useState({
    categoryName: "",
    slug: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // fetch current user (organization) and categories
        const result = await getUserById(webuser.id);
        const res = await getAllCategories();

        // Filter categories by organization id (adjust fields per your API)
        const parentsOnly = res.data.filter(
          (cat) => cat?.organization_id?._id === result.organization_id?._id
        );
        setCategories(parentsOnly);

        if (data) {
          // Prefill with backend's field names: assume data has .name and .slug/_id
          setFormData({
            categoryName: data.categoryName ?? data.categoryName ?? "",
            slug: data.slug ?? (data.name ? String(data.name).toLowerCase() : ""),
          });
        }
      } catch (err) {
        console.error("Error loading categories", err);
      }
    };

    if (webuser?.id) fetchCategories();
  }, [data, webuser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    try {
      // Build payload with fields your backend expects (name and slug)
      const payload = {
        categoryName: formData.categoryName,
        // slug: formData.categoryName ? formData.categoryName.toLowerCase().replace(/\s+/g, "-") : formData.slug,
        // add other fields here if needed, e.g. parent
      };

      // Make sure you pass the correct id field expected by the API (data._id or data.id)
      const idToUse = data._id ?? data.id;
      if (!idToUse) {
        throw new Error("Missing category id to update (data._id or data.id)");
      }

      const result = await updateCategory(idToUse, payload);
      // check result shape — adapt if your service returns e.g. result.data.success
      if (result) {
        setSnackbarMessage("Category Updated!");
        setSnackbarOpen(true);
        refresh?.(); // call parent's refresh if provided
        handleCloseEdit?.();
      } else {
        // defensive: if result is falsy
        setSnackbarMessage("Update failed: empty response");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Update failed", error);
      setSnackbarMessage(error?.message ?? "Update failed");
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Modal open={edit} onClose={handleCloseEdit}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Edit Category
          </Typography>

          <TextField
            fullWidth
            label="Category Name"
            name="categoryName"                   // <-- use "name"
            value={formData.categoryName}
            onChange={handleChange}
            margin="normal"
          />
{/* 
          <TextField
            fullWidth
            label="Slug (optional)"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            margin="normal"
            helperText="Auto-generated from name if left empty"
          /> */}

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleCloseEdit} sx={{ mr: 2, color: "#182848" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ background: "linear-gradient(135deg, #182848, #324b84ff)" }}
              onClick={handleUpdate}
            >
              Update
            </Button>
          </Box>
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage === "Category Updated!" ? "success" : "error"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditCategory;
