import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  Collapse,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Stack,
  Chip,
  Grid,
  TextField,
  InputAdornment,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Add as AddIcon,
  Visibility,
  Search,
} from "@mui/icons-material";
import AddQuotationDialog from "./AddQuotationDialog";
import EditQuotationDialog from "./EditQuotationDialog";
import ViewQuotation from "./ViewQuotation";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import moment from "moment";
import QuotationPrint from "../shared/QuotationPrint";
import { getQuotationsByOrganization } from "../../services/QuotationService";

const QuotationList = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null); // Changed to ID
  const [openRow, setOpenRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUserById(webuser?.id);
      setMainUser(user);
    };
    fetchUser();
  }, [webuser]);

  useEffect(() => {
    if (mainUser) {
      fetchQuotations();
    }
  }, [mainUser]);

  const fetchQuotations = async () => {
    if (!mainUser) return;

    try {
      const data = await getQuotationsByOrganization(mainUser?.organization_id?._id);
      
      if (data.status === 401) {
        setSnackbarMessage("Your session has expired. Please login again!");
        setSnackbarOpen(true);
        setTimeout(() => {
          // navigate("/login");
        }, 2000);
        return;
      }
      
      if (data) {
        setQuotations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching quotations:", error);
      setSnackbarMessage("Failed to load quotations");
      setSnackbarOpen(true);
    }
  };

  const handleEditClick = (quotation) => {
    setCurrentQuotation(quotation);
    setOpenEditDialog(true);
  };

  const handleViewClick = (quotation) => {
    setSelectedQuotationId(quotation._id); // Store only the ID
    setViewDialog(true);
  };

  const handlePrint = (quotation) => {
    setPrintData(quotation);
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 500);
  };

  const handleDeleteClick = async (id) => {
    // Implement delete API call here
    setSnackbarMessage("Quotation deleted successfully");
    setSnackbarOpen(true);
    fetchQuotations();
  };

  const toggleExpand = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
      case "accepted":
        return "success";
      case "pending":
      case "draft":
        return "warning";
      case "rejected":
        return "error";
      case "sent":
        return "info";
      default:
        return "default";
    }
  };

  // Filter quotations
  const filteredQuotations = quotations.filter(quote => {
    const matchesSearch = 
      quote.quotationNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.customer?.phone?.includes(searchQuery);
    
    return matchesSearch;
  });

  // Mobile Card View Component
  const MobileQuotationCard = ({ quote }) => {
    const isExpanded = openRow === quote._id;
    
    return (
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {quote.quotationNo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {quote.customer?.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {moment(quote.date).format("DD/MM/YYYY")}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Chip
                label={quote.status || "Draft"}
                color={getStatusColor(quote.status)}
                size="small"
                sx={{ mb: 1 }}
              />
              <Typography variant="body1" fontWeight="bold" color="primary">
                ₹ {quote.grandTotal?.toFixed(2)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
            <IconButton
              size="small"
              onClick={() => toggleExpand(quote._id)}
            >
              {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
            
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleViewClick(quote)}
              >
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleEditClick(quote)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="success"
                onClick={() => handlePrint(quote)}
              >
                <PrintIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteClick(quote._id)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Products ({quote.products?.length || 0})
              </Typography>
              
              <Stack spacing={1} sx={{ mb: 2 }}>
                {quote.products?.map((product, idx) => (
                  <Box key={idx} sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    p: 1,
                    bgcolor: 'grey.50',
                    borderRadius: 1
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {product.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.quantity} × ₹{product.unitPrice}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="medium">
                      ₹ {(product.total || 0).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
              
              <Box sx={{ 
                p: 1.5, 
                bgcolor: 'primary.light', 
                borderRadius: 1,
                color: 'primary.contrastText'
              }}>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="body2" fontWeight="bold">
                      ₹ {quote.subtotal?.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">Tax:</Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="body2" fontWeight="bold">
                      ₹ {quote.taxTotal?.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" fontWeight="bold">
                      Grand Total:
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="right">
                    <Typography variant="body1" fontWeight="bold">
                      ₹ {quote.grandTotal?.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ 
        display: "flex", 
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between", 
        alignItems: { xs: "stretch", sm: "center" },
        mb: 3,
        gap: 2 
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight={600}>
          Quotation List
        </Typography>
        
        <Box sx={{ 
          display: "flex", 
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          width: { xs: "100%", sm: "auto" }
        }}>
          <TextField
            size="small"
            placeholder="Search quotations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: "100%", sm: "200px" } }}
          />
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ 
              backgroundColor: "#182848", 
              color: "#fff",
              whiteSpace: 'nowrap',
              '&:hover': {
                backgroundColor: "#0d1c3a",
              }
            }}
          >
            New Quotation
          </Button>
        </Box>
      </Box>

      {/* Desktop/Tablet Table View */}
      {!isMobile ? (
        <TableContainer 
          component={Paper} 
          elevation={3}
          sx={{ 
            maxHeight: 600, 
            overflowY: "auto",
            '& .MuiTableCell-root': {
              py: 1.5,
              px: 2,
            }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                <TableCell sx={{ width: 50 }} />
                <TableCell sx={{ fontWeight: 600 }}>Quotation No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQuotations.map((quote) => (
                <React.Fragment key={quote._id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleExpand(quote._id)}
                      >
                        {openRow === quote._id ? (
                          <KeyboardArrowUp />
                        ) : (
                          <KeyboardArrowDown />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {quote.quotationNo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {moment(quote.date).format("DD/MM/YYYY")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {quote.customer?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {quote.customer?.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ₹ {quote.grandTotal?.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={quote.status || "Draft"}
                        color={getStatusColor(quote.status)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewClick(quote)}
                          title="View"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(quote)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handlePrint(quote)}
                          title="Print"
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(quote._id)}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Product Details */}
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                      <Collapse
                        in={openRow === quote._id}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Product Details
                          </Typography>
                          
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell align="right">Price</TableCell>
                                <TableCell align="right">Tax</TableCell>
                                <TableCell align="right">Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {quote.products?.map((product, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {product.productName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">{product.quantity}</TableCell>
                                  <TableCell align="right">₹ {product.unitPrice}</TableCell>
                                  <TableCell align="right">{product.tax}%</TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="medium">
                                      ₹ {(product.total || 0).toFixed(2)}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                              
                              {/* Summary Row */}
                              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                <TableCell colSpan={4} align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    Subtotal:
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    ₹ {quote.subtotal?.toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                <TableCell colSpan={4} align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    Tax Total:
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" fontWeight="bold">
                                    ₹ {quote.taxTotal?.toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                              <TableRow sx={{ backgroundColor: theme.palette.primary.light, color: 'primary.contrastText' }}>
                                <TableCell colSpan={4} align="right">
                                  <Typography variant="body1" fontWeight="bold">
                                    Grand Total:
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body1" fontWeight="bold">
                                    ₹ {quote.grandTotal?.toFixed(2)}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Mobile Card View
        <Box>
          {filteredQuotations.map((quote) => (
            <MobileQuotationCard key={quote._id} quote={quote} />
          ))}
          
          {filteredQuotations.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No quotations found
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Dialogs */}
      <AddQuotationDialog
        open={openAddDialog}
        handleClose={() => setOpenAddDialog(false)}
        refresh={fetchQuotations}
      />
      
      <EditQuotationDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        refresh={fetchQuotations}
        quotation={currentQuotation}
      />
      
      {/* Fixed: Pass only the ID to ViewQuotation */}
      <ViewQuotation 
        open={viewDialog} 
        data={selectedQuotationId}  // Pass only the ID, not the full object
        handleCloseView={() => setViewDialog(false)} 
      />

      {/* Print Component */}
      {showPrint && printData && (
        <div className="print-only">
          <QuotationPrint quotation={printData} />
        </div>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default QuotationList;