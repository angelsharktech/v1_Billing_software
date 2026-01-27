import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  Typography,
  IconButton,
  Paper,
  Container,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Delete, Add } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import {
  createUser,
  getAllUser,
  getUserById,
  updateUser,
} from "../../services/UserService";
import {
  addProducts,
  getAllProducts,
  updateInventory,
} from "../../services/ProductService";
import {
  addSaleBill,
  deleteSaleBill,
  getSaleBillById,
} from "../../services/SaleBillService";
import { addPayment } from "../../services/PaymentModeService";

const SaleBillForm = ({
  setShowPrint,
  setPrintData,
  setSnackbarOpen,
  setSnackbarMessage,
  close,
  refresh,
}) => {
  const { webuser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // State variables
  const [customer, setCustomer] = useState({
    _id: "",
    name: "",
    address: "",
    phone_number: "",
    pincode: "",
    openingAmount: 0,
  });

  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [errors, setErrors] = useState({ phone_number: "", products: {} });

  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([
    {
      _id: "",
      productName: "",
      hsnCode: "",
      productCode: "",
      qty: 1,
      price: 0,
      gstPercent: 0,
      discountPercentage: "",
      discountedPrice: 0,
      isExisting: false,
      category: "",
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0,
    },
  ]);

  // Bill Information
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [billType, setBillType] = useState("nongst");
  const [gstPercent, setGstPercent] = useState(0);
  const [isWithinState, setIsWithinState] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");

  const [totals, setTotals] = useState({
    subtotal: 0,
    gstTotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
  });

  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState();
  const [mainUser, setMainUser] = useState();
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
  });

  // Fetch initial data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [posData, roleData, userData, user] = await Promise.all([
          getAllPositions(),
          getAllRoles(),
          getAllUser(),
          getUserById(webuser.id),
        ]);
        setPositions(posData);
        setRoles(roleData);
        setUsers(userData);
        setMainUser(user);
      } catch (err) {
        console.error("Failed to fetch form data:", err);
      }
    };
    if (webuser?.id) fetchAll();
  }, [webuser?.id]);

  // Calculate totals
  useEffect(() => {
    calculateOverallTotals();
  }, [selectedProducts, gstPercent, billType, isWithinState]);

  // Fetch products
  useEffect(() => {
    if (mainUser) fetchProducts();
  }, [mainUser]);

  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      const prod = (data?.data || []).filter(
        (p) =>
          p?.organization_id === mainUser?.organization_id?._id &&
          (p.status === "active" || p.status === "out_of_stock")
      );
      setProducts(prod);
    } catch (error) {
      console.error("Error fetching product data", error);
    }
  };

  const calculateOverallTotals = () => {
    let subtotal = 0;
    let gstTotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    selectedProducts.forEach((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || 0;
      const base = qty * price;

      // Calculate discount
      let discountValue = 0;
      const discountInput = item.discountPercentage || "0";

      if (discountInput.includes("%")) {
        const percent = parseFloat(discountInput.replace("%", "")) || 0;
        discountValue = (base * percent) / 100;
      } else {
        discountValue = parseFloat(discountInput) || 0;
      }

      const taxable = Math.max(0, base - discountValue);

      // Calculate GST if GST bill
      if (billType === "gst") {
        const itemGstPercent = Number(item.gstPercent) || 0;
        const gstAmount = (taxable * itemGstPercent) / 100;

        if (isWithinState === "true") {
          cgst += gstAmount / 2;
          sgst += gstAmount / 2;
        } else if (isWithinState === "false") {
          igst += gstAmount;
        }
        gstTotal += gstAmount;
      }

      subtotal += taxable;
    });

    const grandTotal = subtotal + gstTotal;

    setTotals({
      subtotal,
      gstTotal,
      cgst,
      sgst,
      igst,
      grandTotal,
    });
  };

  // Customer selection
  const handleCustomerSelection = (value, type) => {
    let selectedCustomer = null;

    if (type === "phone") {
      const phoneRegex = /^[6-9]\d{9}$/;
      setCustomer((prev) => ({ ...prev, phone_number: value }));
      if (!phoneRegex.test(value)) {
        setErrors((prev) => ({ ...prev, phone_number: "Invalid mobile number" }));
      } else {
        setErrors((prev) => ({ ...prev, phone_number: "" }));
      }
    } else if (type === "name") {
      selectedCustomer = users.find(
        (s) => s.name === value && s.role_id?.name?.toLowerCase() === "customer"
      );
    }

    if (selectedCustomer) {
      setCustomer({
        _id: selectedCustomer._id,
        name: selectedCustomer.name,
        address: selectedCustomer.address || "",
        phone_number: selectedCustomer.phone_number || value,
        openingAmount: selectedCustomer.openingAmount || 0,
      });
      setGstDetails({
        gstNumber: selectedCustomer.gstDetails?.gstNumber || "",
        legalName: selectedCustomer.gstDetails?.legalName || "",
        state: selectedCustomer.gstDetails?.state || "",
      });
      setIsExistingCustomer(true);
    }
  };

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value;
    setCustomer({ ...customer, pincode });

    if (pincode.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        if (!res.ok) throw new Error("API response not OK");
        const data = await res.json();
        const stateFind = data[0]?.PostOffice?.[0]?.State || "";
        if (stateFind) setState(stateFind);
      } catch (error) {
        console.error("Error fetching state from pincode", error);
      }
    }
  };

  // Product handlers
  const handleProductChange = (index, field, value) => {
    const updated = [...selectedProducts];
    const item = updated[index] || {};

    if (field === "productName") {
      const product = products.find((p) => p.name === value);
      if (product) {
        const productGstPercent = billType === "gst" ? (product.gstPercent || gstPercent || 0) : 0;

        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode || "",
          productCode: product.productCode || "",
          price: product.price || 0,
          discountPercentage: product.discountPercentage || "",
          discountedPrice: product.price || 0,
          isExisting: true,
          category: product.category,
          gstPercent: productGstPercent,
        };
      } else {
        updated[index] = {
          ...item,
          productName: value,
          isExisting: false,
          gstPercent: billType === "gst" ? gstPercent : 0,
        };
      }
    } else if (field === "productCode") {
      const product = products.find((p) => p.productCode === value);
      if (product) {
        const productGstPercent = billType === "gst" ? (product.gstPercent || gstPercent || 0) : 0;

        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode,
          productCode: product.productCode,
          price: product.price,
          discountPercentage: product.discountPercentage || "",
          discountedPrice: product.price || 0,
          gstPercent: productGstPercent,
          isExisting: true,
        };
      } else {
        updated[index] = {
          ...item,
          productCode: value,
          isExisting: false,
          gstPercent: billType === "gst" ? gstPercent : 0,
        };
      }
    } else if (field === "hsnCode") {
      const product = products.find((p) => p.hsnCode === value);
      if (product) {
        const productGstPercent = billType === "gst" ? (product.gstPercent || gstPercent || 0) : 0;

        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode,
          productCode: product.productCode,
          price: product.price,
          discountPercentage: product.discountPercentage || "",
          discountedPrice: product.price || 0,
          gstPercent: productGstPercent,
          isExisting: true,
        };
      } else {
        updated[index] = {
          ...item,
          hsnCode: value,
          isExisting: false,
          gstPercent: billType === "gst" ? gstPercent : 0,
        };
      }
    } else if (field === "discountPercentage") {
      const discountStr = value;
      const price = parseFloat(item.price) || 0;
      let discountedPrice = price;

      if (discountStr.includes("%")) {
        const percent = parseFloat(discountStr.replace("%", "")) || 0;
        discountedPrice = price - (price * percent) / 100;
      } else {
        const flatDiscount = parseFloat(discountStr) || 0;
        discountedPrice = price - flatDiscount;
      }

      updated[index] = {
        ...item,
        discountPercentage: discountStr,
        discountedPrice,
      };
    } else if (field === "qty" || field === "price") {
      updated[index] = { ...item, [field]: value };
    } else if (field === "gstPercent" && billType === "gst") {
      updated[index] = {
        ...item,
        [field]: Number(value) || 0,
      };
    } else {
      updated[index] = { ...item, [field]: value };
    }

    setSelectedProducts(updated);
  };

  const handleAddProduct = () => {
    setSelectedProducts((prev) => [
      ...prev,
      {
        productName: "",
        hsnCode: "",
        productCode: "",
        qty: 1,
        price: 0,
        gstPercent: billType === "gst" ? gstPercent : 0,
        discountPercentage: "",
        discountedPrice: 0,
        category: "",
        isExisting: false,
        total: 0,
      },
    ]);
  };

  const handleRemoveProduct = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBillTypeChange = (value) => {
    setBillType(value);

    if (value === "nongst") {
      setGstPercent(0);
      setIsWithinState("");
      setGstDetails({ gstNumber: "", legalName: "", state: "" });

      const updatedProducts = selectedProducts.map((item) => ({
        ...item,
        gstPercent: 0,
      }));
      setSelectedProducts(updatedProducts);
    } else {
      if (gstPercent === 0) setGstPercent(18);
    }
  };

  const handleSubmit = async () => {
    try {
      let finalCustomer = { ...customer };

      // Validation
      if (!customer.phone_number || !customer.name || customer.phone_number?.length !== 10) {
        setSnackbarMessage("Please fill valid customer details!");
        setSnackbarOpen(true);
        return;
      }

      for (let p of selectedProducts) {
        if (!p.productName || Number(p.qty) <= 0) {
          setSnackbarMessage("Please fill all product details correctly!");
          setSnackbarOpen(true);
          return;
        }
      }

      // GST validation
      if (billType === "gst") {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

        if (!gstDetails.gstNumber) {
          setSnackbarMessage("GST Number is required for GST Bill!");
          setSnackbarOpen(true);
          return;
        }

        if (!gstRegex.test(gstDetails.gstNumber.toUpperCase())) {
          setSnackbarMessage("Invalid GST Number format!");
          setSnackbarOpen(true);
          return;
        }

        if (!gstDetails.legalName || !gstDetails.state) {
          setSnackbarMessage("Please fill Legal Name and State for GST!");
          setSnackbarOpen(true);
          return;
        }

        if (isWithinState === "") {
          setSnackbarMessage("Please select if transaction is within state or not!");
          setSnackbarOpen(true);
          return;
        }
      }

      // Prepare final products for API
      const finalProducts = selectedProducts.map((product) => {
        const qty = Number(product.qty) || 0;
        const unitPrice = Number(product.price) || 0;
        const lineAmount = +(qty * unitPrice);
        const discountStr = product.discountPercentage.toString();
        let discountPrice = 0;

        if (discountStr.includes("%")) {
          const percent = parseFloat(discountStr) || 0;
          discountPrice = unitPrice * qty - (unitPrice * qty * percent) / 100;
        } else {
          const flat = parseFloat(discountStr) || 0;
          discountPrice = unitPrice * qty - flat;
        }

        const rate = billType === "gst" ? Number(product.gstPercent) || 0 : 0;
        const gstAmount = billType === "gst" ? +(discountPrice * (rate / 100)).toFixed(2) : 0;

        let cgstAmount = 0,
          sgstAmount = 0,
          igstAmount = 0;
        if (billType === "gst") {
          if (isWithinState === "true") {
            cgstAmount = +(gstAmount / 2).toFixed(2);
            sgstAmount = +(gstAmount / 2).toFixed(2);
          } else if (isWithinState === "false") {
            igstAmount = +gstAmount.toFixed(2);
          }
        }

        const lineTotal = +(discountPrice + gstAmount).toFixed(2);

        return {
          _id: product._id,
          name: product.productName || "",
          hsnCode: product.hsnCode || "",
          productCode: product.productCode || "",
          qty,
          price: Number(discountPrice.toFixed(2)),
          unitPrice: Number(unitPrice.toFixed(2)),
          discount: product.discountPercentage || "",
          gstPercent: rate,
          gstAmount,
          cgst: cgstAmount,
          sgst: sgstAmount,
          igst: igstAmount,
          lineTotal,
        };
      });

      // Calculate final totals
      const computedSubtotal = +finalProducts.reduce((acc, p) => acc + Number(p.price), 0).toFixed(2);
      const computedGstTotal = +finalProducts.reduce((acc, p) => acc + (Number(p.gstAmount) || 0), 0).toFixed(2);
      const computedCgst = +finalProducts.reduce((acc, p) => acc + (Number(p.cgst) || 0), 0).toFixed(2);
      const computedSgst = +finalProducts.reduce((acc, p) => acc + (Number(p.sgst) || 0), 0).toFixed(2);
      const computedIgst = +finalProducts.reduce((acc, p) => acc + (Number(p.igst) || 0), 0).toFixed(2);
      const computedGrandTotal = +(computedSubtotal + computedGstTotal).toFixed(2);

      const finalTotals = {
        subtotal: Number(computedSubtotal) || 0,
        gstTotal: Number(computedGstTotal) || 0,
        cgst: Number(computedCgst) || 0,
        sgst: Number(computedSgst) || 0,
        igst: Number(computedIgst) || 0,
        grandTotal: Number(computedGrandTotal) || 0,
      };

      // Prepare bill payload
      const billPayload = {
        bill_to: finalCustomer._id,
        products: finalProducts,
        billType: billType,
        billDate: billDate,
        qty: selectedProducts.length,
        paymentType: "full",
        advance: Number(finalTotals.grandTotal).toFixed(2),
        balance: 0,
        isReturn: true,
        subtotal: finalTotals.subtotal,
        discount: 0,
        gstPercent: Number(gstPercent) || 0,
        gstTotal: finalTotals.gstTotal,
        cgst: finalTotals.cgst,
        sgst: finalTotals.sgst,
        igst: finalTotals.igst,
        grandTotal: finalTotals.grandTotal,
        org: mainUser.organization_id?._id,
        notes: notes || "",
        createdBy: mainUser._id,
        status: "draft",
      };

      const res = await addSaleBill(billPayload);

      if (res?.status === 401) {
        setSnackbarMessage("Your session is expired. Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (res?.success === true || res?.data) {
        setSnackbarMessage("Sale return created successfully!");
        setSnackbarOpen(true);

        const billData = await getSaleBillById(res.data._id);

        let paymentPayload2 = {
          client_id: finalCustomer._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "Sale",
          paymentType: paymentMode,
          narration: "Sale Return",
          advanceAmount: Number(finalTotals.grandTotal).toFixed(2),
          closingAmount: Number(
            (
              Number(finalCustomer?.openingAmount) - Number(finalTotals.grandTotal)
            ).toFixed(2)
          ),
        };

        const paymentResult2 = await addPayment(paymentPayload2);
        if (paymentResult2?.success === false) {
          await deleteSaleBill(res.data._id);
          setSnackbarMessage(paymentResult2.errors || "Payment creation failed");
          setSnackbarOpen(true);
          return;
        } else {
          // Update user
          await updateUser(finalCustomer._id, {
            openingAmount: Number(
              (
                Number(finalCustomer.openingAmount) - Number(finalTotals.grandTotal)
              ).toFixed(2)
            ),
          });

          setPrintData(billData.data);
          setShowPrint(true); // Show bill for printing
          setTimeout(() => {
            window.print();
            setShowPrint(false); // Optional
          }, 500);
          if (refresh) {
            refresh();
          }
        }

        // Reset form
        setCustomer({
          name: "",
          address: "",
          phone_number: "",
          openingAmount: 0,
        });
        setSelectedProducts([
          {
            productName: "",
            hsnCode: "",
            productCode: "",
            qty: 1,
            price: 0,
            discountPercentage: "",
            discountedPrice: 0,
          },
        ]);

        if (close) close();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSnackbarMessage("Error: " + (error?.message || error));
      setSnackbarOpen(true);
    }
  };

  // Filter customer users
  const customerUsers = users.filter(
    (u) =>
      u.role_id?.name?.toLowerCase() === "customer" &&
      u.organization_id?._id === mainUser?.organization_id?._id &&
      (u.status === "active" || u.status === "out_of_stock")
  );

  return (
    <Container
      maxWidth={false}
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        maxWidth: "100%",
        ml: 0,
        mr: 0,
        width: "80vw",
        overflowX: "hidden",
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Create Sale Return
      </Typography>

      {/* ========== 1. BILL INFORMATION SECTION ========== */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Bill Information
        </Typography>

        <Grid container spacing={2}>
          {/* Bill Date */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Return Date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          {/* Bill Type */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              select
              label="Bill Type"
              value={billType}
              onChange={(e) => handleBillTypeChange(e.target.value)}
              size="small"
            >
              <MenuItem value="nongst">Non-GST</MenuItem>
              <MenuItem value="gst">GST</MenuItem>
            </TextField>
          </Grid>

          {/* GST Percentage (only if GST selected) */}
          
          {/* {billType === "gst" && (
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Default GST %"
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value) || 0)}
                size="small"
                InputProps={{
                  inputProps: { min: 0, max: 100, step: 0.01 },
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
              />
            </Grid>
          )} */}
        </Grid>

        {/* Transaction Within State? (only if GST selected) */}
        {billType === "gst" && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Transaction Within State?
            </Typography>
            <RadioGroup
              row
              value={isWithinState}
              onChange={(e) => setIsWithinState(e.target.value)}
            >
              <FormControlLabel value="true" control={<Radio />} label="Yes" />
              <FormControlLabel value="false" control={<Radio />} label="No" />
            </RadioGroup>
          </Box>
        )}
      </Paper>

      {/* ========== 2. CUSTOMER DETAILS SECTION ========== */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Customer Details
        </Typography>

        <Grid container spacing={2}>
          {/* Customer Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Customer Name *"
              value={customer.name}
              onChange={(e) => handleCustomerSelection(e.target.value, "name")}
              size="small"
              placeholder="Select customer"
              SelectProps={{
                native: false,
                displayEmpty: true,
                renderValue: (selected) => {
                  if (!selected) {
                    return <span style={{ color: "#999" }}>Select customer</span>;
                  }
                  return selected;
                },
                MenuProps: {
                  PaperProps: {
                    style: {
                      maxHeight: 250,
                      width: "300px",
                      marginTop: 5,
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>Select customer</em>
              </MenuItem>
              {customerUsers.map((cust) => (
                <MenuItem key={cust._id} value={cust.name} sx={{ py: 1, minHeight: "36px" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {cust.name}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        Phone: {cust.phone_number || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Balance: ₹{cust.openingAmount || 0}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={customer.phone_number}
              onChange={(e) => handleCustomerSelection(e.target.value, "phone")}
              error={!!errors.phone_number}
              helperText={errors.phone_number}
              size="small"
              placeholder="10-digit mobile number"
              inputProps={{ maxLength: 10 }}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              // multiline
              rows={2}
              label="Address"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              size="small"
              placeholder="Customer address"
            />
          </Grid>

          {/* Pincode */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pincode"
              value={customer.pincode}
              onChange={handlePincodeChange}
              size="small"
              placeholder="6-digit pincode"
              inputProps={{ maxLength: 6 }}
              helperText={state && `State: ${state}`}
            />
          </Grid>

          {/* Opening Amount */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Opening Amount"
              value={customer.openingAmount}
              InputProps={{
                readOnly: true,
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { step: 0.01 },
              }}
              size="small"
            />
          </Grid>
        </Grid>

        {/* ===== GST Registration Details (only for GST bills) ===== */}
        {billType === "gst" && (
          <Box
            sx={{
              mt: 4, // space from previous fields
              p: 3,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              backgroundColor: "#f9f9f9",
            }}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
              GST Registration Details
            </Typography>

            <Grid container spacing={2}>
              {/* GST Number */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="GST Number *"
                  value={gstDetails.gstNumber}
                  onChange={(e) => setGstDetails({ ...gstDetails, gstNumber: e.target.value })}
                  size="small"
                  placeholder="22ABCDE1234F1Z5"
                  inputProps={{ style: { textTransform: "uppercase" }, maxLength: 15 }}
                />
              </Grid>

              {/* Legal Name */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Legal Name *"
                  value={gstDetails.legalName}
                  onChange={(e) => setGstDetails({ ...gstDetails, legalName: e.target.value })}
                  size="small"
                  placeholder="Company legal name"
                />
              </Grid>

              {/* State */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="State *"
                  value={gstDetails.state}
                  onChange={(e) => setGstDetails({ ...gstDetails, state: e.target.value })}
                  size="small"
                  placeholder="e.g., Maharashtra"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ========== 3. PRODUCT DETAILS SECTION ========== */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Product Details</Typography>
        </Box>

        <TableContainer
          sx={{
            mb: 3,
            maxHeight: isMobile ? "300px" : "400px",
            overflow: "auto",
            "& .MuiTable-root": {
              minWidth: isMobile ? "900px" : "auto",
            },
          }}
        >
          <Table
            size="small"
            stickyHeader
            sx={{
              tableLayout: isMobile ? "fixed" : "auto",
              minWidth: isMobile ? "900px" : "100%",
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell
                  sx={{
                    width: isMobile ? "150px" : "20%",
                    fontWeight: "bold",
                    padding: "8px",
                    position: "sticky",
                    left: 0,
                    backgroundColor: "#f5f5f5",
                    zIndex: 2,
                  }}
                >
                  Product Name
                </TableCell>
                <TableCell sx={{ width: isMobile ? "70px" : "8%", fontWeight: "bold", padding: "8px" }}>
                  HSN Code
                </TableCell>
                <TableCell sx={{ width: isMobile ? "70px" : "8%", fontWeight: "bold", padding: "8px" }}>
                  Product Code
                </TableCell>
                <TableCell sx={{ width: isMobile ? "50px" : "6%", fontWeight: "bold", padding: "8px" }}>
                  Qty
                </TableCell>
                <TableCell sx={{ width: isMobile ? "80px" : "10%", fontWeight: "bold", padding: "8px" }}>
                  Price
                </TableCell>
                <TableCell sx={{ width: isMobile ? "70px" : "8%", fontWeight: "bold", padding: "8px" }}>
                  Discount
                </TableCell>
                {billType === "gst" && (
                  <>
                    <TableCell sx={{ width: isMobile ? "60px" : "7%", fontWeight: "bold", padding: "8px" }}>
                      GST%
                    </TableCell>
                    {isWithinState === "true" && (
                      <>
                        <TableCell sx={{ width: isMobile ? "60px" : "7%", fontWeight: "bold", padding: "8px" }}>
                          CGST%
                        </TableCell>
                        <TableCell sx={{ width: isMobile ? "60px" : "7%", fontWeight: "bold", padding: "8px" }}>
                          SGST%
                        </TableCell>
                      </>
                    )}
                    {isWithinState === "false" && (
                      <TableCell sx={{ width: isMobile ? "60px" : "7%", fontWeight: "bold", padding: "8px" }}>
                        IGST%
                      </TableCell>
                    )}
                  </>
                )}
                <TableCell sx={{ width: isMobile ? "80px" : "10%", fontWeight: "bold", padding: "8px" }}>
                  Total
                </TableCell>
                <TableCell sx={{ width: isMobile ? "50px" : "5%", fontWeight: "bold", padding: "8px" }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {selectedProducts.map((productItem, index) => {
                // Calculate individual product total
                const qty = Number(productItem.qty) || 0;
                const price = Number(productItem.price) || 0;
                const base = qty * price;
                const discountInput = productItem.discountPercentage || "0";

                let discountValue = 0;
                if (discountInput.includes("%")) {
                  const percent = parseFloat(discountInput.replace("%", "")) || 0;
                  discountValue = (base * percent) / 100;
                } else {
                  discountValue = parseFloat(discountInput) || 0;
                }

                const taxable = base - discountValue;
                const gstAmount = billType === "gst" ? (taxable * (Number(productItem.gstPercent) || 0)) / 100 : 0;
                const productTotal = taxable + gstAmount;

                // Calculate CGST and SGST percentages (9% each for 18% GST)
                const cgstPercent = billType === "gst" && isWithinState === "true" ? (Number(productItem.gstPercent) || 0) / 2 : 0;
                const sgstPercent = billType === "gst" && isWithinState === "true" ? (Number(productItem.gstPercent) || 0) / 2 : 0;
                const igstPercent = billType === "gst" && isWithinState === "false" ? Number(productItem.gstPercent) || 0 : 0;

                return (
                  <TableRow key={index} sx={{ "&:hover": { backgroundColor: "#fafafa" } }}>
                    {/* Product Name - Dropdown */}
                    <TableCell
                      sx={{
                        padding: "4px",
                        position: "sticky",
                        left: 0,
                        backgroundColor: "white",
                        zIndex: 1,
                      }}
                    >
                      {isMobile ? (
                        <TextField
                          fullWidth
                          size="small"
                          value={productItem.productName}
                          onChange={(e) => handleProductChange(index, "productName", e.target.value)}
                          placeholder="Product name"
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "36px",
                              minHeight: "36px",
                            },
                          }}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          select
                          size="small"
                          value={productItem.productName}
                          onChange={(e) => handleProductChange(index, "productName", e.target.value)}
                          SelectProps={{
                            native: false,
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (!selected) {
                                return <span style={{ color: "#999" }}>Select product</span>;
                              }
                              return selected;
                            },
                            MenuProps: {
                              PaperProps: {
                                style: {
                                  maxHeight: 250,
                                  width: "300px",
                                  marginTop: 5,
                                },
                              },
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "36px",
                              minHeight: "36px",
                            },
                            "& .MuiSelect-select": {
                              padding: "8px 12px",
                              lineHeight: "20px",
                              display: "flex",
                              alignItems: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>Select product</em>
                          </MenuItem>
                          {products.map((prod) => (
                            <MenuItem key={prod._id} value={prod.name} sx={{ py: 1, minHeight: "36px", width: "100%" }}>
                              <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {prod.name}
                                </Typography>
                                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                                  <Typography variant="caption" color="textSecondary">
                                    HSN: {prod.hsnCode || "N/A"}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Price: ₹{prod.price || 0}
                                  </Typography>
                                </Box>
                                {prod.quantity !== undefined && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 0.5,
                                      color: prod.quantity > 0 ? "success.main" : "error.main",
                                      fontWeight: 500,
                                    }}
                                  >
                                    Stock: {prod.quantity}
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </TableCell>

                    {/* HSN Code */}
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={productItem.hsnCode}
                        onChange={(e) => handleProductChange(index, "hsnCode", e.target.value)}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                          },
                          "& .MuiInputBase-input": {
                            padding: "8px 6px",
                            lineHeight: "20px",
                            textAlign: "center",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Product Code */}
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={productItem.productCode}
                        onChange={(e) => handleProductChange(index, "productCode", e.target.value)}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                          },
                          "& .MuiInputBase-input": {
                            padding: "8px 6px",
                            lineHeight: "20px",
                            textAlign: "center",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Quantity */}
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        value={productItem.qty}
                        onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                        InputProps={{
                          inputProps: {
                            min: 1,
                            style: { textAlign: "center" },
                          },
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                          },
                          "& .MuiInputBase-input": {
                            padding: "8px 6px",
                            lineHeight: "20px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Price */}
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        type="number"
                        size="small"
                        value={productItem.price}
                        onChange={(e) => handleProductChange(index, "price", e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start" sx={{ mr: 0.5 }}>
                              ₹
                            </InputAdornment>
                          ),
                          inputProps: {
                            min: 0,
                            step: 0.01,
                            style: { textAlign: "right", paddingRight: "4px" },
                          },
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                            pl: 1,
                          },
                          "& .MuiInputBase-input": {
                            padding: "8px 4px 8px 0",
                            lineHeight: "20px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Discount */}
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={productItem.discountPercentage}
                        onChange={(e) => handleProductChange(index, "discountPercentage", e.target.value)}
                        placeholder="0% or ₹"
                        InputProps={{
                          inputProps: {
                            style: { textAlign: "center" },
                          },
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                          },
                          "& .MuiInputBase-input": {
                            padding: "8px 6px",
                            lineHeight: "20px",
                          },
                        }}
                      />
                    </TableCell>

                    {/* GST Percentage (only for GST bills) */}
                    {billType === "gst" && (
                      <TableCell sx={{ padding: "4px" }}>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={productItem.gstPercent}
                          onChange={(e) => handleProductChange(index, "gstPercent", e.target.value)}
                          InputProps={{
                            inputProps: {
                              min: 0,
                              max: 100,
                              step: 0.01,
                              style: { textAlign: "center" },
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "36px",
                              minHeight: "36px",
                            },
                            "& .MuiInputBase-input": {
                              padding: "8px 6px",
                              lineHeight: "20px",
                            },
                          }}
                        />
                      </TableCell>
                    )}

                    {/* CGST Percentage (only for within state GST bills) */}
                    {billType === "gst" && isWithinState === "true" && (
                      <TableCell sx={{ padding: "4px" }}>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={cgstPercent.toFixed(2)}
                          InputProps={{
                            readOnly: true,
                            inputProps: {
                              style: { textAlign: "center", color: "#1976d2" },
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "36px",
                              minHeight: "36px",
                              backgroundColor: "#f0f7ff",
                            },
                            "& .MuiInputBase-input": {
                              padding: "8px 6px",
                              lineHeight: "20px",
                            },
                          }}
                        />
                      </TableCell>
                    )}

                    {/* SGST Percentage (only for within state GST bills) */}
                    {billType === "gst" && isWithinState === "true" && (
                      <TableCell sx={{ padding: "4px" }}>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={sgstPercent.toFixed(2)}
                          InputProps={{
                            readOnly: true,
                            inputProps: {
                              style: { textAlign: "center", color: "#1976d2" },
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "36px",
                              minHeight: "36px",
                              backgroundColor: "#f0f7ff",
                            },
                            "& .MuiInputBase-input": {
                              padding: "8px 6px",
                              lineHeight: "20px",
                            },
                          }}
                        />
                      </TableCell>
                    )}

                    {/* IGST Percentage (only for inter-state GST bills) */}
                    {billType === "gst" && isWithinState === "false" && (
                      <TableCell sx={{ padding: "4px" }}>
                        <TextField
                          fullWidth
                          type="number"
                          size="small"
                          value={igstPercent.toFixed(2)}
                          InputProps={{
                            readOnly: true,
                            inputProps: {
                              style: { textAlign: "center", color: "#ed6c02" },
                            },
                          }}
                          sx={{
                            "& .MuiInputBase-root": {
                              height: "36px",
                              minHeight: "36px",
                              backgroundColor: "#fff3e0",
                            },
                            "& .MuiInputBase-input": {
                              padding: "8px 6px",
                              lineHeight: "20px",
                            },
                          }}
                        />
                      </TableCell>
                    )}

                    {/* Total (Read-only) */}
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={`₹${productTotal.toFixed(2)}`}
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                            backgroundColor: "#f9f9f9",
                            pl: 1,
                          },
                          "& .MuiInputBase-input": {
                            padding: "8px 6px",
                            lineHeight: "20px",
                            fontWeight: "medium",
                            textAlign: "right",
                            color: "#d32f2f",
                          },
                        }}
                      />
                    </TableCell>

                    {/* Action */}
                    <TableCell sx={{ padding: "4px", textAlign: "center" }}>
                      {selectedProducts.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveProduct(index)}
                          color="error"
                          sx={{
                            width: "32px",
                            height: "32px",
                            "& svg": { fontSize: "18px" },
                          }}
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Button variant="contained" color="success" startIcon={<Add />} onClick={handleAddProduct} size="small" sx={{ height: "36px" }}>
          Add Product
        </Button>
      </Paper>

      {/* ========== 4. TOTALS & PAYMENT SECTION ========== */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}>
          Totals & Payment
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* ========== TOTALS SECTION ========== */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mb: 3,
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              p: 2,
              backgroundColor: "#f9f9f9",
            }}
          >
            <Box sx={{ width: "300px" }}>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}>
                Return Totals
              </Typography>

              {/* Subtotal */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                  Subtotal
                </Typography>
                <TextField
                  value={`₹${totals.subtotal?.toFixed(2) || "0.00"}`}
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      height: "35px",
                      width: "120px",
                      "& input": {
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        padding: "6px 8px",
                      },
                    },
                  }}
                />
              </Box>

              {/* GST Amount (only for GST bills) */}
              {billType === "gst" && (
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                    GST Amount
                  </Typography>
                  <TextField
                    value={`₹${totals.gstTotal?.toFixed(2) || "0.00"}`}
                    size="small"
                    InputProps={{
                      readOnly: true,
                      sx: {
                        height: "35px",
                        width: "120px",
                        "& input": {
                          textAlign: "right",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          color: "#d32f2f",
                          padding: "6px 8px",
                        },
                      },
                    }}
                  />
                </Box>
              )}

              {/* Grand Total */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: "bold", color: "text.secondary" }}>
                  Return Amount
                </Typography>
                <TextField
                  value={`₹${totals.grandTotal?.toFixed(2) || "0.00"}`}
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      height: "40px",
                      width: "130px",
                      backgroundColor: "#ffebee",
                      "& input": {
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        color: "#d32f2f",
                        padding: "8px 12px",
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Divider */}
          <Box sx={{ mb: 3, borderBottom: "1px dashed #e0e0e0" }} />

          {/* ========== PAYMENT DETAILS SECTION ========== */}
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}>
              Payment Details
            </Typography>

            {/* All Payment Details in Single Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Return Amount */}
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}>
                    Return Amount
                  </Typography>
                  <TextField
                    fullWidth
                    value={`₹${totals.grandTotal.toFixed(2)}`}
                    size="small"
                    InputProps={{
                      readOnly: true,
                      sx: {
                        height: "40px",
                        backgroundColor: "#ffebee",
                        "& input": {
                          padding: "8px 12px",
                          fontSize: "0.95rem",
                          textAlign: "right",
                          fontWeight: "medium",
                          color: "#d32f2f",
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* Customer Balance After Return */}
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}>
                    Customer Balance After Return
                  </Typography>
                  <TextField
                    fullWidth
                    value={`₹${(customer.openingAmount - totals.grandTotal).toFixed(2)}`}
                    size="small"
                    InputProps={{
                      readOnly: true,
                      sx: {
                        height: "40px",
                        backgroundColor: "#e8f5e9",
                        "& input": {
                          padding: "8px 12px",
                          fontSize: "0.95rem",
                          textAlign: "right",
                          fontWeight: "medium",
                          color: totals.grandTotal > customer.openingAmount ? "#d32f2f" : "#2e7d32",
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>

              {/* Payment Mode */}
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" gutterBottom sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}>
                    Payment Mode
                  </Typography>
                  <TextField
                    fullWidth
                    select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    size="small"
                    InputProps={{
                      sx: {
                        height: "40px",
                        "& input": {
                          padding: "8px 12px",
                          fontSize: "0.95rem",
                          textAlign: "right",
                          fontWeight: "medium",
                        },
                      },
                    }}
                    sx={{ "& .MuiInputBase-root": { height: "40px" } }}
                  >
                    <MenuItem value="">Select Mode</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="online">Online</MenuItem>
                    {/* <MenuItem value="cheque">Cheque</MenuItem> */}
                  </TextField>
                </Box>
              </Grid>
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <Box>
                <Typography variant="body2" gutterBottom sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  size="small"
                  placeholder="Add any notes about this return..."
                />
              </Box>
            </Grid>

            {/* ========== CALCULATION SUMMARY ========== */}
            <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#f5f7fa", borderColor: "#e0e0e0", mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: "bold", mb: 2 }}>
                Return Calculation Summary
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="body2" color="textSecondary">
                        Product Subtotal:
                      </Typography>
                      <TextField
                        value={`₹${totals.subtotal?.toFixed(2)}`}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            height: "35px",
                            width: "120px",
                            "& input": {
                              textAlign: "right",
                              fontSize: "0.85rem",
                              padding: "6px 8px",
                            },
                          },
                        }}
                      />
                    </Box>

                    {billType === "gst" && totals.gstTotal > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" color="textSecondary">
                          GST Amount:
                        </Typography>
                        <TextField
                          value={`+ ₹${totals.gstTotal?.toFixed(2)}`}
                          size="small"
                          InputProps={{
                            readOnly: true,
                            sx: {
                              height: "35px",
                              width: "120px",
                              "& input": {
                                textAlign: "right",
                                fontSize: "0.85rem",
                                color: "#d32f2f",
                                padding: "6px 8px",
                              },
                            },
                          }}
                        />
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1.5,
                        pt: 1.5,
                        borderTop: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="body1" fontWeight="bold">
                        Return Amount:
                      </Typography>
                      <TextField
                        value={`₹${totals.grandTotal?.toFixed(2)}`}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            height: "40px",
                            width: "130px",
                            backgroundColor: "#ffebee",
                            "& input": {
                              textAlign: "right",
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                              color: "#d32f2f",
                              padding: "8px 12px",
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      p: 1.5,
                      backgroundColor: "#e8f5e9",
                      borderRadius: 1,
                      border: "1px solid #c8e6c9",
                      height: "100%",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Current Balance:
                      </Typography>
                      <TextField
                        value={`₹${customer.openingAmount.toFixed(2)}`}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            height: "35px",
                            width: "120px",
                            "& input": {
                              textAlign: "right",
                              fontSize: "0.85rem",
                              color: "#1976d2",
                              padding: "6px 8px",
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        Return Amount:
                      </Typography>
                      <TextField
                        value={`- ₹${totals.grandTotal.toFixed(2)}`}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            height: "35px",
                            width: "120px",
                            "& input": {
                              textAlign: "right",
                              fontSize: "0.85rem",
                              color: "#d32f2f",
                              padding: "6px 8px",
                            },
                          },
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pt: 1,
                        borderTop: "1px dashed #c8e6c9",
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        New Balance:
                      </Typography>
                      <TextField
                        value={`₹${(customer.openingAmount - totals.grandTotal).toFixed(2)}`}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            height: "35px",
                            width: "120px",
                            "& input": {
                              textAlign: "right",
                              fontWeight: "bold",
                              fontSize: "0.85rem",
                              color: totals.grandTotal > customer.openingAmount ? "#d32f2f" : "#2e7d32",
                              padding: "6px 8px",
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        </Box>
      </Paper>

      {/* ========== 5. SUBMIT BUTTON ========== */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={close}
          sx={{
            py: 1.5,
            px: 4,
            height: "48px",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            background: "linear-gradient(135deg, #182848, #324b84ff)",
            color: "#fff",
            py: 1.5,
            px: 4,
            fontSize: '1rem',
            fontWeight: 'bold',
            height: '48px',
            '&:hover': {
              background: "linear-gradient(135deg, #0d1c3c, #1e3a8a)",
            }
          }}
        >
          Submit Return
        </Button>
      </Box>
    </Container>
  );
};

export default SaleBillForm;