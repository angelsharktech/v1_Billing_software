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
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import { deleteIncome, getAllIncomesByOrganization } from "../../services/IncomeService";
import CreateIncome from "./CreateIncome";
import EditIncome from "./EditIncome";
import PaginationComponent from "../shared/PaginationComponent";
import { exportToExcel, exportToPDF } from "../shared/Export";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import moment from "moment";

const exportColumns = [
  { label: "Date", key: "date" },
  { label: "Income Name", key: "name" },
  { label: "Amount", key: "amount" },
  { label: "Income Type", key: "groupOfIncome" },
  { label: "Description", key: "description" },
];

const IncomeList = () => {
  const { webuser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mainUser, setMainUser] = useState();
  const [incomes, setIncomes] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState();
  const [edit, setEdit] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const openExportMenu = Boolean(anchorEl);
  const pageSize = 6;
  
  const incomeInputRef = useRef(null);

  useEffect(() => {
    if (incomeInputRef.current) {
      incomeInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    fetchIncomes();
  }, []);
  
  const fetchIncomes = async () => {
    try {
      const result = await getUserById(webuser.id);
      setMainUser(result);

      const response = await getAllIncomesByOrganization(
        result?.organization_id?._id
      );
      
      setIncomes(response.data || []);
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error fetching income data", error);
      setSnackbarMessage("Failed to load incomes");
      setSnackbarOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  const handleEdit = (rowData) => {
    setData(rowData);
    setEdit(true);
  };
  
  const handleDeleteClick = (id) => {
    setIncomeToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (incomeToDelete) {
      try {
        const res = await deleteIncome(incomeToDelete);
        if (res) {
          setSnackbarMessage("Income Deleted!");
          setSnackbarOpen(true);
          fetchIncomes();
        }
      } catch (error) {
        console.error("Error deleting income", error);
        setSnackbarMessage("Failed to delete income.");
        setSnackbarOpen(true);
      }
    }
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const filteredIncomes = useMemo(() => {
    return incomes?.filter(
      (income) =>
        income.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        income.groupOfIncome?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        income.description?.toLowerCase().includes(searchQuery?.toLowerCase())
    );
  }, [incomes, searchQuery]);
  
  useEffect(() => {
    if (filteredIncomes) {
      setTotalPages(Math.ceil(filteredIncomes.length / pageSize));
    }
  }, [filteredIncomes]);
  
  const paginatedIncomes = filteredIncomes?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  // Mobile Card View Component
  const MobileIncomeCard = ({ income, index }) => (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                #{index + 1} • {income.name || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {moment(income.date).format("DD/MM/YYYY")}
              </Typography>
            </Box>
            <Chip
              label={`₹${income?.amount?.toFixed(2) || "0.00"}`}
              color="primary"
              size="small"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Income Type
            </Typography>
            <Chip
              label={income.groupOfIncome || "N/A"}
              size="small"
              color={income.groupOfIncome === "Direct Income" ? "success" : "info"}
              sx={{ mt: 0.5 }}
            />
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
              {income.description || "--"}
            </Typography>
          </Box>

          <Divider />

          {/* Action Buttons */}
          <Box display="flex" justifyContent="space-between" mt={1}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(income)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteClick(income._id)}
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
              <strong>Date</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Income Name</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Amount (₹)</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Income Type</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Description</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedIncomes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  {searchQuery ? 'No incomes found for your search' : 'No incomes available'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedIncomes.map((income, index) => (
              <TableRow key={income._id} hover>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {moment(income.date).format("DD/MM/YYYY")}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 150 }}>
                    {income.name || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500} color="success.main">
                    ₹{income?.amount?.toFixed(2) || "0.00"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={income.groupOfIncome || "N/A"}
                    size="small"
                    color={income.groupOfIncome === "Direct Income" ? "success" : "info"}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {income.description || "--"}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 120 }}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEdit(income)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(income._id)}
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
              Incomes
            </Typography>
            {paginatedIncomes.length > 0 && (
              <Typography variant="body2" color="textSecondary" mt={0.5}>
                Total: {filteredIncomes.length} incomes • Showing {paginatedIncomes.length} on this page
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
                placeholder="Search incomes..."
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
                variant="outlined"
                onClick={handleExportClick}
                size="small"
                sx={{ 
                  height: 40,
                  whiteSpace: 'nowrap',
                  minWidth: '40px',
                  px: isMobile ? 2 : 1,
                }}
              >
                <GetAppOutlinedIcon />
                {isMobile && ' Export'}
              </Button>
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #182848, #324b84ff)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  height: 40,
                }}
                onClick={handleOpen}
                ref={incomeInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Create Income" : "Create Income"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Export Menu */}
        <Menu
          anchorEl={anchorEl}
          open={openExportMenu}
          onClose={handleExportClose}
        >
          <MenuItem
            onClick={() => {
              exportToPDF(incomes, exportColumns, "Incomes");
              handleExportClose();
            }}
          >
            PDF
          </MenuItem>
          <MenuItem
            onClick={() => {
              exportToExcel(incomes, exportColumns, "Incomes");
              handleExportClose();
            }}
          >
            Excel
          </MenuItem>
        </Menu>

        {isMobile ? (
          <Box>
            {paginatedIncomes.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight={200}
              >
                <Typography color="textSecondary">
                  {searchQuery ? 'No incomes found for your search' : 'No incomes available'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                {paginatedIncomes.map((income, index) => (
                  <MobileIncomeCard 
                    key={income._id} 
                    income={income} 
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

      {/* Pagination */}
      {filteredIncomes && filteredIncomes.length > 0 && totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', px: { xs: 1, sm: 2 } }}>
          <PaginationComponent
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            size={isMobile ? "small" : "medium"}
          />
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this income?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("Deleted") ? "error" : "success"}
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

      <CreateIncome
        open={open}
        handleClose={handleClose}
        refresh={fetchIncomes}
        user={mainUser}
      />

      <EditIncome
        open={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchIncomes}
      />
    </>
  );
};

export default IncomeList;