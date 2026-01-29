import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";
import { getSaleBillByOrganization } from "../../services/SaleBillService";
import { getPurchaseBillByOrganization } from "../../services/PurchaseBillService";
import { getAllExpensesByOrganization } from "../../services/ExpenseService";
import { getAllIncomesByOrganization } from "../../services/IncomeService";

const ProfitAndLoss = () => {
  const { webuser } = useAuth();
  const navigate = useNavigate();

  const [salesAccount, setSalesAccount] = useState(0);
  const [salesReturnAccount, setSalesReturnAccount] = useState(0);
  const [purchaseAccount, setPurchaseAccount] = useState(0);
  const [purchaseReturnAccount, setPurchaseReturnAccount] = useState(0);

  const [indirectExpense, setIndirectExpense] = useState([]);
  const [directExpense, setDirectExpense] = useState([]);
  const [directIncome, setDirectIncome] = useState([]);
  const [indirectIncome, setIndirectIncome] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Manual entries
  const [openingStock, setOpeningStock] = useState(
    localStorage.getItem("openingStock") || 0
  );
  const [closingStock, setClosingStock] = useState(
    localStorage.getItem("closingStock") || 0
  );

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      setLoading(true);
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
        return;
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
    } catch (error) {
      console.error("Error fetching sale/purchase data:", error);
      setSnackbarMessage("Error fetching data. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

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

  const formatNumber = (num) => {
    return Number(num).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleOpeningStockChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setOpeningStock(value);
    localStorage.setItem("openingStock", value);
  };

  const handleClosingStockChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    setClosingStock(value);
    localStorage.setItem("closingStock", value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
          Profit & Loss Account
        </h1>
      </div>

      {/* Mobile View - Separate Cards */}
      <div className="block lg:hidden space-y-6">
        {/* Debit Card (Mobile) */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
            Debit Side (Expenses)
          </h2>
          <div className="space-y-3">
            {/* Opening Stock */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Opening Stock</span>
              <input
                type="text"
                value={openingStock}
                onChange={handleOpeningStockChange}
                className="w-28 text-right border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="flex justify-between">
              <span className="text-gray-700">Purchases</span>
              <span className="font-semibold">{formatNumber(purchaseAccount)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-700">Purchases Return</span>
              <span className="font-semibold">{formatNumber(purchaseReturnAccount)}</span>
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <div className="flex justify-between font-bold">
              <span>Net Purchase</span>
              <span>{formatNumber(netPurchase)}</span>
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            {/* Direct Expenses */}
            <h3 className="font-bold text-gray-800 mt-3 mb-2">Direct Expenses</h3>
            <div className="space-y-2">
              {directExpense.map((exp, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">{exp.name}</span>
                  <span className="text-right">{formatNumber(exp.amount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <div className="flex justify-between font-bold">
              <span>Gross Profit C/O</span>
              <span>{formatNumber(grossProfitCO)}</span>
            </div>
          </div>
        </div>

        {/* Credit Card (Mobile) */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b">
            Credit Side (Income)
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">Sales Account</span>
              <span className="font-semibold">{formatNumber(salesAccount)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-700">Sales Return</span>
              <span className="font-semibold">{formatNumber(salesReturnAccount)}</span>
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <div className="flex justify-between font-bold">
              <span>Net Sale</span>
              <span>{formatNumber(netSale)}</span>
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            {/* Direct Income */}
            <h3 className="font-bold text-gray-800 mt-3 mb-2">Direct Income</h3>
            <div className="space-y-2">
              {directIncome.map((inc, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">{inc.name}</span>
                  <span className="text-right">{formatNumber(inc.amount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            {/* Closing Stock */}
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Closing Stock</span>
              <input
                type="text"
                value={closingStock}
                onChange={handleClosingStockChange}
                className="w-28 text-right border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Middle Section - Gross Profit (Mobile) */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-gray-800">Net Profit</span>
            <span className="font-bold">{formatNumber(grossProfitBF)}</span>
          </div>
          <div className="border-t border-gray-300 my-3"></div>
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-800">Net Profit</span>
            <span className="font-bold">{formatNumber(grossProfitBF)}</span>
          </div>
        </div>

        {/* Bottom Sections (Mobile) */}
        <div className="space-y-6">
          {/* Indirect Expenses Card (Mobile) */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Indirect Expenses</h3>
            <div className="space-y-2">
              {indirectExpense.map((exp, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">{exp.name}</span>
                  <span className="text-right">{formatNumber(exp.amount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <div className="flex justify-between font-bold">
              <span>Net Profit</span>
              <span>{formatNumber(netProfit)}</span>
            </div>
          </div>

          {/* Indirect Income Card (Mobile) */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between font-bold mb-3">
              <span>Gross Profit B/F</span>
              <span>{formatNumber(grossProfitCO)}</span>
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <h3 className="text-lg font-bold text-gray-800 mb-3">Indirect Income</h3>
            <div className="space-y-2">
              {indirectIncome.map((inc, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">{inc.name}</span>
                  <span className="text-right">{formatNumber(inc.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total Card (Mobile) */}
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold">{formatNumber(total)}</span>
            </div>
            <div className="border-t border-gray-300 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold">{formatNumber(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop View - Original Layout */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-xl p-6 max-w-6xl mx-auto">
        {/* Top Section - Debit & Credit Sides */}
        <div className="flex gap-8">
          {/* Debit Side */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Debit Side (Expenses)
            </h2>
            <div className="space-y-3">
              {/* Opening Stock */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Opening Stock</span>
                <input
                  type="text"
                  value={openingStock}
                  onChange={handleOpeningStockChange}
                  className="w-32 text-right border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Purchases</span>
                <span className="font-semibold">{formatNumber(purchaseAccount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Purchases Return</span>
                <span className="font-semibold">{formatNumber(purchaseReturnAccount)}</span>
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              <div className="flex justify-between font-bold">
                <span>Net Purchase</span>
                <span>{formatNumber(netPurchase)}</span>
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              {/* Direct Expenses */}
              <h3 className="font-bold text-gray-800 mt-3 mb-2">Direct Expenses</h3>
              <div className="space-y-2">
                {directExpense.map((exp, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-700">{exp.name}</span>
                    <span className="text-right">{formatNumber(exp.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              <div className="flex justify-between font-bold">
                <span>Gross Profit C/O</span>
                <span>{formatNumber(grossProfitCO)}</span>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="border-l-2 border-gray-300 mx-2"></div>

          {/* Credit Side */}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              Credit Side (Income)
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Sales Account</span>
                <span className="font-semibold">{formatNumber(salesAccount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-700">Sales Return</span>
                <span className="font-semibold">{formatNumber(salesReturnAccount)}</span>
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              <div className="flex justify-between font-bold">
                <span>Net Sale</span>
                <span>{formatNumber(netSale)}</span>
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              {/* Direct Income */}
              <h3 className="font-bold text-gray-800 mt-3 mb-2">Direct Income</h3>
              <div className="space-y-2">
                {directIncome.map((inc, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-gray-700">{inc.name}</span>
                    <span className="text-right">{formatNumber(inc.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-300 my-4"></div>

              {/* Closing Stock */}
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Closing Stock</span>
                <input
                  type="text"
                  value={closingStock}
                  onChange={handleClosingStockChange}
                  className="w-32 text-right border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Gross Profit */}
        <div className="border-t border-gray-300 my-4"></div>
        
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <span className="font-bold text-gray-800">Net Profit </span>
          </div>
          <div className="flex-1 text-center">
            <span className="font-bold">{formatNumber(grossProfitBF)}</span>
          </div>
          <div className="border-l-2 border-gray-300 h-6 mx-4"></div>
          <div className="flex-1 text-right">
            <span className="font-bold">{formatNumber(grossProfitBF)}</span>
          </div>
        </div>

        <div className="border-t border-gray-300 my-4"></div>

        {/* Bottom Section - Indirect Expenses/Income */}
        <div className="flex gap-8">
          {/* Left: Indirect Expenses */}
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-3 mt-3">Indirect Expenses</h3>
            <div className="space-y-2">
              {indirectExpense.map((exp, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">{exp.name}</span>
                  <span className="text-right">{formatNumber(exp.amount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <div className="flex justify-between font-bold">
              <span>Net Profit</span>
              <span>{formatNumber(netProfit)}</span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="border-l-2 border-gray-300 mx-2"></div>

          {/* Right: Indirect Income */}
          <div className="flex-1">
            <div className="flex justify-between font-bold mb-3">
              <span>Gross Profit B/F</span>
              <span>{formatNumber(grossProfitCO)}</span>
            </div>

            <div className="border-t border-gray-300 my-3"></div>

            <h3 className="font-bold text-gray-800 mb-3">Indirect Income</h3>
            <div className="space-y-2">
              {indirectIncome.map((inc, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-gray-700">{inc.name}</span>
                  <span className="text-right">{formatNumber(inc.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Total */}
        <div className="border-t border-gray-300 my-4"></div>
        
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <span className="font-bold text-gray-800">Total</span>
          </div>
          <div className="flex-1 text-center">
            <span className="font-bold">{formatNumber(total)}</span>
          </div>
          <div className="border-l-2 border-gray-300 h-6 mx-4"></div>
          <div className="flex-1 text-right">
            <span className="font-bold">{formatNumber(total)}</span>
          </div>
        </div>
      </div>

      {/* Snackbar/Toast Notification */}
      {snackbarOpen && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md">
          <div className={`p-4 rounded-lg shadow-lg ${
            snackbarMessage.includes("Error") || snackbarMessage.includes("expired")
              ? "bg-red-100 border-red-400 text-red-700"
              : "bg-green-100 border-green-400 text-green-700"
          } border`}>
            <div className="flex justify-between items-center">
              <span>{snackbarMessage}</span>
              <button
                onClick={() => setSnackbarOpen(false)}
                className="ml-4 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitAndLoss;