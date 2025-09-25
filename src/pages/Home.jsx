
import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, Paper, Typography, styled } from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StoreIcon from "@mui/icons-material/Store";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import CategoryIcon from "@mui/icons-material/Category";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getAllUser,
  getUserById,
  getUserByOrganizastionId,
} from "../services/UserService";
import { getAllProducts } from "../services/ProductService";
import { getSaleBillByOrganization } from "../services/SaleBillService";
import { getPurchaseBillByOrganization } from "../services/PurchaseBillService";
import { useAuth } from "../context/AuthContext";
import { getAllRoles } from "../services/Role";
import CreateSaleBill from "../components/salebill/CreateSaleBill";
import CreatePurchaseBill from "../components/purchasebill/CreatePurchaseBill";
import { getAllCategories } from "../services/CategoryService";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: "center",
  color: theme.palette.text.secondary,
  borderRadius: 10,
  boxShadow: theme.shadows[3],
}));

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Item
    onClick={onClick}
    sx={{
      backgroundColor: color,
      color: "white",
      cursor: "pointer", // Makes it look clickable
      transition: "transform 0.2s",
      "&:hover": {
        transform: "scale(1.02)",
      },
    }}
  >
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box sx={{ width: "120px", height: "100px" }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4">{value}</Typography>
      </Box>
      {icon}
    </Box>
  </Item>
);

const Home = ({ setSelectedTab }) => {
  const { webuser } = useAuth();
  const [range, setRange] = useState("Today");
  const [counts, setCounts] = useState({
    vendors: 0,
    customers: 0,
    products: 0,
    category: 0,
  });
  const [saleBills, setSaleBills] = useState([]);
  const [purchaseBills, setPurchaseBills] = useState([]);
  const [openSaleBill, setOpenSaleBill] = useState(false);
  const [openPurchaseBill, setOpenPurchaseBill] = useState(false);

  const handleSaleOpen = () => setOpenSaleBill(true);
  const handlePurchaseOpen = () => setOpenPurchaseBill(true);
  const handleCloseSaleBill = () => setOpenSaleBill(false);
  const handleClosePurchaseBill = () => setOpenPurchaseBill(false);

  useEffect(() => {
    fetchCounts(); // initial load

    const interval = setInterval(() => {
      fetchCounts(); // auto refresh every 5 min
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval); // cleanup
  }, [webuser]);

 const fetchCounts = async () => {
  const user = await getUserById(webuser.id);
  const users = await getUserByOrganizastionId(user.organization_id._id);
  const prod = await getAllProducts();
  const roles = await getAllRoles();
  const categories = await getAllCategories();


  const vendorRole = roles.find((r) => r.name.toLowerCase() === "vendor");
  const customerRole = roles.find((r) => r.name.toLowerCase() === "customer");

  const vendors =
    users?.filter(
      (u) => u.role_id?._id === vendorRole?._id && u.status === "active"
    ) || [];

  const customers =
    users?.filter(
      (u) => u.role_id?._id === customerRole?._id && u.status === "active"
    ) || [];

  const products = prod.data.filter(
    (prod) => prod?.organization_id === user.organization_id._id
  );

  // 🔥 Robust category filter
  const categoryCount = categories.data.filter((cat) => {
    if (!cat?.organization_id) return false;

    // If org is a string
    if (typeof cat.organization_id === "string") {
      return cat.organization_id === user.organization_id._id;
    }

    // If org is an object with _id
    if (typeof cat.organization_id === "object" && cat.organization_id._id) {
      return cat.organization_id._id.toString() === user.organization_id._id.toString();
    }

    return false;
  });


  setCounts({
    vendors: vendors.length,
    customers: customers.length,
    products: products.length,
    category: categoryCount.length, // ✅ use length, not array
  });

  const saleBillsRes = await getSaleBillByOrganization(
    user.organization_id._id
  );
  const purchaseBillsRes = await getPurchaseBillByOrganization(
    user.organization_id._id
  );

  setSaleBills(saleBillsRes?.data?.docs || []);
  setPurchaseBills(purchaseBillsRes?.data?.docs || []);
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
      const billDate = new Date(bill.createdAt);
      if (filterFn(billDate)) {
        const month = billDate.getMonth();
        sale[month] += bill.grandTotal || 0;
      }
    });

    purchaseBills.forEach((bill) => {
      const billDate = new Date(bill.createdAt);
      if (filterFn(billDate)) {
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
          //  accessKey="s"
            variant="contained"
            sx={{background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff" }}
            onClick={handleSaleOpen}
          >
            Create Sale bill (Alt+S)
          </Button>
          <Button
          // accessKey="p"
            variant="contained"
          sx={{background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff" }}
            onClick={handlePurchaseOpen}
          >
            Create Purchase bill (Alt+P)
          </Button>
          </Box>
        </Box>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Suppliers"
              value={counts.vendors}
              icon={<StoreIcon sx={{ fontSize: 50 }} />}
              onClick={() => setSelectedTab("Suppliers")}
              color="#103962ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Customers"
              value={counts.customers}
              icon={<PeopleIcon sx={{ fontSize: 50 }} />}
              onClick={() => setSelectedTab("Customer")}
              color="#135116ff"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Products"
              value={counts.products}
              icon={<Inventory2Icon sx={{ fontSize: 50 }} />}
              onClick={() => setSelectedTab("Product")}
              color="#5F8670"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <StatCard
              title="Categories"
              value={counts.category}
              icon={<CategoryIcon sx={{ fontSize: 50 }} />}
              onClick={() => setSelectedTab("Category")}
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

        <Grid container spacing={25}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, width: "130%" }}>
              <Typography variant="h6" gutterBottom>
                Sale Overview - {range}
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={filteredChartData}
                  barCategoryGap="10%"
                  barSize={40}
                >
                  <defs>
                    <linearGradient
                      id="blueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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
            <Paper sx={{ p: 3, borderRadius: 2, width: "130%" }}>
              <Typography variant="h6" gutterBottom>
                Purchase Overview - {range}
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={filteredChartData}
                  barCategoryGap="10%"
                  barSize={40}
                >
                  <defs>
                    <linearGradient
                      id="yellowGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
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

      <CreateSaleBill
        open={openSaleBill}
        handleClose={handleCloseSaleBill}
        // refresh={fetchBills}
      />
      <CreatePurchaseBill
        open={openPurchaseBill}
        handleClose={handleClosePurchaseBill}
        // refresh={fetchBills}
      />
    </>
  );
};

export default Home;
