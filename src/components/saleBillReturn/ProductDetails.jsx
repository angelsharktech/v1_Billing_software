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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Chip,
  Collapse,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import { Delete, Add, ExpandMore, ExpandLess } from "@mui/icons-material";

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
  setPaymentMode,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const productRefs = useRef([]);
  const [expandedRow, setExpandedRow] = useState(null);

  // ✅ Sanitize number input
  const sanitizeNumber = (v) => {
    if (v === null || v === undefined || v === "") return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    const cleaned = String(v).replace(/[,%]/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // Calculate discounted taxable value for one product
  const getDiscountedAmount = (item) => {
    const price = sanitizeNumber(item.price);
    const qty = sanitizeNumber(item.qty);
    const base = price * qty;

    if (!item.discountPercentage) return base;

    const discountStr = item.discountPercentage.toString();

    if (discountStr.includes("%")) {
      const percent = parseFloat(discountStr) || 0;
      return base - (base * percent) / 100;
    } else {
      const flat = parseFloat(discountStr) || 0;
      return base - flat;
    }
  };

  // ✅ Compute Totals
  const totalsMemo = useMemo(() => {
    const subtotal = selectedProducts.reduce((acc, p) => {
      return acc + getDiscountedAmount(p);
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
      const amount = getDiscountedAmount(p);

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
    const gstTotal = +(cgst + sgst + igst).toFixed(2);
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
      const lastIndex = selectedProducts.length;
      if (productRefs.current[lastIndex]) {
        productRefs.current[lastIndex].focus();
      }
    }, 10);
  };

  // ✅ GST Calculation
  const calculateGST = (item) => {
    const gstRate = Number(item.gstPercent || 0);
    const discountStr = item.discountPercentage?.toString() || "0";
    let base = 0;
    if (discountStr.includes("%")) {
      const percent = parseFloat(discountStr) || 0;
      base = Number(item.price || 0) * (item.qty) - (Number(item.price || 0) * (item.qty) * percent) / 100;
    } else {
      const flat = parseFloat(discountStr) || 0;
      base = Number(item.price || 0) * (item.qty) - flat;
    }
    const gstAmount = +(base * (gstRate / 100)).toFixed(2);

    if (isWithinState) {
      const half = +(gstAmount / 2).toFixed(2);
      return { cgst: half, sgst: half, igst: 0 };
    } else {
      return { cgst: 0, sgst: 0, igst: gstAmount };
    }
  };

  // Mobile Product Card Component
  const MobileProductCard = ({ item, index }) => {
    const { cgst, sgst, igst } = calculateGST(item);
    const isExpanded = expandedRow === index;

    return (
      <Card sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Stack spacing={1.5}>
            {/* Header Row */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1" fontWeight={600}>
                {item.productName || "Select Product"}
              </Typography>
              <Box display="flex" gap={1}>
                <IconButton
                  size="small"
                  onClick={() => setExpandedRow(isExpanded ? null : index)}
                >
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
                {selectedProducts.length > 1 && (
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveProduct(index)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Basic Info */}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                Qty:
              </Typography>
              <TextField
                size="small"
                type="number"
                value={item.qty}
                onChange={(e) => handleProductChange(index, "qty", e.target.value)}
                sx={{ width: '80px' }}
              />
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="textSecondary">
                Rate:
              </Typography>
              <TextField
                size="small"
                type="number"
                value={item.price}
                onChange={(e) => handleProductChange(index, "price", e.target.value)}
                sx={{ width: '100px' }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Box>

            {/* Expandable Details */}
            <Collapse in={isExpanded}>
              <Stack spacing={1.5} mt={2}>
                {/* Product Selection */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                    Product
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.productName}
                    onChange={(e) => handleProductChange(index, "productName", e.target.value)}
                  >
                    {products?.map((prod) => (
                      <MenuItem key={prod._id} value={prod.name}>
                        {prod.name} (₹{prod.price})
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* Product Code */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                    Product Code
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.productCode}
                    onChange={(e) => handleProductChange(index, "productCode", e.target.value)}
                  >
                    {[...new Set(products?.map((prod) => prod.productCode))].map((pcode) => (
                      <MenuItem key={pcode} value={pcode}>
                        {pcode}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* HSN Code */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                    HSN Code
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.hsnCode}
                    onChange={(e) => handleProductChange(index, "hsnCode", e.target.value)}
                  >
                    {[...new Set(products?.map((prod) => prod.hsnCode))].map((hsn) => (
                      <MenuItem key={hsn} value={hsn}>
                        {hsn}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                {/* Discount */}
                <Box>
                  <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                    Discount
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={item.discountPercentage || ""}
                    onChange={(e) => handleProductChange(index, "discountPercentage", e.target.value)}
                    placeholder="e.g. 2%, 100 rs"
                  />
                </Box>

                {/* GST Details */}
                {billType === "gst" && (
                  <>
                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                        GST %
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={item.gstPercent || ""}
                        onChange={(e) => handleProductChange(index, "gstPercent", e.target.value)}
                      />
                    </Box>

                    <Box>
                      <Typography variant="caption" color="textSecondary" display="block" mb={0.5}>
                        Taxable Value
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={getDiscountedAmount(item).toFixed(2)}
                        InputProps={{
                          readOnly: true,
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Box>

                    {isWithinState ? (
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="CGST"
                            value={cgst.toFixed(2)}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="SGST"
                            value={sgst.toFixed(2)}
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      </Grid>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        label="IGST"
                        value={igst.toFixed(2)}
                        InputProps={{ readOnly: true }}
                      />
                    )}
                  </>
                )}
              </Stack>
            </Collapse>

            {/* Total & Summary */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mt={1}
              pt={1}
              borderTop="1px solid #e0e0e0"
            >
              <Typography variant="subtitle2" fontWeight={600}>
                Total:
              </Typography>
              <Chip
                label={`₹${(getDiscountedAmount(item) + (isWithinState ? cgst + sgst : igst)).toFixed(2)}`}
                color="primary"
                size="small"
                variant="outlined"
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  // Desktop Table View
  const DesktopTableView = () => (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: isTablet ? "400px" : "450px",
        overflow: "auto",
        "& .MuiTable-root": {
          minWidth: isMobile ? "1000px" : "auto",
        },
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
            <TableCell sx={{ width: "20%", fontWeight: "bold", padding: "8px" }}>
              Product Name
            </TableCell>
            <TableCell sx={{ width: "8%", fontWeight: "bold", padding: "8px" }}>
              Product Code
            </TableCell>
            <TableCell sx={{ width: "8%", fontWeight: "bold", padding: "8px" }}>
              HSN
            </TableCell>
            <TableCell sx={{ width: "6%", fontWeight: "bold", padding: "8px" }}>
              Qty
            </TableCell>
            <TableCell sx={{ width: "10%", fontWeight: "bold", padding: "8px" }}>
              Rate
            </TableCell>
            <TableCell sx={{ width: "8%", fontWeight: "bold", padding: "8px" }}>
              Discount
            </TableCell>
            {billType === "gst" && (
              <>
                <TableCell sx={{ width: "7%", fontWeight: "bold", padding: "8px" }}>
                  GST %
                </TableCell>
                <TableCell sx={{ width: "10%", fontWeight: "bold", padding: "8px" }}>
                  Taxable Value
                </TableCell>
                {isWithinState ? (
                  <>
                    <TableCell sx={{ width: "7%", fontWeight: "bold", padding: "8px" }}>
                      CGST
                    </TableCell>
                    <TableCell sx={{ width: "7%", fontWeight: "bold", padding: "8px" }}>
                      SGST
                    </TableCell>
                  </>
                ) : (
                  <TableCell sx={{ width: "10%", fontWeight: "bold", padding: "8px" }}>
                    IGST
                  </TableCell>
                )}
              </>
            )}
            <TableCell sx={{ width: "10%", fontWeight: "bold", padding: "8px" }}>
              Total
            </TableCell>
            <TableCell sx={{ width: "5%", fontWeight: "bold", padding: "8px" }}>
              Action
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {selectedProducts.map((item, index) => {
            const { cgst, sgst, igst } = calculateGST(item);
            const total = getDiscountedAmount(item) + (isWithinState ? cgst + sgst : igst);

            return (
              <TableRow key={index} hover>
                {/* Product Name */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.productName}
                    onChange={(e) => handleProductChange(index, "productName", e.target.value)}
                    inputRef={(el) => (productRefs.current[index] = el)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "36px",
                        minHeight: "36px",
                      },
                      "& .MuiSelect-select": {
                        padding: "8px 12px",
                        lineHeight: "20px",
                      },
                    }}
                  >
                    {products?.map((prod) => (
                      <MenuItem key={prod._id} value={prod.name}>
                        {prod.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {/* Product Code */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.productCode}
                    onChange={(e) => handleProductChange(index, "productCode", e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "36px",
                        minHeight: "36px",
                      },
                    }}
                  >
                    {[...new Set(products?.map((prod) => prod.productCode))].map((pcode) => (
                      <MenuItem key={pcode} value={pcode}>
                        {pcode}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {/* HSN Code */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={item.hsnCode}
                    onChange={(e) => handleProductChange(index, "hsnCode", e.target.value)}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "36px",
                        minHeight: "36px",
                      },
                    }}
                  >
                    {[...new Set(products?.map((prod) => prod.hsnCode))].map((hsn) => (
                      <MenuItem key={hsn} value={hsn}>
                        {hsn}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {/* Quantity */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={item.qty}
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
                    }}
                  />
                </TableCell>

                {/* Rate */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    fullWidth
                    type="number"
                    size="small"
                    value={item.price}
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
                        style: { textAlign: "right" },
                      },
                    }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: "36px",
                        minHeight: "36px",
                        pl: 1,
                      },
                    }}
                  />
                </TableCell>

                {/* Discount */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={item.discountPercentage || ""}
                    onChange={(e) => handleProductChange(index, "discountPercentage", e.target.value)}
                    placeholder="2% or ₹100"
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
                    }}
                  />
                </TableCell>

                {/* GST Percentage */}
                {billType === "gst" && (
                  <TableCell sx={{ padding: "4px" }}>
                    <TextField
                      fullWidth
                      type="number"
                      size="small"
                      value={item.gstPercent || ""}
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
                      }}
                    />
                  </TableCell>
                )}

                {/* Taxable Value */}
                {billType === "gst" && (
                  <TableCell sx={{ padding: "4px" }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={getDiscountedAmount(item).toFixed(2)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 0.5 }}>
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "36px",
                          minHeight: "36px",
                          backgroundColor: "#f9f9f9",
                        },
                      }}
                    />
                  </TableCell>
                )}

                {/* CGST & SGST or IGST */}
                {billType === "gst" && isWithinState && (
                  <>
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={cgst.toFixed(2)}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start" sx={{ mr: 0.5 }}>
                              ₹
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                            backgroundColor: "#f0f7ff",
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: "4px" }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={sgst.toFixed(2)}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start" sx={{ mr: 0.5 }}>
                              ₹
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: "36px",
                            minHeight: "36px",
                            backgroundColor: "#f0f7ff",
                          },
                        }}
                      />
                    </TableCell>
                  </>
                )}

                {billType === "gst" && !isWithinState && (
                  <TableCell sx={{ padding: "4px" }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={igst.toFixed(2)}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 0.5 }}>
                            ₹
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: "36px",
                          minHeight: "36px",
                          backgroundColor: "#fff3e0",
                        },
                      }}
                    />
                  </TableCell>
                )}

                {/* Total */}
                <TableCell sx={{ padding: "4px" }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={`₹${total.toFixed(2)}`}
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
  );

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom>
        Product Details
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {isMobile ? (
        <Box>
          {selectedProducts.map((item, index) => (
            <MobileProductCard key={index} item={item} index={index} />
          ))}
        </Box>
      ) : (
        <DesktopTableView />
      )}

      {/* Add Product Button */}
      <Button
        onClick={handleAddAndFocus}
        variant="contained"
        startIcon={<Add />}
        sx={{ mt: 2, backgroundColor: "#182848", height: "36px" }}
      >
        Add Product
      </Button>

      {/* ✅ Totals Summary */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mt: 3, backgroundColor: "#f5f5f5" }}>
        <Typography variant="h6" gutterBottom>
          Bill Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              {/* Subtotal */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">Subtotal:</Typography>
                <Chip
                  label={`₹${totalsMemo.subtotal.toFixed(2)}`}
                  color="default"
                  variant="outlined"
                  size="medium"
                />
              </Box>

              {/* GST Summary */}
              {billType === "gst" && (
                <>
                  {isWithinState ? (
                    <>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">CGST:</Typography>
                        <Chip
                          label={`₹${totalsMemo.cgst.toFixed(2)}`}
                          color="info"
                          variant="outlined"
                          size="medium"
                        />
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body1">SGST:</Typography>
                        <Chip
                          label={`₹${totalsMemo.sgst.toFixed(2)}`}
                          color="info"
                          variant="outlined"
                          size="medium"
                        />
                      </Box>
                    </>
                  ) : (
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1">IGST:</Typography>
                      <Chip
                        label={`₹${totalsMemo.igst.toFixed(2)}`}
                        color="warning"
                        variant="outlined"
                        size="medium"
                      />
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1" fontWeight={600}>Total GST:</Typography>
                    <Chip
                      label={`₹${totalsMemo.gstTotal.toFixed(2)}`}
                      color="primary"
                      size="medium"
                    />
                  </Box>
                </>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{ p: 2, backgroundColor: "#e8f0fe", height: "100%" }}
            >
              <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Grand Total:</Typography>
                  <Chip
                    label={`₹${totalsMemo.grandTotal.toFixed(2)}`}
                    color="primary"
                    size="large"
                    sx={{ fontSize: "1.1rem", fontWeight: "bold" }}
                  />
                </Box>

                {/* Payment Details */}
                <Divider />
                <Typography variant="subtitle2" fontWeight={600}>
                  Payment Details
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Payment Mode"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                    >
                      <MenuItem value="">Select Mode</MenuItem>
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="online">Online</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                    </TextField>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Amount Due"
                      value={`₹${Math.max(totalsMemo.grandTotal - sanitizeNumber(advanceAmount), 0).toFixed(2)}`}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProductDetails;