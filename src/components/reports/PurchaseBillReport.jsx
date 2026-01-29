import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  MenuItem,
  Menu,
  Box,
  TextField,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import DownloadIcon from "@mui/icons-material/Download";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { exportToExcel, exportToPDF } from "../shared/Export";
import moment from "moment";
import { getPurchaseBillByOrganization } from "../../services/PurchaseBillService";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { useNavigate } from "react-router-dom";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import PurchaseBillReturnReport from "./PurchaseBillReturnReport";

const exportColumns = [
  { label: "#", key: "index" },
  { label: "Bill\nDate", key: "billDate" },
  { label: "HSN", key: "hsn" },
  { label: "Product\nCode", key: "productCode" },
  { label: "Invoice\nNo.", key: "invoiceNo" },
  { label: "Customer\nName", key: "customerName" },
  { label: "GSTIN", key: "gstNo" },
  { label: "Rate", key: "rate" },
  { label: "discount", key: "discount" },
  { label: "Taxable\nAmount", key: "taxableAmount" },
  { label: "Gst\nRate", key: "gstRate" },
  { label: "Total\nGst", key: "totalGst" },
  { label: "CGST", key: "cgst" },
  { label: "SGST", key: "sgst" },
  { label: "IGST", key: "igst" },
  { label: "Bill\nTotal ", key: "billTotal" },
];

const PurchaseBillReport = () => {
  const { webuser } = useAuth();
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [mainUser, setMainUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gstFilter, setGstFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const openExportMenu = Boolean(anchorEl);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUserById(webuser?.id);
      setMainUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (mainUser) {
      fetchBills();
    }
  }, [mainUser]);

  const fetchBills = async () => {
    try {
      const data = await getPurchaseBillByOrganization(
        mainUser?.organization_id?._id
      );
      if (data.status === 401) {
        setSnackbarMessage("Your Session is expired. Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }

      const allBills = data.data || [];
      const filteredBills = allBills.docs.filter(
        (bill) => bill.isReturn === false
      );

      setBills(filteredBills);
    } catch (err) {
      console.error("Failed to fetch purchase bills:", err);
      setError("Failed to load purchase bills");
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (!bill.createdAt) return false;

      const billDate = new Date(bill.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);

      const billNumber = (bill?.bill_number || "").toLowerCase();
      const billStatus = bill?.status;
      const billName = (bill.client_id?.name || "").toLowerCase();

      const matchesDateRange =
        (!start || billDate >= start) && (!end || billDate <= end);

      const matchesSearch =
        !searchQuery ||
        billNumber.includes(searchQuery) ||
        billName.includes(searchQuery) ||
        billStatus.includes(searchQuery);

      const matchesGST = !gstFilter || bill?.billType === gstFilter;

      return matchesDateRange && matchesSearch && matchesGST;
    });
  }, [bills, startDate, endDate, searchQuery, gstFilter]);

  const mappedBills = useMemo(
    () =>
      filteredBills.map((bill, index) => ({
        index: index + 1,
        hsn: `${bill?.products?.map((p) => p.hsnCode) || "N/A"}`,
        productCode: `${bill?.products?.map((p) => p.productCode) || "N/A"}`,
        gstNo: `${bill?.bill_to?.gstDetails?.gstNumber || "N/A"}`,
        rate: `${bill?.products?.map((p) => p.unitPrice) || "N/A"}`,
        discount: `${bill?.products?.map((p) => p.discount) || 0}`,
        taxableAmount: `${bill?.subtotal || "N/A"}`,
        gstRate: `${bill?.products?.[0]?.gstPercent || "0"}`,
        totalGst: `${bill?.gstTotal || "0"}`,
        cgst: `${bill?.products?.[0]?.cgst || "0"}`,
        sgst: `${bill?.products?.[0]?.sgst || "0"}`,
        igst: `${bill?.products?.[0]?.igst || "0"}`,
        customerName: `${bill.bill_to?.name || ""}`,
        invoiceNo: bill?.bill_number || "",
        billDate: moment(bill.createdAt).format("DD/MM/YYYY") || "",
        billTotal: bill?.grandTotal || 0,
      })),
    [filteredBills]
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredBills.length / itemsPerPage);
  const paginatedBills = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBills.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBills, currentPage]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const totalBill = filteredBills.reduce(
    (acc, bill) => acc + (bill.salebill?.grandTotal || 0),
    0
  );
  const totalPaid = filteredBills.reduce(
    (acc, bill) =>
      acc +
      Number(bill.salebill?.advance || 0) +
      Number(bill.salebill?.fullPaid || 0),
    0
  );
  const totalbal = filteredBills.reduce(
    (acc, bill) => acc + Number(bill.salebill?.balance || 0),
    0
  );

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <Typography 
              variant="h5" 
              fontWeight={600} 
              className="text-xl md:text-2xl lg:text-3xl text-gray-800"
            >
              Purchase Report
            </Typography>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Bar */}
              <div className="w-full sm:w-64">
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search by invoice, supplier..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon className="text-gray-400" />
                      </InputAdornment>
                    ),
                  }}
                  className="bg-white"
                />
              </div>

              {/* Filter Toggle Button (Mobile) */}
              <IconButton
                className="sm:hidden"
                onClick={() => setShowFilters(!showFilters)}
                aria-label="toggle filters"
              >
                <FilterListIcon />
              </IconButton>

              {/* Export Button */}
              <Button
                variant="outlined"
                onClick={handleExportClick}
                className="hidden sm:flex items-center gap-2"
                startIcon={<GetAppOutlinedIcon />}
              >
                <span className="hidden md:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Filters Section */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block`}>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Filters */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon className="text-gray-400 text-sm" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarTodayIcon className="text-gray-400 text-sm" />
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      min: startDate,
                    }}
                  />
                </div>

                {/* GST Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    GST Filter
                  </label>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    value={gstFilter}
                    onChange={(e) => setGstFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="gst">GST</MenuItem>
                    <MenuItem value="nongst">Non-GST</MenuItem>
                  </TextField>
                </div>

                {/* Export Button (Mobile) */}
                <div className="flex items-end">
                  <Button
                    variant="outlined"
                    onClick={handleExportClick}
                    className="w-full sm:hidden"
                    startIcon={<GetAppOutlinedIcon />}
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Menu */}
        <Menu
          anchorEl={anchorEl}
          open={openExportMenu}
          onClose={handleExportClose}
        >
          <MenuItem
            onClick={() => {
              exportToPDF(
                mappedBills,
                exportColumns,
                `Purchase Summary Report - ${gstFilter.toUpperCase() || "All"}`
              );
              handleExportClose();
            }}
          >
            Export as PDF
          </MenuItem>
          <MenuItem
            onClick={() => {
              exportToExcel(
                mappedBills,
                exportColumns,
                `Purchase Summary Report - ${gstFilter.toUpperCase() || "All"}`
              );
              handleExportClose();
            }}
          >
            Export as Excel
          </MenuItem>
        </Menu>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Summary Cards */}
          <div className="p-4 border-b">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Purchase Bills</p>
                <p className="text-2xl font-bold text-gray-800">{filteredBills.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Purchase Amount</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{totalBill.toFixed(2)}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{totalPaid.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <TableContainer>
              <Table className="min-w-full">
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">#</TableCell>
                    <TableCell className="font-semibold text-gray-700">Bill Date</TableCell>
                    <TableCell className="font-semibold text-gray-700">HSN</TableCell>
                    <TableCell className="font-semibold text-gray-700">Product Code</TableCell>
                    <TableCell className="font-semibold text-gray-700">Invoice No.</TableCell>
                    <TableCell className="font-semibold text-gray-700">Supplier</TableCell>
                    {(gstFilter === "gst" || gstFilter === "") && (
                      <TableCell className="font-semibold text-gray-700">GSTIN</TableCell>
                    )}
                    <TableCell className="font-semibold text-gray-700">Rate</TableCell>
                    <TableCell className="font-semibold text-gray-700">Discount</TableCell>
                    <TableCell className="font-semibold text-gray-700">Taxable Amt</TableCell>
                    {(gstFilter === "gst" || gstFilter === "") && (
                      <>
                        <TableCell className="font-semibold text-gray-700">GST Rate</TableCell>
                        <TableCell className="font-semibold text-gray-700">Total GST</TableCell>
                        <TableCell className="font-semibold text-gray-700">CGST</TableCell>
                        <TableCell className="font-semibold text-gray-700">SGST</TableCell>
                        <TableCell className="font-semibold text-gray-700">IGST</TableCell>
                      </>
                    )}
                    <TableCell className="font-semibold text-gray-700">Bill Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedBills.length > 0 ? (
                    paginatedBills.map((bill, billIndex) =>
                      bill?.products?.map((product, prodIndex) => (
                        <TableRow 
                          key={`${billIndex}-${prodIndex}`}
                          className="hover:bg-gray-50"
                        >
                          <TableCell className="sticky left-0 bg-white z-10">
                            {(currentPage - 1) * itemsPerPage + billIndex + 1}.{prodIndex + 1}
                          </TableCell>
                          <TableCell>{bill.billDate ? bill.billDate : "--"}</TableCell>
                          <TableCell>{product?.hsnCode || "N/A"}</TableCell>
                          <TableCell>{product?.productCode || "N/A"}</TableCell>
                          <TableCell>
                            <span className="font-medium">{bill?.bill_number || "N/A"}</span>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate" title={bill.bill_to?.name}>
                              {bill.bill_to?.name || "N/A"}
                            </div>
                          </TableCell>
                          {(gstFilter === "gst" || gstFilter === "") && (
                            <TableCell>
                              <div className="max-w-[120px] truncate font-mono text-sm">
                                {bill?.bill_to?.gstDetails?.gstNumber || "N/A"}
                              </div>
                            </TableCell>
                          )}
                          <TableCell>₹{product?.unitPrice || "0"}</TableCell>
                          <TableCell>
                            {product?.discount.includes("%")
                              ? product?.discount
                              : "₹" + product?.discount || "0"}
                          </TableCell>
                          <TableCell>₹{product?.price || "0"}</TableCell>
                          {(gstFilter === "gst" || gstFilter === "") && (
                            <>
                              <TableCell>{product?.gstPercent || "0"}%</TableCell>
                              <TableCell>
                                ₹{product?.cgst > 0
                                  ? product?.cgst + product?.sgst
                                  : product?.igst || "0"}
                              </TableCell>
                              <TableCell>₹{product?.cgst || "0"}</TableCell>
                              <TableCell>₹{product?.sgst || "0"}</TableCell>
                              <TableCell>₹{product?.igst || "0"}</TableCell>
                            </>
                          )}
                          <TableCell className="font-semibold">
                            ₹{product?.cgst > 0
                              ? (product?.price + product?.cgst + product?.sgst).toFixed(2)
                              : (product?.price + product?.igst).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <TableCell 
                        colSpan={gstFilter === "gst" || gstFilter === "" ? 17 : 11}
                        className="text-center py-8"
                      >
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <div className="text-4xl mb-2">🛒</div>
                          <p className="text-lg font-medium">No Purchase Bills Found</p>
                          <p className="text-sm">Try adjusting your filters or search query</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Pagination and Footer */}
          {filteredBills.length > 0 && (
            <div className="p-4 border-t">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredBills.length)} of{" "}
                  {filteredBills.length} purchase entries
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-3"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        size="small"
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "contained" : "outlined"}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    size="small"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-3"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("expired") ? "error" : "success"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          className="w-full max-w-md"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <PurchaseBillReturnReport />
    </>
  );
};

export default PurchaseBillReport;