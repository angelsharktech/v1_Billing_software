// import React, { useEffect, useState } from "react";
// import {
//   Box,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Typography,
//   IconButton,
//   Snackbar,
//   Alert,
//   useMediaQuery,
//   useTheme,
//   Collapse,
//   Menu,
//   MenuItem,
//   Button,
// } from "@mui/material";
// import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
// import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
// import FilterData from "../shared/FilterData";
// import { getPaymentByOrganization } from "../../services/PaymentModeService";
// import { getUserById } from "../../services/UserService";
// import { useAuth } from "../../context/AuthContext";
// import { exportToExcel, exportToPDF } from "../shared/Export";
// import moment from "moment";
// import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
// import GenerateLedger from "../shared/GenerateLedger";
// import { PrintOutlined, WhatsApp } from "@mui/icons-material";

// const exportColumns = [
//   { label: "Date", key: "date" },
//   { label: "Narration", key: "narration" },
//   { label: "Dr", key: "dr" }, // Debit
//   { label: "Cr", key: "cr" }, // Credit
//   { label: "Closing Balance", key: "closingAmount" },
// ];

// const CustomerLedger = () => {
//   const { webuser } = useAuth();
//   const [mainUser, setMainUser] = useState();
//   const [rows, setRows] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [openRows, setOpenRows] = useState({});

//   const [showPrint, setShowPrint] = useState(false);
//   const [printData, setPrintData] = useState();
//   const [anchorEl, setAnchorEl] = useState(null);
//   const openExportMenu = Boolean(anchorEl);

//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
//   const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

//   // fetch logged-in user
//   useEffect(() => {
//     const fetchUser = async () => {
//       const res = await getUserById(webuser.id);
//       setMainUser(res);
//     };
//     fetchUser();
//   }, [webuser]);

//   // fetch supplier payments
//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const refresh = async () => {
//     if (!mainUser?.organization_id?._id) return;
//     try {
//       const data = await getPaymentByOrganization(mainUser.organization_id._id);

//       const bills = data.data.filter(
//         (bill) => bill.forPayment.toLowerCase() === "sale"
//       );

//       setRows(bills);
//     } catch (error) {
//       console.error("Error fetching payments:", error);
//     }
//   };

//   useEffect(() => {
//     refresh();
//   }, [mainUser]);

//   // group payments by supplier
//   const groupedPayments = {};
//   rows.forEach((p) => {
//     if (p.client_id?._id) {
//       if (!groupedPayments[p.client_id._id]) {
//         groupedPayments[p.client_id._id] = {
//           client: p.client_id,
//           payments: [],
//         };
//       }
//       groupedPayments[p.client_id._id].payments.push(p);
//     }
//   });
//   // search filter
//   const filteredCustomers = Object.values(groupedPayments).filter(
//     ({ payments }) => {
//       const matchesSearch = payments.some(
//         (row) =>
//           row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           row.client_id.name
//             ?.toLowerCase()
//             .includes(searchQuery.toLocaleLowerCase()) ||
//           row.salebill?.bill_number?.includes(searchQuery) ||
//           String(row.advanceAmount).includes(searchQuery)
//       );
//       return matchesSearch;
//     }
//   );
//   // console.log("**filteredCustomers::", filteredCustomers);
//   const toggleRow = (clientId) => {
//     setOpenRows((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
//   };

//   const handleExportClose = () => {
//     setAnchorEl(null);
//   };
//   const handleExportClick = (event) => {
//     setAnchorEl(event.currentTarget);
//   };
//   const handleExportPrint = (client, payments) => {
//     const billData = {
//       client,
//       payments,
//     };
//     setPrintData(billData);
//     setShowPrint(true); // Show bill for printing
//     setTimeout(() => {
//       window.print();
//       setShowPrint(false); // Optional
//     }, 500);
//   };
//   const handleExport = (type, client, payments) => {
//     const exportData = payments.map((p) => ({
//       date: p.date ? moment(p.date).format("DD/MM/YYYY") : "--",
//       narration: p.narration || "--",
//       dr: (p?.balance ?? 0).toString(), // Convert number to string
//       cr: (p?.advanceAmount ?? 0).toString(), // Convert number to string
//       closingAmount: (p?.closingAmount ?? 0).toString(),
//     }));

//     const fileName = `Customer Ledger - ${client.name}`;

//     if (type === "pdf") {
//       exportToPDF(exportData, exportColumns, fileName);
//     } else {
//       exportToExcel(exportData, exportColumns, fileName);
//     }

//     handleExportClose();
//   };
//   const handleWhatsAppClick = (client, payments) => {
//     const phoneNumber = client.phone_number;

//     if (!phoneNumber) {
//       setSnackbarMessage("No phone number available for this supplier");
//       setSnackbarOpen(true);
//       return;
//     }

//     const message = `Dear ${client?.name || "Valued Customer"},

// This is a reminder regarding your pending payment of ₹ ${
//       client.openingAmount || "N/A"
//     }.

// Please complete the payment at your earliest convenience.

// Thank you,
// ${mainUser?.organization_id?.name || "Our Company"}`;

//     const encodedMessage = encodeURIComponent(message);
//     const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
//     window.open(whatsappUrl, "_blank");
//   };

//   return (
//     <>
//       <Box sx={{ p: isExtraSmallScreen ? 1 : 3 }}>
//         {/* Header */}
//         <Box
//           display="flex"
//           flexDirection={isSmallScreen ? "column" : "row"}
//           justifyContent="space-between"
//           alignItems={isSmallScreen ? "flex-start" : "center"}
//           mb={2}
//           gap={isSmallScreen ? 2 : 0}
//         >
//           <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={600}>
//             Customer Ledger
//           </Typography>

//           <FilterData
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             autoFocusOnMount
//           />
//         </Box>

//         {/* Supplier Ledger Table */}
//         <TableContainer component={Paper} elevation={3}>
//           <Table>
//             <TableHead sx={{ backgroundColor: "lightgrey" }}>
//               <TableRow>
//                 <TableCell />
//                 <TableCell align="center">
//                   <strong>Customer</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Closing Balance</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Total Transactions</strong>
//                 </TableCell>
//                 <TableCell align="center">
//                   <strong>Action</strong>
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredCustomers.map(({ client, payments }) => (
//                 <React.Fragment key={client._id}>
//                   <TableRow>
//                     <TableCell>
//                       <IconButton
//                         size="small"
//                         onClick={() => toggleRow(client._id)}
//                       >
//                         {openRows[client._id] ? (
//                           <KeyboardArrowUpIcon />
//                         ) : (
//                           <KeyboardArrowDownIcon />
//                         )}
//                       </IconButton>
//                     </TableCell>
//                     <TableCell align="center">{client?.name}</TableCell>
//                     <TableCell align="center">
//                       {client?.openingAmount}
//                     </TableCell>
//                     <TableCell align="center">{payments.length}</TableCell>
//                     <TableCell align="center">
//                       <IconButton
//                         color="inherit"
//                         onClick={() => handleWhatsAppClick(client, payments)}
//                       >
//                         <WhatsApp style={{ color: "#25D366" }} />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>

//                   {/* Expanded Ledger */}
//                   <TableRow>
//                     <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
//                       <Collapse
//                         in={openRows[client._id]}
//                         timeout="auto"
//                         unmountOnExit
//                       >
//                         <Box m={2}>
//                           <Box display="flex" justifyContent="space-between">
//                             <Typography
//                               variant="subtitle1"
//                               fontWeight="bold"
//                               gutterBottom
//                             >
//                               Transactions
//                             </Typography>
//                             <Box
//                               display="flex"
//                               justifyContent="space-between"
//                               gap={2}
//                             >
//                               <Button
//                                 variant="outlined"
//                                 onClick={handleExportClick}
//                               >
//                                 <GetAppOutlinedIcon titleAccess="Download As" />
//                               </Button>
//                               <Button
//                                 variant="outlined"
//                                 onClick={() =>
//                                   handleExportPrint(client, payments)
//                                 }
//                               >
//                                 <PrintOutlined titleAccess="Print" />
//                               </Button>
//                             </Box>
//                           </Box>
//                           <Menu
//                             anchorEl={anchorEl}
//                             open={openExportMenu}
//                             onClose={handleExportClose}
//                           >
//                             <MenuItem
//                               onClick={() =>
//                                 handleExport("pdf", client, payments)
//                               }
//                             >
//                               PDF
//                             </MenuItem>
//                             <MenuItem
//                               onClick={() =>
//                                 handleExport("excel", client, payments)
//                               }
//                             >
//                               Excel
//                             </MenuItem>
//                           </Menu>

//                           <Table size="small">
//                             <TableHead>
//                               <TableRow>
//                                 <TableCell align="center">
//                                   <strong>Date</strong>
//                                 </TableCell>
//                                 <TableCell align="center">
//                                   <strong>Narration</strong>
//                                 </TableCell>
//                                 <TableCell align="center">
//                                   <strong>Dr</strong>
//                                 </TableCell>
//                                 <TableCell align="center">
//                                   <strong>Cr</strong>
//                                 </TableCell>
//                                 <TableCell align="center">
//                                   <strong>Closing Balance</strong>
//                                 </TableCell>
//                               </TableRow>
//                             </TableHead>
//                             <TableBody>
//                               {payments.map((p, index) => {
//                                 const dr = 0;
//                                 const cr = 0;

//                                 return (
//                                   <TableRow key={p._id}>
//                                     <TableCell align="center">
//                                       {p.date
//                                         ? new Date(p.date).toLocaleDateString()
//                                         : "--"}
//                                     </TableCell>
//                                     <TableCell align="center">
//                                       {p.narration || "--"}
//                                     </TableCell>
//                                     <TableCell align="center">
//                                       {/* ₹ {p?.advanceAmount || 0} */}₹{" "}
//                                       {p?.balance || 0}
//                                     </TableCell>
//                                     {/* <TableCell align="center">
//                                       ₹ {total}
//                                     </TableCell> */}
//                                     <TableCell align="center">
//                                       ₹ {p?.advanceAmount || 0}
//                                       {/* ₹ {p?.balance || 0} */}
//                                     </TableCell>
//                                     {/* <TableCell align="center">
//                                       ₹ {moneyGiven}
//                                     </TableCell> */}
//                                     <TableCell align="center">
//                                       ₹ {p?.closingAmount}
//                                     </TableCell>
//                                   </TableRow>
//                                 );
//                               })}
//                             </TableBody>
//                           </Table>
//                         </Box>
//                       </Collapse>
//                     </TableCell>
//                   </TableRow>
//                 </React.Fragment>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Box>

//       {showPrint && printData && (
//         <div className="print-only">
//           <GenerateLedger bill={printData} type={"Customer"} />
//         </div>
//       )}
//     </>
//   );
// };

// export default CustomerLedger;


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
  useMediaQuery,
  useTheme,
  Collapse,
  Menu,
  MenuItem,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterData from "../shared/FilterData";
import { getPaymentByOrganization } from "../../services/PaymentModeService";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";
import { exportToExcel, exportToPDF } from "../shared/Export";
import moment from "moment";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import GenerateLedger from "../shared/GenerateLedger";
import { PrintOutlined, WhatsApp, MoreVert, ExpandMore, ExpandLess } from "@mui/icons-material";

const exportColumns = [
  { label: "Date", key: "date" },
  { label: "Narration", key: "narration" },
  { label: "Dr", key: "dr" },
  { label: "Cr", key: "cr" },
  { label: "Closing Balance", key: "closingAmount" },
];

const CustomerLedger = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openRows, setOpenRows] = useState({});
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const openExportMenu = Boolean(anchorEl);
  const openMobileMenu = Boolean(mobileMenuAnchor);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getUserById(webuser.id);
      setMainUser(res);
    };
    fetchUser();
  }, [webuser]);

  const refresh = async () => {
    if (!mainUser?.organization_id?._id) return;
    try {
      const data = await getPaymentByOrganization(mainUser.organization_id._id);
      const bills = data.data.filter(
        (bill) => bill.forPayment.toLowerCase() === "sale"
      );
      setRows(bills);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  useEffect(() => {
    refresh();
  }, [mainUser]);

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

  const filteredCustomers = Object.values(groupedPayments).filter(
    ({ payments }) => {
      const matchesSearch = payments.some(
        (row) =>
          row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.client_id.name
            ?.toLowerCase()
            .includes(searchQuery.toLocaleLowerCase()) ||
          row.salebill?.bill_number?.includes(searchQuery) ||
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
  
  const handleExportClick = (event, client, payments) => {
    setSelectedClient({ client, payments });
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClick = (event, client, payments) => {
    setSelectedClient({ client, payments });
    setMobileMenuAnchor(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
    setSelectedClient(null);
  };
  
  const handleExportPrint = (client, payments) => {
    const billData = { client, payments };
    setPrintData(billData);
    setShowPrint(true);
    setTimeout(() => {
      window.print();
      setShowPrint(false);
    }, 500);
  };
  
  const handleExport = (type) => {
    if (!selectedClient) return;
    
    const { client, payments } = selectedClient;
    const exportData = payments.map((p) => ({
      date: p.date ? moment(p.date).format("DD/MM/YYYY") : "--",
      narration: p.narration || "--",
      dr: (p?.balance ?? 0).toString(),
      cr: (p?.advanceAmount ?? 0).toString(),
      closingAmount: (p?.closingAmount ?? 0).toString(),
    }));

    const fileName = `Customer Ledger - ${client.name}`;

    if (type === "pdf") {
      exportToPDF(exportData, exportColumns, fileName);
    } else {
      exportToExcel(exportData, exportColumns, fileName);
    }

    handleExportClose();
    handleMobileMenuClose();
  };

  const handleWhatsAppClick = (client) => {
    const phoneNumber = client.phone_number;
    if (!phoneNumber) return;
    
    const message = `Dear ${client?.name || "Valued Customer"},

This is a reminder regarding your pending payment of ₹ ${
      client.openingAmount || "N/A"
    }.

Please complete the payment at your earliest convenience.

Thank you,
${mainUser?.organization_id?.name || "Our Company"}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  // Mobile Card View
  const MobileCustomerCard = ({ client, payments }) => {
    const isOpen = openRows[client._id];
    
    return (
      <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {client?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {payments.length} transaction{payments.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip 
                label={`₹ ${client?.openingAmount || 0}`}
                color={client?.openingAmount > 0 ? "error" : "success"}
                size="small"
                sx={{ fontWeight: "bold" }}
              />
              <IconButton size="small" onClick={() => toggleRow(client._id)}>
                {isOpen ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
            <IconButton 
              size="small" 
              onClick={(e) => handleMobileMenuClick(e, client, payments)}
              sx={{ color: "primary.main" }}
            >
              <MoreVert />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleWhatsAppClick(client)}
              sx={{ color: "#25D366" }}
            >
              <WhatsApp />
            </IconButton>
          </Box>

          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Transaction Details
              </Typography>
              <Stack spacing={1.5}>
                {payments.map((p, index) => (
                  <Box key={p._id} sx={{ 
                    p: 1.5, 
                    bgcolor: 'grey.50', 
                    borderRadius: 1,
                    borderLeft: 3,
                    borderColor: p.advanceAmount > 0 ? 'success.light' : 'warning.light'
                  }}>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="text.secondary">
                            Date:
                          </Typography>
                          <Typography variant="caption" fontWeight="medium">
                            {p.date ? new Date(p.date).toLocaleDateString() : "--"}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" sx={{ wordBreak: "break-word", mb: 0.5 }}>
                          {p.narration || "--"}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="error.main">
                            Debit:
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            ₹ {p?.balance || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography variant="caption" color="success.main">
                            Credit:
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            ₹ {p?.advanceAmount || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                          <Typography variant="caption" color="primary.main">
                            Closing:
                          </Typography>
                          <Typography variant="caption" fontWeight="bold">
                            ₹ {p?.closingAmount || 0}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            mb: 3,
            gap: 2,
          }}
        >
          <Typography variant={isMobile ? "h6" : isTablet ? "h5" : "h4"} fontWeight={600}>
            Customer Ledger
          </Typography>

          <Box sx={{ width: { xs: "100%", sm: "300px" } }}>
            <FilterData
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocusOnMount
              size={isMobile ? "small" : "medium"}
            />
          </Box>
        </Box>

        {isMobile ? (
          // Mobile Card View
          <Box>
            {filteredCustomers.map(({ client, payments }) => (
              <MobileCustomerCard key={client._id} client={client} payments={payments} />
            ))}
            {filteredCustomers.length === 0 && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                  No customers found
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          // Tablet & Desktop Table View
          <TableContainer 
            component={Paper} 
            elevation={3}
            sx={{
              overflowX: "auto",
              "& .MuiTableCell-root": {
                px: { xs: 1, sm: 2 },
                py: { xs: 1, sm: 1.5 },
              },
            }}
          >
            <Table sx={{ minWidth: 600 }}>
              <TableHead sx={{ backgroundColor: "lightgrey" }}>
                <TableRow>
                  <TableCell sx={{ width: 50 }} />
                  <TableCell align={isTablet ? "left" : "center"}>
                    <strong>Customer</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Balance</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Txn</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Action</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.map(({ client, payments }) => (
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
                      <TableCell align={isTablet ? "left" : "center"} sx={{ wordBreak: "break-word" }}>
                        {client?.name}
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`₹ ${client?.openingAmount || 0}`}
                          color={client?.openingAmount > 0 ? "error" : "success"}
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={payments.length}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                          <IconButton
                            color="inherit"
                            onClick={() => handleWhatsAppClick(client)}
                            size="small"
                          >
                            <WhatsApp sx={{ color: "#25D366", fontSize: "1.2rem" }} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => handleExportClick(e, client, payments)}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                        <Collapse
                          in={openRows[client._id]}
                          timeout="auto"
                          unmountOnExit
                        >
                          <Box sx={{ p: { xs: 1, sm: 2 } }}>
                            <Box sx={{ 
                              display: "flex", 
                              flexDirection: { xs: "column", sm: "row" },
                              justifyContent: "space-between",
                              alignItems: { xs: "flex-start", sm: "center" },
                              mb: 2,
                              gap: 2 
                            }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                Transactions ({payments.length})
                              </Typography>
                              <Box sx={{ 
                                display: "flex", 
                                gap: 1,
                                width: { xs: "100%", sm: "auto" },
                              }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={(e) => handleExportClick(e, client, payments)}
                                  startIcon={<GetAppOutlinedIcon />}
                                >
                                  Export
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleExportPrint(client, payments)}
                                  startIcon={<PrintOutlined />}
                                >
                                  Print
                                </Button>
                              </Box>
                            </Box>
                            
                            <Box sx={{ overflowX: "auto" }}>
                              <Table size="small" sx={{ minWidth: 500 }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell align="center"><strong>Date</strong></TableCell>
                                    <TableCell align="center"><strong>Narration</strong></TableCell>
                                    <TableCell align="center"><strong>Dr</strong></TableCell>
                                    <TableCell align="center"><strong>Cr</strong></TableCell>
                                    <TableCell align="center"><strong>Closing</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {payments.map((p) => (
                                    <TableRow key={p._id}>
                                      <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
                                        {p.date ? new Date(p.date).toLocaleDateString() : "--"}
                                      </TableCell>
                                      <TableCell align="center" sx={{ maxWidth: 150, wordBreak: "break-word" }}>
                                        {p.narration || "--"}
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography color="error.main" fontWeight="medium">
                                          ₹ {p?.balance || 0}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography color="success.main" fontWeight="medium">
                                          ₹ {p?.advanceAmount || 0}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center" fontWeight="bold">
                                        ₹ {p?.closingAmount || 0}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Export Menu for Desktop */}
        <Menu
          anchorEl={anchorEl}
          open={openExportMenu}
          onClose={handleExportClose}
        >
          <MenuItem onClick={() => handleExport("pdf")}>
            Download as PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport("excel")}>
            Download as Excel
          </MenuItem>
          {selectedClient && (
            <MenuItem onClick={() => handleExportPrint(selectedClient.client, selectedClient.payments)}>
              Print Ledger
            </MenuItem>
          )}
        </Menu>

        {/* Mobile Menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={openMobileMenu}
          onClose={handleMobileMenuClose}
        >
          <MenuItem onClick={() => handleExport("pdf")}>
            Download as PDF
          </MenuItem>
          <MenuItem onClick={() => handleExport("excel")}>
            Download as Excel
          </MenuItem>
          {selectedClient && (
            <MenuItem onClick={() => handleExportPrint(selectedClient.client, selectedClient.payments)}>
              Print Ledger
            </MenuItem>
          )}
        </Menu>
      </Box>

      {showPrint && printData && (
        <div className="print-only">
          <GenerateLedger bill={printData} type={"Customer"} />
        </div>
      )}
    </>
  );
};

export default CustomerLedger;