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
import { Visibility, WhatsApp } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import {
  cancelPurchaseBill,
  getAllPurchaseBills,
  getPurchaseBillById,
  getPurchaseBillByOrganization,
} from "../../services/PurchaseBillService";
import CreatePurchaseBill from "./CreatePurchaseBill";
import ViewBill from "./ViewBill";
import EditBill from "./EditBill";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import PaginationComponent from "../shared/PaginationComponent";
import { useNavigate } from "react-router-dom";
import CancelIcon from "@mui/icons-material/Cancel";
import PrintIcon from "@mui/icons-material/Print";
import GenerateBill from "../shared/GenerateBill";

const PurchaseBillList = () => {
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

  const purchaseInputRef = useRef(null);

  useEffect(() => {
    if (purchaseInputRef.current) {
      purchaseInputRef.current.focus();
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
        return bill.status === "draft" && bill.isReturn === false;
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
  const totalPaid = filteredBills.reduce(
    (acc, bill) => acc + Number(bill.advance || 0) + Number(bill.fullPaid || 0),
    0
  );
  const totalbal = filteredBills.reduce(
    (acc, bill) => acc + Number(bill.balance || 0),
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
    if (window.confirm("Are you sure you want to delete this bill?")) {
      try {
        const response = await cancelPurchaseBill(id, { status: "cancelled" });
        if (response.success === true) {
          setSnackbarMessage("Bill cancelled successfully!");
          setSnackbarOpen(true);
          fetchBills();
        }
      } catch (error) {
        console.error("Error cancel bill:", error);
        setSnackbarMessage("Failed to cancel bill");
        setSnackbarOpen(true);
      }
    }
  };

  const handleWhatsAppClick = (bill) => {
    const phoneNumber = bill.bill_to?.phone_number;

    if (!phoneNumber) {
      setSnackbarMessage("No phone number available for this supplier");
      setSnackbarOpen(true);
      return;
    }

    const message = `Dear ${bill.bill_to?.name || "Valued Supplier"},

This is a reminder regarding your pending payment for 
Balance Amount: ₹ ${bill.balance?.toFixed(2) || "0.00"}

Please complete the payment at your earliest convenience.

Thank you,
${mainUser?.organization_id?.name || "Our Company"}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  // Mobile Card View Component
  const MobileBillCard = ({ bill, index }) => (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              #{index + 1} • {bill.bill_number || "N/A"}
            </Typography>
            <Chip
              label={`₹${bill.grandTotal?.toFixed(2) || "0.00"}`}
              color="primary"
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
              Bill Date
            </Typography>
            <Typography variant="body1">
              {bill.billDate
                ? moment(bill.billDate).format("DD/MM/YYYY")
                : "--"}
            </Typography>
          </Box>

          {bill.balance > 0 && (
            <Box>
              <Chip
                label={`Balance: ₹${bill.balance?.toFixed(2) || "0.00"}`}
                color="warning"
                size="small"
                variant="outlined"
              />
            </Box>
          )}

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
              <strong>Bill Date</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Bill Total (₹)</strong>
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
                  No bills found for selected date
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
                  <Typography fontWeight={500}>
                    ₹{bill.grandTotal?.toFixed(2) || "0.00"}
                  </Typography>
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
              Purchase Summary
            </Typography>
            {filteredBills.length > 0 && (
              <Typography variant="body2" color="textSecondary" mt={0.5}>
                Total: {filteredBills.length} bills • Amount: ₹{totalBill.toFixed(2)}
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
                ref={purchaseInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Create Bill" : "Create Purchase Bill (Alt + P)"}
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
                  No bills found for selected date
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
            snackbarMessage === "Bill cancelled successfully!" ||
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
          <GenerateBill bill={printData} billName={"PURCHASE"} />
        </div>
      )}
    </>
  );
};

export default PurchaseBillList;