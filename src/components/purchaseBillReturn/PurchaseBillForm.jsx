// PurchaseBillForm.jsx (Return Version)
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
  getAllUser,
  getUserById,
  registerUser,
  updateUser,
} from "../../services/UserService";
import {
  addProducts,
  getAllProducts,
  updateInventory,
} from "../../services/ProductService";
import {
  addPurchaseBill,
  deletePurchaseBill,
} from "../../services/PurchaseBillService";
import { getAllCategories } from "../../services/CategoryService";
import { addPayment } from "../../services/PaymentModeService";

const PurchaseBillForm = ({
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
  const [vendor, setVendor] = useState({
    _id: "",
    name: "",
    address: "",
    phone_number: "",
    pincode: "",
    openingAmount: 0,
  });

  const [isExistingVendor, setIsExistingVendor] = useState(false);
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
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [billType, setBillType] = useState("nongst");
  const [gstPercent, setGstPercent] = useState(0);
  const [isWithinState, setIsWithinState] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingCharge, setShippingCharge] = useState(0);
  const [packagingCharge, setPackagingCharge] = useState(0);

  const [totals, setTotals] = useState({
    subtotal: 0,
    gstTotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    additionalCharges: 0,
    taxableAmount: 0,
    grandTotal: 0,
  });

  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState();
  const [mainUser, setMainUser] = useState();
  const [categories, setCategories] = useState([]);
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
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
      }
    };

    if (webuser?.id) fetchCategories();
  }, [webuser?.id]);

  // Calculate totals
  useEffect(() => {
    calculateOverallTotals();
  }, [
    selectedProducts,
    gstPercent,
    billType,
    isWithinState,
    shippingCharge,
    packagingCharge,
  ]);

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

    const additionalCharges =
      Number(shippingCharge || 0) + Number(packagingCharge || 0);
    const taxableAmount = subtotal;

    const grandTotal = subtotal + gstTotal + additionalCharges;

    setTotals({
      subtotal,
      gstTotal,
      cgst,
      sgst,
      igst,
      additionalCharges,
      taxableAmount,
      grandTotal,
    });
  };

  // Vendor selection
  const handleVendorSelection = (value, type) => {
    let selectedVendor = null;

    if (type === "phone") {
      const phoneRegex = /^[6-9]\d{9}$/;
      setVendor((prev) => ({ ...prev, phone_number: value }));
      if (!phoneRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          phone_number: "Invalid mobile number",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone_number: "" }));
      }
      selectedVendor = users.find(
        (u) =>
          u.phone_number === value &&
          u.role_id?.name?.toLowerCase() === "vendor"
      );
    } else if (type === "name") {
      selectedVendor = users.find(
        (s) =>
          s.name === value && s.role_id?.name?.toLowerCase() === "vendor"
      );
    }

    if (selectedVendor) {
      setVendor({
        _id: selectedVendor._id,
        name: selectedVendor.name,
        address: selectedVendor.address || "",
        phone_number: selectedVendor.phone_number || value,
        openingAmount: selectedVendor.openingAmount || 0,
      });
      setGstDetails({
        gstNumber: selectedVendor.gstDetails?.gstNumber || "",
        legalName: selectedVendor.gstDetails?.legalName || "",
        state: selectedVendor.gstDetails?.state || "",
      });
      setIsExistingVendor(true);
    } else {
      setVendor((prev) => ({
        _id: "",
        name: type === "name" ? value : prev.name,
        address: prev.address,
        phone_number: type === "phone" ? value : prev.phone_number,
        openingAmount: prev.openingAmount,
      }));
      setGstDetails({
        gstNumber: "",
        legalName: "",
        state: "",
      });
      setIsExistingVendor(false);
    }
  };

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value;
    setVendor({ ...vendor, pincode });

    if (pincode.length === 6) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`
        );
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
      const product = products.find(
        (p) => p.name.toLowerCase() === value.toLowerCase()
      );
      if (product) {
        const productGstPercent =
          billType === "gst" ? product.gstPercent || gstPercent || 0 : 0;

        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode || "",
          productCode: product.productCode || "",
          price: product.compareAtPrice || 0,
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
      let finalVendor = { ...vendor };

      // Validation
      if (
        !vendor.phone_number ||
        !vendor.name ||
        vendor.phone_number?.length !== 10
      ) {
        setSnackbarMessage("Please fill valid vendor details!");
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
        const gstRegex =
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

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
          setSnackbarMessage(
            "Please select if transaction is within state or not!"
          );
          setSnackbarOpen(true);
          return;
        }
      }

      // Register vendor if not existing
      if (!isExistingVendor) {
        const vendorRole = roles.find(
          (role) => role.name.toLowerCase() === "vendor"
        );
        const vendorposition = positions.find(
          (pos) => pos.name.toLowerCase() === "vendor"
        );
        const payload = {
          ...vendor,
          organization_id: mainUser.organization_id?._id,
          email:
            vendor.name.replace(/\s+/g, "").toLowerCase() + "@example.com",
          password:
            vendor.name.replace(/\s+/g, "").toLowerCase() + "@example.com",
          role_id: vendorRole?._id,
          position_id: vendorposition?._id,
          gstDetails: billType === "gst" ? gstDetails : {},
        };
        const res = await registerUser(payload);
        finalVendor = {
          ...vendor,
          _id: res.user.id || res?.data?.id || res?.data?._id,
        };
        setIsExistingVendor(true);
        setVendor({
          _id: res.data.data._id,
          name: res.data.data.name,
          address: res.data.data.address || "",
          phone_number: res.data.data.phone_number,
        });
      }

      // Handle products
      for (let prod of selectedProducts) {
        if (!prod.isExisting) {
          if (billType === "gst" && (!prod.hsnCode || prod.hsnCode.length < 4)) {
            setSnackbarMessage(
              "HSN code must be at least 4 digits for GST bills!"
            );
            setSnackbarOpen(true);
            return;
          }

          const newProductPayload = {
            name: prod.productName,
            category: prod.category,
            hsnCode: prod.hsnCode,
            productCode: prod.productCode,
            price: prod.discountedPrice,
            compareAtPrice: prod.price,
            quantity: prod.qty,
            gstPercent: prod.gstPercent,
            organization_id: mainUser.organization_id?._id,
            status: "active",
          };
          const res = await addProducts(newProductPayload);
          prod._id = res.data._id;
          prod.isExisting = true;
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
        const gstAmount =
          billType === "gst"
            ? +(discountPrice * (rate / 100)).toFixed(2)
            : 0;

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
      const computedSubtotal = +finalProducts
        .reduce((acc, p) => acc + Number(p.price), 0)
        .toFixed(2);

      const computedAdditionalCharges =
        Number(shippingCharge || 0) + Number(packagingCharge || 0);
      const computedTaxableAmount = computedSubtotal;

      const computedGstTotal = +finalProducts
        .reduce((acc, p) => acc + (Number(p.gstAmount) || 0), 0)
        .toFixed(2);

      const computedCgst = +finalProducts
        .reduce((acc, p) => acc + (Number(p.cgst) || 0), 0)
        .toFixed(2);
      const computedSgst = +finalProducts
        .reduce((acc, p) => acc + (Number(p.sgst) || 0), 0)
        .toFixed(2);
      const computedIgst = +finalProducts
        .reduce((acc, p) => acc + (Number(p.igst) || 0), 0)
        .toFixed(2);

      const computedGrandTotal = +(
        computedSubtotal +
        computedGstTotal +
        computedAdditionalCharges
      ).toFixed(2);

      const finalTotals = {
        subtotal: Number(computedSubtotal) || 0,
        gstTotal: Number(computedGstTotal) || 0,
        cgst: Number(computedCgst) || 0,
        sgst: Number(computedSgst) || 0,
        igst: Number(computedIgst) || 0,
        additionalCharges: Number(computedAdditionalCharges) || 0,
        taxableAmount: Number(computedTaxableAmount) || 0,
        grandTotal: Number(computedGrandTotal) || 0,
      };

      // Prepare bill payload
      const billPayload = {
        bill_to: finalVendor._id,
        products: finalProducts,
        billType: billType,
        billDate: billDate,
        qty: selectedProducts.length,
        paymentType: paymentType,
        advance: Number(finalTotals.grandTotal).toFixed(2),
        balance: 0,
        subtotal: finalTotals.subtotal,
        discount: 0,
        gstPercent: Number(gstPercent) || 0,
        gstTotal: finalTotals.gstTotal,
        cgst: finalTotals.cgst,
        sgst: finalTotals.sgst,
        igst: finalTotals.igst,
        shippingCharge: Number(shippingCharge || 0),
        packagingCharge: Number(packagingCharge || 0),
        additionalCharges: finalTotals.additionalCharges,
        taxableAmount: finalTotals.taxableAmount,
        grandTotal: finalTotals.grandTotal,
        isReturn: true,
        org: mainUser.organization_id?._id,
        notes: notes || "",
        createdBy: mainUser._id,
        status: "draft",
        isWithinState: isWithinState === "true",
      };

      const res = await addPurchaseBill(billPayload);

      if (res?.success === false) {
        setSnackbarMessage(res.message || "Failed to create purchase bill");
        setSnackbarOpen(true);
        return;
      }

      if (res?.status === 401) {
        setSnackbarMessage("Your session is expired Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (res?.success === true || res?.data) {
        setSnackbarMessage("Purchase Return created successfully!");
        setSnackbarOpen(true);

        // Payment processing for RETURN
        let paymentPayload2 = {
          client_id: finalVendor._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "purchase",
          paymentType: paymentMode,
          narration: "Purchase Return",
          advanceAmount: finalTotals.grandTotal,
          closingAmount: Number(
            (
              Number(finalVendor.openingAmount) - Number(finalTotals.grandTotal)
            ).toFixed(2)
          ),
        };

        const paymentResult2 = await addPayment(paymentPayload2);
        if (paymentResult2?.success === false) {
          await deletePurchaseBill(res.data._id);
          setSnackbarMessage(
            paymentResult2.errors || "Payment creation failed"
          );
          setSnackbarOpen(true);
          return;
        } else {
          const res = await updateUser(finalVendor._id, {
            openingAmount: Number(
              (
                Number(finalVendor.openingAmount) -
                Number(finalTotals.grandTotal)
              ).toFixed(2)
            ),
          });
        }

        // Reset form
        setVendor({
          _id: "",
          name: "",
          address: "",
          phone_number: "",
          pincode: "",
          openingAmount: 0,
        });
        setSelectedProducts([
          {
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
            total: 0,
          },
        ]);
        setAdvanceAmount(0);
        setShippingCharge(0);
        setPackagingCharge(0);
        setGstDetails({ gstNumber: "", legalName: "", state: "" });
        setBillType("nongst");
        setGstPercent(0);
        setIsWithinState("");
        setNotes("");
        setPaymentMode("");

        if (refresh) refresh();
        if (close) close();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSnackbarMessage("Vendor " + (error?.message || error));
      setSnackbarOpen(true);
    }
  };

  // Filter vendor users
  const vendorUsers = users.filter(
    (u) =>
      u.role_id?.name?.toLowerCase() === "vendor" &&
      u.organization_id?._id === mainUser?.organization_id?._id &&
      u.status === "active"
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
        Create Purchase Return
      </Typography>

      {/* ========== 1. BILL INFORMATION SECTION ========== */}
      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Bill Information
        </Typography>

        <Grid container spacing={2}>
          {/* Bill Date */}
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              type="date"
              label="Bill Date"
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
          {billType === "gst" && (
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
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}
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

      {/* ========== 2. VENDOR DETAILS SECTION ========== */}
      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Vendor Details
        </Typography>

        <Grid container spacing={2}>
          {/* Vendor Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor Name *"
              value={vendor.name}
              onChange={(e) => handleVendorSelection(e.target.value, "name")}
              size="small"
              placeholder="Enter vendor name"
            />
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number *"
              value={vendor.phone_number}
              onChange={(e) => handleVendorSelection(e.target.value, "phone")}
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
              multiline
              rows={2}
              label="Address"
              value={vendor.address}
              onChange={(e) => setVendor({ ...vendor, address: e.target.value })}
              size="small"
              placeholder="Vendor address"
            />
          </Grid>

          {/* Pincode */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Pincode"
              value={vendor.pincode}
              onChange={handlePincodeChange}
              size="small"
              placeholder="6-digit pincode"
              inputProps={{ maxLength: 6 }}
              helperText={state && `State: ${state}`}
            />
          </Grid>

          {/* Remaining Amount */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Remaining Amount"
              value={vendor.openingAmount}
              onChange={(e) =>
                setVendor({
                  ...vendor,
                  openingAmount: Number(e.target.value) || 0,
                })
              }
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₹</InputAdornment>
                ),
                inputProps: { step: 0.01 },
              }}
            />
          </Grid>
        </Grid>

        {/* ===== GST Registration Details (only for GST bills) ===== */}
        {billType === "gst" && (
          <Box
            sx={{
              mt: 4,
              p: 3,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              backgroundColor: "#f9f9f9",
            }}
          >
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              GST Registration Details
            </Typography>

            <Grid container spacing={2}>
              {/* GST Number */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="GST Number *"
                  value={gstDetails.gstNumber}
                  onChange={(e) =>
                    setGstDetails({ ...gstDetails, gstNumber: e.target.value })
                  }
                  size="small"
                  placeholder="22ABCDE1234F1Z5"
                  inputProps={{
                    style: { textTransform: "uppercase" },
                    maxLength: 15,
                  }}
                />
              </Grid>

              {/* Legal Name */}
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Legal Name *"
                  value={gstDetails.legalName}
                  onChange={(e) =>
                    setGstDetails({ ...gstDetails, legalName: e.target.value })
                  }
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
                  onChange={(e) =>
                    setGstDetails({ ...gstDetails, state: e.target.value })
                  }
                  size="small"
                  placeholder="e.g., Maharashtra"
                />
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* ========== 3. PRODUCT DETAILS SECTION ========== */}
      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
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
                <TableCell
                  sx={{
                    width: isMobile ? "70px" : "8%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
                  HSN Code
                </TableCell>
                <TableCell
                  sx={{
                    width: isMobile ? "70px" : "8%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
                  Product Code
                </TableCell>
                <TableCell
                  sx={{
                    width: isMobile ? "50px" : "6%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
                  Qty
                </TableCell>
                <TableCell
                  sx={{
                    width: isMobile ? "80px" : "10%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
                  Price
                </TableCell>
                <TableCell
                  sx={{
                    width: isMobile ? "70px" : "8%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
                  Discount
                </TableCell>
                {billType === "gst" && (
                  <>
                    <TableCell
                      sx={{
                        width: isMobile ? "60px" : "7%",
                        fontWeight: "bold",
                        padding: "8px",
                      }}
                    >
                      GST%
                    </TableCell>
                    {isWithinState === "true" && (
                      <>
                        <TableCell
                          sx={{
                            width: isMobile ? "60px" : "7%",
                            fontWeight: "bold",
                            padding: "8px",
                          }}
                        >
                          CGST%
                        </TableCell>
                        <TableCell
                          sx={{
                            width: isMobile ? "60px" : "7%",
                            fontWeight: "bold",
                            padding: "8px",
                          }}
                        >
                          SGST%
                        </TableCell>
                      </>
                    )}
                    {isWithinState === "false" && (
                      <TableCell
                        sx={{
                          width: isMobile ? "60px" : "7%",
                          fontWeight: "bold",
                          padding: "8px",
                        }}
                      >
                        IGST%
                      </TableCell>
                    )}
                  </>
                )}
                <TableCell
                  sx={{
                    width: isMobile ? "80px" : "10%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
                  Total
                </TableCell>
                <TableCell
                  sx={{
                    width: isMobile ? "50px" : "5%",
                    fontWeight: "bold",
                    padding: "8px",
                  }}
                >
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
                const gstAmount =
                  billType === "gst"
                    ? (taxable * (Number(productItem.gstPercent) || 0)) / 100
                    : 0;
                const productTotal = taxable + gstAmount;

                // Calculate CGST and SGST percentages
                const cgstPercent =
                  billType === "gst" && isWithinState === "true"
                    ? (Number(productItem.gstPercent) || 0) / 2
                    : 0;
                const sgstPercent =
                  billType === "gst" && isWithinState === "true"
                    ? (Number(productItem.gstPercent) || 0) / 2
                    : 0;
                const igstPercent =
                  billType === "gst" && isWithinState === "false"
                    ? Number(productItem.gstPercent) || 0
                    : 0;

                return (
                  <TableRow
                    key={index}
                    sx={{ "&:hover": { backgroundColor: "#fafafa" } }}
                  >
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
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "productName",
                              e.target.value
                            )
                          }
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
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "productName",
                              e.target.value
                            )
                          }
                          SelectProps={{
                            native: false,
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (!selected) {
                                return (
                                  <span style={{ color: "#999" }}>
                                    Select product
                                  </span>
                                );
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
                            <MenuItem
                              key={prod._id}
                              value={prod.name}
                              sx={{
                                py: 1,
                                minHeight: "36px",
                                width: "100%",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  width: "100%",
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {prod.name}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mt: 0.5,
                                  }}
                                >
                                  <Typography variant="caption" color="textSecondary">
                                    HSN: {prod.hsnCode || "N/A"}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    Price: ₹{prod.compareAtPrice || prod.price || 0}
                                  </Typography>
                                </Box>
                                {prod.quantity !== undefined && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 0.5,
                                      color:
                                        prod.quantity > 0
                                          ? "success.main"
                                          : "error.main",
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
                        onChange={(e) =>
                          handleProductChange(index, "hsnCode", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "productCode",
                            e.target.value
                          )
                        }
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
                        onChange={(e) =>
                          handleProductChange(index, "qty", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleProductChange(index, "price", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleProductChange(
                            index,
                            "discountPercentage",
                            e.target.value
                          )
                        }
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
                          onChange={(e) =>
                            handleProductChange(
                              index,
                              "gstPercent",
                              e.target.value
                            )
                          }
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
                            color: "#1976d2",
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

        <Button
          variant="contained"
          color="success"
          startIcon={<Add />}
          onClick={handleAddProduct}
          size="small"
          sx={{ height: "36px" }}
        >
          Add Product
        </Button>
      </Paper>

      {/* ========== 4. TOTALS & PAYMENT SECTION ========== */}
      <Paper
        elevation={2}
        sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ mb: 3, pb: 2, borderBottom: "1px solid #e0e0e0" }}
        >
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
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
              >
                Totals
              </Typography>

              {/* Subtotal */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
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
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", color: "text.secondary" }}
                  >
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

              {/* Hamali & Packing */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
                  Hamali & Packing
                </Typography>
                <TextField
                  type="number"
                  value={totals.additionalCharges}
                  onChange={(e) => {
                    const value = Math.max(0, Number(e.target.value) || 0);
                    setShippingCharge(value / 2);
                    setPackagingCharge(value / 2);
                  }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">₹</InputAdornment>
                    ),
                    inputProps: { step: 0.01, min: 0 },
                    sx: { height: "35px", width: "120px" },
                  }}
                  sx={{ "& .MuiInputBase-root": { height: "35px", width: "120px" } }}
                />
              </Box>

              {/* Grand Total */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
                  Grand Total
                </Typography>
                <TextField
                  value={`₹${totals.grandTotal?.toFixed(2) || "0.00"}`}
                  size="small"
                  InputProps={{
                    readOnly: true,
                    sx: {
                      height: "40px",
                      width: "130px",
                      backgroundColor: "#e3f2fd",
                      "& input": {
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: "1rem",
                        color: "#1976d2",
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
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ mb: 2, fontWeight: "bold", color: "primary.main" }}
            >
              Payment Details
            </Typography>

            {/* All Payment Details in Single Row */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {/* Payment Mode (For Return) */}
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography
                    variant="body2"
                    gutterBottom
                    sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}
                  >
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
                  </TextField>
                </Box>
              </Grid>

              {/* Return Amount (Read-only) */}
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography
                    variant="body2"
                    gutterBottom
                    sx={{ fontWeight: "bold", color: "text.secondary", mb: 1 }}
                  >
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
                        backgroundColor: "#e8f5e9",
                        "& input": {
                          padding: "8px 12px",
                          fontSize: "0.95rem",
                          textAlign: "right",
                          fontWeight: "medium",
                          color: "#2e7d32",
                        },
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>

            {/* ========== CALCULATION SUMMARY ========== */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                backgroundColor: "#f5f7fa",
                borderColor: "#e0e0e0",
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: "bold", mb: 2 }}
              >
                Calculation Summary
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
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
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
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

                    {totals.additionalCharges > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="body2" color="textSecondary">
                          Hamali & Packing:
                        </Typography>
                        <TextField
                          value={`+ ₹${totals.additionalCharges?.toFixed(2)}`}
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
                        Total Return Amount:
                      </Typography>
                      <TextField
                        value={`₹${totals.grandTotal?.toFixed(2)}`}
                        size="small"
                        InputProps={{
                          readOnly: true,
                          sx: {
                            height: "40px",
                            width: "130px",
                            backgroundColor: "#e3f2fd",
                            "& input": {
                              textAlign: "right",
                              fontWeight: "bold",
                              fontSize: "0.9rem",
                              color: "#1976d2",
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
                      backgroundColor: "#fff3e0",
                      borderRadius: 1,
                      border: "1px solid #ffe0b2",
                      textAlign: "center",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      This is a Purchase Return
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="#ed6c02">
                      Amount will be deducted from vendor's balance
                    </Typography>
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
            fontSize: "1rem",
            fontWeight: "bold",
            height: "48px",
            "&:hover": {
              background: "linear-gradient(135deg, #0d1c3c, #1e3a8a)",
            },
          }}
        >
          Submit Return
        </Button>
      </Box>
    </Container>
  );
};

export default PurchaseBillForm;