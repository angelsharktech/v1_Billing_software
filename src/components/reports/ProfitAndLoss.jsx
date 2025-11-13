import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  IconButton,
  Button,
  Divider,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";
import { getSaleBillByOrganization } from "../../services/SaleBillService";
import { getPurchaseBillByOrganization } from "../../services/PurchaseBillService";
import { getAllProducts } from "../../services/ProductService";
import { useNavigate } from "react-router-dom";
import { getAllExpensesByOrganization } from "../../services/ExpenseService";
import { getAllIncomesByOrganization } from "../../services/IncomeService";

const ProfitAndLoss = () => {
  const { webuser } = useAuth();
  const navigate = useNavigate();

  const [salesAccount, setSalesAccount] = useState(0);
  const [salesReturnAccount, setSalesReturnAccount] = useState(0);
  // const [closingStock, setClosingStock] = useState(0);
  const [purchaseAccount, setPurchaseAccount] = useState(0);
  const [purchaseReturnAccount, setPurchaseReturnAccount] = useState(0);

  const [indirectExpense, setIndirectExpense] = useState([]);
  const [directExpense, setDirectExpense] = useState([]);

  const [directIncome, setDirectIncome] = useState([]);
  const [indirectIncome, setIndirectIncome] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const user = await getUserById(webuser.id);
      const saleBillsRes = await getSaleBillByOrganization(
        user.organization_id._id
      );

      if (saleBillsRes.status === 401) {
        setSnackbarMessage("Your Session is expired. Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
      const saleBills = saleBillsRes?.data?.docs || [];
      const sale = saleBills.filter((sale) => sale?.isReturn === false);
      const saleReturn = saleBills.filter(
        (saleRet) => saleRet?.isReturn === true
      );
      const totalSales = sale.reduce(
        (sum, bill) => sum + Number(bill.grandTotal || 0),
        0
      );
      const totalSalesReturn = saleReturn.reduce(
        (sum, bill) => sum + Number(bill.grandTotal || 0),
        0
      );

      const purchaseBillsRes = await getPurchaseBillByOrganization(
        user.organization_id._id
      );
      const purchaseBills = purchaseBillsRes?.data?.docs || [];
      const purchase = purchaseBills.filter(
        (purchase) => purchase?.isReturn === false
      );
      const purchaseReturn = purchaseBills.filter(
        (purchaseRet) => purchaseRet?.isReturn === true
      );

      const totalPurchases = purchase.reduce(
        (sum, bill) => sum + Number(bill.grandTotal || 0),
        0
      );
      const totalPurchasesReturn = purchaseReturn.reduce(
        (sum, bill) => sum + Number(bill.grandTotal || 0),
        0
      );

      const expense = await getAllExpensesByOrganization(
        user.organization_id._id
      );
      const indirectExpense = expense.data.filter(
        (exp) => exp?.groupOfExpense === "Indirect Expense"
      );
      const directExpense = expense.data.filter(
        (exp) => exp?.groupOfExpense === "Direct Expense"
      );

      const income = await getAllIncomesByOrganization(
        user.organization_id._id
      );
      const indirectIncome = income.data.filter(
        (inc) => inc?.groupOfIncome === "Indirect Income"
      );
      const directIncome = income.data.filter(
        (inc) => inc?.groupOfIncome === "Direct Income"
      );

      setIndirectExpense(indirectExpense);
      setDirectExpense(directExpense);

      setDirectIncome(directIncome);
      setIndirectIncome(indirectIncome);

      setSalesAccount(totalSales);
      setSalesReturnAccount(totalSalesReturn);

      setPurchaseAccount(totalPurchases);
      setPurchaseReturnAccount(totalPurchasesReturn);
      // setClosingStock(totalClosing);
    } catch (error) {
      console.error("Error fetching sale/purchase data:", error);
    }
  };

  // Manual entries
  const [openingStock, setOpeningStock] = useState(() => {
    return JSON.parse(localStorage.getItem("openingStock")) || 0;
  });
  const [closingStock, setClosingStock] = useState(() => {
    return JSON.parse(localStorage.getItem("closingStock"));
  });

  // Autosave

  const getTotal = (arr) =>
    arr.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalDirectExpense = getTotal(directExpense);
  const totalIndirectExpense = getTotal(indirectExpense);
  const totalIndirectIncome = getTotal(indirectIncome);
  const totalDirectIncome = getTotal(directIncome);

  const netSale = salesAccount - salesReturnAccount;
  const netPurchase = purchaseAccount - purchaseReturnAccount;

  const grossProfitBF = netSale + closingStock + totalDirectIncome;
  const grossProfitCO =
    grossProfitBF - (openingStock + netPurchase + totalDirectExpense);

  const total = grossProfitCO + totalIndirectIncome;
  const netProfit = total - totalIndirectExpense;

  return (
    <>
      <Box p={3} sx={{ backgroundColor: "#fafafa", minHeight: "100vh" }}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Profit & Loss Account
        </Typography>

        <Paper
          elevation={5}
          sx={{
            p: 3,
            borderRadius: 3,
            maxWidth: 1100,
            mx: "auto",
            boxShadow: 10,
            background: "#fff",
          }}
        >
          <Box display="flex" justifyContent="space-between">
            {/* ===== Debit Side ===== */}
            <Box flex={1} pr={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Debit Side (Expenses)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {/* Opening Stock */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography>Opening Stock</Typography>
                <TextField
                  type="text"
                  variant="outlined"
                  size="small"
                  value={`${openingStock}`}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setOpeningStock(Number(value));
                    localStorage.setItem("openingStock", value);
                  }}
                  sx={{
                    width: 120,
                    "& .MuiInputBase-input": {
                      textAlign: "right",
                      fontWeight: 500,
                    },
                  }}
                />
              </Box>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Purchases</Typography>
                <Typography fontWeight="bold">
                  {Number(purchaseAccount).toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Purchases Return</Typography>
                <Typography fontWeight="bold">
                  {Number(purchaseReturnAccount).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 3 }} />
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography fontWeight="bold">Net Purchase</Typography>
                <Typography fontWeight="bold">
                  {Number(netPurchase).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 3 }} />
              {/* Direct Expenses */}
              <Typography mt={2} mb={3} fontWeight="bold">
                Direct Expenses
              </Typography>
              {directExpense.map((exp, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1}
                >
                  <Typography>{exp.name}</Typography>
                  <Typography sx={{ textAlign: "right" }}>
                    {Number(exp.amount).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 3 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Gross Profit C/O</Typography>
                <Typography fontWeight="bold" ml={25}>
                  {grossProfitCO.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderRightWidth: 2, mx: 2 }}
            />

            {/* ===== Credit Side ===== */}
            <Box flex={1} pl={3}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Credit Side (Income)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Sales Account</Typography>
                <Typography fontWeight="bold">
                  {Number(salesAccount).toFixed(2)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Sales Return</Typography>
                <Typography fontWeight="bold">
                  {Number(salesReturnAccount).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 3 ,mt:9}} />
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography fontWeight="bold">Net Sale</Typography>
                <Typography fontWeight="bold">
                  {Number(netSale).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 3 }} />
              {/* Direct Income */}
              <Typography mt={2} mb={3} fontWeight="bold">
                Direct Income
              </Typography>
              {directIncome.map((inc, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1}
                >
                  <Typography>{inc.name}</Typography>
                  <Typography sx={{ textAlign: "right" }}>
                    {Number(inc.amount).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 3 }} />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography>closing Stock</Typography>
                <TextField
                  type="text"
                  variant="outlined"
                  size="small"
                  value={`${closingStock}`}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    setClosingStock(Number(value));
                    localStorage.setItem("closingStock", value);
                  }}
                  sx={{
                    width: 120,
                    "& .MuiInputBase-input": {
                      textAlign: "right",
                      fontWeight: 500,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* ===== Middle Line: Gross Profit c/o and b/f ===== */}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight="bold">Net Profit </Typography>
            <Typography fontWeight="bold" ml={38}>
              {grossProfitBF.toFixed(2)}
            </Typography>
            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderRightWidth: 2, mr: 52 }}
            />
            <Typography fontWeight="bold">
              {grossProfitBF.toFixed(2)}
            </Typography>
          </Box>
          <Divider sx={{ my: 3 }} />

          {/* ===== Indirect Expenses and Net Profit ===== */}
          <Box display="flex" justifyContent="space-between">
            {/* Left: Indirect Expenses */}
            <Box flex={1} pr={3}>
              <Typography fontWeight="bold" mb={3} mt={7}>
                Indirect Expenses
              </Typography>
              {indirectExpense.map((exp, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1}
                >
                  <Typography>{exp.name}</Typography>
                  <Typography sx={{ textAlign: "right" }}>
                    {Number(exp.amount).toFixed(2)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Net Profit</Typography>
                <Typography fontWeight="bold">
                  {netProfit.toFixed(2)}
                </Typography>
              </Box>
            </Box>

            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderRightWidth: 2, mx: 2 }}
            />

            {/* Right: Indirect Income */}

            <Box flex={1} pl={3}>
              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight="bold">Gross Profit B/F</Typography>
                <Typography fontWeight="bold">
                  {grossProfitCO.toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography fontWeight="bold" mb={3} >
                Indirect Income
              </Typography>
              {indirectIncome.map((inc, i) => (
                <Box
                  key={i}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1}
                >
                  <Typography>{inc.name}</Typography>
                  <Typography sx={{ textAlign: "right" }}>
                    {Number(inc.amount).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ===== Last Line: total ===== */}
          <Divider sx={{ my: 3 }} />
          <Box display="flex" justifyContent="space-between">
            <Typography fontWeight="bold">Total</Typography>
            <Typography fontWeight="bold" ml={40}>
              {total.toFixed(2)}
            </Typography>
            {/* Vertical Divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderRightWidth: 2, mr: 50 }}
            />
            <Typography fontWeight="bold">{total.toFixed(2)}</Typography>
          </Box>

          <Divider sx={{ my: 3 }} />
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage === " " ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ProfitAndLoss;
