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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PaginationComponent from "../shared/PaginationComponent";
import FilterData from "../shared/FilterData";

const StockInList = () => {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // dummy fetch (replace with API later)
  useEffect(() => {
    fetchStockIn();
  }, []);

  const fetchStockIn = async () => {
    // Replace with API call
    const dummyData = [
      { id: 1, supplier: "ABC Traders", date: "2025-09-04", amount: 1200 },
      { id: 2, supplier: "XYZ Suppliers", date: "2025-09-02", amount: 850 },
      { id: 3, supplier: "MNO Enterprises", date: "2025-08-30", amount: 1500 },
    ];
    setRows(dummyData);
  };

  const filteredStockIn = rows?.filter(
    (row) =>
      row.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.date.includes(searchQuery) ||
      String(row.amount).includes(searchQuery)
  );

  useEffect(() => {
    if (filteredStockIn) {
      setTotalPages(Math.ceil(filteredStockIn.length / pageSize));
    }
  }, [filteredStockIn]);

  const paginatedStockIn = filteredStockIn?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedRows = rows.filter((row) => row.id !== id);
      setRows(updatedRows);
      setSnackbarMessage("Stock In record deleted!");
      setSnackbarOpen(true);
    }
  };

  // Mobile-friendly stock card
  const MobileStockCard = ({ stock }) => (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {stock.supplier}
          </Typography>
          <Typography variant="body2">Date: {stock.date}</Typography>
          <Typography variant="body2">
            Payable: ₹ {stock.amount}
          </Typography>
        </Box>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDelete(stock.id)}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    </Paper>
  );

  return (
    <>
      <Box sx={{ p: isExtraSmallScreen ? 1 : 3 }}>
        {/* Header with title + search + add button */}
        <Box
          display="flex"
          flexDirection={isSmallScreen ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isSmallScreen ? "flex-start" : "center"}
          mb={2}
          gap={isSmallScreen ? 2 : 0}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={600}>
            Stock In
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
              onClick={() => alert("Open Add Stock In Form")}
            >
              {isSmallScreen ? "Add Stock" : "Add Stock (alt+x)"}
            </Button>
          </Box>
        </Box>

        {isSmallScreen ? (
          // Mobile view
          <Box>
            {paginatedStockIn?.map((stock, index) => (
              <MobileStockCard key={index} stock={stock} />
            ))}
          </Box>
        ) : (
          // Desktop view with table
          <TableContainer component={Paper} elevation={3} sx={{ height: "422px" }}>
            <Table>
              <TableHead sx={{ backgroundColor: "lightgrey" }}>
                <TableRow>
                  <TableCell align="center">
                    <strong>Supplier Name</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Date</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Payable Amount</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStockIn?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell align="center">{row.supplier}</TableCell>
                    <TableCell align="center">{row.date}</TableCell>
                    <TableCell align="center">₹ {row.amount}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row.id)}
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
          severity="success"
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {filteredStockIn && filteredStockIn.length > 0 && (
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
};

export default StockInList;
