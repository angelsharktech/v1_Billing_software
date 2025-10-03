import React, { useEffect, useRef, useState } from "react";
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
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Collapse,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterData from "../shared/FilterData";
import { getPaymentByOrganization } from "../../services/PaymentModeService";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import { exportToExcel, exportToPDF } from "../shared/Export";
import moment from "moment";
import { PrintOutlined, WhatsApp } from "@mui/icons-material";
import ReactToPrint from "react-to-print";
import GenerateLedger from "../shared/GenerateLedger";

const exportColumns = [
  { label: "Date", key: "date" },
  { label: "Narration", key: "narration" },
  { label: "Dr", key: "dr" }, // Debit
  { label: "Cr", key: "cr" }, // Credit
  { label: "Closing Balance", key: "closingAmount" },
];

const SupplierLedger = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openRows, setOpenRows] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const openExportMenu = Boolean(anchorEl);
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const res = await getUserById(webuser.id);
      setMainUser(res);
    };
    fetchUser();
  }, [webuser]);

  // fetch supplier payments
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = async () => {
    if (!mainUser?.organization_id?._id) return;
    try {
      const data = await getPaymentByOrganization(mainUser.organization_id._id);

      const bills = data.data.filter(
        (bill) => bill.forPayment.toLowerCase() === "purchase"
      );
      setRows(bills);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  useEffect(() => {
    refresh();
  }, [mainUser]);

  // group payments by supplier
  const groupedPayments = {};
  rows.forEach((p) => {
    if (p.client_id?._id) {
      if (!groupedPayments[p.client_id._id]) {
        groupedPayments[p.client_id._id] = {
          client: p.client_id,
          payments: [],
        };
      }
      groupedPayments[p.client_id._id].payments.push(p);
    }
  });

  // search filter
  const filteredSuppliers = Object.values(groupedPayments).filter(
    ({ payments }) => {
      const matchesSearch = payments.some(
        (row) =>
          row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.client_id.name
            ?.toLowerCase()
            .includes(searchQuery.toLocaleLowerCase()) ||
          row.purchasebill?.bill_number?.includes(searchQuery) ||
          String(row.advanceAmount).includes(searchQuery)
      );
      return matchesSearch;
    }
  );

  const toggleRow = (clientId) => {
    setOpenRows((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };
  const handleExportClose = () => {
    setAnchorEl(null);
  };
  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleExportPrint = (client, payments) => {
    const billData = {
      client,
      payments,
    };
    setPrintData(billData);
    setShowPrint(true); // Show bill for printing
    setTimeout(() => {
      window.print();
      setShowPrint(false); // Optional
    }, 500);
  };

  const handleExport = (type, client, payments) => {
    const exportData = payments.map((p) => ({
      date: p.date ? moment(p.date).format("DD/MM/YYYY") : "--",
      narration: p.narration || "--",
      dr: (p?.balance ?? 0).toString(), // Convert number to string
      cr: (p?.advanceAmount ?? 0).toString(), // Convert number to string
      closingAmount: (p?.closingAmount ?? 0).toString(),
    }));

    const fileName = `Supplier Ledger - ${client.name}`;

    if (type === "pdf") {
      exportToPDF(exportData, exportColumns, fileName);
    } else {
      exportToExcel(exportData, exportColumns, fileName);
    }

    handleExportClose();
  };
  const handleWhatsAppClick = (client, payments) => {
    const phoneNumber = client.phone_number;

    if (!phoneNumber) {
      setSnackbarMessage("No phone number available for this supplier");
      setSnackbarOpen(true);
      return;
    }

    const message = `Dear ${client?.name || "Valued Supplier"},

This is a reminder regarding your pending payment of ${
      client.openingAmount || "N/A"
    }.

Please complete the payment at your earliest convenience.

Thank you,
${mainUser?.organization_id?.name || "Our Company"}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

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
            Supplier Ledger
          </Typography>

          <FilterData
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocusOnMount
          />
        </Box>

        {/* Supplier Ledger Table */}
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: "lightgrey" }}>
              <TableRow>
                <TableCell />
                <TableCell align="center">
                  <strong>Supplier</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Opening Amount</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Total Transactions</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map(({ client, payments }) => (
                <React.Fragment key={client._id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRow(client._id)}
                      >
                        {openRows[client._id] ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">{client?.name || ""}</TableCell>
                    <TableCell align="center">
                      {client?.openingAmount}
                    </TableCell>
                    <TableCell align="center">{payments.length}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="inherit"
                        onClick={() => handleWhatsAppClick(client, payments)}
                      >
                        <WhatsApp style={{ color: "#25D366" }}  />
                      </IconButton>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Ledger */}
                  <TableRow>
                    <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                      <Collapse
                        in={openRows[client._id]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box m={2}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              gutterBottom
                            >
                              Transactions
                            </Typography>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              gap={2}
                            >
                              <Button
                                variant="outlined"
                                onClick={handleExportClick}
                              >
                                <GetAppOutlinedIcon titleAccess="Download As" />
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() =>
                                  handleExportPrint(client, payments)
                                }
                              >
                                <PrintOutlined titleAccess="Print" />
                              </Button>
                            </Box>
                          </Box>
                          <Menu
                            anchorEl={anchorEl}
                            open={openExportMenu}
                            onClose={handleExportClose}
                          >
                            <MenuItem
                              onClick={() =>
                                handleExport("pdf", client, payments)
                              }
                            >
                              PDF
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleExport("excel", client, payments)
                              }
                            >
                              Excel
                            </MenuItem>
                          </Menu>

                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell align="center">
                                  <strong>Date</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Narration</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Dr</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Cr</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Closing Balance</strong>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {payments.map((p, index) => {
                                const dr = 0;
                                const cr = 0;
                                return (
                                  <TableRow key={p._id}>
                                    <TableCell align="center">
                                      {p.date
                                        ? new Date(p.date).toLocaleDateString()
                                        : "--"}
                                    </TableCell>
                                    <TableCell align="center">
                                      {p.narration || "--"}
                                    </TableCell>
                                    <TableCell align="center">
                                      ₹ {p?.advanceAmount || 0}
                                    </TableCell>
                                    {/* <TableCell align="center">
                                      ₹ {total}
                                    </TableCell> */}
                                    <TableCell align="center">
                                      ₹ {p?.balance || 0}
                                    </TableCell>
                                    {/* <TableCell align="center">
                                      ₹ {moneyGiven}
                                    </TableCell> */}
                                    <TableCell align="center">
                                      ₹ {p?.closingAmount}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
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
      </Box>

      {showPrint && printData && (
        <div className="print-only">
          <GenerateLedger bill={printData} type={"Supplier"} />
        </div>
      )}
    </>
  );
};

export default SupplierLedger;
