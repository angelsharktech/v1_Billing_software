import React from "react";
import { Dialog } from "@mui/material";
import { useShortcuts } from "../../context/ShortcutContext";
import SaleBillForm from "../salebill/SaleBillForm";
import AddQuotationDialog from "../quotation/AddQuotationDialog";
import CreateSaleBill from "../salebill/CreateSaleBill";
import CreatePurchaseBill from "../purchasebill/CreatePurchaseBill";
import AddVendor from "../vendors/AddVendor";
import AddCustomer from "../customer/AddCustomer";
import AddCategory from "../category/AddCategory";
import AddProduct from "../product/AddProduct";

const GlobalModals = () => {
  const {
    isSaleBillOpen,
    setIsSaleBillOpen,
    isPurchaseBillOpen,
    setIsPurchaseBillOpen,
    isSupplierOpen,
    setIsSupplierOpen,
    isCustomerOpen,
    setIsCustomerOpen,
    isCategoryOpen,
    setIsCategoryOpen,
    isProductOpen,
    setIsProductOpen,
    isQuotationOpen,
    setIsQuotationOpen,
  } = useShortcuts();

  const handleClose = () => {
    setIsSaleBillOpen(false);
    setIsPurchaseBillOpen(false);
    setIsSupplierOpen(false);
    setIsCustomerOpen(false);
    setIsCategoryOpen(false);
    setIsProductOpen(false);
    setIsQuotationOpen(false);
  };
  return (
    <>
      {/* Sale Bill Modal */}
      <CreateSaleBill open={isSaleBillOpen} handleClose={handleClose} />
      <CreatePurchaseBill open={isPurchaseBillOpen} handleClose={handleClose} />
      <AddVendor open={isSupplierOpen} handleClose={handleClose} />
      <AddCustomer open={isCustomerOpen} handleClose={handleClose} />
      <AddCategory open={isCategoryOpen} handleClose={handleClose} />
      <AddProduct open={isProductOpen} handleClose={handleClose} />
      <AddQuotationDialog open={isQuotationOpen} handleClose={handleClose} />
    </>
  );
};

export default GlobalModals;
