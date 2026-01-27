import {
  Alert,
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Modal,
  Snackbar,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { addProducts } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import CloseIcon from "@mui/icons-material/Close";

const AddProduct = ({ open, handleClose, refresh }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [form, setForm] = useState({
    name: "",
    hsnCode: "",
    category: "",
    unit: "",
    price: 0,
    quantity: 0,
    productCode: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const userRes = await getUserById(webuser.id);
        const userData = userRes?.data || userRes;
        setMainUser(userData);

        const catRes = await getAllCategories();
        const allCats = catRes?.data?.data ?? catRes?.data ?? [];

        const userOrgId =
          userData?.organization_id?._id ?? userData?.organization_id ?? null;

        const parentsOnly = allCats.filter((cat) => {
          const catOrgId =
            cat?.organization_id?._id ?? cat?.organization_id ?? null;
          return String(catOrgId) === String(userOrgId);
        });

        setCategories(parentsOnly);
      } catch (err) {
        console.error("Error loading categories", err);
        setSnackbarMessage("Failed to load categories");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [webuser.id]);

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: isMobile ? 1.5 : 2,
    width: isMobile ? "95vw" : isTablet ? "85vw" : 700,
    maxWidth: "95vw",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "price" || name === "quantity" ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      hsnCode: "",
      category: "",
      unit: "",
      price: 0,
      quantity: 0,
      productCode: "",
    });
  };

  const handleReset = () => {
    resetForm();
    handleClose();
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!form.name.trim()) {
        setSnackbarMessage("Product Name is required!");
        setSnackbarOpen(true);
        return;
      }
      if (!form.hsnCode.trim()) {
        setSnackbarMessage("HSN Code is required!");
        setSnackbarOpen(true);
        return;
      }
      if (form.hsnCode.length > 6) {
        setSnackbarMessage("Enter valid HSN Code (max 6 characters)!");
        setSnackbarOpen(true);
        return;
      }
      if (!form.category) {
        setSnackbarMessage("Please select a category!");
        setSnackbarOpen(true);
        return;
      }

      const product = {
        ...form,
        createdBy: webuser.id,
        organization_id:
          mainUser?.organization_id?._id || mainUser?.organization_id,
      };

      const res = await addProducts(product);
      if (res.success === true) {
        setSnackbarMessage("Product Added successfully!");
        setSnackbarOpen(true);
        resetForm();
        refresh();
        handleClose();
      }
    } catch (error) {
      console.error("Error adding product", error);
      setSnackbarMessage(error?.response?.data?.message || "Failed to add product");
      setSnackbarOpen(true);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      height: 40,
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.875rem',
    },
    '& .MuiOutlinedInput-input': {
      fontSize: '0.875rem',
      padding: '8.5px 14px',
    },
  };

  const formFields = [
    { name: "name", label: "Product Name", required: true, type: "text", xs: 12, sm: 6 },
    { name: "hsnCode", label: "HSN Code", required: true, type: "text", xs: 12, sm: 6 },
    { name: "productCode", label: "Product Code", required: false, type: "text", xs: 12, sm: 6 },
    { name: "price", label: "Price (₹)", required: true, type: "number", xs: 12, sm: 6 },
    { name: "unit", label: "Unit", required: false, type: "text", xs: 12, sm: 6 },
    { name: "quantity", label: "Quantity", required: false, type: "number", xs: 12, sm: 6 },
  ];

  return (
    <>
      <Modal open={open} onClose={handleReset}>
        <Box sx={style}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
              Add Product
            </Typography>
            <IconButton
              onClick={handleReset}
              size="small"
            >
              <CloseIcon fontSize={isMobile ? "small" : "medium"} />
            </IconButton>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <Typography variant="body2">Loading categories...</Typography>
            </Box>
          ) : (
            <>
              {/* Product Information */}
              <Typography variant="body1" fontWeight="bold" mb={0.5}>
                Product Information
              </Typography>
              <Grid container spacing={1}>
                {formFields.map((field) => (
                  <Grid item xs={field.xs} sm={field.sm} key={field.name}>
                    <TextField
                      fullWidth
                      label={field.label}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      type={field.type}
                      size="small"
                      sx={textFieldStyle}
                      inputProps={field.type === "number" ? { min: 0 } : {}}
                    />
                  </Grid>
                ))}

                {/* Category Select */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    size="small"
                    sx={{ ...textFieldStyle, minWidth: 200 }} 
                  >
                    <MenuItem value="">Select Category</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.categoryName || "Unnamed category"}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

              </Grid>

              {/* Action Buttons */}
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Button
                  onClick={handleReset}
                  variant="outlined"
                  size="small"
                  sx={{
                    fontSize: '0.8125rem',
                    py: 0.5,
                    px: 1.5,
                    minWidth: '70px',
                    color: '#324b84ff'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    background: "linear-gradient(135deg, #182848, #324b84ff)",
                    color: "#fff",
                    fontSize: '0.8125rem',
                    py: 0.5,
                    px: 1.5,
                    minWidth: '70px'
                  }}
                  onClick={handleSave}
                >
                  Save
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("successfully") ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{ fontSize: '0.875rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddProduct;