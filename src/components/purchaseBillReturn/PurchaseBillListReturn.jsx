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
  Box,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  Card,
  CardContent,
  Divider,
  Stack,
} from "@mui/material";
import moment from "moment";
import { Visibility } from "@mui/icons-material";
import {
  cancelPurchaseBill,
  getPurchaseBillByOrganization,
  getPurchaseBillById,
} from "../../services/PurchaseBillService";
import CreatePurchaseBill from "./CreatePurchaseReturn";
import ViewBill from "./ViewBill";
import EditBill from "./EditBill";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { useNavigate } from "react-router-dom";
import CancelIcon from "@mui/icons-material/Cancel";
import PrintIcon from "@mui/icons-material/Print";
import GenerateBill from "../shared/GenerateBill";

const PurchaseBillListReturn = () => {
  const { webuser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [mainUser, setMainUser] = useState();
  const [bills, setBills] = useState([]);
  const [data, setData] = useState();
  const [editData, setEditData] = useState();
  const [view, setView] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [printData, setPrintData] = useState();
  const [showPrint, setShowPrint] = useState(false);
  const [mobileViewDialog, setMobileViewDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const purchaseReturnInputRef = useRef(null);

  useEffect(() => {
    if (purchaseReturnInputRef.current) {
      purchaseReturnInputRef.current.focus();
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
    if (data.success === true) {
      const allBills = data.data.docs || [];

      const FilteredBill = allBills.filter((bill) => {
        return bill.status === "draft" && bill.isReturn === true;
      });

      setBills(FilteredBill);
    }
  };

  const handleCloseEdit = () => setEdit(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseView = () => setView(false);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      if (!bill.billDate) return false;
      const billDate = new Date(bill.billDate);
      const selectedDate = startDate ? new Date(startDate) : null;

      if (!selectedDate) return true;

      billDate.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      return billDate.getTime() === selectedDate.getTime();
    });
  }, [bills, startDate]);

  const totalBill = filteredBills.reduce(
    (acc, bill) => acc + (bill.grandTotal || 0),
    0
  );

  const handleView = async (billId) => {
    try {
      if (isMobile) {
        const response = await getPurchaseBillById(billId);
        setSelectedBill(response.data);
        setMobileViewDialog(true);
      } else {
        setData(billId);
        setView(true);
      }
    } catch (error) {
      console.error("Error viewing bill:", error);
      setSnackbarMessage("Failed to load bill details");
      setSnackbarOpen(true);
    }
  };

  const handleEditBill = (rowData) => {
    setEditData(rowData);
    setEdit(true);
  };

  const handlePrint = async (bill) => {
    try {
      const res = await getPurchaseBillById(bill._id);

      setPrintData(res.data);
      setShowPrint(true);
      setTimeout(() => {
        window.print();
        setShowPrint(false);
      }, 500);
    } catch (error) {
      console.error("Error printing bill:", error);
      setSnackbarMessage("Failed to load bill for printing");
      setSnackbarOpen(true);
    }
  };

  const handleCancelBill = async (id) => {
    if (window.confirm("Are you sure you want to delete this return bill?")) {
      try {
        const response = await cancelPurchaseBill(id, { status: "cancelled" });
        if (response.success === true) {
          setSnackbarMessage("Return bill cancelled successfully!");
          setSnackbarOpen(true);
          fetchBills();
        }
      } catch (error) {
        console.error("Error cancel bill:", error);
        setSnackbarMessage("Failed to cancel return bill");
        setSnackbarOpen(true);
      }
    }
  };

  // Mobile Card View Component
  const MobileBillCard = ({ bill, index }) => (
    <Card sx={{ mb: 2, boxShadow: 2, borderLeft: "4px solid #d32f2f" }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              #{index + 1} • {bill.bill_number || "N/A"}
            </Typography>
            <Chip
              label={`₹${bill.grandTotal?.toFixed(2) || "0.00"}`}
              color="error"
              size="small"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Supplier
            </Typography>
            <Typography variant="body1" noWrap>
              {bill.bill_to?.name || "N/A"}
            </Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Return Date
            </Typography>
            <Typography variant="body1">
              {bill.billDate
                ? moment(bill.billDate).format("DD/MM/YYYY")
                : "--"}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center">
            <Chip
              label="RETURN"
              color="error"
              size="small"
              sx={{ mr: 1 }}
            />
            <Typography variant="caption" color="textSecondary">
              Amount deducted from supplier balance
            </Typography>
          </Box>

          <Divider />

          <Box display="flex" justifyContent="space-between" mt={1}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleView(bill._id)}
              title="View"
            >
              <Visibility fontSize="small" />
            </IconButton>
            <IconButton
              color="success"
              size="small"
              onClick={() => handlePrint(bill)}
              title="Print"
            >
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleCancelBill(bill._id)}
              title="Cancel"
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: 550,
        overflowY: "auto",
        [theme.breakpoints.down("md")]: {
          maxHeight: 500,
        },
      }}
    >
      <Table stickyHeader size={isTablet ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>#</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Supplier Name</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Invoice No.</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Return Date</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Return Amount (₹)</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Status</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredBills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  No return bills found for selected date
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            filteredBills.map((bill, index) => (
              <TableRow key={bill._id || index} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                    {bill.bill_to?.name || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>{bill.bill_number || "N/A"}</TableCell>
                <TableCell>
                  {bill.billDate
                    ? moment(bill.billDate).format("DD/MM/YYYY")
                    : "--"}
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={500} color="error">
                    ₹{bill.grandTotal?.toFixed(2) || "0.00"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label="RETURN"
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleView(bill._id)}
                      title="View"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="success"
                      size="small"
                      onClick={() => handlePrint(bill)}
                      title="Print"
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleCancelBill(bill._id)}
                      title="Cancel"
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" fontWeight={600}>
              Purchase Return Summary
            </Typography>
            {filteredBills.length > 0 && (
              <Typography variant="body2" color="error" mt={0.5}>
                Total: {filteredBills.length} return bills • Amount: ₹{totalBill.toFixed(2)}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={2} 
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <TextField
                label="Select Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                fullWidth={isMobile}
                sx={{ 
                  minWidth: { xs: "100%", sm: 180 },
                  maxWidth: { xs: "100%", sm: 200 }
                }}
                inputProps={{
                  max: moment().format("YYYY-MM-DD"),
                }}
              />
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg,  #182848, #324b84ff)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    background: "linear-gradient(135deg, #b71c1c, #ff5252)",
                  },
                }}
                onClick={handleOpen}
                ref={purchaseReturnInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Create Return" : "Create Purchase Return (Alt + P + R)"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {isMobile ? (
          <Box>
            {filteredBills.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight={200}
              >
                <Typography color="textSecondary">
                  No return bills found for selected date
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                {filteredBills.map((bill, index) => (
                  <MobileBillCard key={bill._id || index} bill={bill} index={index} />
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <DesktopTableView />
        )}
      </Box>

      {/* Mobile View Dialog */}
      <Dialog
        open={mobileViewDialog}
        onClose={() => setMobileViewDialog(false)}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedBill && (
            <ViewBill 
              open={mobileViewDialog}
              data={selectedBill._id} 
              handleCloseView={() => setMobileViewDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage === "Return bill cancelled successfully!" ||
            snackbarMessage.includes("successfully")
              ? "success"
              : snackbarMessage.includes("expired")
                ? "warning"
                : "error"
          }
          variant="filled"
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      <CreatePurchaseBill
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
      {showPrint && printData && (
        <div className="print-only">
          <GenerateBill bill={printData} billName={"PURCHASE RETURN"} />
        </div>
      )}
    </>
  );
};

export default PurchaseBillListReturn;