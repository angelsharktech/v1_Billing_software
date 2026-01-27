import React, { useEffect, useState } from "react";
import { getUserById } from "../services/UserService";
import { getSaleBillByOrganization, getSaleBillById, cancelSaleBill } from "../services/SaleBillService";
import { useAuth } from "../context/AuthContext";
import CreateSaleBill from "../components/salebill/CreateSaleBill";
import CreatePurchaseBill from "../components/purchasebill/CreatePurchaseBill";
import { IconButton, Snackbar, Alert } from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Print as PrintIcon,
  Cancel as CancelIcon,
  Receipt as ReceiptIcon,
  Inventory2 as InventoryIcon,
  People as PeopleIcon,
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon
} from "@mui/icons-material";
import moment from "moment";
import ViewBill from "../components/salebill/ViewBill";
import GenerateBill from "../components/shared/GenerateBill";

const Home = ({ setSelectedTab }) => {
  const { webuser } = useAuth();
  const [counts, setCounts] = useState({
    totalProducts: 12,
    todaySaleAmount: " Rs.0.00",
    todaySaleInvoices: 0,
    totalCustomers: 9,
  });
  const [saleBills, setSaleBills] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [openSaleBill, setOpenSaleBill] = useState(false);
  const [openPurchaseBill, setOpenPurchaseBill] = useState(false);
  const [viewBillData, setViewBillData] = useState(null);
  const [viewBillOpen, setViewBillOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleSaleOpen = () => setOpenSaleBill(true);
  const handlePurchaseOpen = () => setOpenPurchaseBill(true);
  const handleCloseSaleBill = () => setOpenSaleBill(false);
  const handleClosePurchaseBill = () => setOpenPurchaseBill(false);
  const handleCloseViewBill = () => {
    setViewBillOpen(false);
    setViewBillData(null);
  };

  const parseBillDate = (billDateStr) => {
    if (!billDateStr) return null;
    const [year, month, day] = billDateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  useEffect(() => {
    fetchCounts();

    const interval = setInterval(() => {
      fetchCounts();
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [webuser]);

  useEffect(() => {
    // Setup keyboard shortcuts
    const handleKeyDown = (e) => {
      if (e.altKey) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSaleOpen();
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          handlePurchaseOpen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchCounts = async () => {
    if (!webuser?.id) return;

    try {
      const user = await getUserById(webuser.id);

      const saleBillsRes = await getSaleBillByOrganization(
        user.organization_id._id
      );

      const saleBillsData = saleBillsRes?.data?.docs || [];
      setSaleBills(saleBillsData);

      const today = new Date();
      const isToday = (billDateStr) => {
        const billDate = parseBillDate(billDateStr);
        if (!billDate) return false;
        return billDate.toDateString() === today.toDateString();
      };

      const todaySales = saleBillsData.filter(
        (b) => isToday(b.billDate) && b.isReturn === false && b.status === "draft"
      );

      const todaySaleAmount = todaySales.reduce(
        (sum, b) => sum + (b.grandTotal || 0),
        0
      );

      // Get recent invoices (last 2-3)
      const recent = saleBillsData
        .filter(b => b.status === "draft" && b.isReturn === false)
        .sort((a, b) => new Date(b.billDate) - new Date(a.billDate))
        .slice(0, 3);

      setRecentInvoices(recent);

      setCounts(prev => ({
        ...prev,
        todaySaleAmount: ` Rs.${todaySaleAmount.toFixed(2)}`,
        todaySaleInvoices: todaySales.length,
      }));

    } catch (error) {
      console.error("Error fetching counts:", error);
    }
  };

  const handleViewInvoice = async (invoiceId) => {
    try {
      // Pass just the ID to ViewBill component
      setViewBillData(invoiceId);
      setViewBillOpen(true);
    } catch (error) {
      console.error("Error fetching bill details:", error);
      setSnackbarMessage("Failed to load invoice details");
      setSnackbarOpen(true);
    }
  };

  const handlePrintInvoice = async (bill) => {
    try {
      const res = await getSaleBillById(bill._id);
      if (res.success) {
        setPrintData(res.data);
        setShowPrint(true);
        // Print after a short delay
        setTimeout(() => {
          window.print();
          setTimeout(() => {
            setShowPrint(false);
          }, 100);
        }, 500);
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      setSnackbarMessage("Failed to print invoice");
      setSnackbarOpen(true);
    }
  };

  const handleCancelBill = async (invoiceId) => {
    if (window.confirm("Are you sure you want to cancel this invoice?")) {
      try {
        const response = await cancelSaleBill(invoiceId, { status: "cancelled" });
        if (response.success === true) {
          setSnackbarMessage("Invoice cancelled successfully!");
          setSnackbarOpen(true);
          // Refresh the data
          fetchCounts();
        }
      } catch (error) {
        console.error("Error cancelling invoice:", error);
        setSnackbarMessage("Failed to cancel invoice");
        setSnackbarOpen(true);
      }
    }
  };

  const handleViewAllInvoices = () => {
    // Use the setSelectedTab prop passed from Dashboard to switch to Sale Bill tab
    if (setSelectedTab) {
      setSelectedTab("Sale Bill (ALT+S)");
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Products Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium opacity-90 mb-2">Products</h3>
                <h2 className="text-3xl font-bold leading-tight">{counts.totalProducts}</h2>
              </div>
              <InventoryIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.9)" }} />
            </div>
          </div>

          {/* Today's Sales Card */}
          <div className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium opacity-90 mb-2">Today's Sales ( Rs.)</h3>
                <h2 className="text-3xl font-bold leading-tight">{counts.todaySaleAmount}</h2>
              </div>
              <AttachMoneyIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.9)" }} />
            </div>
          </div>

          {/* Today's Sale Invoices Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium opacity-90 mb-2">Today's Sale Invoices</h3>
                <h2 className="text-3xl font-bold leading-tight">{counts.todaySaleInvoices}</h2>
              </div>
              <ReceiptIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.9)" }} />
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 text-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium opacity-90 mb-2">Customers</h3>
                <h2 className="text-3xl font-bold leading-tight">{counts.totalCustomers}</h2>
              </div>
              <PeopleIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.9)" }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Invoices</h2>
              </div>

              {/* Mobile View - Cards */}
              <div className="block md:hidden p-4 space-y-4">
                {recentInvoices.length > 0 ? (
                  recentInvoices.map((invoice, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {invoice.bill_number || `INV-${invoice._id?.slice(-6) || '000000'}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {invoice.billDate ? moment(invoice.billDate).format("DD/MM/YYYY") : "--"}
                          </p>
                        </div>
                        <span className="font-bold text-gray-800 text-lg">
                           Rs.{invoice.grandTotal?.toFixed(2) || "0.00"}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Customer:</span> {invoice.bill_to?.name || "Walk-in Customer"}
                        </p>
                      </div>

                      <div className="flex justify-end">
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleViewInvoice(invoice._id)}
                            className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                            title="View"
                          >
                            <VisibilityIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => handlePrintInvoice(invoice)}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
                            title="Print"
                          >
                            <PrintIcon fontSize="small" />
                          </button>
                          <button
                            onClick={() => handleCancelBill(invoice._id)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                            title="Delete"
                          >
                            <CancelIcon fontSize="small" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <ReceiptIcon className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg mb-4">No invoices found</p>
                    <button
                      onClick={handleSaleOpen}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-base font-medium"
                    >
                      Create Your First Invoice
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop View - Table */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 sm:px-6 text-sm font-semibold text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 sm:px-6 text-sm font-semibold text-gray-600">Invoice</th>
                        <th className="text-left py-3 px-4 sm:px-6 text-sm font-semibold text-gray-600">Customer</th>
                        <th className="text-left py-3 px-4 sm:px-6 text-sm font-semibold text-gray-600">Amount</th>
                        <th className="text-left py-3 px-4 sm:px-6 text-sm font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentInvoices.length > 0 ? (
                        recentInvoices.map((invoice, index) => (
                          <tr
                            key={index}
                            className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                          >
                            <td className="py-4 px-4 sm:px-6 text-gray-700">
                              {invoice.billDate ? moment(invoice.billDate).format("DD/MM/YYYY") : "--"}
                            </td>
                            <td className="py-4 px-4 sm:px-6">
                              <span className="font-medium text-gray-800">
                                {invoice.bill_number || `INV-${invoice._id?.slice(-6) || '000000'}`}
                              </span>
                            </td>
                            <td className="py-4 px-4 sm:px-6 text-gray-700">
                              {invoice.bill_to?.name || "Walk-in Customer"}
                            </td>
                            <td className="py-4 px-4 sm:px-6">
                              <span className="font-bold text-gray-800">
                                 Rs.{invoice.grandTotal?.toFixed(2) || "0.00"}
                              </span>
                            </td>
                            <td className="py-4 px-4 sm:px-6">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewInvoice(invoice._id)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                                  title="View"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </button>
                                <button
                                  onClick={() => handlePrintInvoice(invoice)}
                                  className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100"
                                  title="Print"
                                >
                                  <PrintIcon fontSize="small" />
                                </button>
                                {/* <button
                                  onClick={() => handleCancelBill(invoice._id)}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                                  title="Delete"
                                >
                                  <CancelIcon fontSize="small" />
                                </button> */}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 px-6 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <ReceiptIcon className="w-12 h-12 text-gray-300 mb-3" />
                              <p className="text-gray-500 text-lg">No invoices found</p>
                              <button
                                onClick={handleSaleOpen}
                                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                              >
                                Create Your First Invoice
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
                <button
                  onClick={handleViewAllInvoices}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Invoices →
                </button>
              </div>
            </div>

            {/* Today's Summary Section */}
            <div className="bg-white rounded-xl shadow-md mt-6 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Today's Summary</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm sm:text-base">Total Invoices</span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base">{counts.todaySaleInvoices}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 text-sm sm:text-base">Total Sales</span>
                    <span className="font-bold text-gray-800 text-sm sm:text-base">{counts.todaySaleAmount}</span>
                  </div>
                </div>
                {/* <div className="mt-6 sm:mt-8 pt-4 border-t">
                  <p className="text-xs sm:text-sm text-gray-500">Active Windows</p>
                  <p className="text-xs sm:text-sm text-blue-600 cursor-pointer hover:underline mt-1">
                    Go to Settings to activate Windows.
                  </p>
                </div> */}
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={handleSaleOpen}
                  className="w-full flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all duration-200 group border border-blue-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg mr-4">
                    <AddIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-blue-600">Create Sale Bill</span>
                </button>
                <button
                  onClick={handlePurchaseOpen}
                  className="w-full flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 group border border-purple-100"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg mr-4">
                    <ReceiptIcon sx={{ color: "white", fontSize: 24 }} />
                  </div>
                  <span className="font-medium text-gray-800 group-hover:text-purple-600">Create Purchase Bill</span>
                </button>
              </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="font-bold text-gray-800 mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Sale Invoice</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Alt + S</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">New Purchase Invoice</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm border border-gray-300">Alt + P</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSaleBill open={openSaleBill} handleClose={handleCloseSaleBill} refresh={fetchCounts} />
      <CreatePurchaseBill open={openPurchaseBill} handleClose={handleClosePurchaseBill} refresh={fetchCounts} />

      {/* View Bill Modal */}
      {viewBillOpen && (
        <ViewBill open={viewBillOpen} data={viewBillData} handleCloseView={handleCloseViewBill} />
      )}

      {/* Print Component */}
      {showPrint && printData && (
        <div className="print-only">
          <GenerateBill bill={printData} billName={"SALE"} />
        </div>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage.includes("successfully") ? "success" : "error"
          }
          variant="filled"
          onClose={handleCloseSnackbar}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;