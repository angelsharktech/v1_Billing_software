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
} from "@mui/material";
import { getSaleBillByOrganization } from "../../services/SaleBillService";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { exportToExcel, exportToPDF } from "../shared/Export";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FilterData from "../shared/FilterData";
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
  const openExportMenu = Boolean(anchorEl);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

      // ✅ Filter bills within the date range (if dates are selected)
      const filteredBillsByDate = allBills.filter((bill) => {
        if (!startDate && !endDate) return true; // no filter applied
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

      // ✅ Generate HSN report from filtered bills
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

  // ✅ Filter for search
  const filteredData = hsnReportArray.filter((row) =>
    row.hsnCode?.toString().toLowerCase().includes(searchQuery)
  );

  const exportData = filteredData.map((item, idx) => ({
    index: idx + 1,
    ...item,
  }));
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value.toLowerCase()); // Case-insensitive search
  };
  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight={600}>
          HSN Report
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            inputProps={{
              min: startDate || moment().format("YYYY-MM-DD"), // Disable dates before start date
            }}
          />
        </Box>

        <Box display="flex" alignItems="center" gap={2} mr={4}>
          <FilterData value={searchQuery} onChange={handleSearchChange} />

          <Button
            variant="outlined"
            sx={{ ml: 2, mb: 2 }}
            onClick={handleExportClick}
          >
            <GetAppOutlinedIcon titleAccess="Download As" />
          </Button>
        </Box>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={openExportMenu}
        onClose={handleExportClose}
      >
        <MenuItem
          onClick={() => {
            exportToPDF(exportData, exportColumns, "HSN Report");
            handleExportClose();
          }}
        >
          PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            exportToExcel(exportData, exportColumns, "HSN Report");
            handleExportClose();
          }}
        >
          Excel
        </MenuItem>
      </Menu>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            maxWidth: 1100,
            margin: "5px auto",
            maxHeight: 550,
            overflowY: "auto",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: "#e0e0e0ff" }} align="center">
                  <strong>#</strong>
                </TableCell>
                <TableCell sx={{ background: "#e0e0e0ff" }} align="center">
                  <strong>HSN Code</strong>
                </TableCell>
                {/* <TableCell sx={{ background: "#e0e0e0ff" }} align="center">
                  <strong>Count</strong>
                </TableCell> */}
                <TableCell sx={{ background: "#e0e0e0ff" }} align="center">
                  <strong>Total Quantity</strong>
                </TableCell>
                <TableCell sx={{ background: "#e0e0e0ff" }} align="center">
                  <strong>Total Price (₹)</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={row.hsnCode}>
                  <TableCell align="center">{index + 1}</TableCell>
                  <TableCell align="center">{row.hsnCode}</TableCell>
                  {/* <TableCell align="center">{row.count}</TableCell> */}
                  <TableCell align="center">{row.totalQty}</TableCell>
                  <TableCell align="center">
                    ₹{row.totalPrice.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              {/* <TableRow
                sx={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 1,
                  background: "#e0e0e0ff",
                  fontWeight: "bold",
                }}
              >
                <TableCell colSpan={2}>
                  <strong>Total HSN Codes: {filteredData.length}</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>
                    {filteredData
                      .reduce((sum, row) => sum + row.totalQty, 0)
                      .toFixed(2)}
                  </strong>
                </TableCell>
                <TableCell align="center">
                  <strong>
                    ₹
                    {filteredData
                      .reduce((sum, row) => sum + row.totalPrice, 0)
                      .toFixed(2)}
                  </strong>
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default HsnReport;
