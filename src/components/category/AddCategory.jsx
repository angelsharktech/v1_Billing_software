import {
  Box,
  Button,
  Modal,
  TextField,
  Typography,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import {
  addCategories,
  getAllCategories,
} from "../../services/CategoryService";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import Category from "../Category";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  minWidth: 350,
};

const AddCategory = ({ open, handleClose, refresh }) => {
  const { webuser } = useAuth();
  const [categories, setCategories] = useState([]);
  // const [main, setMain] = useState(false);
  const [mainUser, setMainUser] = useState();
  const [main, setMain] = useState(true);

  const [formData, setFormData] = useState({
    categoryName: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);
  const fetchCategories = async () => {
    try {
      const result = await getUserById(webuser.id);
      setMainUser(result);
      const res = await getAllCategories();
      const parentsOnly = res.data.filter(
        (cat) => cat?.organization_id._id === result.organization_id?._id
      );
      setCategories(parentsOnly);
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleMain = () => {
    setMain((prevMain) => {
      const nextMain = !prevMain;

      setFormData((prev) => ({
        ...prev,
        categoryName: "", // Clear subcategory fields
      }));

      return nextMain;
    });
  };

  const handleCancel = () => {
    handleClose();
    setFormData({
      categoryName: "",
    });
  };

  const categoryAdd = async () => {
    try {
      const isDuplicate = categories.some(
        (cat) =>
          cat.categoryName.toLowerCase().trim() ===
          formData.categoryName.toLowerCase().trim()
      );

      if (isDuplicate) {
        setSnackbarMessage("Category Already Exist!");
        setSnackbarOpen(true);
        return; // stop execution
        
      }
      let payload;

        payload = {
          categoryName: formData.categoryName,
          organization_id: mainUser.organization_id?._id,
        };
         const res = await addCategories(payload);

        if (res) {
          setSnackbarMessage("Category Added!");
          setSnackbarOpen(true);
          fetchCategories();
          handleClose();
          refresh();
        }
      }
     catch (error) {
        console.error("Error adding category", error);
      setSnackbarMessage("Category Already Exist!");
      setSnackbarOpen(true);
    }
  };

  // const categoryAdd = async () => {
  //   try {
  //     // Trim and make case-insensitive comparison
  //     const isDuplicate = categories.some(
  //       (cat) =>
  //         cat.categoryName.toLowerCase().trim() ===
  //         formData.categoryName.toLowerCase().trim()
  //     );

  //     if (isDuplicate) {
  //       setSnackbarMessage("Category Already Exist!");
  //       setSnackbarOpen(true);
  //       return; // stop execution
        
  //     }


  //     const payload = {
  //       categoryName: formData.categoryName.trim(),
  //       organization_id: mainUser.organization_id?._id,
  //     };

  //     const res = await addCategories(payload);

  //     if (res) {
  //       setSnackbarMessage("Category Added!");
  //       setSnackbarOpen(true);
  //       fetchCategories();
  //       handleClose();
  //       refresh();
  //     }
  //   } catch (error) {
  //     console.error("Error adding category", error);
  //     setSnackbarMessage("Failed to add category!");
  //     setSnackbarOpen(true);
  //   }
  // };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6" mb={2}>
              Add Category
            </Typography>
          </Box>
          <>
            <TextField
              fullWidth
              label="Category Name"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleChange}
              margin="normal"
            />
          </>

          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button onClick={handleCancel} sx={{ mr: 2, color: "#182848" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ background: "linear-gradient(135deg, #182848, #324b84ff)" }}
              onClick={categoryAdd}
            >
              Save
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
          severity={snackbarMessage === "Category Added!" ? "success" : "error"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddCategory;
