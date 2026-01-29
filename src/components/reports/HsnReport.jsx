import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Button,
  Menu,
  MenuItem,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { getSaleBillByOrganization } from "../../services/SaleBillService";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { exportToExcel, exportToPDF } from "../shared/Export";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import moment from "moment";

const exportColumns = [
  { label: "#", key: "index" },
  { label: "HSN Number", key: "hsnCode" },
  { label: "Total qty", key: "totalQty" },
  { label: "Total Amount", key: "totalPrice" },
];

const HsnReport = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState(null);
  const [hsnReportArray, setHsnReportArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  }, [webuser?.id]);

  useEffect(() => {
    if (mainUser) {
      fetchBills();
    }
  }, [mainUser, startDate, endDate]);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const data = await getSaleBillByOrganization(
        mainUser?.organization_id?._id
      );
      const allBills = data.data.docs || [];

      const filteredBillsByDate = allBills.filter((bill) => {
        if (!startDate && !endDate) return true;
        const billDate = new Date(bill.createdAt);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        billDate.setHours(0, 0, 0, 0);

        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        if (start && end) {
          return billDate >= start && billDate <= end;
        } else if (start) {
          return billDate >= start;
        } else if (end) {
          return billDate <= end;
        }
        return true;
      });

      const hsnReport = {};
      filteredBillsByDate.forEach((bill) => {
        bill.products.forEach((product) => {
          const hsn = product.hsnCode;
          const qty = product.qty;
          const price = product.price;

          if (!hsnReport[hsn]) {
            hsnReport[hsn] = {
              hsnCode: hsn,
              count: 1,
              totalQty: qty,
              totalPrice: qty * price,
            };
          } else {
            hsnReport[hsn].count += 1;
            hsnReport[hsn].totalQty += qty;
            hsnReport[hsn].totalPrice += qty * price;
          }
        });
      });

      setHsnReportArray(Object.values(hsnReport));
    } catch (err) {
      console.error("Failed to fetch sale bills:", err);
      setError("Failed to load sale bills");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = hsnReportArray.filter((row) =>
    row.hsnCode?.toString()?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportData = paginatedData.map((item, idx) => ({
    index: (currentPage - 1) * itemsPerPage + idx + 1,
    ...item,
  }));

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (type, value) => {
    if (type === "start") {
      setStartDate(value);
      if (endDate && value > endDate) {
        setEndDate("");
      }
    } else {
      setEndDate(value);
    }
    setCurrentPage(1);
  };

  const totals = {
    hsnCodes: filteredData.length,
    totalQuantity: filteredData.reduce((sum, row) => sum + row.totalQty, 0),
    totalAmount: filteredData.reduce((sum, row) => sum + row.totalPrice, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <Typography
            variant="h5"
            fontWeight={600}
            className="text-xl md:text-2xl lg:text-3xl text-gray-800"
          >
            HSN Report
          </Typography>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Bar */}
            <div className="w-full sm:w-64">
              <TextField
                fullWidth
                size="small"
                placeholder="Search HSN Code..."
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
        <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Date */}
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
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon className="text-gray-400 text-sm" />
                      </InputAdornment>
                    ),
                  }}
                />
              </div>

              {/* End Date */}
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
                  onChange={(e) => handleDateChange("end", e.target.value)}
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

              {/* Export Button (Mobile) */}
              <div className="flex items-end">
                <Button
                  variant="outlined"
                  onClick={handleExportClick}
                  className="w-full sm:hidden"
                  startIcon={<GetAppOutlinedIcon />}
                >
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Menu */}
      <Menu anchorEl={anchorEl} open={openExportMenu} onClose={handleExportClose}>
        <MenuItem
          onClick={() => {
            exportToPDF(exportData, exportColumns, "HSN Report");
            handleExportClose();
          }}
        >
          Export as PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportToExcel(exportData, exportColumns, "HSN Report");
            handleExportClose();
          }}
        >
          Export as Excel
        </MenuItem>
      </Menu>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-2xl">#</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total HSN Codes</p>
              <p className="text-2xl font-bold text-gray-800">
                {totals.hsnCodes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-2xl">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-800">
                {totals.totalQuantity.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-2xl">₹</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-800">
                ₹{totals.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <TableContainer>
            <Table className="min-w-full">
              <TableHead>
                <TableRow className="bg-gray-50">
                  <TableCell className="font-semibold text-gray-700 text-center sticky left-0 bg-gray-50 z-10">
                    #
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">
                    HSN Code
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">
                    Total Quantity
                  </TableCell>
                  <TableCell className="font-semibold text-gray-700 text-center">
                    Total Price (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  <>
                    {paginatedData.map((row, index) => (
                      <TableRow key={row.hsnCode} className="hover:bg-gray-50">
                        <TableCell className="text-center sticky left-0 bg-white z-10">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {row.hsnCode}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {row.totalQty.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-green-600">
                          ₹{row.totalPrice.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12"
                    >
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="text-5xl mb-4">🔍</div>
                        <p className="text-xl font-medium mb-2">No HSN Data Found</p>
                        <p className="text-sm">
                          {searchQuery
                            ? "Try adjusting your search query"
                            : "Try selecting a different date range"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>

        {/* Pagination and Footer */}
        {filteredData.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} HSN codes
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

      {/* Date Range Info */}
      {(startDate || endDate) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-sm text-yellow-800">
            <span className="mr-2">📅</span>
            <span>
              Showing data{" "}
              {startDate && endDate
                ? `from ${moment(startDate).format("MMM D, YYYY")} to ${moment(endDate).format("MMM D, YYYY")}`
                : startDate
                ? `from ${moment(startDate).format("MMM D, YYYY")} onwards`
                : `up to ${moment(endDate).format("MMM D, YYYY")}`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HsnReport;