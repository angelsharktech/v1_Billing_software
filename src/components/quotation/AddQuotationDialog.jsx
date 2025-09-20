import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Typography,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import {
  addQuotation,
  generateQuotationNoByOrganization,
  getQuotationById,
} from "../../services/QuotationService";
import QuotationPrint from "../shared/QuotationPrint";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const AddQuotationDialog = ({ open, handleClose, refresh, mainUser }) => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const yyyy = today.getFullYear();

  const formatted = `${dd}/${mm}/${yyyy}`;

  const [formData, setFormData] = useState({
    quotationNo: "",
    // date: new Date().toLocaleDateString("en-GB"),
    date: formatted,
    validUpTo: "",
    customer: {
      name: "",
      email: "",
      phone: "",
      address: "",
      terms:""
    },
    status: "Draft",
    products: [{ productName: "", quantity: 1, unitPrice: 0, tax: 18 }],
  });

  const [errors, setErrors] = useState({});
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await generateQuotationNoByOrganization(mainUser?.organization_id?._id);

        setFormData((prev) => ({
          ...prev,
          quotationNo: res.quoteNo,
        }));
      } catch (err) {
        console.log(err);
      }
    };
    if (open) fetchQuotation();
  }, [open, mainUser]);
  // handle customer field changes
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

  // handle product field changes
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index][field] = value;
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  // add a new product row
  const handleAddProduct = () => {
    setFormData((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        { productName: "", quantity: 1, unitPrice: 0, tax: 18 },
      ],
    }));
  };

  // delete a product row
  const handleDeleteProduct = (index) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, products: updatedProducts }));
  };

  // totals calculation
  const subtotal = formData.products.reduce(
    (acc, p) => acc + p.quantity * p.unitPrice,
    0
  );
  const taxTotal = formData.products.reduce(
    (acc, p) => acc + (p.quantity * p.unitPrice * p.tax) / 100,
    0
  );
  const grandTotal = subtotal + taxTotal;

  // form submit
  const handleSubmit = async () => {
    const newErrors = {
      customerName: formData.customer.name.trim() === "",
      customerPhone: formData.customer.phone.trim() === "",
      products: formData.products.some((p) => p.productName.trim() === ""),
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some((err) => err)) {
      try {
        const updatedProducts = formData.products.map((p) => ({
          ...p,
          total: p.quantity * p.unitPrice * (1 + p.tax / 100),
        }));

        const payload = {
          ...formData,
          products: updatedProducts,
          organization_id: mainUser?.organization_id?._id,
          createdBy: mainUser?._id,
        };

        const response = await addQuotation(payload); // ✅ Call API

        if (response.status === true) {
          setSnackbarOpen(true);
          setSnackbarMessage(response.message);
          const quotationData = await getQuotationById(response.quotation._id);

          // const quotationData = {
          //   ...formData,
          //   products: updatedProducts,
          //   organization_name: mainUser?.organization_id,
          //   firm_name: mainUser?.activeFirm,
          //   subtotal: subtotal.toFixed(2),
          //   taxTotal: taxTotal.toFixed(2),
          //   grandTotal: grandTotal.toFixed(2),
          //   createdBy: mainUser?._id,
          // };
          setPrintData(quotationData);
          setShowPrint(true); // Show bill for printing
          setTimeout(() => {
            window.print();
            setShowPrint(false); // Optional
          }, 500);
          setFormData({
            quotationNo: `Q-${Date.now()}`,
            customer: { name: "", email: "", phone: "", address: "" },
            status: "Draft",
            products: [{ productName: "", quantity: 1, unitPrice: 0, tax: 18 }],
          });

          handleClose(); //  close dialog after success
          refresh(); //  Refresh the list after adding
        } else {
          setSnackbarOpen(true);
          setSnackbarMessage(response.message);
          return;
        }

        // reset form after success
      } catch (err) {
        console.error("Error adding quotation:", err);
      }
    }
  };

  return (
    <>
      <Dialog open={open} handleClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>Add Quotation</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Quotation Number + Date */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Quotation No"
                value={formData.quotationNo || ""}
                disabled
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                // type="date"
                label="Date"
                value={formData.date}
                InputLabelProps={{ shrink: true }}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Valid Up To"
                  value={formData.validUpTo ? dayjs(formData.validUpTo) : null}
                  format="DD/MM/YYYY" // display format
                  onChange={(newValue) => {
                    setFormData({
                      ...formData,
                      // store as YYYY-MM-DD if you need backend compatibility
                      validUpTo: newValue ? newValue.format("YYYY-MM-DD") : "",
                    });
                  }}
                  slotProps={{
                    textField: { fullWidth: true },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          

            {/* Customer Details */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={2}>
                <Typography variant="h6">Customer Details</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="name"
                    value={formData.customer.name}
                    onChange={handleCustomerChange}
                    error={errors.customerName}
                    helperText={
                      errors.customerName ? "Customer name is required" : ""
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact Number"
                    name="phone"
                    value={formData.customer.phone}
                    onChange={handleCustomerChange}
                    error={
                      errors.customerPhone ||
                      (formData.customer.phone.trim() !== "" &&
                        formData.customer.phone.trim().length !== 10)
                    }
                    helperText={
                      errors.customerPhone
                        ? "Customer phone is required"
                        : formData.customer.phone.trim() !== "" &&
                          formData.customer.phone.trim().length !== 10
                        ? "Invalid Phone Number"
                        : ""
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.customer.email}
                    onChange={handleCustomerChange}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Address"
                    name="address"
                    value={formData.customer.address}
                    onChange={handleCustomerChange}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Products Section */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6">Products</Typography>
                <Divider sx={{ my: 1 }} />
              </Grid>

              <Grid container spacing={2} alignItems="flex-start">
                {formData.products.map((product, index) => (
                  <>
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        label="Product Name"
                        value={product.productName}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "productName",
                            e.target.value
                          )
                        }
                        error={
                          errors.products && product.productName.trim() === ""
                        }
                        helperText={
                          errors.products && product.productName.trim() === ""
                            ? "Product name is required"
                            : ""
                        }
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        sx={{ width: "150px" }}
                        type="number"
                        label="Quantity"
                        value={product.quantity}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "quantity",
                            Number(e.target.value)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        sx={{ width: "150px" }}
                        type="number"
                        label="Unit Price"
                        value={product.unitPrice}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "unitPrice",
                            Number(e.target.value)
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField
                        select
                        sx={{ width: "120px" }}
                        label="Tax %"
                        value={product.tax}
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "tax",
                            Number(e.target.value)
                          )
                        }
                      >
                        {[0, 3, 5, 6, 9, 12, 18].map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}%
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="body1" sx={{ mt: 2 }}>
                        {(
                          product.quantity *
                          product.unitPrice *
                          (1 + product.tax / 100)
                        ).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={1}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteProduct(index)}
                        disabled={formData.products.length === 1}
                      >
                        <Delete />
                      </IconButton>
                    </Grid>
                  </>
                ))}
              </Grid>

              <Grid item xs={12}>
                <Button
                  startIcon={<Add />}
                  onClick={handleAddProduct}
                  sx={{ color: "#182848" }}
                >
                  Add Product
                </Button>
              </Grid>
            </Grid>
            {/* Totals */}
            <Grid item xs={12}>
              <Divider />
              <Typography>Subtotal: {subtotal.toFixed(2)}</Typography>
              <Typography>Tax Total: {taxTotal.toFixed(2)}</Typography>
              <Typography variant="h6">
                Grand Total: {grandTotal.toFixed(2)}
              </Typography>
            </Grid>
              <Divider />
          
           
          </Grid>
           <Grid item xs={12} mt={4}>
              <Typography>Terms and Conditions :</Typography>
              <TextField
                    fullWidth
                    multiline
                    rows={2}
                    // label="Address"
                    name="terms"
                    value={formData.terms}
                    onChange={(e) =>
                  setFormData({ ...formData, terms: e.target.value })
                }
                  />
            </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} sx={{ color: "#182848" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: "#182848", color: "#fff" }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        handleClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage.includes("successful") ? "success" : "error"
          }
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {showPrint && printData && (
        <div className="print-only">
          <QuotationPrint quotation={printData} />
        </div>
      )}
    </>
  );
};

export default AddQuotationDialog;
