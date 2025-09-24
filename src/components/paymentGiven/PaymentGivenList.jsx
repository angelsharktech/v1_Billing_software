import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Button,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Dialog,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PaginationComponent from "../shared/PaginationComponent";
import FilterData from "../shared/FilterData";
import { getPaymentByOrganization } from "../../services/PaymentModeService";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";
import AddPaymentGiven from "./AddPaymentGiven";

const PaymentGivenList = ({ organizationId }) => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const pageSize = 5;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getUserById(webuser.id);
      setMainUser(res);
    };
    fetchUser();
  }, [webuser]);

  // 🔄 refresh function to fetch payments
  const refresh = async () => {
    if (!mainUser?.organization_id?._id) return;
    try {
      const data = await getPaymentByOrganization(mainUser.organization_id._id);
       const bills = data.data.filter((bill)=> bill.forPayment === 'purchase')
      
      setRows(bills || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  useEffect(() => {
    refresh();
  }, [mainUser]);

  const filteredPayments = rows?.filter(
    
    (row) =>
      row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(row.advanceAmount).includes(searchQuery) ||
      // row.date?.includes(searchQuery) || 
      row.purchasebill?.bill_number?.includes(searchQuery)
  );
  useEffect(() => {
    if (filteredPayments) {
      setTotalPages(Math.ceil(filteredPayments.length / pageSize));
    }
  }, [filteredPayments]);

  const paginatedPayments = filteredPayments?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedRows = rows.filter((row) => row._id !== id);
      setRows(updatedRows);
      setSnackbarMessage("Payment record deleted!");
      setSnackbarOpen(true);
    }
  };

  // ✅ after adding payment, call refresh instead of just pushing
  const handlePaymentAdded = () => {
    refresh();
    setSnackbarMessage("Payment added successfully!");
    setSnackbarOpen(true);
  };

  // Mobile-friendly card
  const MobilePaymentCard = ({ payment }) => (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            Payment Mode: {payment.paymentType}
          </Typography>
          <Typography variant="body2">
            Date: {new Date(payment.date).toLocaleDateString()}
          </Typography>
          <Typography variant="body2">Advance: ₹ {payment.advanceAmount}</Typography>
        </Box>
        <IconButton size="small" color="error" onClick={() => handleDelete(payment._id)}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );

  return (
    <>
      <Box sx={{ p: isExtraSmallScreen ? 1 : 3 }}>
        {/* Header */}
        <Box
          display="flex"
          flexDirection={isSmallScreen ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isSmallScreen ? "flex-start" : "center"}
          mb={2}
          gap={isSmallScreen ? 2 : 0}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={600}>
            Payment Given List
          </Typography>

          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            alignItems={isSmallScreen ? "stretch" : "center"}
            gap={2}
            width={isSmallScreen ? "100%" : "auto"}
          >
            <Box flexGrow={1} width={isSmallScreen ? "100%" : "auto"} mt={2}>
              <FilterData
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth={isSmallScreen}
                autoFocusOnMount
              />
            </Box>
            <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
                whiteSpace: "nowrap",
                width: isSmallScreen ? "100%" : "auto",
              }}
              onClick={() => setOpenDialog(true)}
            >
              Add Payment
            </Button>
          </Box>
        </Box>

        {/* Table / Cards */}
        {isSmallScreen ? (
          <Box>
            {paginatedPayments?.map((payment) => (
              <MobilePaymentCard key={payment._id} payment={payment} />
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={3} sx={{ height: "422px" }}>
            <Table>
              <TableHead sx={{ backgroundColor: "lightgrey" }}>
                <TableRow>
                   <TableCell align="center">
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Supplier Name</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Payment Mode</strong>
                  </TableCell>
                 
                  <TableCell align="center">
                    <strong>Amount</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedPayments?.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell align="center">
                      {row.date ? new Date(row.date).toLocaleDateString() : "--"}
                    </TableCell>
                    <TableCell align="center">
                      {row.client_id?.first_name + " " +( row.client_id?.last_name ? row.client_id?.last_name : "") || ''}
                    </TableCell>
                    <TableCell align="center">{row.paymentType}</TableCell>
                    <TableCell align="center">₹ {row.balance > 0 ? row.balance : row.advanceAmount  || 0}</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => handleDelete(row._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Pagination */}
      {filteredPayments && filteredPayments.length > 0 && (
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      {/* Add Payment Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <AddPaymentGiven
          onClose={() => setOpenDialog(false)}
          onPaymentAdded={handlePaymentAdded}
          organizationId={mainUser?.organization_id?._id}
          webuser={webuser}
        />
      </Dialog>
    </>
  );
};

export default PaymentGivenList;
