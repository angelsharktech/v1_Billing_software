// PurchaseBillForm.jsx
import React, { useEffect, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import {
  createUser,
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
import ProductDetails from "./ProductDetails";
import BillType from "./BillType";
import VendorDetails from "./VendorDetails";
import {
  addPurchaseBill,
  deletePurchaseBill,
} from "../../services/PurchaseBillService";
import { getAllCategories } from "../../services/CategoryService";
import { addPayment } from "../../services/PaymentModeService";
import PaymentDetails from "./PaymentDetails";

const PurchaseBillForm = ({
  setSnackbarOpen,
  setSnackbarMessage,
  close,
  refresh,
}) => {
  const { webuser } = useAuth();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState({
    _id: "",
    first_name: "",
    address: "",
    phone_number: "",
    pincode: "",
    openingAmount: 0,
  });

  const [isExistingVendor, setIsExistingVendor] = useState(false);
    const [errors, setErrors] = useState({ phone_number: "", products: {} , stateCode:"" });
  
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([
    {
      _id: "",
      productName: "",
      hsnCode: "",
      qty: 1,
      price: 0,
      gstPercent: 0,
      discountPercentage: 0,
      discountedPrice: 0,
      isExisting: false,
      category: "",
      cgst: 0,
      sgst: 0,
      igst: 0,
    },
  ]);

  // safer defaults
  const [billType, setBillType] = useState("nongst");
  const [gstPercent, setGstPercent] = useState(0);
  const [isWithinState, setIsWithinState] = useState("");
  const [paymentType, setPaymentType] = useState("full");
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState(0);
  const [billDate ,setBillDate] = useState("");

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
  const [mainUser, setMainUser] = useState();
  const [notes, setNotes] = useState("");
  const [categories, setCategories] = useState([]);
  const [gstDetails, setGstDetails] = useState({
    gstNumber: "",
    legalName: "",
    state: "",
    stateCode: "",
  });

  // load positions/roles/users + main user
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

  // categories
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

  // compute totals whenever items / gstPercent / billType / state change
  useEffect(() => {
    let subtotal = 0;
    selectedProducts.forEach((item) => {
      const qty = Number(item.qty) || 0;
      const price = Number(item.discountedPrice) || 0;
      subtotal += qty * price;
    });

    const isGST = billType === "gst";
    let gstTotal = 0,
      cgst = 0,
      sgst = 0,
      igst = 0;

    if (isGST) {
      const rate = Number(gstPercent) || 0;
      gstTotal = +(subtotal * (rate / 100));
      if (isWithinState) {
        cgst = +(gstTotal / 2);
        sgst = +(gstTotal / 2);
      } else {
        igst = +gstTotal;
      }
    }
    const grandTotal = +(subtotal + gstTotal);

    setTotals({
      subtotal: +subtotal,
      gstTotal: +gstTotal,
      cgst: +cgst,
      sgst: +sgst,
      igst: +igst,
      grandTotal: +grandTotal,
    });
  }, [selectedProducts, gstPercent, billType]);

  // fetch products for selection
  useEffect(() => {
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
    if (mainUser) fetchProducts();
  }, [mainUser]);

  // vendor selection handlers
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
        setErrors((prev) => ({ ...prev, phone_number: "" , stateCode : "" }));
      }
      selectedVendor = users.find(
        (u) =>
          u.phone_number === value && u.role_id.name.toLowerCase() === "vendor"
      );
    } else if (type === "name") {
      selectedVendor = users.find(
        (s) =>
          s.first_name === value && s.role_id.name.toLowerCase() === "vendor"
      );
    }

    if (selectedVendor) {
      setVendor({
        _id: selectedVendor._id,
        first_name: selectedVendor.first_name,
        address: selectedVendor.address || "",
        phone_number: selectedVendor.phone_number || value,
        openingAmount: selectedVendor.openingAmount,
      });
      setGstDetails({
        gstNumber: selectedVendor.gstDetails?.gstNumber || "",
        legalName: selectedVendor.gstDetails?.legalName || "",
        state: selectedVendor.gstDetails?.state || "",
        stateCode: selectedVendor.gstDetails?.stateCode || "",
      });
      setIsExistingVendor(true);
    } else {
      setVendor((prev) => ({
        _id: "",
        first_name: type === "name" ? value : prev.first_name,
        address: prev.address,
        phone_number: type === "phone" ? value : prev.phone_number,
        openingAmount: selectedVendor?.openingAmount || 0,
      }));
      setGstDetails({
        gstNumber: "",
        legalName: "",
        state: "",
        stateCode: "",
      });
      setIsExistingVendor(false);
    }
  };

  // product row handlers
  const handleProductChange = (index, field, value) => {
    const updated = [...selectedProducts];
    const item = updated[index] || {};

    if (field === "productName") {
      // if chosen product exists in products list, fill details
      const product = products.find(
        (p) => p.name.toLowerCase() === value.toLowerCase()
      );
      if (product) {
        const price = product.compareAtPrice || 0;
        const discountPrice = product.price || 0;
        updated[index] = {
          ...item,
          _id: product._id,
          productName: product.name,
          hsnCode: product.hsnCode || "",
          price,
          discountPercentage: product.discountPercentage || 0,
          discountedPrice: discountPrice,
          isExisting: true,
          category: product.category,
          gstPercent: product.gstPercent || gstPercent || 0,
        };
      } else {
        updated[index] = {
          ...item,
          productName: value,
          isExisting: false,
        };
      }
    } 
    else if (field === "discountPercentage") {
      const discount = parseFloat(value) || 0;
      const price = parseFloat(item.price) || 0;
      const discountPrice = +(price - (price * discount) / 100);
      updated[index] = {
        ...item,
        discountPercentage: discount,
        discountedPrice: discountPrice,
      };
    } 
    else if (field === "discountedPrice") {
      const discountedPrice = parseFloat(value) || 0;
      const price = parseFloat(item.price) || 0;
      const discountPercentage =
        price > 0 ? +(((price - discountedPrice) / price) * 100) : 0;
      updated[index] = {
        ...item,
        discountedPrice,
        discountPercentage: Math.round(discountPercentage),
      };
    } 
    else if (field === "qty") {
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
    setSelectedProducts((prev) => [
      ...prev,
      {
        productName: "",
        hsnCode: "",
        qty: 1,
        price: 0,
        gstPercent: 0,
        discountPercentage: 0,
        discountedPrice: 0,
        category: "",
        isExisting: false,
      },
    ]);
  };

  const handleRemoveProduct = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      let finalVendor = { ...vendor };

      if (!vendor.phone_number || !vendor.first_name) {
        setSnackbarMessage("Please fill vendor details!");
        setSnackbarOpen(true);
        return;
      }

      for (let p of selectedProducts) {
        if (
          !p.productName ||
          Number(p.qty) <= 0 ||
          Number(p.discountedPrice) <= 0
        ) {
          setSnackbarMessage("Please fill all product details correctly!");
          setSnackbarOpen(true);
          return;
        }
      }

      // register vendor if not existing
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
            vendor.first_name.replace(/\s+/g, "").toLowerCase() +
            "@example.com",
          password:
            vendor.first_name.replace(/\s+/g, "").toLowerCase() +
            "@example.com",
          role_id: vendorRole?._id,
          position_id: vendorposition?._id,

          gstDetails,
        };
        const res = await createUser(payload);
        
        const paymentPayload = {
          organization: mainUser.organization_id?._id,
          narration: "Opening Balance",
          client_id: res.data.data._id,
          forPayment: "purchase",
          closingAmount: vendor.openingAmount,
        };
        const resPayment = await addPayment(paymentPayload);

        finalVendor = {
          ...vendor,
          _id: res.data.data._id,
        };
      }

      for (let prod of selectedProducts) {
        if (!prod.isExisting) {
          const newProductPayload = {
            name: prod.productName,
            category: prod.category,
            hsnCode: prod.hsnCode,
            price: prod.discountedPrice,
            compareAtPrice: prod.price,
            quantity: prod.qty,
            organization_id: mainUser.organization_id?._id,
            status: "active",
          };
          const res = await addProducts(newProductPayload);
          prod._id = res.data._id;
          prod.isExisting = true;
        } else {
          const updatePayload = {
            quantity: Number(prod.qty) || 0,
            action: "add",
          };
          await updateInventory(prod._id, updatePayload);
        }
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
        bill_to: finalVendor._id,
        products: finalProducts,
        billType: billType,
        billDate :billDate,
        qty: selectedProducts.length,
        paymentType: paymentType,
        advance: advanceAmount || 0,
        balance: finalTotals.grandTotal - advanceAmount,
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

      const res = await addPurchaseBill(billPayload);

      // handle error returns from API
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
        setSnackbarMessage("Purchase bill created successfully!");
        setSnackbarOpen(true);

        const billData = {
          biller: finalVendor,
          products: finalProducts,
          billType,
          paymentType,
          gstPercent,
          org: mainUser.organization_id?.name,
          totals: finalTotals,
        };
        if (refresh) refresh();

        let paymentPayload = {
          client_id: finalVendor._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "purchase",
          paymentType: paymentMode,
          narration: "Purchase",
          balance: finalTotals.grandTotal,
          closingAmount: finalVendor?.openingAmount + finalTotals.grandTotal,
        };
        const paymentResult = await addPayment(paymentPayload);

        let paymentPayload2 = {
          client_id: finalVendor._id,
          purchasebill: res?.data?._id || res?.data?._id,
          organization: mainUser.organization_id?._id,
          forPayment: "purchase",
          paymentType: paymentMode,
          narration: "Payment to Supplier",
          advanceAmount: advanceAmount,
          closingAmount: paymentResult.data?.closingAmount - advanceAmount,
        };

        const paymentResult2 = await addPayment(paymentPayload2);
        if (paymentResult?.success === false) {
          await deletePurchaseBill(res.data._id);
          setSnackbarMessage(paymentResult.errors || "Payment creation failed");
          setSnackbarOpen(true);
          return;
        } else {
          const res = await updateUser(finalVendor._id, {
            openingAmount:
              Number(finalVendor.openingAmount) +
              Number(finalTotals.grandTotal - advanceAmount),
          });
        }

        setVendor({
          first_name: "",
          address: "",
          phone_number: "",
        });
        setSelectedProducts([
          {
            productName: "",
            hsnCode: "",
            qty: 0,
            price: 0,
            discountPercentage: 0,
            gstPercent: 0,
            discountedPrice: 0,
          },
        ]);
        close();
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSnackbarMessage("Vendor " + (error?.message || error));
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Create purchase Bill
      </Typography>

      <BillType
        billType={billType}
        setBillType={setBillType}
        gstPercent={gstPercent}
        setGstPercent={setGstPercent}
        isWithinState={isWithinState}
        setIsWithinState={setIsWithinState}
        totals={totals}
        billDate={billDate}
        setBillDate={setBillDate}
      />

      <VendorDetails
        vendor={vendor}
        isExistingVendor={isExistingVendor}
        handleVendorSelection={handleVendorSelection}
        setVendor={setVendor}
        setGstDetails={setGstDetails}
        gstDetails={gstDetails}
        errors={errors}
        setErrors={setErrors}
        supplierList={users.filter(
          (u) =>
            u.role_id?.name?.toLowerCase() === "vendor" &&
            u.organization_id?._id === mainUser?.organization_id?._id &&
            u.status === "active"
        )}
      />

      <ProductDetails
        products={products}
        selectedProducts={selectedProducts}
        handleProductChange={handleProductChange}
        handleAddProduct={handleAddProduct}
        handleRemoveProduct={handleRemoveProduct}
        categories={categories}
        billType={billType}
        isWithinState={isWithinState}
        gstPercent={gstPercent}
        productErrors={errors.products}
        onTotalsChange={setTotals}
        onError={(msg) => {
          setSnackbarMessage(msg);
          setSnackbarOpen(true);
        }}
        setAdvanceAmount={setAdvanceAmount}
        advanceAmount={advanceAmount}
        setPaymentMode={setPaymentMode}
        paymentMode={paymentMode}
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

export default PurchaseBillForm;
