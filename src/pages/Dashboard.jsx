// Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Box, Toolbar, Grid, Paper, Typography, Stack } from "@mui/material";
import Sidebar from "../layouts/Sidebar";
import Navbar from "../layouts/Navbar";
import Vendors from "../components/Vendors";
import Category from "../components/Category";
import Product from "../components/Product";
import Customer from "../components/Customer";
import SaleBill from "../components/SaleBill";
import PurchaseBill from "../components/PurchaseBill";
import SaleBillReport from "../components/reports/SaleBillReport";
import PurchaseBillReport from "../components/reports/PurchaseBillReport";
import Home from "./Home";
import HsnReport from "../components/reports/HsnReport";
import Quotation from "../components/Quotation";
import GlobalModals from "../components/shared/GlobalModals";


import PaymentReceived from "../components/PaymentReceived";
import PaymentGiven from "../components/PaymentGiven";
import CustomerLedger from "../components/ledger/CustomerLedger";
import SupplierLedger from "../components/ledger/SupplierLedger";
import SaleBillReturn from "../components/SaleBillReturn";
import PurchaseBillReturn from "../components/PurchaseBillReturn";




const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState("Dashboard");

  // // Global keyboard shortcuts
  // useEffect(() => {
  //   const handleKeyDown = (e) => {
  //     if (e.altKey && e.key === "s") {
  //       e.preventDefault();
  //       setIsSaleBillOpen(true); // open SaleBill modal
  //     }
  //     if (e.altKey && e.key === "q") {
  //       e.preventDefault();
  //       setIsQuotationOpen(true); // open Quotation modal
  //     }
  //   };
  //   window.addEventListener("keydown", handleKeyDown);
  //   return () => window.removeEventListener("keydown", handleKeyDown);
  // }, []);

  const renderContent = () => {
    switch (selectedTab) {

      case "Dashboard":       
        return <Home setSelectedTab={setSelectedTab}/>;

      case "Suppliers":
        return <Vendors />;

      case "Customer":
        return <Customer />;

      case "Category":
        return <Category />;

      case "Product":
        return <Product />;

      case "ALT+P:Purchase Bill":
        return <PurchaseBill />;

      case "ALT+P+R:Purchase Return":
        return <PurchaseBillReturn />;

      case "ALT+S:Sale Bill":
        return <SaleBill />;

        case "ALT+S+R:Sale Return":
          return <SaleBillReturn />
          
      case "Sale Report":
        return <SaleBillReport/>

    


      case "Purchase Report":
        return <PurchaseBillReport/>
      case "HSN Report":
        return <HsnReport />
      case "Quotation":
        return <Quotation />

      case "Payment Received":
        return <PaymentReceived />

      case "Payment Given":
        return <PaymentGiven />
      
      case "Customer Ledger":
        return <CustomerLedger />

      case "Supplier Ledger":
        return <SupplierLedger />

      default:
        return <h2></h2>;
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Navbar />
      <Sidebar selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
      <GlobalModals />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          bgcolor: "#f9f9f9",
          minHeight: "80vh",
           marginLeft: "230px", 
        }}
      >
      
        <Toolbar />
        {renderContent()}
      </Box>
        {/* Global Modals always available */}
    </Box>
  );
};

export default Dashboard;
