import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Paper, Typography, styled } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getUserById } from "../services/UserService";
import { getSaleBillByOrganization } from "../services/SaleBillService";
import { getPurchaseBillByOrganization } from "../services/PurchaseBillService";
import { useAuth } from "../context/AuthContext";
import CreateSaleBill from "../components/salebill/CreateSaleBill";
import CreatePurchaseBill from "../components/purchasebill/CreatePurchaseBill";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import ReceiptIcon from '@mui/icons-material/Receipt';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  borderRadius: 10,
  boxShadow: theme.shadows[3],
 
}));

const StatCard = ({ title, value, icon, color }) => (
  <Item
    sx={{
      backgroundColor: color,
      color: "white",
      transition: "transform 0.2s",
      "&:hover": {
        transform: "scale(1.02)",
      },
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box sx={{ width: "150px", height: "120px" ,gap:'10px'}}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4">{value}</Typography>
      </Box>
      {icon}
    </Box>
  </Item>
);

const Home = () => {
  const { webuser } = useAuth();
  const [range, setRange] = useState("Today");
  const [counts, setCounts] = useState({
    todaySaleAmount: 0,
    todayPurchaseAmount: 0,
    todaySaleInvoices: 0,
  });
  const [saleBills, setSaleBills] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [openSaleBill, setOpenSaleBill] = useState(false);
  const [openPurchaseBill, setOpenPurchaseBill] = useState(false);

  const handleSaleOpen = () => setOpenSaleBill(true);
  const handlePurchaseOpen = () => setOpenPurchaseBill(true);
  const handleCloseSaleBill = () => setOpenSaleBill(false);
  const handleClosePurchaseBill = () => setOpenPurchaseBill(false);

  // Parse billDate "DD-MM-YYYY" → JS Date
 const parseBillDate = (billDateStr) => {
  if (!billDateStr) return null;
  const [year, month, day] = billDateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

  useEffect(() => {
    fetchCounts(); // initial load

    const interval = setInterval(() => {
      fetchCounts(); // auto refresh every 2 min
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [webuser]);

  const fetchCounts = async () => {
    const user = await getUserById(webuser.id);

    const saleBillsRes = await getSaleBillByOrganization(
      user.organization_id._id
    );
    const purchaseBillsRes = await getPurchaseBillByOrganization(
      user.organization_id._id
    );

    const saleBillsData = saleBillsRes?.data?.docs || [];
    const purchaseBillsData = purchaseBillsRes?.data?.docs || [];

    setSaleBills(saleBillsData);
    setPurchaseBills(purchaseBillsData);

    // ✅ Calculate today's stats
    const today = new Date();
    const isToday = (billDateStr) => {
      const billDate = parseBillDate(billDateStr);
      if (!billDate) return false;
      return billDate.toDateString() === today.toDateString();
    };

    const todaySales = saleBillsData.filter((b) => isToday(b.billDate));
    const todayPurchases = purchaseBillsData.filter((b) =>
      isToday(b.billDate)
    );

    const todaySaleAmount = todaySales.reduce(
      (sum, b) => sum + (b.grandTotal || 0),
      0
    );
    const todayPurchaseAmount = todayPurchases.reduce(
      (sum, b) => sum + (b.grandTotal || 0),
      0
    );

    setCounts({
      todaySaleAmount,
      todayPurchaseAmount,
      todaySaleInvoices: todaySales.length,
    });
  };

  const filteredChartData = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const sale = Array(12).fill(0);
    const purchase = Array(12).fill(0);
    const today = new Date();

    const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();

    const isSameWeek = (date) => {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      const lastDay = new Date(now.setDate(firstDay.getDate() + 6));
      return date >= firstDay && date <= lastDay;
    };

    const isSameMonth = (date) =>
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    const isSameYear = (date) => date.getFullYear() === today.getFullYear();

    const filterFn = (date) => {
      switch (range) {
        case "Today":
          return isSameDay(date, today);
        case "Week":
          return isSameWeek(date);
        case "Month":
          return isSameMonth(date);
        case "Year":
          return isSameYear(date);
        default:
          return true;
      }
    };

    saleBills.forEach((bill) => {
      const billDate = parseBillDate(bill.billDate);
      if (billDate && filterFn(billDate)) {
        const month = billDate.getMonth();
        sale[month] += bill.grandTotal || 0;
      }
    });

    purchaseBills.forEach((bill) => {
      const billDate = parseBillDate(bill.billDate);
      if (billDate && filterFn(billDate)) {
        const month = billDate.getMonth();
        purchase[month] += bill.grandTotal || 0;
      }
    });

    return months.map((name, i) => ({
      name,
      Sale: sale[i],
      Purchase: purchase[i],
    }));
  }, [range, saleBills, purchaseBills]);

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Organization Overview
          </Typography>
          <Box display={"flex"} justifyContent={"flex-end"} gap={2}>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
              }}
              onClick={handleSaleOpen}
            >
              Create Sales bill (Alt+S)
            </Button>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
              }}
              onClick={handlePurchaseOpen}
            >
              Create Purchase bill (Alt+P)
            </Button>
          </Box>
        </Box>

        <Grid container spacing={9} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Today's Sales (₹)"
              value={counts.todaySaleAmount.toFixed(2)}
              icon={<TrendingDownIcon sx={{ fontSize: 50 }} />}
              color="#103962ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Today's Purchases (₹)"
              value={counts.todayPurchaseAmount.toFixed(2)}
              icon={<ShoppingCartIcon sx={{ fontSize: 50 }} />}
              color="#135116ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Today's Sale Invoices"
              value={counts.todaySaleInvoices}
              icon={<ReceiptIcon sx={{ fontSize: 50 }} />}
              color="#750f8eff"
            />
          </Grid>
        </Grid>

        {/* Bar Charts Section */}
        <Box display="flex" justifyContent="flex-start" mb={2}>
          <FormControl size="small">
            <InputLabel id="range-select-label">Range</InputLabel>
            <Select
              labelId="range-select-label"
              value={range}
              label="Range"
              onChange={(e) => setRange(e.target.value)}
            >
              <MenuItem value="Today">Today</MenuItem>
              <MenuItem value="Week">This Week</MenuItem>
              <MenuItem value="Month">This Month</MenuItem>
              <MenuItem value="Year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={38}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, width: "190%" }}>
              <Typography variant="h6" gutterBottom>
                Sale Overview - {range}
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredChartData} barCategoryGap="10%" barSize={40}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3477eb" />
                      <stop offset="100%" stopColor="#25f5ee" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Sale" fill="url(#blueGradient)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, width: "170%" }}>
              <Typography variant="h6" gutterBottom>
                Purchase Overview - {range}
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={filteredChartData} barCategoryGap="10%" barSize={40}>
                  <defs>
                    <linearGradient id="yellowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f5f125" />
                      <stop offset="100%" stopColor="#9ff01d" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Purchase" fill="url(#yellowGradient)" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <CreateSaleBill open={openSaleBill} handleClose={handleCloseSaleBill} />
      <CreatePurchaseBill
        open={openPurchaseBill}
        handleClose={handleClosePurchaseBill}
      />
    </>
  );
};

export default Home;
