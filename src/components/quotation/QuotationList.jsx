import React, { useEffect, useRef, useState } from "react";
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
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Collapse,
} from "@mui/material";
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import AddQuotationDialog from "./AddQuotationDialog";
import EditQuotationDialog from "./EditQuotationDialog";
import PrintInvoiceDialog from "./PrintInvoiceDialog";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import moment from "moment/moment";
import QuotationPrint from "../shared/QuotationPrint";
import {  getQuotationsByOrganization } from "../../services/QuotationService";

const QuotationList = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState(null);
  const [quotations, setQuotations] = useState();
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [currentQuotation, setCurrentQuotation] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deletedQuotation, setDeletedQuotation] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();
const quoteInputRef = useRef(null);

useEffect(() => {
  if (quoteInputRef.current) {
    quoteInputRef.current.focus();
  }
}, []);
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
  }, [webuser, mainUser]);

  const fetchQuotations = async () => {
    if (!mainUser) return;

    const data = await getQuotationsByOrganization(
      mainUser?.organization_id?._id
    );

    if (data.status === 401) {
      setSnackbarMessage("Your Session is expired. Please login again!");
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
    if (data) {
      setQuotations(data);
    }
  };
  const handleCloseEdit = () => setOpenEditDialog(false);

  const handleDelete = (id) => {
    const quotationToDelete = quotations.find((quote) => quote.id === id);
    setDeletedQuotation(quotationToDelete);
    setQuotations(quotations.filter((quote) => quote.id !== id));
    setSnackbarOpen(true);
  };

  const handleUndoDelete = () => {
    if (deletedQuotation) {
      setQuotations([...quotations, deletedQuotation]);
      setSnackbarOpen(false);
    }
  };

  const handleEditClick = (quotation) => {
    setCurrentQuotation(quotation);
    setOpenEditDialog(true);
  };

  const handlePrint = (data) => {
    try {      
      setPrintData(data);
      setShowPrint(true); // Show quotation for printing
      setTimeout(() => {
        window.print();
        setShowPrint(false); // Optional
      }, 500);
    } catch (error) {
      console.log("Error printing quotation:", error);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };
  const [openRow, setOpenRow] = useState(null);

  const toggleExpand = (id) => {
    setOpenRow(openRow === id ? null : id);
  };
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Quotation List
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenAddDialog(true)}
          sx={{ backgroundColor: "#182848", color: "#fff" }}
          inputRef={quoteInputRef}
        >
          Add Quotation (Alt + Q)
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={3}
        sx={{ maxHeight: 550, overflowY: "auto" }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: "grey.100" }}>
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: "bold" }}>Quotation No.</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Valid Up To</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Total (₹)</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quotations?.map((quote, index) => (
              <React.Fragment key={quote._id}>
                {/* Main Row */}
                <TableRow>
                  <TableCell>
                    {quote.products && (
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
                    )}
                  </TableCell>
                  <TableCell>{quote.quotationNo}</TableCell>
                  <TableCell>
                    {moment(quote.date).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>
                    {moment(quote.validUpTo).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>{quote.customer.name}</TableCell>
                  <TableCell>{quote.grandTotal}</TableCell>
                  <TableCell>
                    <Chip
                      label={quote.status}
                      color={getStatusColor(quote.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      aria-label="edit"
                      onClick={() => handleEditClick(quote)}
                    >
                      <EditIcon />
                    </IconButton>
                    {/* <IconButton
                    color="error"
                    aria-label="delete"
                    onClick={() => handleDelete(quote._id)}
                  >
                    <DeleteIcon />
                  </IconButton> */}
                    <IconButton
                      color="success"
                      aria-label="print"
                      onClick={() => handlePrint(quote)}
                    >
                      <PrintIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>

                {/* Expandable Product Details */}
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={7}
                  >
                    <Collapse
                      in={openRow === quote._id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box margin={1}>
                        <Table size="small" aria-label="products">
                          <TableHead>
                            <TableRow>
                              <TableCell>Product/Service</TableCell>
                              <TableCell>Qty</TableCell>
                              <TableCell>Price (₹)</TableCell>
                              <TableCell>Tax (%)</TableCell>
                              <TableCell>Total (₹)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {quote.products.map((product, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{product.productName}</TableCell>
                                <TableCell>{product.quantity}</TableCell>
                                <TableCell>{product.unitPrice}</TableCell>
                                <TableCell>{product.tax}%</TableCell>
                                <TableCell>
                                  {product.total.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Optional: totals */}
                            <TableRow>
                              <TableCell colSpan={4} align="right">
                                <strong>Subtotal</strong>
                              </TableCell>
                              <TableCell>{quote.subtotal}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={4} align="right">
                                <strong>Tax</strong>
                              </TableCell>
                              <TableCell>{quote.taxTotal}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell colSpan={4} align="right">
                                <strong>Grand Total</strong>
                              </TableCell>
                              <TableCell>{quote.grandTotal}</TableCell>
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

      <AddQuotationDialog
        open={openAddDialog}
        handleClose={() => setOpenAddDialog(false)}
        mainUser={mainUser}
        refresh={fetchQuotations}
      />
      <EditQuotationDialog
        open={openEditDialog}
        onClose={handleCloseEdit}
        refresh={fetchQuotations}
        quotation={currentQuotation}
      />
      {/* <PrintInvoiceDialog
        open={openPrintDialog}
        onClose={() => setOpenPrintDialog(false)}
        quotation={currentQuotation}
      /> */}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
          action={
            <Button color="inherit" size="small" onClick={handleUndoDelete}>
              UNDO
            </Button>
          }
        >
          Quotation {deletedQuotation?.id} has been deleted.
        </Alert>
      </Snackbar>

      {showPrint && printData && (
        <div className="print-only">
          <QuotationPrint quotation={printData} />
        </div>
      )}
    </Box>
  );
};

export default QuotationList;
