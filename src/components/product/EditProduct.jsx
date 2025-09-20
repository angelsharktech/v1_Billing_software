/* eslint-disable react-hooks/exhaustive-deps */
import {
  Alert,
  Box,
  Button,
  Grid,
  MenuItem,
  Modal,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { getAllCategories } from "../../services/CategoryService";
import {
  getProductById,
  updateProductById,
} from "../../services/ProductService";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import RemoveCircleOutlineOutlinedIcon from "@mui/icons-material/RemoveCircleOutlineOutlined";
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
  minWidth: 800,
  maxHeight: "90vh",
  overflowY: "auto",
};

const EditProduct = ({ open, data, handleCloseEdit, refresh }) => {
  const [categories, setCategories] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { webuser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    hsnCode: "",
    sku: "",
    quantity: "",
    category: "",
    tags: "",
    unit: "",
    hasVariants: false,
    variantOptions: [],

    // description: "",
    // costPerItem: "",
    // lowStockThreshold: "",
    // weight: "",
    // dimensions: {
    //   length: "",
    //   width: "",
    //   height: "",
    // },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // get user (normalize shape)
        const userRes = await getUserById(webuser.id);
        const userData = userRes?.data || userRes; // adapt if service returns axios response
        // setMainUser(userData);

        // get categories (normalize to array)
        const catRes = await getAllCategories();
        // catRes.data might be { success: true, data: [...] } or might be the array directly
        const allCats = catRes?.data?.data ?? catRes?.data ?? [];

        // normalize user's organization id
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
      }
    };

    fetchCategories();
  }, [webuser.id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await getProductById(data?._id);
        const prod = res.data;
        setForm({
          ...form,
          ...prod,
          // sku: '',
          category: prod.category?._id || "",
          tags: prod.tags?.join(", ") || "",
          hasVariants: prod.hasVariants || false,
          variantOptions: prod.variantOptions || [],
          costPerItem: prod.costPerItem || "",
          lowStockThreshold: prod.lowStockThreshold || "",
          dimensions: {
            length: prod.dimensions?.length || "",
            width: prod.dimensions?.width || "",
            height: prod.dimensions?.height || "",
          },
        });
      } catch (err) {
        console.error("Error loading product by ID", err);
      }
    };

    if (data?._id) {
      fetchProduct();
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...form.variantOptions];
    if (field === "values") {
      updatedVariants[index][field] = value.split(",").map((v) => v.trim());
    } else {
      updatedVariants[index][field] = value;
    }

    setForm((prev) => ({
      ...prev,
      variantOptions: updatedVariants,
    }));
  };

  const addVariantOption = () => {
    setForm((prev) => ({
      ...prev,
      variantOptions: [...prev.variantOptions, { name: "", values: [] }],
    }));
  };

  const removeVariantOption = (index) => {
    const updated = [...form.variantOptions];
    updated.splice(index, 1);
    setForm((prev) => ({
      ...prev,
      variantOptions: updated,
    }));
  };

  const updateProduct = async () => {
    try {
      const updatedData = {
        ...form,
        status: form.quantity > 0 ? "active" : "out_of_stock",
        tags: form.tags.split(",").map((tag) => tag.trim()),
        dimensions: {
          length: parseFloat(form.dimensions.length),
          width: parseFloat(form.dimensions.width),
          height: parseFloat(form.dimensions.height),
        },
        costPerItem: parseFloat(form.costPerItem),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        variantOptions: form.hasVariants
          ? form.variantOptions.map((opt) => ({
              name: opt.name,
              values: opt.values,
              _id: opt._id,
              id: opt.id,
            }))
          : [],
      };

      const res = await updateProductById(data._id, updatedData);
      if (res) {
        setSnackbarMessage("Product Updated!");
        setSnackbarOpen(true);
        refresh();
        handleCloseEdit();
      }
    } catch (err) {
      setSnackbarMessage(err?.response?.data?.error || "Update failed");
      setSnackbarOpen(true);
    }
  };

  // const updateProduct = async () => {
  //   try {
  //     const updatedData = {
  //       ...form,
  //       status: form.quantity > 0 ? "active" : "out_of_stock",
  //       tags: form.tags.split(",").map((tag) => tag.trim()),
  //       dimensions: {
  //         length: parseFloat(form.dimensions.length),
  //         width: parseFloat(form.dimensions.width),
  //         height: parseFloat(form.dimensions.height),
  //       },
  //       costPerItem: parseFloat(form.costPerItem),
  //       lowStockThreshold: parseInt(form.lowStockThreshold),
  //       variantOptions: form.hasVariants
  //         ? form.variantOptions.map((opt) => ({
  //             name: opt.name,
  //             values: opt.values,
  //             _id: opt._id,
  //             id: opt.id,
  //           }))
  //         : [],
  //     };

  //     const res = await updateProductById(data._id, updatedData);
  //     if (res) {
  //       setSnackbarMessage("Product Updated!");
  //       setSnackbarOpen(true);
  //       refresh();
  //       handleCloseEdit();
  //     }
  //   } catch (err) {
  //     setSnackbarMessage(err?.response?.data?.error || "Update failed");
  //     setSnackbarOpen(true);
  //   }
  // };

  return (
    <>
      <Modal open={open} onClose={handleCloseEdit}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Edit Product
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                sx={{ width: "200px" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="HSN number"
                name="hsnCode"
                value={form.hsnCode}
                onChange={handleChange}
                required
                sx={{ width: "200px" }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="Price (₹)"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="Unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="MRP (₹)"
                name="compareAtPrice"
                type="number"
                value={form.compareAtPrice}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="Quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                sx={{ width: "200px" }}
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ width: "200px" }}
                label="Short Description"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ width: "200px" }}
                select
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.categoryName}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                sx={{ width: "200px" }}
                label="Tags (comma separated)"
                name="tags"
                value={form.tags}
                onChange={handleChange}
              />
            </Grid>
            {/* <Grid></Grid> */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center">
                <Typography>Variants:</Typography>
                <Button
                  variant={form.hasVariants ? "contained" : "outlined"}
                  color="primary"
                  size="small"
                  sx={{ ml: 2 }}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      hasVariants: !prev.hasVariants,
                    }))
                  }
                >
                  {form.hasVariants ? "Yes" : "No"}
                </Button>

                {form.hasVariants && (
                  <Button
                    sx={{ ml: "5px" }}
                    variant="outlined"
                    color="#324b84ff"
                    onClick={addVariantOption}
                  >
                    {/* + Add Variant Option */}
                    <AddCircleOutlineOutlinedIcon />
                  </Button>
                )}
              </Box>

              {form.hasVariants &&
                form.variantOptions.map((opt, index) => (
                  <Grid item xs={12} key={index} mt={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <TextField
                        label="Option Name"
                        value={opt.name}
                        onChange={(e) =>
                          handleVariantChange(index, "name", e.target.value)
                        }
                        sx={{ width: "200px" }}
                      />
                      <TextField
                        label="Values (comma separated)"
                        value={opt.values.join(", ")}
                        onChange={(e) =>
                          handleVariantChange(index, "values", e.target.value)
                        }
                        sx={{ width: "300px" }}
                      />
                      <Button
                        sx={{ mb: 2 }}
                        color="error"
                        variant="outlined"
                        onClick={() => removeVariantOption(index)}
                      >
                        <RemoveCircleOutlineOutlinedIcon />
                      </Button>
                    </Box>
                  </Grid>
                ))}
            </Grid>
          </Grid>

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button onClick={handleCloseEdit} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
              }}
              onClick={updateProduct}
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
          severity={
            snackbarMessage === "Product Updated!" ? "success" : "error"
          }
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditProduct;
