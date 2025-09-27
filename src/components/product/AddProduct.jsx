import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Grid,
  MenuItem,
  Modal,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { addProducts } from "../../services/ProductService";
import { getAllCategories } from "../../services/CategoryService";
import { useAuth } from "../../context/AuthContext";
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import { getUserById } from "../../services/UserService";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  minWidth: 700,
  maxHeight: "90vh",
  overflowY: "auto",
};

const AddProduct = ({ open, handleClose, refresh }) => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [form, setForm] = useState({
    name: "",
    hsnCode: "",
    category: "",
    tags: "",
    productCode: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [hasVariant, setHasVariant] = useState("No");
  const [variants, setVariants] = useState([{ name: "", values: [""] }]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // get user (normalize shape)
        const userRes = await getUserById(webuser.id);
        const userData = userRes?.data || userRes; // adapt if service returns axios response
        setMainUser(userData);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    handleClose();
    setForm({
      name: "",
      // description: "",
      shortDescription: "",
      price: "",
      compareAtPrice: "",
      hsnCode: "",
      sku: "",
      quantity: "",
      category: "",
      tags: "",
      unit: "",
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.hsnCode) {
      setSnackbarMessage("Enter Required fields!");
      setSnackbarOpen(true);
      return;
    }
    const product = {
      ...form,
      tags: form.tags ? form.tags.split(",").map((tag) => tag.trim()) : [],
      createdBy: webuser.id,
      organization_id: mainUser?.organization_id?._id || mainUser?.organization_id,
    };
    try {
      const res = await addProducts(product);
      if (res.success === true) {
        setSnackbarMessage("Product Added!");
        setSnackbarOpen(true);
        handleClose();
        refresh();
      }
    } catch (error) {
      console.error("Error adding product", error);
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <Typography variant="h6" mb={2}>
            Add Product
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
                sx={{ width: "200px" }}
                label="HSN Number"
                name="hsnCode"
                value={form.hsnCode}
                onChange={handleChange}
                required
              />
            </Grid>
            {/* <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="Price (₹)"
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
              />
            </Grid> */}
            {/* <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="MRP(₹)"
                name="compareAtPrice"
                type="number"
                value={form.compareAtPrice}
                onChange={handleChange}
              />
            </Grid> */}
            {/* <Grid item xs={12} sm={6}>
              <TextField
                sx={{ width: "200px" }}
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={handleChange}
              />
            </Grid> */}

            {/* <Grid item xs={12}>
              <TextField
                sx={{ width: "200px" }}
                label="Short Description"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
              />
            </Grid> */}
            {/* <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="Quantity"
                name="quantity"
                type="number"
                value={form.quantity}
                onChange={handleChange}
              />
            </Grid> */}
            <Grid item xs={6}>
              <TextField
                sx={{ width: "200px" }}
                label="Product Code"
                name="productCode"
                value={form.productCode}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                sx={{ width: "200px" }}
                select
                label="category Name"
                name="category"
                value={form.category}
                onChange={handleChange}
              //   margin="normal"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.categoryName || "Unnamed category"}
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
            {/* <Grid item xs={12}>
              <Autocomplete
                options={["Yes", "No"]}
                value={hasVariant}
                onChange={(e, newValue) => setHasVariant(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="Has Variant" />
                )}
                sx={{ width: "200px" }}
              />
            </Grid> */}
            {/* {hasVariant === "Yes" && (
              <>
                {variants.map((variant, idx) => (
                  <Grid container spacing={2} key={idx}>
                    <Grid item xs={4}>
                      <TextField
                        label="Variant Name"
                        value={variant.name}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].name = e.target.value;
                          setVariants(updated);
                        }}
                        sx={{ width: "200px" }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Values (comma separated)"
                        value={variant.values.join(",")}
                        onChange={(e) => {
                          const updated = [...variants];
                          updated[idx].values = e.target.value
                            .split(",")
                            .map((v) => v.trim());
                          setVariants(updated);
                        }}
                        sx={{ width: "300px" }}
                      />
                    </Grid>
                    <Grid item xs={2} mt={1}>
                      <Button
                        onClick={() => {
                          const updated = [...variants];
                          updated.splice(idx, 1);
                          setVariants(updated);
                        }}
                        color="error"
                        variant="outlined"
                      >
                        <RemoveCircleOutlineOutlinedIcon />
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                <Box mt={1}>
                  <Button
                    onClick={() =>
                      setVariants([...variants, { name: "", values: [""] }])
                    }
                    variant="outlined"
                    color="#2F4F4F"
                  >
                    <AddCircleOutlineOutlinedIcon />
                  </Button>
                </Box>
              </>
            )} */}
          </Grid>

          <Box mt={4} display="flex" justifyContent="flex-end">
            <Button onClick={handleCancel} sx={{ mr: 2, color: "#324b84ff" }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              sx={{ background: "linear-gradient(135deg, #182848, #324b84ff)", color: "#fff" }}
              onClick={handleSave}
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
          severity={snackbarMessage === "Product Added!" ? "success" : "error"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddProduct;
