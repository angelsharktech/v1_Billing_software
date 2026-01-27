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
  Dialog,
  DialogContent,
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
import AddVendor from "./AddVendor";
import { getAllPositions } from "../../services/Position";
import { getAllRoles } from "../../services/Role";
import { getAllUser, getUserById, updateUser } from "../../services/UserService";
import EditVendor from "./EditVendor";
import PaginationComponent from "../shared/PaginationComponent";
import { useAuth } from "../../context/AuthContext";

const VendorList = () => {
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
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [positions, setPositions] = useState([]);
  const [user, setUser] = useState([]);
  const [mainUser, setMainUser] = useState();
  const [roles, setRoles] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileViewDialog, setMobileViewDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const pageSize = 6;
  
  const vendorInputRef = useRef(null);

  useEffect(() => {
    if (vendorInputRef.current) {
      vendorInputRef.current.focus();
    }
  }, []);

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

      const vendorRole = roles.find((r) => r.name?.toLowerCase() === "vendor");
      if (vendorRole && mainUser) {
        const vendorsOnly = data.filter(
          (u) => u.role_id?._id === vendorRole?._id && 
                 u.status === "active" && 
                 u.organization_id?._id === mainUser.organization_id?._id
        );
        setFilteredVendors(vendorsOnly);
        setCurrentPage(1); // Reset to first page when data changes
      }
    } catch (error) {
      console.error("Error fetching product data", error);
      setSnackbarMessage("Failed to load suppliers");
      setSnackbarOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  const filteredvendor = useMemo(() => {
    return filteredVendors?.filter(
      (ven) =>
        ven.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        ven.address?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        ven.city?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        ven.phone_number?.includes(searchQuery?.toLowerCase())
    );
  }, [filteredVendors, searchQuery]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
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
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        const updatedUser = {
          status: "inactive",
        };
        const res = await updateUser(id, updatedUser);

        if (res) {
          setSnackbarMessage("Supplier Deleted!");
          setSnackbarOpen(true);
          fetchUsers(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting vendor", error);
        setSnackbarMessage("Failed to delete supplier");
        setSnackbarOpen(true);
      }
    }
  };

  const handleViewVendor = (vendor) => {
    if (isMobile) {
      setSelectedVendor(vendor);
      setMobileViewDialog(true);
    }
  };

  // Mobile Card View Component
  const MobileVendorCard = ({ vendor, index }) => (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        '&:hover': {
          boxShadow: 4,
          cursor: 'pointer'
        }
      }}
      onClick={() => handleViewVendor(vendor)}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                #{index + 1} • {vendor.name || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {vendor.phone_number || "No contact"}
              </Typography>
            </Box>
            <Chip
              label={`₹${vendor?.openingAmount?.toFixed(2) || "0.00"}`}
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
              {vendor.address || "N/A"}, {vendor.city || ""}
            </Typography>
          </Box>

          <Divider />

          <Box display="flex" justifyContent="space-between" mt={1}>
            <IconButton
              color="primary"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(vendor);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(vendor._id);
              }}
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
              <strong>Supplier Name</strong>
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
          {paginatedVendors.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  {searchQuery ? 'No suppliers found for your search' : 'No suppliers available'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedVendors.map((vendor, index) => (
              <TableRow key={vendor._id} hover>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 150 }}>
                    {vendor.name || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {vendor.phone_number || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200 }}>
                    {vendor.address || "N/A"} {vendor.city || ""}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={500}>
                    ₹{vendor?.openingAmount?.toFixed(2) || "0.00"}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEdit(vendor)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(vendor._id)}
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
              Suppliers
            </Typography>
            {paginatedVendors.length > 0 && (
              <Typography variant="body2" color="textSecondary" mt={0.5}>
                Total: {filteredvendor.length} suppliers • Showing {paginatedVendors.length} on this page
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
                placeholder="Search suppliers..."
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
                ref={vendorInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Add Supplier" : "Add Supplier (Alt + L)"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {isMobile ? (
          <Box>
            {paginatedVendors.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight={200}
              >
                <Typography color="textSecondary">
                  {searchQuery ? 'No suppliers found for your search' : 'No suppliers available'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                {paginatedVendors.map((vendor, index) => (
                  <MobileVendorCard 
                    key={vendor._id} 
                    vendor={vendor} 
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

      {/* Mobile View Dialog */}
      <Dialog
        open={mobileViewDialog}
        onClose={() => setMobileViewDialog(false)}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogContent>
          {selectedVendor && (
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedVendor.name}
                  </Typography>
                  
                  <Divider />
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Contact Number
                    </Typography>
                    <Typography variant="body1">
                      {selectedVendor.phone_number || "N/A"}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Address
                    </Typography>
                    <Typography variant="body1">
                      {selectedVendor.address || "N/A"}
                      {selectedVendor.city && `, ${selectedVendor.city}`}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Closing Balance
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ₹{selectedVendor?.openingAmount?.toFixed(2) || "0.00"}
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => handleEdit(selectedVendor)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="contained" 
                      color="error"
                      onClick={() => {
                        handleDelete(selectedVendor._id);
                        setMobileViewDialog(false);
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {filteredvendor && filteredvendor.length > 0 && totalPages > 1 && (
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
          severity={snackbarMessage === "Supplier Deleted!" ? "error" : "success"}
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

      <AddVendor open={open} handleClose={handleClose} refresh={fetchUsers} />
      <EditVendor
        open={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchUsers}
      />
    </>
  );
};

export default VendorList;