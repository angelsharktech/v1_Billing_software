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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterData from "../shared/FilterData";
import AddVendor from "./AddVendor";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import { getAllUser, getUserById, updateUser } from "../../services/UserService";
import EditVendor from "./EditVendor";
import PaginationComponent from "../shared/PaginationComponent";
import { useAuth } from "../../context/AuthContext";

const VendorList = () => {
  const { webuser } = useAuth();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState();
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [positions, setPositions] = useState([]);
  const [user, setUser] = useState([]);
  const [mainUser, setMainUser] = useState();
  const [roles, setRoles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
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
          getUserById(webuser.id)
        ]);
        setPositions(posData);
        setRoles(roleData);
        setMainUser(user)
      } catch (err) {
        console.error("Failed to fetch form data:", err);
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

      const vendorRole = roles.find((r) => r.name.toLowerCase() === "vendor");
      if (vendorRole && mainUser) {
        const vendorsOnly = data.filter(
          (u) => u.role_id?._id === vendorRole?._id && 
                 u.status === "active" && 
                 u.organization_id?._id === mainUser.organization_id?._id
        );
        setFilteredVendors(vendorsOnly);
      }
    } catch (error) {
      console.error("Error fetching product data", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  const filteredvendor = filteredVendors?.filter(
    (ven) =>
      ven.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ven.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ven.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ven.phone_number?.includes(searchQuery.toLowerCase())
  );
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  useEffect(() => {
    if (filteredvendor) {
      setTotalPages(Math.ceil(filteredvendor.length / pageSize));
    }
  }, [filteredvendor]);
  
  const paginatedVendors = filteredvendor?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleEdit = (rowData) => {
    setData(rowData);
    setEdit(true);
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      try {
        const updatedUser = {
          status: "inactive",
        };
        const res = await updateUser(id, updatedUser);

        if (res) {
          setSnackbarMessage("Vendor Deleted!");
          setSnackbarOpen(true);
          fetchUsers(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting vendor", error);
        alert("Failed to delete vendor.");
      }
    }
  };

  // Mobile-friendly table view
  const MobileVendorCard = ({ vendor }) => (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {vendor.first_name} {vendor.last_name}
        </Typography>
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(vendor)}
            sx={{ mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(vendor._id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        <strong>Contact:</strong> {vendor.phone_number}
      </Typography>
      <Typography variant="body2">
        <strong>Address:</strong> {vendor.address} {vendor.city}
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
            Suppliers
          </Typography>
          
          {/* Combined search and button container */}
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
                onChange={handleSearchChange} 
                fullWidth={isSmallScreen}
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
              {isSmallScreen ? "Add Supplier" : "Add Supplier(alt+l)"}
            </Button>
          </Box>
        </Box>

        {isSmallScreen ? (
          // Mobile view with cards
          <Box>
            {paginatedVendors.map((vendor) => (
              <MobileVendorCard key={vendor._id} vendor={vendor} />
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
                {paginatedVendors.map((vendor) => (
                  <TableRow key={vendor._id}>
                    <TableCell>
                      {vendor.first_name} {vendor.last_name}
                    </TableCell>
                    <TableCell>{vendor.phone_number}</TableCell>
                    <TableCell>{vendor.address}  {vendor.city}</TableCell>
                    <TableCell>{vendor?.openingAmount}</TableCell>
                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(vendor)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(vendor._id)}
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
          severity={snackbarMessage === "Vendor Deleted!" ? "error" : "success"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <AddVendor open={open} handleClose={handleClose} refresh={fetchUsers} />
      <EditVendor
        open={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchUsers}
      />
      
      {filteredvendor && filteredvendor.length > 0 && (
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
};

export default VendorList;