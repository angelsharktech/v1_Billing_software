import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Typography,
  Divider,
  Button,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import { Delete } from "@mui/icons-material";

const ProductDetails = ({
  products,
  selectedProducts,
  handleProductChange,
  handleAddProduct,
  handleRemoveProduct,
  isWithinState,
  onTotalsChange,
  gstPercent,
  billType,
  advanceAmount,
  setAdvanceAmount,
   paymentMode,
   productErrors,
  setPaymentMode,
  getRef, // ✅ from parent
  handleKeyDown,
  // totalFields,
}) => {
  const productRefs = useRef([]);
  const [paymentType, setPaymentType] = useState("full"); // full | advance


  // ✅ Sanitize number input
  const sanitizeNumber = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const cleaned = String(v).replace(/[,%]/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // ✅ Compute Totals
  const totalsMemo = useMemo(() => {
    const subtotal = selectedProducts.reduce((acc, p) => {
      const price = sanitizeNumber(p.discountedPrice ?? p.price);
      const qty = sanitizeNumber(p.qty);
      return acc + price * qty;
    }, 0);

    if (billType !== "gst") {
      return {
        subtotal: +subtotal.toFixed(2),
        cgst: 0,
        sgst: 0,
        igst: 0,
        gstTotal: 0,
        grandTotal: +subtotal.toFixed(2),
      };
    }

    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    selectedProducts.forEach((p) => {
      const price = sanitizeNumber(p.discountedPrice ?? p.price);
      const qty = sanitizeNumber(p.qty);
      const amount = price * qty;

      const percentFromProduct = sanitizeNumber(p.gstPercent ?? p.gst);
      const parentPercent = sanitizeNumber(gstPercent);
      const rate = percentFromProduct || parentPercent || 0;

      const gstAmount = amount * (rate / 100);

      if (isWithinState) {
        totalCGST += gstAmount / 2;
        totalSGST += gstAmount / 2;
      } else {
        totalIGST += gstAmount;
      }
    });

    const cgst = +totalCGST.toFixed(2);
    const sgst = +totalSGST.toFixed(2);
    const igst = +totalIGST.toFixed(2);
    const gstTotal = +((cgst + sgst + igst).toFixed(2));
    const grandTotal = +(subtotal + gstTotal).toFixed(2);

    return {
      subtotal: +subtotal.toFixed(2),
      cgst,
      sgst,
      igst,
      gstTotal,
      grandTotal,
    };
  }, [selectedProducts, gstPercent, billType, isWithinState]);

  useEffect(() => {
    if (typeof onTotalsChange === "function") {
      onTotalsChange(totalsMemo);
    }
  }, [totalsMemo, onTotalsChange]);

  
// ✅ Auto-focus on new product
const handleAddAndFocus = () => {
  handleAddProduct();

  setTimeout(() => {
    const lastIndex = selectedProducts.length; // new product index
    const rowBase = baseProductIndex + lastIndex * fieldsPerProduct;
    const input = getRef(rowBase)?.current;
    if (input) {
      input.focus(); // ✅ focus on new Product Name
    }
  }, 50);
};


  // ✅ GST Calculation
  const calculateGST = (item) => {
    const gstRate = Number(item.gstPercent || 0);
    const base = Number(item.discountedPrice || 0) * Number(item.qty || 0);
    const gstAmount = +(base * (gstRate / 100)).toFixed(2);

    if (isWithinState) {
      const half = +(gstAmount / 2).toFixed(2);
      return { cgst: half, sgst: half, igst: 0 };
    } else {
      return { cgst: 0, sgst: 0, igst: gstAmount };
    }
  };

    const baseProductIndex = 14; // start after customer fields
  const fieldsPerProduct = 12; // e.g. productName, hsn, qty, price, discount, discountedPrice, gst, delete

  return (
    <Box mt={3}>
      <Typography variant="h6">Products</Typography>
      <Divider />

      {selectedProducts.map((item, index) => {
        const { cgst, sgst, igst } = calculateGST(item);
        const rowBase = baseProductIndex + index * fieldsPerProduct;

        return (
          <Grid container spacing={2} key={index} mt={4}>
            {/* Product Dropdown */}
            <Grid item xs={12} sm={3}>
              <TextField
                sx={{ width: "200px" }}
                select
                value={item.productName}
                onChange={(e) =>
                  handleProductChange(index, "productName", e.target.value)
                }
                label="Select Product"
                inputRef={getRef(rowBase)} // ✅ dynamic global index
                onKeyDown={(e) => handleKeyDown(e, rowBase, totalFields)}
                
              >
                {products?.map((prod) => (
                  <MenuItem key={prod._id} value={prod.name}>
                    {prod.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* HSN */}
            <Grid item xs={12} sm={1}>
              <TextField
                select
                label="HSN"
                value={item.hsnCode}
                onChange={(e) =>
                  handleProductChange(index, "hsnCode", e.target.value)
                }
                sx={{ width: "150px" }}
               inputRef={getRef(rowBase + 1)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 1, totalFields)}
              >
                {[...new Set(products?.map((prod) => prod.hsnCode))].map(
                  (hsn) => (
                    <MenuItem key={hsn} value={hsn}>
                      {hsn}
                    </MenuItem>
                  )
                )}
              </TextField>
            </Grid>

            {/* Qty */}
            <Grid item xs={12} sm={1}>
              <TextField
                label="Qty"
                type="number"
                sx={{ width: "80px" }}
                value={item.qty}
                onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                error={!!productErrors?.[index]}
                helperText={productErrors?.[index] || ""}
                 inputRef={getRef(rowBase + 2)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 2, totalFields)}
              />
            </Grid>

            {/* MRP */}
            <Grid item xs={12} sm={2}>
              <TextField
                label="MRP"
                type="number"
                sx={{ width: "90px" }}
                value={item.price}
                onChange={(e) => handleProductChange(index, "price", e.target.value)}
                   inputRef={getRef(rowBase + 3)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 3, totalFields)}
              />
            </Grid>

            {/* Discount % */}
            <Grid item xs={12} sm={2}>
              <TextField
                label="Discount %"
                type="number"
                sx={{ width: "100px" }}
                value={item.discountPercentage}
                onChange={(e) =>
                  handleProductChange(index, "discountPercentage", e.target.value)
                }
                   inputRef={getRef(rowBase + 4)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 4, totalFields)}
              />
            </Grid>

            {/* Selling Price */}
            <Grid item xs={12} sm={2}>
              <TextField
                label="Selling Price"
                type="number"
                sx={{ width: "100px" }}
                value={item.discountedPrice}
                onChange={(e) =>
                  handleProductChange(index, "discountedPrice", e.target.value)
                }
                 inputRef={getRef(rowBase + 5)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 5, totalFields)}
              />
            </Grid>

            {/* GST % */}
            {billType === "gst" && (
              <Grid item xs={12} sm={1.5} >
                <TextField
                  label="GST %"
                  type="number"
                  sx={{ width: "80px" }}
                  value={item.gstPercent || ""}
                  onChange={(e) =>
                    handleProductChange(index, "gstPercent", e.target.value)
                  }
                   inputRef={getRef(rowBase + 6)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 6, totalFields)}
                />
              </Grid>
            )}

            {billType === "gst" && isWithinState && (
              <>
                <Grid item xs={12} sm={1.5} width={100}>
                  <TextField label="CGST" value={cgst} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={1.5} width={100}>
                  <TextField label="SGST" value={sgst} InputProps={{ readOnly: true }} />
                </Grid>
              </>
            )}

            {billType === "gst" && !isWithinState && (
              <Grid item xs={12} sm={2} width={100}>
                <TextField label="IGST" value={igst} InputProps={{ readOnly: true }} />
              </Grid>
            )}

            {/* Total */}
            <Grid item xs={12} sm={2} width={150}>
              <TextField
                label="Total"
                value={
                  item.discountedPrice * item.qty +
                  (isWithinState ? cgst + sgst : igst)
                }
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Delete Button */}
            <Grid item xs={12} sm={1}>
              <IconButton onClick={() => handleRemoveProduct(index)} 
                inputRef={getRef(rowBase + 8)}
                onKeyDown={(e) => handleKeyDown(e, rowBase + 8, totalFields)}>
                <Delete color="error" />
              </IconButton>
            </Grid>
          </Grid>
        );
      })}

      <Button
        onClick={handleAddAndFocus}
        variant="contained"
        sx={{ mt: 2, backgroundColor: "#182848" }}
      >
        + Add Product
      </Button>

      {/* GST Summary */}
      {billType === "gst" && (
        <Paper elevation={2} sx={{ p: 2, mt: 3, backgroundColor: "#f5f5f5" }}>
          <Typography variant="h6" gutterBottom>
            GST Summary
          </Typography>
          <Grid container spacing={2}>
            {isWithinState ? (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={`Total CGST`}
                    type="number"
                    fullWidth
                    value={totalsMemo.cgst}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label={`Total SGST`}
                    type="number"
                    fullWidth
                    value={totalsMemo.sgst}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </>
            ) : (
              <Grid item xs={12} sm={4}>
                <TextField
                  label={`Total IGST`}
                  type="number"
                  fullWidth
                  value={totalsMemo.igst}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={4}>
              <TextField
                label="Total GST Amount"
                type="number"
                fullWidth
                value={totalsMemo.gstTotal}
                InputProps={{ readOnly: true }}
                sx={{ fontWeight: "bold" }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="Total Grand Amount"
                type="number"
                fullWidth
                value={totalsMemo.grandTotal}
                InputProps={{ readOnly: true }}
                sx={{ fontWeight: "bold" }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ✅ Payment Details Section */}
      <Paper elevation={2} sx={{ p: 2, mt: 3, backgroundColor: "#e8f0fe" }}>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Received Amount"
              type="number"
              fullWidth
              value={advanceAmount}
              // onChange={(e) => handlePayment(e.target.value)}
              onChange={(e) => setAdvanceAmount(sanitizeNumber(e.target.value))}
                inputRef={getRef(23)}
                onKeyDown={(e) => handleKeyDown(e, 23, totalFields)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Remaining Amount"
              type="number"
              fullWidth
              value={Math.max(
                totalsMemo.grandTotal - sanitizeNumber(advanceAmount),
                0
              )}
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Payment Mode"
              sx={{width:'200px'}}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
               inputRef={getRef(24)}
                onKeyDown={(e) => handleKeyDown(e, 24, totalFields)}
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="online">Online</MenuItem>
            </TextField>
          </Grid>
        </Grid>

      </Paper>
    </Box>
  );
};

export default ProductDetails;
