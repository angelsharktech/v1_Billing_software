import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterData from "../shared/FilterData";
import AddCustomer from "./AddCustomer";
import { getAllUser, getUserById, updateUser } from "../../services/UserService";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import EditCustomer from "./EditCustomer";
import PaginationComponent from "../shared/PaginationComponent";
import { useAuth } from "../../context/AuthContext";

const CustomerList = () => {
  const { webuser } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [positions, setPositions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [data, setData] = useState();
  const [edit, setEdit] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [mainUser, setMainUser] = useState();
  const pageSize = 6;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
      }
    };
    fetchAll();
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (roles && roles.length > 0) {
      fetchUsers();
    }
  }, [roles]);
  
  const fetchUsers = async () => {
    try {
      const data = await getAllUser();
      setUser(data);

      const customerRole = roles.find(
        (r) => r.name.toLowerCase() === "customer"
      );
      
      if (customerRole) {
        const customersOnly = data.filter(
          (u) =>
            u.role_id?._id === customerRole?._id &&
            u.status === "active" &&
            u.organization_id?._id === mainUser.organization_id?._id
        );

        setFilteredCustomers(customersOnly);
      }
    } catch (error) {
      console.error("Error fetching product data", error);
    }
  };

  // Search bar code
  const filteredCustomer = filteredCustomers?.filter(
    (cust) =>
      cust.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cust.phone_number?.includes(searchQuery.toLowerCase())
  );
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  // --------------end of search
  
  useEffect(() => {
    if (filteredCustomer) {
      setTotalPages(Math.ceil(filteredCustomer.length / pageSize));
    }
  }, [filteredCustomer]);
  
  const paginatedCustomers = filteredCustomer?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  const handleEdit = (rowData) => {
    setData(rowData);
    setEdit(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this Customer?")) {
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
        alert("Failed to delete Customer.");
      }
    }
  };

  // Mobile-friendly customer card component
  const MobileCustomerCard = ({ customer }) => (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {customer.first_name} {customer.last_name}
        </Typography>
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(customer)}
            sx={{ mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(customer._id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <strong>Contact:</strong> {customer.phone_number}
      </Typography>
      <Typography variant="body2">
        <strong>Address:</strong> {customer.address} {customer.city}
      </Typography>
    </Paper>
  );
  
  return (
    <>
      <Box sx={{ p: isExtraSmallScreen ? 1 : 2 }}>
        <Box
          display="flex"
          flexDirection={isSmallScreen ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isSmallScreen ? "flex-start" : "center"}
          mb={2}
          gap={isSmallScreen ? 2 : 0}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={600}>
            Customers
          </Typography>
          
          {/* Combined search and button container */}
          <Box 
            display="flex" 
            flexDirection={isSmallScreen ? "column" : "row"} 
            alignItems={isSmallScreen ? "stretch" : "center"}
            gap={2}
            width={isSmallScreen ? "100%" : "auto"}
          >
            <Box flexGrow={1} width={isSmallScreen ? "100%" : "auto"}>
              <FilterData 
                value={searchQuery} 
                onChange={handleSearchChange} 
                fullWidth={isSmallScreen}
                autoFocusOnMount
              />
            </Box>
            <Button
              variant="contained"
              sx={{ 
                background: "linear-gradient(135deg, #182848, #324b84ff)", 
                color: "#fff",
                whiteSpace: 'nowrap',
                width: isSmallScreen ? "100%" : "auto"
              }}
              onClick={handleOpen}
            >
              {isSmallScreen ? "Add Customer" : "Add Customer (alt+c)"}
            </Button>
          </Box>
        </Box>

        {isSmallScreen ? (
          // Mobile view with cards
          <Box>
            {paginatedCustomers.map((customer) => (
              <MobileCustomerCard key={customer._id} customer={customer} />
            ))}
          </Box>
        ) : (
          // Desktop view with table
          <TableContainer
            component={Paper}
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: "lightgrey" }}>
                <TableRow>
                  <TableCell>
                    <strong>Name</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Contact Number</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Address</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Closing Balance</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCustomers.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell>
                      {customer.first_name} {customer.last_name}
                    </TableCell>
                    <TableCell>{customer.phone_number}</TableCell>
                    <TableCell>{customer.address}  {customer.city}</TableCell>
                    <TableCell>{customer.openingAmount}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(customer)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(customer._id)}
                      >
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage === "Customer Deleted!" ? "success" : "error"
          }
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
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

      {filteredCustomer && filteredCustomer.length > 0 && (
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
};

export default CustomerList;