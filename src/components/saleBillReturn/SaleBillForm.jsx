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

const SaleBillForm = ({
  setShowPrint,
  setPrintData,
  setSnackbarOpen,
  setSnackbarMessage,
  // setInvoiceNumber,
  close,
  refresh,
}) => {
  const { webuser } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({
    _id: "",
    name: "",
    address: "",
    phone_number: "",
    pincode: "",
    openingAmount: 0,
  });
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [products, setProducts] = useState([]);
  const [paymentMode, setPaymentMode] = useState();
  const [billDate, setBillDate] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([
    {
      _id: "",
      productName: "",
      hsnCode: "",
      productCode:"",
      qty: 1,
      price: 0,
      discountPercentage: "",
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
    // advance: 0,
    // balance: 0,
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
  const [errors, setErrors] = useState({ phone_number: "", products: {} });
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
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
      const taxable = qty * item.price;
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
        setErrors((prev) => ({ ...prev, phone_number: "" }));
      }

      // selectedCustomer = users.find(
      //   (u) =>
      //     u.phone_number === value && u.role_id.name.toLowerCase() === "customer"
      // );
    } else if (type === "name") {
      selectedCustomer = users.find(
        (s) => s.name === value && s.role_id.name.toLowerCase() === "customer"
      );
    }

    if (selectedCustomer) {
      setCustomer({
        _id: selectedCustomer._id,
        name: selectedCustomer.name,
        address: selectedCustomer.address || "",
        phone_number: selectedCustomer.phone_number || value,
        openingAmount: selectedCustomer.openingAmount,
      });
      setGstDetails({
        gstNumber: selectedCustomer.gstDetails?.gstNumber || "",
        legalName: selectedCustomer.gstDetails?.legalName || "",
        state: selectedCustomer.gstDetails?.state || "",
      });
      setIsExistingCustomer(true);
    }
    // else {
    //   setCustomer((prev) => ({
    //     _id: "",
    //     name: type === "name" ? value : prev.name,
    //     address: prev.address,
    //     phone_number: type === "phone" ? value : prev.phone_number,
    //     openingAmount: selectedCustomer?.openingAmount || 0,
    //   }));
    //   setGstDetails({
    //     gstNumber: "",
    //     legalName: "",
    //     state: "",
    //   });
    //   setIsExistingCustomer(false);
    // }
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
          productCode: product.productCode || "",
          price : product.price,
          // discountPercentage: product.discountPercentage,
          // discountedPrice: discountPrice,
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
    } 
    else if (field === "productCode") {
      const product = products.find((p) => p.productCode === value);
      if (product) {
        const price = product.compareAtPrice || 0;
        const discountPrice = product.price;
        const discountPercentage = ((price - discountPrice) / price) * 100;

        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode,
          productCode: product.productCode,
          price : product.price,
          // discountPercentage: discountPercentage,
          // discountedPrice: discountPrice,
          gstPercent: product.gstPercent || gstPercent || 0,
          isExisting: true,
        };
      } else {
        updated[index] = {
          ...item,
          productCode: value,
          isExisting: false,
        };
      }
    }
    else if (field === "hsnCode") {
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
          productCode: product.productCode,
          price : product.price,
          // discountPercentage: discountPercentage,
          // discountedPrice: discountPrice,
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
    }
     else if (field === "discountPercentage") {
      const discountStr = value;
      const price = parseFloat(item.price) || 0;
      let discountedPrice = price;
      if (discountStr.includes("%")) {
        const percent = parseFloat(discountStr.replace("%", ""));
        discountedPrice = price - (price * percent) / 100;
      } else {
        const flatDiscount = parseFloat(discountStr);
        if (!isNaN(flatDiscount)) {
          discountedPrice = price - flatDiscount;
        }
      }

      updated[index] = {
        ...item,
        discountPercentage: discountStr, // keep user input as string
        discountedPrice,
      };
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
        productCode : "",
        qty: 1,
        price: 0,
        gst: 0,
        discountPercentage: "",
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

      if (!customer.phone_number || !customer.name || customer.phone_number?.length > 10) {
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
      // ---------- compute finalProducts & totals (replace your existing block) ----------
      const finalProducts = selectedProducts.map((product) => {
        const qty = Number(product.qty) || 0;
        // price = the actual selling/unit price after discount (use discountedPrice if available)
        const unitPrice = Number(product.price) || 0;
        const lineAmount = +(qty * unitPrice); // taxable amount for this line
        const discountStr = product.discountPercentage.toString();
        let discountPrice = 0;
        if (discountStr.includes("%")) {
          const percent = parseFloat(discountStr) || 0;
          discountPrice = unitPrice * qty - (unitPrice * qty * percent) / 100;
        } else {
          const flat = parseFloat(discountStr) || 0;
          discountPrice = unitPrice * qty - flat;
        }
        // GST percent precedence:
        // 1) product.gstPercent (explicit)
        // 2) product.gst (legacy)
        // 3) parent gstPercent (global from BillType)
        // 4) fallback to 0
        const percentFromProduct =
          Number(product.gstPercent ?? product.gst) || 0;
        const rate = percentFromProduct || Number(gstPercent) || 0;

        // calculate GST amounts
        const gstAmount = +(discountPrice * (rate / 100)).toFixed(2);
        const cgstAmount = isWithinState ? +(gstAmount / 2).toFixed(2) : 0;
        const sgstAmount = isWithinState ? +(gstAmount / 2).toFixed(2) : 0;
        const igstAmount = !isWithinState ? +gstAmount.toFixed(2) : 0;
        const lineTotal = +(discountPrice + gstAmount).toFixed(2);

        return {
          _id: product._id,
          name: product.productName || product.name || "",
          hsnCode: product.hsnCode || "",
          productCode : product.productCode || "",
          qty,
          price: Number(discountPrice).toFixed(2), // price used for subtotal
          unitPrice: Number(unitPrice).toFixed(2), // original price if you keep both
          discount: product.discountPercentage || "",
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
        .reduce((acc, p) => acc + Number(p.price), 0)
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
        billType: billType,
        billDate: billDate,
        qty: selectedProducts.length,
        paymentType: paymentType,
        advance: Number(finalTotals.grandTotal).toFixed(2),
        balance: 0,
        isReturn: true,
        balancePayMode:
          (paymentDetails.balancePayMode || "") +
          "-" +
          (paymentDetails.financeName || ""),
        fullPaid: Number(paymentDetails.fullPaid).toFixed(2) || 0,
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

        let paymentPayload2 = {
          client_id: finalCustomer._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "Sale",
          paymentType: paymentMode,
          narration: "Sale Return",
          advanceAmount:Number(finalTotals.grandTotal).toFixed(2),
          closingAmount:Number(Number(finalCustomer?.openingAmount) - Number(finalTotals.grandTotal)).toFixed(2),
        };

        const paymentResult2 = await addPayment(paymentPayload2);
        if (paymentResult2?.success === false) {
          await deleteSaleBill(res.data._id);
          setSnackbarMessage(
            paymentResult2.errors || "Payment creation failed"
          );
          setSnackbarOpen(true);
          return;
        } else {
          //  update user
          const res = await updateUser(finalCustomer._id, {
            openingAmount:
             Number(
              (Number(finalCustomer.openingAmount) -
                Number(finalTotals.grandTotal)).toFixed(2))
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
          name: "",
          address: "",
          phone_number: "",
          openingAmount: 0,
        });
        setSelectedProducts([
          {
            productName: "",
            hsnCode: "",
            productCode:"",
            qty: 0,
            price: 0,
            discountPercentage: "",
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
        Create Sale Return
      </Typography>

      {/* Step 1: Customer Info */}
      <BillType
        billType={billType}
        setBillType={setBillType}
        gstPercent={gstPercent}
        setGstPercent={setGstPercent}
        customer={customer}
        handlePincodeChange={handlePincodeChange}
        isWithinState={isWithinState}
        setIsWithinState={setIsWithinState}
        totals={totals}
         billDate={billDate}
        setBillDate={setBillDate}
      />
      {/* Step 2: Product Details */}

      <CustomerDetails
        customer={customer}
        isExistingCustomer={isExistingCustomer}
        handleCustomerSelection={handleCustomerSelection}
        setCustomer={setCustomer}
        errors={errors}
        gstDetails={gstDetails}
        setGstDetails={setGstDetails}
        billType={billType}
        billDate={billDate}
        setBillDate={setBillDate}
        customerList={users.filter(
          (u) =>
            u.role_id?.name?.toLowerCase() === "customer" &&
            u.organization_id?._id === mainUser?.organization_id?._id &&
            (u.status === "active" || u.status === "out_of_stock")
        )}
      />

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
      />

      {/* Step 4: Payment Type */}
      {/* <PaymentDetails
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        paymentDetails={paymentDetails}
        setPaymentDetails={setPaymentDetails}
        totals={totals}
        notes={notes}
        setNotes={setNotes}
      /> */}

      {/* Navigation Buttons */}
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

export default SaleBillForm;
