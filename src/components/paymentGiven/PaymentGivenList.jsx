// import React, { useEffect, useRef, useState } from "react";
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
//   Button,
//   Snackbar,
//   Alert,
//   useMediaQuery,
//   useTheme,
//   Dialog,
// } from "@mui/material";
// import DeleteIcon from "@mui/icons-material/Delete";
// import PaginationComponent from "../shared/PaginationComponent";
// import FilterData from "../shared/FilterData";
// import { getPaymentByOrganization } from "../../services/PaymentModeService";
// import { getUserById } from "../../services/UserService";
// import { useAuth } from "../../context/AuthContext";
// import AddPaymentGiven from "./AddPaymentGiven";

// const PaymentGivenList = ({ organizationId }) => {
//   const { webuser } = useAuth();
//   const [mainUser, setMainUser] = useState();
//   const [rows, setRows] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState("");
//   const [totalPages, setTotalPages] = useState(1);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [openDialog, setOpenDialog] = useState(false);
//   const pageSize = 5;

//   const theme = useTheme();
//   const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
//   const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
// const paymentGivenInputRef = useRef(null);

//   useEffect(() => {
//     if (paymentGivenInputRef.current) {
//       paymentGivenInputRef.current.focus();
//     }
//   }, []);

//   useEffect(() => {
//     const fetchUser = async () => {
//       const res = await getUserById(webuser.id);
//       setMainUser(res);
//     };
//     fetchUser();
//   }, [webuser]);

//   // 🔄 refresh function to fetch payments
//   const refresh = async () => {
//     if (!mainUser?.organization_id?._id) return;
//     try {
//       const data = await getPaymentByOrganization(mainUser.organization_id._id);
//        const bills = data.data.filter((bill)=> bill.forPayment === 'purchase')
      
//       setRows(bills || []);
//     } catch (error) {
//       console.error("Error fetching payments:", error);
//     }
//   };

//   useEffect(() => {
//     refresh();
//   }, [mainUser]);

//   const filteredPayments = rows?.filter(
    
//     (row) =>
//       row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       String(row.advanceAmount).includes(searchQuery) ||
//       // row.date?.includes(searchQuery) || 
//       row.purchasebill?.bill_number?.includes(searchQuery)
//   );
//   useEffect(() => {
//     if (filteredPayments) {
//       setTotalPages(Math.ceil(filteredPayments.length / pageSize));
//     }
//   }, [filteredPayments]);

//   const paginatedPayments = filteredPayments?.slice(
//     (currentPage - 1) * pageSize,
//     currentPage * pageSize
//   );

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this record?")) {
//       const updatedRows = rows.filter((row) => row._id !== id);
//       setRows(updatedRows);
//       setSnackbarMessage("Payment record deleted!");
//       setSnackbarOpen(true);
//     }
//   };

//   // ✅ after adding payment, call refresh instead of just pushing
//   const handlePaymentAdded = () => {
//     refresh();
//     setSnackbarMessage("Payment added successfully!");
//     setSnackbarOpen(true);
//   };

//   // Mobile-friendly card
//   const MobilePaymentCard = ({ payment }) => (
//     <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
//       <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
//         <Box>
//           <Typography variant="subtitle1" fontWeight="bold">
//             Payment Mode: {payment.paymentType}
//           </Typography>
//           <Typography variant="body2">
//             Date: {new Date(payment.date).toLocaleDateString()}
//           </Typography>
//           <Typography variant="body2">Advance: ₹  {Number(payment.advanceAmount || 0).toFixed(2)}</Typography>
//         </Box>
//         <IconButton size="small" color="error" onClick={() => handleDelete(payment._id)}>
//           <DeleteIcon fontSize="small" />
//         </IconButton>
//       </Box>
//     </Paper>
//   );

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
//             Payment Given List
//           </Typography>

//           <Box
//             display="flex"
//             flexDirection={isSmallScreen ? "column" : "row"}
//             alignItems={isSmallScreen ? "stretch" : "center"}
//             gap={2}
//             width={isSmallScreen ? "100%" : "auto"}
//           >
//             <Box flexGrow={1} width={isSmallScreen ? "100%" : "auto"} mt={2}>
//             <Button
//               variant="contained"
//               sx={{
//                 background: "linear-gradient(135deg, #182848, #324b84ff)",
//                 color: "#fff",
//                 whiteSpace: "nowrap",
//                 width: isSmallScreen ? "100%" : "auto",
//                 mr:'10px',
//               }}
//               onClick={() => setOpenDialog(true)}
//               ref={paymentGivenInputRef}
//             >
//               Add Payment
//             </Button>
//               <FilterData
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 fullWidth={isSmallScreen}
//                 // autoFocusOnMount
//               />
//             </Box>
//           </Box>
//         </Box>

//         {/* Table / Cards */}
//         {isSmallScreen ? (
//           <Box>
//             {paginatedPayments?.map((payment) => (
//               <MobilePaymentCard key={payment._id} payment={payment} />
//             ))}
//           </Box>
//         ) : (
//           <TableContainer component={Paper} elevation={3} sx={{ height: "422px" }}>
//             <Table>
//               <TableHead sx={{ backgroundColor: "lightgrey" }}>
//                 <TableRow>
//                    <TableCell align="center">
//                     <strong>Date</strong>
//                   </TableCell>
//                   <TableCell align="center">
//                     <strong>Supplier Name</strong>
//                   </TableCell>
//                   <TableCell align="center">
//                     <strong>Payment Mode</strong>
//                   </TableCell>
                 
//                   <TableCell align="center">
//                     <strong>Amount</strong>
//                   </TableCell>
//                   <TableCell align="center">
//                     <strong>Action</strong>
//                   </TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {paginatedPayments?.map((row) => (
//                   <TableRow key={row._id}>
//                     <TableCell align="center">
//                       {row.date ? new Date(row.date).toLocaleDateString() : "--"}
//                     </TableCell>
//                     <TableCell align="center">
//                       {row.client_id?.name || ''}
//                     </TableCell>
//                     <TableCell align="center">{row.paymentType}</TableCell>
//                     <TableCell align="center">₹ {Number(
//                         row.balance > 0
//                           ? row.balance
//                           : row.advanceAmount || 0
//                       ).toFixed(2)}</TableCell>
//                     <TableCell align="center">
//                       <IconButton color="error" onClick={() => handleDelete(row._id)}>
//                         <DeleteIcon />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </Box>

//       {/* Snackbar */}
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={3000}
//         onClose={() => setSnackbarOpen(false)}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//       >
//         <Alert severity="success" onClose={() => setSnackbarOpen(false)} variant="filled">
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>

//       {/* Pagination */}
//       {filteredPayments && filteredPayments.length > 0 && (
//         <PaginationComponent
//           totalPages={totalPages}
//           currentPage={currentPage}
//           onPageChange={(page) => setCurrentPage(page)}
//         />
//       )}

//       {/* Add Payment Dialog */}
//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
//         <AddPaymentGiven
//           onClose={() => setOpenDialog(false)}
//           onPaymentAdded={handlePaymentAdded}
//           organizationId={mainUser?.organization_id?._id}
//           webuser={webuser}
//         />
//       </Dialog>
//     </>
//   );
// };

// export default PaymentGivenList;




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
  Button,
  Snackbar,
  Alert,
  Dialog,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterListIcon from "@mui/icons-material/FilterList";
import { getPaymentByOrganization } from "../../services/PaymentModeService";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";
import AddPaymentGiven from "./AddPaymentGiven";

const PaymentGivenList = ({ organizationId }) => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const pageSize = 8;

  const paymentGivenInputRef = useRef(null);

  useEffect(() => {
    if (paymentGivenInputRef.current) {
      paymentGivenInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await getUserById(webuser.id);
      setMainUser(res);
    };
    fetchUser();
  }, [webuser]);

  // 🔄 refresh function to fetch payments
  const refresh = async () => {
    if (!mainUser?.organization_id?._id) return;
    setLoading(true);
    try {
      const data = await getPaymentByOrganization(mainUser.organization_id._id);
      const bills = data.data.filter((bill) => bill.forPayment === 'purchase');
      setRows(bills || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setSnackbarMessage("Failed to load payments");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [mainUser]);

  const filteredPayments = rows?.filter(
    (row) =>
      row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(row.advanceAmount || row.balance).includes(searchQuery) ||
      row.client_id?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (filteredPayments) {
      setTotalPages(Math.ceil(filteredPayments.length / pageSize));
    }
  }, [filteredPayments]);

  const paginatedPayments = filteredPayments?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      const updatedRows = rows.filter((row) => row._id !== id);
      setRows(updatedRows);
      setSnackbarMessage("Payment record deleted successfully!");
      setSnackbarOpen(true);
    }
  };

  const handlePaymentAdded = () => {
    refresh();
    setSnackbarMessage("Payment added successfully!");
    setSnackbarOpen(true);
  };

  const handleRefresh = () => {
    refresh();
    setSnackbarMessage("Refreshed payment list");
    setSnackbarOpen(true);
  };

  // Calculate totals
  const totalAmount = filteredPayments?.reduce(
    (sum, payment) => sum + (payment.balance || payment.advanceAmount || 0),
    0
  );

  // Mobile-friendly card
  const MobilePaymentCard = ({ payment }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${payment.paymentType === 'cash' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
              <span className="font-semibold text-gray-800 capitalize">{payment.paymentType}</span>
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded bg-blue-50 text-blue-700">
              ₹{Number(payment.balance > 0 ? payment.balance : payment.advanceAmount || 0).toFixed(2)}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-24 font-medium">Date:</span>
              <span>{payment.date ? new Date(payment.date).toLocaleDateString() : "--"}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-24 font-medium">Supplier:</span>
              <span className="truncate">{payment.client_id?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="w-24 font-medium">Type:</span>
              <span className="capitalize">{payment.forPayment || 'purchase'}</span>
            </div>
          </div>
        </div>
        <IconButton 
          size="small" 
          color="error" 
          onClick={() => handleDelete(payment._id)}
          className="ml-2"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Typography variant="h5" fontWeight={600} className="text-xl md:text-2xl lg:text-3xl text-gray-800 mb-1">
              Payment Given List
            </Typography>
            <p className="text-sm text-gray-600">
              Manage supplier payments and track transactions
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Refresh Button */}
            <Button
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              className="sm:hidden"
              size="small"
            >
              Refresh
            </Button>

            {/* Add Payment Button */}
            <Button
              variant="contained"
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-md"
              onClick={() => setOpenDialog(true)}
              startIcon={<AddIcon />}
            >
              <span className="hidden sm:inline">Add Payment Given</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-800">{filteredPayments?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">₹</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{totalAmount?.toFixed(2) || "0.00"}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">∑</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Page</p>
                <p className="text-2xl font-bold text-gray-800">{paginatedPayments?.length || 0} items</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">📄</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by supplier, payment mode, amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={paymentGivenInputRef}
                />
              </div>
            </div>

            {/* Filter Toggle (Mobile) */}
            <Button
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterListIcon />}
              className="sm:hidden"
              size="small"
            >
              Filters
            </Button>

            {/* Refresh Button (Desktop) */}
            <Button
              variant="outlined"
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              className="hidden sm:flex"
            >
              Refresh
            </Button>
          </div>

          {/* Additional Filters (Collapsible on Mobile) */}
          <div className={`${showFilters ? 'block' : 'hidden'} sm:block mt-4`}>
            <div className="flex flex-wrap gap-4">
              <Button
                variant={searchQuery === '' ? "contained" : "outlined"}
                size="small"
                onClick={() => setSearchQuery('')}
              >
                All Payments
              </Button>
              <Button
                variant={searchQuery === 'cash' ? "contained" : "outlined"}
                size="small"
                onClick={() => setSearchQuery('cash')}
              >
                Cash
              </Button>
              <Button
                variant={searchQuery === 'online' ? "contained" : "outlined"}
                size="small"
                onClick={() => setSearchQuery('online')}
              >
                Online
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Content Section */}
      {!loading && (
        <>
          {/* Mobile View - Cards */}
          <div className="block sm:hidden">
            {paginatedPayments?.length > 0 ? (
              paginatedPayments.map((payment) => (
                <MobilePaymentCard key={payment._id} payment={payment} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">💸</div>
                <p className="text-lg font-medium text-gray-700 mb-2">No Payments Found</p>
                <p className="text-gray-500">Add your first payment or adjust your search</p>
              </div>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden sm:block">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <TableContainer>
                <Table className="min-w-full">
                  <TableHead>
                    <TableRow className="bg-gray-50">
                      <TableCell className="font-semibold text-gray-700 text-center">Date</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-center">Supplier Name</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-center">Payment Mode</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-center">Type</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-center">Amount</TableCell>
                      <TableCell className="font-semibold text-gray-700 text-center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPayments?.length > 0 ? (
                      paginatedPayments.map((row) => (
                        <TableRow key={row._id} className="hover:bg-gray-50">
                          <TableCell className="text-center">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700">
                              {row.date ? new Date(row.date).toLocaleDateString() : "--"}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium">{row.client_id?.name || 'N/A'}</div>
                            <div className="text-xs text-gray-500">Supplier</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              row.paymentType === 'cash' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {row.paymentType}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
                              {row.forPayment || 'purchase'}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-bold text-lg text-green-600">
                              ₹{Number(row.balance > 0 ? row.balance : row.advanceAmount || 0).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <IconButton 
                              color="error" 
                              onClick={() => handleDelete(row._id)}
                              size="small"
                              className="hover:bg-red-50"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center text-gray-500">
                            <div className="text-5xl mb-4">📋</div>
                            <p className="text-xl font-medium mb-2">No Payment Records</p>
                            <p className="text-sm">Add your first payment using the "Add Payment" button</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>

          {/* Pagination */}
          {filteredPayments?.length > 0 && (
            <div className="mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredPayments.length)} of{" "}
                  {filteredPayments.length} payments
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="small"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="px-4"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        size="small"
                        onClick={() => setCurrentPage(pageNum)}
                        variant={currentPage === pageNum ? "contained" : "outlined"}
                        className="min-w-[40px]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    size="small"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="px-4"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Snackbar */}
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
          className="w-full max-w-md"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Add Payment Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={window.innerWidth < 768}
      >
        <AddPaymentGiven
          onClose={() => setOpenDialog(false)}
          onPaymentAdded={handlePaymentAdded}
          organizationId={mainUser?.organization_id?._id}
          webuser={webuser}
        />
      </Dialog>
    </div>
  );
};

export default PaymentGivenList;