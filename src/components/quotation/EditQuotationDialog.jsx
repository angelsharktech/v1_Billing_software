import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  IconButton,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import moment from "moment";
import { updateQuotation } from "../../services/QuotationService";
import QuotationPrint from "../shared/QuotationPrint";

// Example API import
// import { updateQuotation } from "../../services/quotationService";

const EditQuotationDialog = ({ open, onClose, quotation, refresh }) => {
  const [formData, setFormData] = useState({
    quotationNo: "",
    date: "",
    customer: { name: "", email: "", phone: "", address: "" },
    status: "",
    products: [],
    subtotal: 0,
    taxTotal: 0,
    grandTotal: 0,
    terms:"",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Load quotation data into form
  useEffect(() => {
    if (quotation) {
      setFormData({
        quotationNo: quotation.quotationNo || "",
        date: moment(quotation.date).format("YYYY-MM-DD"),
        customer: quotation.customer || {
          name: "",
          email: "",
          phone: "",
          address: "",
          terms :"",
        },
        status: quotation.status || "Draft",
        products: quotation.products || [],
        subtotal: quotation.subtotal || 0,
        taxTotal: quotation.taxTotal || 0,
        grandTotal: quotation.grandTotal || 0,
        terms: quotation.terms ,

      });
    }
  }, [quotation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [name]: value,
      },
    }));
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;

    // Auto recalc product total
    if (field === "quantity" || field === "unitPrice" || field === "tax") {
      const qty = Number(updatedProducts[index].quantity) || 0;
      const price = Number(updatedProducts[index].unitPrice) || 0;
      const tax = Number(updatedProducts[index].tax) || 0;
      const total = qty * price + (qty * price * tax) / 100;
      updatedProducts[index].total = total;
    }

    // Recalculate totals
    const newSubtotal = updatedProducts.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );
    const newTaxTotal = updatedProducts.reduce(
      (sum, p) => sum + (p.quantity * p.unitPrice * p.tax) / 100,
      0
    );
    const newGrandTotal = newSubtotal + newTaxTotal;

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
      subtotal: newSubtotal,
      taxTotal: newTaxTotal,
      grandTotal: newGrandTotal,
    }));
  };

  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productName: "", quantity: 1, unitPrice: 0, tax: 0, total: 0 },
      ],
    }));
  };

  const handleRemoveProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);

    // Recalculate totals after removal
    const newSubtotal = updatedProducts.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );
    const newTaxTotal = updatedProducts.reduce(
      (sum, p) => sum + (p.quantity * p.unitPrice * p.tax) / 100,
      0
    );
    const newGrandTotal = newSubtotal + newTaxTotal;

    setFormData((prev) => ({
      ...prev,
      products: updatedProducts,
      subtotal: newSubtotal,
      taxTotal: newTaxTotal,
      grandTotal: newGrandTotal,
    }));
  };

  const handleSubmit = async () => {
    try {
      // call API
      const response = await updateQuotation(quotation._id, formData);

      if (response.status === true) {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
        refresh();
        onClose();
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage(response.message);
        return;
      }
    } catch (error) {
      console.error("Failed to update quotation", error);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit Quotation</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Quotation No"
                name="quotationNo"
                value={formData.quotationNo}
                fullWidth
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                type="date"
                label="Date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Customer Details */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={2}>
                <Typography variant="h6">Customer Details</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={6}>
                  <TextField
                    label="Customer Name"
                    name="name"
                    value={formData.customer.name}
                    onChange={handleCustomerChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Phone"
                    name="phone"
                    value={formData.customer.phone}
                    onChange={handleCustomerChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Email"
                    name="email"
                    value={formData.customer.email}
                    onChange={handleCustomerChange}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Address"
                    name="address"
                    value={formData.customer.address}
                    onChange={handleCustomerChange}
                    fullWidth
                  />
                </Grid>
              </Grid>

              {/* Products Section */}
              <Grid container spacing={2}>
                {/* Products Heading */}
                <Grid item xs={12}>
                  <Typography variant="h6">Products</Typography>
                  <Divider sx={{ my: 1 }} />
                </Grid>

                {/* Products Rows */}
                {formData.products.map((product, index) => (
                  <Grid container spacing={2} alignItems="center" key={index}>
                    <Grid item xs={3}>
                      <TextField
                        label="Product Name"
                        value={product.productName}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "productName",
                            e.target.value
                          )
                        }
                        sx={{ width: "150px" }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Qty"
                        type="number"
                        value={product.quantity}
                        onChange={(e) =>
                          handleProductChange(index, "quantity", e.target.value)
                        }
                        sx={{ width: "150px" }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Unit Price"
                        type="number"
                        value={product.unitPrice}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "unitPrice",
                            e.target.value
                          )
                        }
                        sx={{ width: "150px" }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Tax %"
                        type="number"
                        value={product.tax}
                        onChange={(e) =>
                          handleProductChange(index, "tax", e.target.value)
                        }
                        sx={{ width: "100px" }}
                      />
                    </Grid>

                    <Grid item xs={2}>
                      <TextField
                        label="Total"
                        type="number"
                        value={product.total.toFixed(2)}
                        disabled
                        sx={{ width: "150px" }}
                      />
                    </Grid>

                    <Grid item xs={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveProduct(index)}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                {/* Add Product Button */}
                <Grid item xs={12}>
                  <Button
                    startIcon={<Add />}
                    onClick={handleAddProduct}
                    sx={{ color: "#2F4F4F" }}
                  >
                    Add Product
                  </Button>
                </Grid>
              </Grid>

              {/* Totals */}
              <Grid item xs={4}>
                <TextField
                  label="Subtotal"
                  value={formData.subtotal}
                  sx={{ width: "150px" }}
                  disabled
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Tax Total"
                  value={formData.taxTotal}
                  sx={{ width: "120px" }}
                  disabled
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  label="Grand Total"
                  value={formData.grandTotal.toFixed(2)}
                  sx={{ width: "150px" }}
                  disabled
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} mt={4}>
            <Typography>Terms and Conditions :</Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              name="terms"
              value={formData.terms}
                onChange={handleChange}
              // onChange={(e) =>
              //   setFormData({ ...formData, terms: e.target.value })
              // }
            />
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} sx={{ color: "#2F4F4F" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: "#2F4F4F", color: "#fff" }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage.includes("successfully") ? "success" : "error"
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

export default EditQuotationDialog;
