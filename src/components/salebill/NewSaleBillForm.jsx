import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  TextField,
  Typography,
  IconButton,
  Divider,
  Autocomplete,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import {
  addProducts,
  getAllProducts,
  updateInventory,
} from "../../services/ProductService";
import {
  createUser,
  getAllUser,
  getUserById,
  registerUser,
  updateUser,
} from "../../services/UserService";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import { useAuth } from "../../context/AuthContext";
import {
  addSaleBill,
  deleteSaleBill,
  getSaleBillById,
  updateSaleBill,
} from "../../services/SaleBillService";
import ProductDetails from "./ProductDetails";
import BillType from "./BillType";
import CustomerDetails from "./CustomerDetails";
import { addPayment } from "../../services/PaymentModeService";
import { useNavigate } from "react-router-dom";
import { updatePurchaseBill } from "../../services/PurchaseBillService";
import { useFormNavigation } from "../shared/Navigation";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";

const NewSaleBillForm = ({
  setShowPrint,
  setPrintData,
  setSnackbarOpen,
  setSnackbarMessage,
  // setInvoiceNumber,
  close,
  refresh,
}) => {
  const { webuser } = useAuth();
  // const { getRef, handleKeyDown } = useFormNavigation();
  let fieldIndex = 0;
  // sum of all focusable inputs
  const { getRef, handleKeyDown } = useFormNavigation();
  // const getRef = (i) => refs[i];

  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    _id: "",
    first_name: "",
    address: "",
    phone_number: "",
    pincode: "",
    openingAmount: 0,
  });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [products, setProducts] = useState([]);
  const [paymentMode, setPaymentMode] = useState();
  const [billDate, setBillDate] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([
    {
      _id: "",
      productName: "",
      hsnCode: "",
      qty: 1,
      price: 0,
      discountPercentage: 0,
      discountedPrice: 0,
      gstPercent: 0,
      isExisting: false,
      category: "",
      cgst: 0,
      sgst: 0,
      igst: 0,
    },
  ]);
  const [billType, setBillType] = useState("nongst");
  const [gstPercent, setGstPercent] = useState(0);
  const [paymentType, setPaymentType] = useState("full");
  const [isWithinState, setIsWithinState] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentDetails, setPaymentDetails] = useState({
    advpaymode: "",
    transactionNumber: "",
    bankName: "",
    chequeNumber: "",
    balpaymode: "",
    transactionNumber2: "",
    bankName2: "",
    chequeNumber2: "",
    cardLastFour: "",
    cardLastFour2: "",
    fullMode: "",
    fullPaid: 0,
    dueDate: "",
    financeName: "",
    chequeDate: "",
    cardType: "",
  });
  const [totals, setTotals] = useState(0);
  const [step, setStep] = useState(1);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [state, setState] = useState();
  const [mainUser, setMainUser] = useState();
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({
    phone_number: "",
    products: {},
    stateCode: "",
  });
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: 0,
  });
  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

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
    fetchAll();
  }, []);

  // Calculating totals
  useEffect(() => {
    let subtotal = 0;
    selectedProducts.forEach((item) => {
      const qty = Number(item.qty);
      const taxable = qty * item.discountedPrice;
      subtotal += taxable;
    });
    const isMaharashtra = state?.toLowerCase() === "maharashtra";
    const isGST = billType === "gst";
    let gstTotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    if (isGST) {
      gstTotal = (subtotal * gstPercent) / 100;
      if (isMaharashtra) {
        cgst = gstPercent / 2;
        sgst = gstPercent / 2;
      } else {
        igst = gstTotal;
      }
    }

    const grandTotal = subtotal + gstTotal;
    setTotals({
      subtotal,
      gstTotal,
      cgst,
      sgst,
      igst,
      grandTotal,
    });
  }, [selectedProducts, gstPercent, billType, state]);

  // Fetch product data
  useEffect(() => {
    fetchProducts();
  }, [mainUser]);
  const customerList = users.filter(
    (u) =>
      u.role_id?.name?.toLowerCase() === "customer" &&
      u.organization_id?._id === mainUser?.organization_id?._id &&
      u.status === "active"
  );
  const fetchProducts = async () => {
    try {
      const data = await getAllProducts();
      const prod = (data?.data || []).filter(
        (p) =>
          p?.organization_id === mainUser?.organization_id?._id &&
          p.status === "active"
      );
      setProducts(prod);
    } catch (error) {
      console.error("Error fetching product data", error);
    }
  };

  const handleCustomerSelection = (value, type) => {
    let selectedCustomer = null;
    if (type === "phone") {
      const phoneRegex = /^[6-9]\d{9}$/;
      setCustomer((prev) => ({ ...prev, phone_number: value }));
      if (!phoneRegex.test(value)) {
        setErrors((prev) => ({
          ...prev,
          phone_number: "Invalid mobile number",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone_number: "", stateCode: "" }));
      }
    } else if (type === "name") {
      selectedCustomer = users.find(
        (s) =>
          s.first_name === value && s.role_id.name.toLowerCase() === "customer"
      );
    }

    if (selectedCustomer) {
      setCustomer({
        _id: selectedCustomer._id,
        first_name: selectedCustomer.first_name,
        address: selectedCustomer.address || "",
        phone_number: selectedCustomer.phone_number || value,
        openingAmount: selectedCustomer.openingAmount,
      });
      setGstDetails({
        gstNumber: selectedCustomer.gstDetails?.gstNumber || "",
        legalName: selectedCustomer.gstDetails?.legalName || "",
        state: selectedCustomer.gstDetails?.state || "",
        stateCode: selectedCustomer.gstDetails?.stateCode || "",
      });
      setIsExistingCustomer(true);
    } else {
      setCustomer((prev) => ({
        _id: "",
        first_name: type === "name" ? value : prev.first_name,
        address: prev.address,
        phone_number: type === "phone" ? value : prev.phone_number,
        openingAmount: selectedCustomer?.openingAmount || 0,
      }));
      setGstDetails({
        gstNumber: "",
        legalName: "",
        state: "",
        stateCode: "",
      });
      setIsExistingCustomer(false);
    }
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...selectedProducts];
    const item = updated[index];

    if (field === "productName") {
      const product = products.find((p) => p.name === value);
      if (product) {
        const price = product.compareAtPrice || 0;
        const discountPrice = product.price;
        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode || "",
          price,
          discountPercentage: product.discountPercentage,
          discountedPrice: discountPrice,
          gstPercent: product.gstPercent || gstPercent || 0,
          isExisting: true,
        };
      } else {
        updated[index] = {
          ...item,
          productName: value,
          isExisting: false,
        };
      }
    } else if (field === "hsnCode") {
      const product = products.find((p) => p.hsnCode === value);
      if (product) {
        const price = product.compareAtPrice || 0;
        const discountPrice = product.price;
        const discountPercentage = ((price - discountPrice) / price) * 100;

        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode,
          price,
          discountPercentage: discountPercentage,
          discountedPrice: discountPrice,
          gstPercent: product.gstPercent || gstPercent || 0,
          isExisting: true,
        };
      } else {
        updated[index] = {
          ...item,
          hsnCode: value,
          isExisting: false,
        };
      }
    } else if (field === "discountPercentage") {
      const discount = parseFloat(value) || 0;
      const price = parseFloat(item.price) || 0;
      const discountPrice = price - (price * discount) / 100;

      updated[index] = {
        ...item,
        discountPercentage: discount.toFixed(0),
        discountedPrice: discountPrice,
      };
    } else if (field === "discountedPrice") {
      const discountedPrice = parseFloat(value) || 0;
      const price = parseFloat(item.price) || 0;
      const discountPercentage =
        price > 0 ? ((price - discountedPrice) / price) * 100 : 0;

      updated[index] = {
        ...item,
        discountedPrice,
        discountPercentage: discountPercentage.toFixed(0),
      };
    } else if (field === "qty") {
      const qty = Number(value);
      const availableQty =
        products.find((p) => p._id === item._id)?.quantity || 0;

      if (qty > availableQty) {
        // Show error
        setErrors((prev) => ({
          ...prev,
          products: {
            ...prev.products,
            [index]: `Only ${availableQty} items left`,
          },
        }));
      } else {
        // Clear error
        setErrors((prev) => ({
          ...prev,
          products: {
            ...prev.products,
            [index]: "",
          },
        }));
        updated[index][field] = qty;
        // setSelectedProducts(updated);
      }
    } else {
      updated[index] = { ...item, [field]: value };
    }

    setSelectedProducts(updated);
  };

  const handleAddProduct = () => {
    setSelectedProducts([
      ...selectedProducts,
      {
        productName: "",
        hsnCode: "",
        qty: 1,
        price: 0,
        gst: 0,
        discountPercentage: 0,
        discountedPrice: 0,
      },
    ]);
  };

  const handleRemoveProduct = (index) => {
    const updated = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(updated);
  };

  const handlePincodeChange = async (e) => {
    const pincode = e.target.value;
    setCustomer({ ...customer, pincode });

    if (pincode.length === 6) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${pincode}`
        );
        if (!res.ok) {
          setSnackbarMessage("API response not OK");
          setSnackbarOpen(true);
          return;
        }
        const data = await res.json();
        const stateFind = data[0]?.PostOffice?.[0]?.State || "Not Found";
        if (stateFind === "Not Found") {
          setSnackbarMessage("State Not Found!");
          setSnackbarOpen(true);
          return;
        }
        setState(stateFind);
      } catch (error) {
        console.error("Error fetching state from pincode", error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      let finalCustomer = { ...customer };

      if (!customer.phone_number || !customer.first_name) {
        setSnackbarMessage("Please fill customer details!");
        setSnackbarOpen(true);
        return;
      }

      for (let p of selectedProducts) {
        if (!p.productName || p.qty <= 0 || p.price <= 0) {
          setSnackbarMessage("Please fill all product details correctly!");
          setSnackbarOpen(true);
          return;
        }
      }

      if (!isExistingCustomer) {
        const customerRole = roles.find(
          (role) => role.name.toLowerCase() === "customer"
        );
        const customerposition = positions.find(
          (pos) => pos.name.toLowerCase() === "customer"
        );
        const payload = {
          ...customer,
          organization_id: mainUser.organization_id?._id,
          email:
            customer.first_name.replace(/\s+/g, "").toLowerCase() +
            "@example.com",
          password:
            customer.first_name.replace(/\s+/g, "").toLowerCase() +
            "@example.com",
          role_id: customerRole._id,
          position_id: customerposition._id,
          gstDetails: {
            gstNumber: gstDetails.gstNumber,
            legalName: gstDetails.legalName,
            state: gstDetails.state,
            stateCode: gstDetails.stateCode,
          },
        };

        const res = await createUser(payload);
        const paymentPayload = {
          organization: mainUser.organization_id?._id,
          narration: "Opening Balance",
          client_id: res.data.data._id,
          forPayment: "sale",
          closingAmount: customer.openingAmount,
        };
        const resPayment = await addPayment(paymentPayload);

        finalCustomer = { ...customer, _id: res.data.data._id };
      }

      if (
        (billType === "gst" && gstDetails.gstNumber === "") ||
        gstDetails.legalName === "" ||
        gstDetails.stateCode === "" ||
        gstDetails.state === ""
      ) {
        setSnackbarMessage("Please Fill Gst Details");
        setSnackbarOpen(true);
        return;
      }

      // ---------- compute finalProducts & totals (replace your existing block) ----------
      const finalProducts = selectedProducts.map((product) => {
        const qty = Number(product.qty) || 0;
        // price = the actual selling/unit price after discount (use discountedPrice if available)
        const unitPrice = Number(product.discountedPrice ?? product.price) || 0;
        const lineAmount = +(qty * unitPrice); // taxable amount for this line

        // GST percent precedence:
        // 1) product.gstPercent (explicit)
        // 2) product.gst (legacy)
        // 3) parent gstPercent (global from BillType)
        // 4) fallback to 0
        const percentFromProduct =
          Number(product.gstPercent ?? product.gst) || 0;
        const rate = percentFromProduct || Number(gstPercent) || 0;

        // calculate GST amounts
        const gstAmount = +(lineAmount * (rate / 100)).toFixed(2);
        const cgstAmount = isWithinState ? +(gstAmount / 2).toFixed(2) : 0;
        const sgstAmount = isWithinState ? +(gstAmount / 2).toFixed(2) : 0;
        const igstAmount = !isWithinState ? +gstAmount.toFixed(2) : 0;
        const lineTotal = +(lineAmount + gstAmount).toFixed(2);

        return {
          _id: product._id,
          name: product.productName || product.name || "",
          hsnCode: product.hsnCode || "",
          qty,
          price: unitPrice, // price used for subtotal
          unitPrice: Number(product.price) || 0, // original price if you keep both
          discount: Number(product.discountPercentage) || 0,
          gstPercent: rate, // percent (important)
          gstAmount, // amount in ₹
          cgst: cgstAmount,
          sgst: sgstAmount,
          igst: igstAmount,
          lineTotal,
        };
      });

      // compute totals from finalProducts (single source of truth)
      const computedSubtotal = +finalProducts
        .reduce((acc, p) => acc + Number(p.qty) * Number(p.price), 0)
        .toFixed(2);
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
      const computedGrandTotal = +(computedSubtotal + computedGstTotal).toFixed(
        2
      );

      const finalTotals = {
        subtotal: Number(computedSubtotal) || 0,
        gstTotal: Number(computedGstTotal) || 0,
        cgst: Number(computedCgst) || 0,
        sgst: Number(computedSgst) || 0,
        igst: Number(computedIgst) || 0,
        grandTotal: Number(computedGrandTotal) || 0,
      };

      // ---------- final payload (guarantees numeric values) ----------
      const billPayload = {
        bill_to: finalCustomer._id,
        products: finalProducts,
        billDate: billDate,
        billType: billType,
        qty: selectedProducts.length,
        paymentType: paymentType,
        advance: advanceAmount || 0,
        balance: finalTotals.grandTotal - advanceAmount,
        balancePayMode:
          (paymentDetails.balancePayMode || "") +
          "-" +
          (paymentDetails.financeName || ""),
        fullPaid: Number(paymentDetails.fullPaid) || 0,
        subtotal: finalTotals.subtotal,
        discount: 0,
        // include gstPercent at top-level if your schema expects it:
        gstPercent: Number(gstPercent) || 0,
        gstTotal: finalTotals.gstTotal,
        cgst: finalTotals.cgst,
        sgst: finalTotals.sgst,
        igst: finalTotals.igst,
        grandTotal: finalTotals.grandTotal,
        org: mainUser.organization_id?._id,
        dueDate: paymentDetails.dueDate || null,
        notes: notes || "",
        createdBy: mainUser._id,
        status: "draft",
      };

      const res = await addSaleBill(billPayload);

      if (res.status === 401) {
        setSnackbarMessage("Your session is expired Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (res.success === true) {
        setSnackbarMessage("Sale bill created successfully!");
        setSnackbarOpen(true);

        const billData = await getSaleBillById(res.data._id);

        let paymentPayload = {
          client_id: finalCustomer._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "Sale",
          paymentType: paymentMode,
          narration: "Sale",
          balance: finalTotals.grandTotal,
          closingAmount:
            Number(finalCustomer?.openingAmount) +
            Number(finalTotals.grandTotal),
        };
        const paymentResult = await addPayment(paymentPayload);

        let paymentPayload2 = {
          client_id: finalCustomer._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "Sale",
          paymentType: paymentMode,
          narration: "Payment Recieved",
          advanceAmount: advanceAmount,
          closingAmount:
            Number(paymentResult.data?.closingAmount) - Number(advanceAmount),
        };

        const paymentResult2 = await addPayment(paymentPayload2);
        if (paymentResult?.success === false) {
          await deleteSaleBill(res.data._id);
          setSnackbarMessage(paymentResult.errors || "Payment creation failed");
          setSnackbarOpen(true);
          return;
        } else {
          //  update user
          const res = await updateUser(finalCustomer._id, {
            openingAmount:
              Number(finalCustomer.openingAmount) +
              Number(finalTotals.grandTotal - advanceAmount),
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

        setCustomer({
          first_name: "",
          address: "",
          phone_number: "",
          openingAmount: 0,
        });
        setSelectedProducts([
          {
            productName: "",
            hsnCode: "",
            qty: 0,
            price: 0,
            discountPercentage: 0,
            gst: 0,
            discountedPrice: 0,
          },
        ]);
        close();
      }
    } catch (error) {
      console.log(error);

      setSnackbarMessage("Customer " + error);
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Create Sale Bill : New
      </Typography>

      {/* Step 1: Customer Info */}
      <Box p={2} border="1px solid #ddd" borderRadius="8px" width={1200}>
        <Typography variant="h6" gutterBottom>
          Bill Details
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box mb={4}>
          {/* <Typography variant="subtitle1">Bill Date</Typography> */}
          <LocalizationProvider dateAdapter={AdapterMoment}>
            <DatePicker
              label="Bill Date"
              value={moment(billDate, "DD-MM-YYYY")}
              onChange={(newValue) =>
                setBillDate(moment(newValue).format("DD-MM-YYYY"))
              }
              format="DD-MM-YYYY"
              slotProps={{
                textField: {
                  inputRef: getRef(fieldIndex),
                  onKeyDown: (e) => handleKeyDown(e, fieldIndex),
                  inputProps: { tabIndex: 20 }, // 👈 keep this inside textField
                },
              }}
            />
          </LocalizationProvider>
          {fieldIndex++}
        </Box>
        <FormControl component="fieldset">
          <Typography variant="subtitle1">Bill Type</Typography>
          <RadioGroup
            row
            value={billType}
            onChange={(e) => setBillType(e.target.value)}
          >
            {fieldIndex++}
            <FormControlLabel
              value="gst"
              control={
                <Radio
                  inputRef={getRef(fieldIndex)}
                  onKeyDown={(e) => handleKeyDown(e, fieldIndex)}
                />
              }
              label="GST Bill"
            />

            <FormControlLabel
              value="nongst"
              control={
                <Radio
                  inputRef={getRef(fieldIndex)}
                  onKeyDown={(e) => handleKeyDown(e, fieldIndex)}
                />
              }
              label="Non-GST Bill"
            />
          </RadioGroup>
        </FormControl>

        {/* Within State / Out of State */}
        {/* {billType === "gst" && (
          <Box mt={3}>
            <FormControl component="fieldset">
              <Typography variant="subtitle1">Billing Location</Typography>
              <RadioGroup
                row
                value={isWithinState ? "within" : "out"} // <-- now string for UI
                onChange={(e) => setIsWithinState(e.target.value === "within")}
              >
                <FormControlLabel
                  value="within"
                  control={
                    <Radio
                      inputRef={getRef(3)} // ✅ within radio
                      onKeyDown={(e) => handleKeyDown(e, 3, totalFields)}
                    />
                  }
                  label="Within State"
                />
                <FormControlLabel
                  value="out"
                  control={
                    <Radio
                      inputRef={getRef(4)} // ✅ within radio
                      onKeyDown={(e) => handleKeyDown(e, 4, totalFields)}
                    />
                  }
                  label="Out of State"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        )} */}
        {billType === "gst" && (
          <>
            {fieldIndex++}
            <RadioGroup
              row
              value={isWithinState ? "within" : "out"} // <-- now string for UI
              onChange={(e) => setIsWithinState(e.target.value === "within")}
            >
              <FormControlLabel
                value="out"
                control={
                  <Radio
                    inputRef={getRef(fieldIndex)}
                    onKeyDown={(e) => handleKeyDown(e, fieldIndex)}
                  />
                }
                label="Out of State"
              />

              {fieldIndex++}
              <FormControlLabel
                value="within"
                control={
                  <Radio
                    inputRef={getRef(fieldIndex)}
                    onKeyDown={(e) => handleKeyDown(e, fieldIndex)}
                  />
                }
                label="within State"
              />
            </RadioGroup>
            {fieldIndex++}
          </>
        )}
      </Box>
      {/* Step 2: Product Details */}

      <Box mt={3}>
        <Typography variant="h6">Customer Details</Typography>
        <Divider />
        <Grid container spacing={2} mt={4}>
          <Autocomplete
            freeSolo // allows typing values not in list
            options={customerList}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : option.first_name + " " + (option.last_name || "")
            }
            value={
              customerList.find((s) => s.first_name === customer.first_name) ||
              customer.first_name ||
              "" // keep typed value for new customer
            }
            onChange={(event, newValue) => {
              if (typeof newValue === "string") {
                // User typed a new vendor name
                handleCustomerSelection(newValue, "name");
              } else if (newValue && newValue.first_name) {
                // Selected existing vendor
                handleCustomerSelection(newValue.first_name, "name");
              }
            }}
            onInputChange={(event, newInputValue) => {
              // This handles typing live into the field
              if (event && event.type === "change") {
                handleCustomerSelection(newInputValue, "name");
              }
            }}
            ListboxProps={{
              style: {
                maxHeight: 300,
                overflowY: "auto",
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer Name"
                sx={{ width: "200px" }}
                inputRef={getRef(fieldIndex)}
                onKeyDown={(e) => handleKeyDown(e, fieldIndex)} // 20 = total fields across all components
              />
            )}
          />
          {fieldIndex++}
          <Grid item xs={12} sm={4} width={200}>
            <TextField
              label="Mobile Number"
              fullWidth
              value={customer.phone_number}
              onChange={(e) => handleCustomerSelection(e.target.value, "phone")}
              error={Boolean(errors.phone_number)}
              helperText={errors.phone_number}
              inputRef={getRef(fieldIndex)}
              onKeyDown={(e) => handleKeyDown(e, fieldIndex)}
            />
          </Grid>
          {fieldIndex++}
          <Grid item xs={12} sm={4} width={200}>
            <TextField
              label="Address"
              fullWidth
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
              disabled={isExistingCustomer}
              inputRef={getRef(fieldIndex)}
              onKeyDown={(e) => handleKeyDown(e, fieldIndex)}
            />
          </Grid>
          {fieldIndex++}
          <Grid item xs={12} sm={4} width={200}>
            <TextField
              label="Opening Amount"
              fullWidth
              value={customer.openingAmount}
              onChange={(e) =>
                setCustomer({ ...customer, openingAmount: e.target.value })
              }
              disabled={isExistingCustomer}
              inputRef={getRef(8)} // ✅ index 8
              onKeyDown={(e) => handleKeyDown(e, 8)}
            />
          </Grid>
          {fieldIndex++}
          <Grid container spacing={2} mt={1}>
            {billType === "gst" &&
              Object.entries(gstDetails).map(([key, value]) => {
                const thisIndex = fieldIndex++; // ✅ works inside { }

                return (
                  <Grid item xs={12} sm={6} key={key} width={200}>
                    {thisIndex}
                    <TextField
                      fullWidth
                      label={
                        key === "legalName"
                          ? "Business Name"
                          : key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (s) => s.toUpperCase())
                      }
                      name={key}
                      value={value}
                      onChange={(e) => {
                        const newValue = e.target.value;

                        setGstDetails((prev) => ({
                          ...prev,
                          [key]: newValue,
                        }));

                        // validate only stateCode here
                        if (key === "stateCode") {
                          const stateCodeRegex = /^\d{2}$/; // GST state code = 2 digits
                          if (!stateCodeRegex.test(newValue)) {
                            setErrors((prev) => ({
                              ...prev,
                              stateCode: "Invalid State Code",
                            }));
                          } else {
                            setErrors((prev) => ({ ...prev, stateCode: "" }));
                          }
                        }
                      }}
                      error={
                        key === "stateCode" ? Boolean(errors.stateCode) : false
                      }
                      helperText={key === "stateCode" ? errors.stateCode : ""}
                      inputRef={getRef(thisIndex)} // ✅ dynamic index
                      onKeyDown={(e) => handleKeyDown(e, thisIndex)}
                    />
                  </Grid>
                );
              })}
          </Grid>
          {fieldIndex++}
        </Grid>
      </Box>

      {/* Step 3: Bill Type */}
      <ProductDetails
        products={products}
        selectedProducts={selectedProducts}
        handleProductChange={handleProductChange}
        handleAddProduct={handleAddProduct}
        handleRemoveProduct={handleRemoveProduct}
        setSelectedProducts={setSelectedProducts} //barcode
        productErrors={errors.products}
        billType={billType}
        isWithinState={isWithinState}
        setAdvanceAmount={setAdvanceAmount}
        advanceAmount={advanceAmount}
        setPaymentMode={setPaymentMode}
        paymentMode={paymentMode}
        getRef={getRef}
        handleKeyDown={handleKeyDown}
        // totalFields={totalFields}
      />

      <Box mt={4} display="flex" justifyContent="space-between">
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            background: "linear-gradient(135deg, #182848, #324b84ff)",
            color: "#fff",
          }}
        >
          Submit Bill
        </Button>
      </Box>
    </>
  );
};

export default NewSaleBillForm;
