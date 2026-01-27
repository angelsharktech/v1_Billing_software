import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  Grid,
  TextField,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddCustomer from "./AddCustomer";
import { getAllUser, getUserById, updateUser } from "../../services/UserService";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import EditCustomer from "./EditCustomer";
import PaginationComponent from "../shared/PaginationComponent";
import { useAuth } from "../../context/AuthContext";

const CustomerList = () => {
  const { webuser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [user, setUser] = useState([]);
  const [mainUser, setMainUser] = useState();
  const [roles, setRoles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  
  const customerInputRef = useRef(null);

  useEffect(() => {
    if (customerInputRef.current) {
      customerInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [posData, roleData, user] = await Promise.all([
          getAllPositions(),
          getAllRoles(),
          getUserById(webuser.id),
        ]);
        setPositions(posData);
        setRoles(roleData);
        setMainUser(user);
      } catch (err) {
        console.error("Failed to fetch form data:", err);
        setSnackbarMessage("Failed to load data");
        setSnackbarOpen(true);
      }
    };
    fetchAll();
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (roles && roles.length > 0 && mainUser) {
      fetchUsers();
    }
  }, [roles, mainUser]);
  
  const fetchUsers = async () => {
    try {
      const data = await getAllUser();
      setUser(data);

      const customerRole = roles.find(
        (r) => r.name?.toLowerCase() === "customer"
      );
      
      if (customerRole && mainUser) {
        const customersOnly = data.filter(
          (u) =>
            u.role_id?._id === customerRole?._id &&
            u.status === "active" &&
            u.organization_id?._id === mainUser.organization_id?._id
        );

        setFilteredCustomers(customersOnly);
        setCurrentPage(1); // Reset to first page when data changes
      }
    } catch (error) {
      console.error("Error fetching customer data", error);
      setSnackbarMessage("Failed to load customers");
      setSnackbarOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  const filteredCustomer = useMemo(() => {
    return filteredCustomers?.filter(
      (cust) =>
        cust.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        cust.address?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        cust.city?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        cust.phone_number?.includes(searchQuery?.toLowerCase())
    );
  }, [filteredCustomers, searchQuery]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  useEffect(() => {
    if (filteredCustomer) {
      setTotalPages(Math.ceil(filteredCustomer.length / pageSize));
    }
  }, [filteredCustomer]);
  
  const paginatedCustomers = filteredCustomer?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleEdit = (rowData) => {
    setData(rowData);
    setEdit(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        const updatedUser = {
          status: "inactive",
        };
        const res = await updateUser(id, updatedUser);

        if (res) {
          setSnackbarMessage("Customer Deleted!");
          setSnackbarOpen(true);
          fetchUsers(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting Customer", error);
        setSnackbarMessage("Failed to delete customer");
        setSnackbarOpen(true);
      }
    }
  };

  // Mobile Card View Component - NOT clickable
  const MobileCustomerCard = ({ customer, index }) => (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        // Removed hover cursor style to indicate non-clickable
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                #{index + 1} • {customer.name || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {customer.phone_number || "No contact"}
              </Typography>
            </Box>
            <Chip
              label={`₹${customer?.openingAmount?.toFixed(2) || "0.00"}`}
              color="primary"
              size="small"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Address
            </Typography>
            <Typography variant="body1" noWrap>
              {customer.address || "N/A"}, {customer.city || ""}
            </Typography>
          </Box>

          <Divider />

          {/* Action Buttons */}
          <Box display="flex" justifyContent="space-between" mt={1}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(customer)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDelete(customer._id)}
            >
              <DeleteIcon fontSize="small" />
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
              <strong>Customer Name</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Contact Number</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Address</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Closing Balance (₹)</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedCustomers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  {searchQuery ? 'No customers found for your search' : 'No customers available'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedCustomers.map((customer, index) => (
              <TableRow key={customer._id} hover>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 150 }}>
                    {customer.name || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {customer.phone_number || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {customer.address || "N/A"} {customer.city || ""}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={500}>
                    ₹{customer?.openingAmount?.toFixed(2) || "0.00"}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEdit(customer)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(customer._id)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
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
              Customers
            </Typography>
            {paginatedCustomers.length > 0 && (
              <Typography variant="body2" color="textSecondary" mt={0.5}>
                Total: {filteredCustomer.length} customers • Showing {paginatedCustomers.length} on this page
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
                placeholder="Search customers..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                fullWidth={isMobile}
                sx={{ 
                  minWidth: { xs: "100%", sm: 300 },
                  maxWidth: { xs: "100%", sm: 400 },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.875rem',
                    padding: '8.5px 14px',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
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
                ref={customerInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Add Customer" : "Add Customer (Alt + C)"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {isMobile ? (
          <Box>
            {paginatedCustomers.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight={200}
              >
                <Typography color="textSecondary">
                  {searchQuery ? 'No customers found for your search' : 'No customers available'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                {paginatedCustomers.map((customer, index) => (
                  <MobileCustomerCard 
                    key={customer._id} 
                    customer={customer} 
                    index={(currentPage - 1) * pageSize + index} 
                  />
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <DesktopTableView />
        )}
      </Box>

      {/* Removed mobile view dialog since cards are not clickable */}

      {/* Pagination */}
      {filteredCustomer && filteredCustomer.length > 0 && totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', px: { xs: 1, sm: 2 } }}>
          <PaginationComponent
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            size={isMobile ? "small" : "medium"}
          />
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage === "Customer Deleted!" ? "error" : "success"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
          sx={{ 
            width: '100%',
            fontSize: '0.875rem'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <AddCustomer open={open} handleClose={handleClose} refresh={fetchUsers} />

      <EditCustomer
        open={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchUsers}
      />
    </>
  );
};

export default CustomerList;