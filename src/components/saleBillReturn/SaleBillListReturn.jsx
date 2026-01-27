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
  Snackbar,
  Alert,
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
import {
  cancelSaleBill,
  getSaleBillByOrganization,
  getSaleBillById,
} from "../../services/SaleBillService";
import CreateSaleBill from "./CreateSaleReturn";
import { Visibility, Cancel, Print } from "@mui/icons-material";
import ViewBill from "./ViewBill";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { useNavigate } from "react-router-dom";
import GenerateBill from "../shared/GenerateBill";

const SaleBillList = () => {
  const { webuser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [mainUser, setMainUser] = useState(null);
  const [bills, setBills] = useState([]);
  const [data, setData] = useState();
  const [view, setView] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [printData, setPrintData] = useState();
  const [showPrint, setShowPrint] = useState(false);
  const [mobileViewDialog, setMobileViewDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  const saleReturnInputRef = useRef(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseView = () => setView(false);

  useEffect(() => {
    if (saleReturnInputRef.current) {
      saleReturnInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (webuser?.id) {
        const user = await getUserById(webuser.id);
        setMainUser(user);
      }
    };
    fetchUser();
  }, [webuser]);

  useEffect(() => {
    if (mainUser) {
      fetchBills();
    }
  }, [mainUser]);

  const fetchBills = async () => {
    if (!mainUser) return;

    try {
      const data = await getSaleBillByOrganization(
        mainUser?.organization_id?._id
      );

      if (data.status === 401) {
        setSnackbarMessage("Your Session is expired. Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => {
          navigate("/login");
        }, 2000);
        return;
      }

      if (data.success === true) {
        const allBills = data.data.docs || [];
        const FilteredBill = allBills.filter((bill) => {
          return bill.status === "draft" && bill.isReturn === true;
        });
        setBills(FilteredBill);
      }
    } catch (error) {
      console.error("Error fetching return bills:", error);
      setSnackbarMessage("Failed to fetch return bills");
      setSnackbarOpen(true);
    }
  };

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
        const response = await getSaleBillById(billId);
        setSelectedBill(response.data);
        setMobileViewDialog(true);
      } else {
        setData(billId);
        setView(true);
      }
    } catch (error) {
      console.error("Error viewing return bill:", error);
      setSnackbarMessage("Failed to load return bill details");
      setSnackbarOpen(true);
    }
  };

  const handlePrint = async (bill) => {
    try {
      const res = await getSaleBillById(bill._id);
      if (res.data) {
        setPrintData(res.data);
        setShowPrint(true);
        setTimeout(() => {
          window.print();
          setShowPrint(false);
        }, 500);
      }
    } catch (error) {
      console.error("Error printing return bill:", error);
      setSnackbarMessage("Failed to load return bill for printing");
      setSnackbarOpen(true);
    }
  };

  const handleCancelBill = async (id) => {
    if (window.confirm("Are you sure you want to cancel this return bill?")) {
      try {
        const response = await cancelSaleBill(id, { status: "cancelled" });
        if (response.success === true) {
          setSnackbarMessage("Return bill cancelled successfully!");
          setSnackbarOpen(true);
          fetchBills();
        } else {
          throw new Error(response.message || "Failed to cancel return bill");
        }
      } catch (error) {
        console.error("Error canceling return bill:", error);
        setSnackbarMessage("Failed to cancel return bill");
        setSnackbarOpen(true);
      }
    }
  };

  // Mobile Card View Component for Return Bills
  const MobileReturnBillCard = ({ bill, index }) => (
    <Card sx={{
      mb: 2,
      boxShadow: 2,
      borderLeft: '4px solid',
      borderColor: 'error.main'
    }}>
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
              variant="outlined"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Customer
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

          {bill.notes && (
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Notes
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {bill.notes}
              </Typography>
            </Box>
          )}

          <Divider />

          <Box display="flex" justifyContent="space-between" mt={1}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleView(bill._id)}
              title="View Details"
            >
              <Visibility fontSize="small" />
            </IconButton>
            <IconButton
              color="success"
              size="small"
              onClick={() => handlePrint(bill)}
              title="Print"
            >
              <Print fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleCancelBill(bill._id)}
              title="Cancel Return"
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Desktop Table View for Return Bills
  const DesktopReturnTableView = () => (
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
              <strong>Customer Name</strong>
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
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredBills.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                  <Chip
                    label={`₹${bill.grandTotal?.toFixed(2) || "0.00"}`}
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
                      title="View Details"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="success"
                      size="small"
                      onClick={() => handlePrint(bill)}
                      title="Print Return"
                    >
                      <Print fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleCancelBill(bill._id)}
                      title="Cancel Return"
                    >
                      <Cancel fontSize="small" />
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
              Sale Return Summary
            </Typography>
            {filteredBills.length > 0 && (
              <Typography variant="body2" color="textSecondary" mt={0.5}>
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
                  background: "linear-gradient(135deg, #182848, #324b84ff)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                }}
                onClick={handleOpen}
                ref={saleReturnInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Create Return" : "Create Sale Return (Alt + S + R)"}
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
                  <MobileReturnBillCard key={bill._id || index} bill={bill} index={index} />
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <DesktopReturnTableView />
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
            snackbarMessage === "Return bill cancelled successfully!"
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

      <CreateSaleBill
        open={open}
        handleClose={handleClose}
        refresh={fetchBills}
      />
      <ViewBill
        open={view}
        data={data}
        handleCloseView={handleCloseView}
      />

      {showPrint && printData && (
        <div className="print-only">
          <GenerateBill bill={printData} billName={"RETURN"} />
        </div>
      )}
    </>
  );
};

export default SaleBillList;