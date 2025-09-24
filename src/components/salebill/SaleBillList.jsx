import React, { useEffect, useMemo, useRef, useState } from "react";
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
  IconButton,
  Snackbar,
  Alert,
  Chip,
} from "@mui/material";
import moment from "moment";
import {
  cancelSaleBill,
  getAllSaleBills,
  getSaleBillByOrganization,
} from "../../services/SaleBillService";
import CreateSaleBill from "./CreateSaleBill";
import { Visibility } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import ViewBill from "./ViewBill";
import EditBill from "./EditBill";
import PaginationComponent from "../shared/PaginationComponent";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { useNavigate } from "react-router-dom";
import CancelIcon from "@mui/icons-material/Cancel";

const SaleBillList = () => {
  const { webuser } = useAuth();
  const navigate = useNavigate();
  const [mainUser, setMainUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [data, setData] = useState();
  const [view, setView] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState();
  const [edit, setEdit] = useState(false);

  const handleCloseEdit = () => setEdit(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseView = () => setView(false);

const dateInputRef = useRef(null);

useEffect(() => {
  if (dateInputRef.current) {
    dateInputRef.current.focus();
  }
}, []);

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
    if (!mainUser) return;

    const data = await getSaleBillByOrganization(
      mainUser?.organization_id?._id
    );
    if (data.status === 401) {
      setSnackbarMessage("Your Session is expired. Please login again!");
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
    if (data.success === true) {
      const allBills = data.data.docs || [];
      const FilteredBill = allBills.filter((bill) => {
        return bill.status === "draft" && bill.isReturn === false;
      });
      setBills(FilteredBill);
    }
  };

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (!bill.billDate) return false;
      const billDate = new Date(bill.billDate);
      const selectedDate = startDate ? new Date(startDate) : null;

      if (!selectedDate) return true;

      // Normalize both to remove time portion
      billDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      // Return only bills matching that exact date
      return billDate.getTime() === selectedDate.getTime();
    });
  }, [bills, startDate]);

  const totalBill = filteredBills.reduce(
    (acc, bill) => acc + (bill.grandTotal || 0),
    0
  );
  const totalPaid = filteredBills.reduce(
    (acc, bill) => acc + Number(bill.advance || 0) + Number(bill.fullPaid || 0),
    0
  );
  const totalbal = filteredBills.reduce(
    (acc, bill) => acc + Number(bill.balance || 0),
    0
  );

  const handleView = (rowData) => {
    setData(rowData);
    setView(true);
  };
  const handleEditBill = (rowData) => {
    setEditData(rowData);
    setEdit(true);
  };
  const handleCancelBill = async (id) => {
    try {
      const response = await cancelSaleBill(id, { status: "cancelled" });
      if (response.success === true) {
        setSnackbarMessage("Bill cancelled successfully!");
        setSnackbarOpen(true);
        fetchBills(); // Refresh the bill list after cancellation
      }
    } catch (error) {
      console.error("Error cancel bill:", error);
      setSnackbarMessage("Failed to cancel bill");
      setSnackbarOpen(true);
    }
  };
  return (
    <>
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" fontWeight={600}>
            Sale Summary
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={2} mr={4}>
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
              }}
              size="small"
              inputProps={{
                max: moment().format("YYYY-MM-DD"), // Disable future dates
              }}
              inputRef={dateInputRef}
            />

            <Button
              // accessKey="s"
              variant="contained"
              sx={{background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff" }}
              onClick={handleOpen}
            >
              Create Sale bill (Alt + S)
            </Button>
          </Box>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            maxWidth: 1200,
            margin: "5px auto",
            maxHeight: 550,
            overflowY: "auto",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: "#e0e0e0ff" }}>
                  <strong>#</strong>
                </TableCell>
                <TableCell sx={{ background: "#e0e0e0ff" }}>
                  <strong>Customer Name</strong>
                </TableCell>
                <TableCell sx={{ background: "#e0e0e0ff" }}>
                  <strong>Invoice No.</strong>
                </TableCell>
                <TableCell sx={{ background: "#e0e0e0ff" }}>
                  <strong>Bill Date</strong>
                </TableCell>
                <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                                  <strong>Bill Total (₹)</strong>
                                </TableCell>
                {/*<TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Received Amount (₹)</strong>
                </TableCell>
                 <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Balances Amount</strong>
                </TableCell>
                <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Status</strong>
                </TableCell>
                <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Balance Amount (₹)</strong>
                </TableCell>
                <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Notes</strong>
                </TableCell> */}
                {/* <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Payment Mode</strong>
                </TableCell>
                <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Transaction Number</strong>
                </TableCell> */}
                <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBills.map((bill, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{bill.bill_to?.first_name || "N/A"}</TableCell>
                  <TableCell>{bill.bill_number || "N/A"}</TableCell>
                  <TableCell>
                    {bill.billDate
                      ? moment(bill.billDate).format("DD/MM/YYYY")
                      : "--"}
                  </TableCell>
                  <TableCell align="center">
                                      {bill.grandTotal?.toFixed(2) || "0.00"}
                                    </TableCell>
                  {/* <TableCell align="center">
                    {bill.advance?.toFixed(2) || "0.00"}
                  </TableCell>
                   <TableCell align="center">
                    {bill.balance || "N/A"}
                  </TableCell>
                  <TableCell align="center">
                    {bill.balance > 0 ? (
                      <Chip
                        label="Pending Payment"
                        color="warning"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="Paid"
                        color="success"
                        size="small"
                      />
                    )}
                  </TableCell> */}
                  {/*<TableCell align="center">
                    {(
                      Number(bill.advance || 0) + Number(bill.fullPaid || 0)
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell align="center">
                    {bill.balance?.toFixed(2) || "0.00"}
                  </TableCell>
                  <TableCell align="center">{bill.notes}</TableCell> */}
                  {/* <TableCell align="center">
                    {bill.paymentType === "advance"
                      ? "Advance"
                      : bill.paymentType === "full"
                      ? "Full"
                      : "N/A"}
                  </TableCell> */}
                  {/* <TableCell align="center">
                    {bill.referenceId || "N/A"}
                  </TableCell> */}
                  <TableCell align="center" sx={{ width: "150px" }}>
                    <IconButton
                      color="inherit"
                      onClick={() => handleView(bill._id)}
                    >
                      <Visibility style={{ color: "#1976d2" }} />
                    </IconButton>
                    {/* <IconButton
                      color="inherit"
                      onClick={() => handleEditBill(bill)}
                    >
                      <EditIcon style={{ color: "#f57c00" }} />
                    </IconButton> */}
                    <IconButton
                      color="inherit"
                      onClick={() => handleCancelBill(bill._id)}
                    >
                      <CancelIcon style={{ color: "#d32f2f" }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals */}
              {/* <TableRow
                sx={{
                  position: "sticky",
                  bottom: 0,
                  zIndex: 1,
                  background: "#e0e0e0ff",
                  fontWeight: "bold",
                }}
              >
                <TableCell colSpan={3}>
                  <strong>Total Bills: {filteredBills.length}</strong>
                </TableCell>
                <TableCell align="center" colSpan={2}>
                  <strong>Total Amount: {totalBill.toFixed(2)}</strong>
                </TableCell>
                <TableCell align="center" colSpan={2}>
                  <strong>Total Paid: {totalPaid.toFixed(2)}</strong>
                </TableCell>
                <TableCell align="center" colSpan={3}>
                  <strong>Balance: {totalbal.toFixed(2)}</strong>
                </TableCell>
              </TableRow> */}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage === "Bill cancelled successfully!" ? "success" : "error"}
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <CreateSaleBill
        open={open}
        handleClose={handleClose}
        refresh={fetchBills}
      />
      <EditBill
        open={edit}
        data={editData}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchBills}
      />
      <ViewBill open={view} data={data} handleCloseView={handleCloseView} />
    </>
  );
};

export default SaleBillList;
