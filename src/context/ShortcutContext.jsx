import { set } from "date-fns";
import React, { createContext, useContext, useEffect, useState } from "react";

const ShortcutContext = createContext();

export const ShortcutProvider = ({ children }) => {
  const [isSaleBillOpen, setIsSaleBillOpen] = useState(false);
  const [isPurchaseBillOpen, setIsPurchaseBillOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [isSaleReturnOpen, setIsSaleReturnOpen] = useState(false); // NEW: for Alt+S+R
  const [isPurchaseReturnOpen, setIsPurchaseReturnOpen] = useState(false); // NEW: for Alt+P+R

  const [keysPressed, setKeysPressed] = useState({});

  useEffect(() => {
    const handleKeyDown = (event) => {
       const key = event.key.toLowerCase();
      setKeysPressed((prev) => ({ ...prev, [key]: true }));
      // ALT + S -> Toggle Sale Bill
      if (event.altKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        setIsSaleBillOpen((prev) => !prev);
      }
      // ALT + P -> Toggle Purchase Bill
      if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setIsPurchaseBillOpen((prev) => !prev);
      }
      // ALT + L -> Toggle Supplier
      if (event.altKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setIsSupplierOpen((prev) => !prev);
      }
      // ALT + c -> Toggle Customer
      if (event.altKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        setIsCustomerOpen((prev) => !prev);
      }
        // ALT + x -> Toggle Category   
      if (event.altKey && event.key.toLowerCase() === "x") {
        event.preventDefault();
        setIsCategoryOpen((prev) => !prev);
      }
        // ALT + r -> Toggle Product
        if (event.altKey && event.key.toLowerCase() === "r") {  
        event.preventDefault();
        setIsProductOpen((prev) => !prev);
      }
      
      // ALT + Q -> Toggle Quotation
      if (event.altKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        setIsQuotationOpen((prev) => !prev);
      }


    //  ALT + S + R -> Toggle Sale Return
      if (event.altKey && keysPressed["s"] && key === "r") {
        event.preventDefault();
        setIsSaleReturnOpen((prev) => !prev);
      }
    //  ALT + P + R -> Toggle Purchase Return
      if (event.altKey && keysPressed["p"] && key === "r") {
        event.preventDefault();
        setIsPurchaseReturnOpen((prev) => !prev);
      }
    };

    const handleKeyUp = (event) => {
      const key = event.key.toLowerCase();
      setKeysPressed((prev) => ({ ...prev, [key]: false }));
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    }
  }, [keysPressed]);

  return (
    <ShortcutContext.Provider
      value={{
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
        isSaleReturnOpen,
        setIsSaleReturnOpen,
        isPurchaseReturnOpen,
        setIsPurchaseReturnOpen
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcuts = () => useContext(ShortcutContext);
