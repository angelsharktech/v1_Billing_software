import React, { useState } from "react";
import { Box, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "../layouts/Sidebar";
import Navbar from "../layouts/Navbar";
import GlobalModals from "../components/shared/GlobalModals";
import Home from "./Home";

// Import all components
import Vendors from "../components/Vendors";
import Category from "../components/Category";
import Product from "../components/Product";
import Customer from "../components/Customer";
import SaleBill from "../components/SaleBill";
import PurchaseBill from "../components/PurchaseBill";
import SaleBillReport from "../components/reports/SaleBillReport";
import PurchaseBillReport from "../components/reports/PurchaseBillReport";
import HsnReport from "../components/reports/HsnReport";
import Quotation from "../components/Quotation";
import PaymentReceived from "../components/PaymentReceived";
import PaymentGiven from "../components/PaymentGiven";
import CustomerLedger from "../components/ledger/CustomerLedger";
import SupplierLedger from "../components/ledger/SupplierLedger";
import SaleBillReturn from "../components/SaleBillReturn";
import PurchaseBillReturn from "../components/PurchaseBillReturn";
import Settings from "../components/setting/Settings";
import ProfitAndLoss from "../components/reports/ProfitAndLoss";
import Expenses from "../components/reports/Expenses";
import Income from "../components/reports/Income";

const Dashboard = () => {
  // State to track which tab is selected
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check screen size for responsiveness
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Tablet & mobile
  const isDesktop = useMediaQuery(theme.breakpoints.up("md")); // Desktop

  // Component mapping for cleaner switch case
  const componentMap = {
    "Dashboard": <Home setSelectedTab={setSelectedTab} />,
    "Suppliers": <Vendors />,
    "Customer": <Customer />,
    "Category": <Category />,
    "Product": <Product />,
    "Purchase Bill (ALT+P)": <PurchaseBill />,
    "Purchase Return (ALT+P+R)": <PurchaseBillReturn />,
    "Sale Bill (ALT+S)": <SaleBill />,
    "Sale Return (ALT+S+R)": <SaleBillReturn />,
    "Sale Report": <SaleBillReport />,
    "Purchase Report": <PurchaseBillReport />,
    "HSN Report": <HsnReport />,
    "Expense": <Expenses />,
    "Income": <Income />,
    "Profit & Loss": <ProfitAndLoss />,
    "Quotation": <Quotation />,
    "Payment Received": <PaymentReceived />,
    "Payment Given": <PaymentGiven />,
    "Customer Ledger": <CustomerLedger />,
    "Supplier Ledger": <SupplierLedger />,
    "Settings": <Settings />,
  };

  // Get the component to render based on selected tab
  const renderContent = () => {
    return componentMap[selectedTab] || <h2>Page not found</h2>;
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Navbar - Always visible */}
      <Navbar 
        setSelectedTab={setSelectedTab} 
        onMenuClick={handleSidebarToggle}
      />

      {/* Sidebar - Desktop: fixed, Mobile: drawer */}
      <Sidebar 
        selectedTab={selectedTab} 
        setSelectedTab={setSelectedTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          bgcolor: "#f9f9f9",
          minHeight: "calc(100vh - 64px)",
          // Update these marginLeft values to match the wider sidebar
          marginLeft: { 
            xs: "0px", 
            md: "200px", // Increased from 220px for medium screens
            lg: "220px", // Add for large screens
            xl: "300px"  // Add for extra large screens
          },
          width: "100%",
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginTop: "64px",
          overflowX: "hidden",
          position: "relative",
        }}
      >
        {/* Render the selected content */}
        {renderContent()}
      </Box>

      {/* Global Modals - Always available */}
      <GlobalModals />
    </Box>
  );
};

export default Dashboard;