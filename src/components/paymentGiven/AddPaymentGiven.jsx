// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   MenuItem,
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   Grid,
//   IconButton,
// } from "@mui/material";
// import { getAllUser, updateUser } from "../../services/UserService";
// import { addPayment } from "../../services/PaymentModeService";
// import CloseIcon from "@mui/icons-material/Close";

// const CUSTOMER_ROLE_ID = "687883c32a1384f42ea5a1d4"; // <-- replace with actual
// const SUPPLIER_ROLE_ID = "687883ba2a1384f42ea5a1d2"; // vendor role from your code

// const AddPaymentGiven = ({
//   onClose,
//   onPaymentAdded,
//   organizationId,
//   webuser,
// }) => {
//   const [userType, setUserType] = useState("supplier"); // default supplier
//   const [customerList, setCustomerList] = useState([]);
//   const [supplierList, setSupplierList] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [payment, setPayment] = useState({
//     user: "",
//     paymentType: "",
//     advanceAmount: "",
//     date: new Date().toISOString().split("T")[0],
//     narration: "",
//     openingAmount: "", // ✅ added
//     closingAmount: "", // ✅ added
//   });

//   // When user changes
//   const handleUserChange = (e) => {
//     const selectedUserId = e.target.value;

//     // Find selected user from either customers or suppliers
//     const selectedUser = (
//       userType === "customer" ? customerList : supplierList
//     ).find((u) => u._id === selectedUserId);

//     // Example: assume user object has openingBalance field
//     const openingBalance = selectedUser?.openingAmount || 0;

//     setPayment({
//       ...payment,
//       user: selectedUserId,
//       openingAmount: openingBalance.toFixed(2),
//       closingAmount: openingBalance.toFixed(2), // initial same as opening
//     });
//   };

//   // When amount changes -> recalc closing balance
// const handleAmountChange = (e) => {
//   const rawValue = e.target.value;
//   const value = parseFloat(rawValue) || 0; // safely convert to number
//   const opening = Number(payment.openingAmount || 0);

//   const closing =
//     userType === "customer" ? opening + value : opening - value;

//   setPayment({
//     ...payment,
//     advanceAmount: rawValue, // keep it as string for typing
//     closingAmount: closing.toFixed(2),
//   });
// };

//   // Fetch users (customers + suppliers)
//   useEffect(() => {
//     const fetchUsers = async () => {
//       try {
//         const users = await getAllUser();
//         const customers = users.filter(
//           (u) => u.role_id?._id === CUSTOMER_ROLE_ID
//         );
//         const suppliers = users.filter(
//           (u) => u.role_id?._id === SUPPLIER_ROLE_ID
//         );

//         setCustomerList(customers);
//         setSupplierList(suppliers);
//       } catch (err) {
//         console.error("Failed to fetch users:", err);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formattedPayment = {
//     ...payment,
//     // Ensure all amounts are stored with 2 decimals and as numbers
//     advanceAmount: Number(Number(payment.advanceAmount || 0).toFixed(2)),
//     openingAmount: Number(Number(payment.openingAmount || 0).toFixed(2)),
//     closingAmount: Number(Number(payment.closingAmount || 0).toFixed(2)),
//   };

//   const newPayment = {
//     paymentType: formattedPayment.paymentType,
//     ...(userType === "customer"
//       ? { balance: formattedPayment.advanceAmount }
//       : { advanceAmount: formattedPayment.advanceAmount }),

//     date: formattedPayment.date,
//     client_id: formattedPayment.user,
//     organization: organizationId || null,
//     forPayment: userType === "customer" ? "sale" : "purchase",
//     createdBy: webuser?.id || null,
//     narration: "Payment Given",
//     closingAmount: formattedPayment.closingAmount,
//   };

//     try {
//       setLoading(true);
//       const savedPayment = await addPayment(newPayment);
//       if (savedPayment.success === true) {
//         const res = await updateUser(payment.user, {
//           openingAmount: payment.closingAmount,
//         });
//         onPaymentAdded();
//         onClose();
//       }
//     } catch (error) {
//       console.error("Error adding payment:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <>
//       <DialogTitle>Payment Given</DialogTitle>
//       <IconButton
//         aria-label="close"
//         onClick={onClose}
//         sx={{
//           position: "absolute",
//           right: 8,
//           top: 8,
//           color: (theme) => theme.palette.grey[500],
//         }}
//       >
//         <CloseIcon />
//       </IconButton>
//       <DialogContent dividers>
//         <Box display="flex" flexDirection="column" gap={2} mt={1}>
//           {/* Radio: Customer or Supplier */}
//           <RadioGroup
//             row
//             value={userType}
//             onChange={(e) => {
//               setUserType(e.target.value);
//               setPayment({ ...payment, user: "" }); // reset user when switching
//             }}
//           >
//             <FormControlLabel
//               value="supplier"
//               control={<Radio />}
//               label="Supplier"
//             />
//             <FormControlLabel
//               value="customer"
//               control={<Radio />}
//               label="Customer"
//             />
//           </RadioGroup>
//           {/* Date */}
//           <TextField
//             label="Date"
//             type="date"
//             InputLabelProps={{ shrink: true }}
//             value={payment.date}
//             onChange={(e) => setPayment({ ...payment, date: e.target.value })}
//             fullWidth
//             required
//           />

//           {/* Select Customer or Supplier */}
//           <TextField
//             select
//             label={
//               userType === "customer" ? "Select Customer" : "Select Supplier"
//             }
//             value={payment.user}
//             onChange={handleUserChange}
//             // onChange={(e) => setPayment({ ...payment, user: e.target.value })}
//             fullWidth
//             required
//           >
//             {(userType === "customer" ? customerList : supplierList).map(
//               (u) => (
//                 <MenuItem key={u._id} value={u._id}>
//                   {u.name}
//                 </MenuItem>
//               )
//             )}
//           </TextField>
//           {/* Amount */}
//           <TextField
//             label="Amount"
//             type="number"
//             value={payment.advanceAmount}
//             onChange={handleAmountChange} // ✅ updated
//             fullWidth
//             required
//           />
//           {/* Payment Mode */}
//           <TextField
//             select
//             label="Payment Mode"
//             value={payment.paymentType}
//             onChange={(e) =>
//               setPayment({ ...payment, paymentType: e.target.value })
//             }
//             fullWidth
//             required
//           >
//             <MenuItem value="cash">Cash</MenuItem>
//             <MenuItem value="online">Online</MenuItem>
//           </TextField>

//           {/* <TextField
//             label="Narration"
//             value={payment.narration}
//             onChange={(e) =>
//               setPayment({ ...payment, narration: e.target.value })
//             }
//             fullWidth
//             required
//           /> */}
//           <Grid container spacing={2}>
//             <Grid item xs={6}>
//               <TextField
//                 label="Opening Balance"
//                 value={payment.openingAmount}
//                 InputProps={{ readOnly: true }} // ✅ readonly autofill
//                 fullWidth
//               />
//             </Grid>
//             <Grid item xs={6}>
//               <TextField
//                 label="Closing Balance"
//                 value={payment.closingAmount}
//                 InputProps={{ readOnly: true }} // ✅ readonly autofill
//                 fullWidth
//               />
//             </Grid>
//           </Grid>
//         </Box>
//       </DialogContent>

//       <DialogActions>
//         <Button onClick={onClose} color="secondary" disabled={loading}>
//           Cancel
//         </Button>
//         <Button
//           type="submit"
//           variant="contained"
//           color="primary"
//           onClick={handleSubmit}
//         >
//           Save
//         </Button>
//       </DialogActions>
//     </>
//   );
// };

// export default AddPaymentGiven;


import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import { getAllUser, updateUser } from "../../services/UserService";
import { addPayment } from "../../services/PaymentModeService";
import CloseIcon from "@mui/icons-material/Close";

const AddPaymentGiven = ({
  onClose,
  onPaymentAdded,
  organizationId,
  webuser,
}) => {
  const [userType, setUserType] = useState("supplier");
  const [customerList, setCustomerList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [error, setError] = useState("");

  const [payment, setPayment] = useState({
    user: "",
    paymentType: "",
    advanceAmount: "",
    date: new Date().toISOString().split("T")[0],
    narration: "",
    openingAmount: "",
    closingAmount: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!payment.date) newErrors.date = "Date is required";
    if (!payment.user) newErrors.user = `${userType === "customer" ? "Customer" : "Supplier"} is required`;
    if (!payment.advanceAmount || parseFloat(payment.advanceAmount) <= 0) 
      newErrors.advanceAmount = "Valid amount is required";
    if (!payment.paymentType) newErrors.paymentType = "Payment mode is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserChange = (e) => {
    const selectedUserId = e.target.value;
    const userList = userType === "customer" ? customerList : supplierList;
    const selectedUser = userList.find((u) => u._id === selectedUserId);

    const openingBalance = Number(selectedUser?.openingAmount || 0).toFixed(2);

    setPayment({
      ...payment,
      user: selectedUserId,
      openingAmount: openingBalance,
      closingAmount: openingBalance,
    });
    
    if (errors.user) {
      setErrors({...errors, user: ""});
    }
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    const value = parseFloat(rawValue) || 0;
    const opening = Number(payment.openingAmount || 0);

    const closing = userType === "customer" ? opening + value : opening - value;

    setPayment({
      ...payment,
      advanceAmount: rawValue,
      closingAmount: closing.toFixed(2),
    });
    
    if (errors.advanceAmount) {
      setErrors({...errors, advanceAmount: ""});
    }
  };

  const handleFieldChange = (field, value) => {
    setPayment({
      ...payment,
      [field]: value,
    });
    
    if (errors[field]) {
      setErrors({...errors, [field]: ""});
    }
  };

  // Fetch users (customers + suppliers)
  useEffect(() => {
    const fetchUsers = async () => {
      setFetchingUsers(true);
      try {
        const users = await getAllUser();
        console.log("🔍 DEBUG AddPaymentGiven - All users:", users);
        
        // Debug: Show all user role information
        users.forEach((user, index) => {
          console.log(`User ${index}: ${user.name || 'No Name'}`, {
            id: user._id,
            role_id: user.role_id,
            role_id_type: typeof user.role_id,
            role_id_id: user.role_id?._id,
            role_id_string: user.role_id, // if it's a string
            role_name: user.role_id?.role_name || user.role_name
          });
        });

        // Try multiple approaches to find customers
        let customers = [];
        let suppliers = [];
        
        // First try: Check if role_id is an object with _id
        customers = users.filter(u => {
          if (!u.role_id) return false;
          if (typeof u.role_id === 'object' && u.role_id._id) {
            return u.role_id._id === "687883c32a1384f42ea5a1d4";
          }
          // Try as string
          return u.role_id === "687883c32a1384f42ea5a1d4";
        });

        suppliers = users.filter(u => {
          if (!u.role_id) return false;
          if (typeof u.role_id === 'object' && u.role_id._id) {
            return u.role_id._id === "687883ba2a1384f42ea5a1d2";
          }
          // Try as string
          return u.role_id === "687883ba2a1384f42ea5a1d2";
        });

        console.log("✅ Customers found (by ID):", customers.length, customers);
        console.log("✅ Suppliers found (by ID):", suppliers.length, suppliers);

        // If no users found by ID, try by role name
        if (customers.length === 0) {
          console.log("⚠️ No customers found by ID, trying by role name...");
          const possibleCustomers = users.filter(u => {
            const roleName = u.role_id?.role_name || u.role_name || '';
            return roleName.toLowerCase().includes('customer') || 
                   roleName.toLowerCase().includes('client');
          });
          console.log("Customers by name:", possibleCustomers);
          setCustomerList(possibleCustomers);
        } else {
          setCustomerList(customers);
        }

        if (suppliers.length === 0) {
          console.log("⚠️ No suppliers found by ID, trying by role name...");
          const possibleSuppliers = users.filter(u => {
            const roleName = u.role_id?.role_name || u.role_name || '';
            return roleName.toLowerCase().includes('supplier') || 
                   roleName.toLowerCase().includes('vendor');
          });
          console.log("Suppliers by name:", possibleSuppliers);
          setSupplierList(possibleSuppliers);
        } else {
          setSupplierList(suppliers);
        }

        // If still no users, show all users for debugging
        if (customers.length === 0 && suppliers.length === 0) {
          console.log("⚠️ No users found with any role criteria. Showing all users for debugging.");
          setCustomerList(users.slice(0, 10)); // Show first 10 users
          setSupplierList(users.slice(0, 10)); // Show first 10 users
        }

      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError(`Failed to load users: ${err.message}`);
      } finally {
        setFetchingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const formattedPayment = {
      ...payment,
      advanceAmount: Number(Number(payment.advanceAmount || 0).toFixed(2)),
      openingAmount: Number(Number(payment.openingAmount || 0).toFixed(2)),
      closingAmount: Number(Number(payment.closingAmount || 0).toFixed(2)),
    };

    const newPayment = {
      paymentType: formattedPayment.paymentType,
      ...(userType === "customer"
        ? { balance: formattedPayment.advanceAmount }
        : { advanceAmount: formattedPayment.advanceAmount }),

      date: formattedPayment.date,
      client_id: formattedPayment.user,
      organization: organizationId || null,
      forPayment: userType === "customer" ? "sale" : "purchase",
      createdBy: webuser?.id || null,
      narration: "Payment Given",
      closingAmount: formattedPayment.closingAmount,
    };

    try {
      setLoading(true);
      const savedPayment = await addPayment(newPayment);
      if (savedPayment.success === true) {
        const res = await updateUser(payment.user, {
          openingAmount: payment.closingAmount,
        });
        onPaymentAdded();
        onClose();
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      setError("Failed to save payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentUserList = userType === "customer" ? customerList : supplierList;
  const hasUsers = currentUserList.length > 0;

  return (
    <>
      <DialogTitle>
        Payment Given
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {/* User Type Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              Who are you paying? *
            </label>
            <Box display="flex" gap={2}>
              <Button
                variant={userType === "supplier" ? "contained" : "outlined"}
                onClick={() => {
                  setUserType("supplier");
                  setPayment({ ...payment, user: "" });
                }}
                fullWidth
              >
                Supplier
              </Button>
              <Button
                variant={userType === "customer" ? "contained" : "outlined"}
                onClick={() => {
                  setUserType("customer");
                  setPayment({ ...payment, user: "" });
                }}
                fullWidth
              >
                Customer
              </Button>
            </Box>
          </div>
          
          {/* Date */}
          <TextField
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={payment.date}
            onChange={(e) => handleFieldChange("date", e.target.value)}
            error={!!errors.date}
            helperText={errors.date}
            fullWidth
            required
          />

          {/* Select Customer or Supplier */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
              {userType === "customer" ? "Select Customer" : "Select Supplier"} *
            </label>
            {fetchingUsers ? (
              <Box display="flex" alignItems="center" gap={1} p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                <CircularProgress size={20} />
                <span style={{ fontSize: '14px' }}>Loading users...</span>
              </Box>
            ) : !hasUsers ? (
              <Alert severity="warning">
                No {userType === "customer" ? "customers" : "suppliers"} found.
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Please check browser console for debugging information.
                </div>
              </Alert>
            ) : (
              <TextField
                select
                value={payment.user}
                onChange={handleUserChange}
                error={!!errors.user}
                helperText={errors.user}
                fullWidth
                required
              >
                <MenuItem value="">
                  <em>Select {userType === "customer" ? "Customer" : "Supplier"}</em>
                </MenuItem>
                {currentUserList.map((u) => (
                  <MenuItem key={u._id} value={u._id}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{u.name || 'Unnamed User'}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {u.phone && `Phone: ${u.phone} • `}
                        Role: {u.role_id?.role_name || (typeof u.role_id === 'string' ? u.role_id : 'No role')}
                      </div>
                    </div>
                  </MenuItem>
                ))}
              </TextField>
            )}
          </div>

          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            value={payment.advanceAmount}
            onChange={handleAmountChange}
            error={!!errors.advanceAmount}
            helperText={errors.advanceAmount}
            fullWidth
            required
            inputProps={{ step: "0.01", min: "0" }}
          />
          
          {/* Payment Mode */}
          <TextField
            select
            label="Payment Mode"
            value={payment.paymentType}
            onChange={(e) => handleFieldChange("paymentType", e.target.value)}
            error={!!errors.paymentType}
            helperText={errors.paymentType}
            fullWidth
            required
          >
            <MenuItem value="">
              <em>Select Payment Mode</em>
            </MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="online">Online</MenuItem>
          </TextField>

          {/* Balance Summary */}
          {payment.user && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Opening Balance"
                  value={payment.openingAmount}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Closing Balance"
                  value={payment.closingAmount}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={loading || !payment.user || !hasUsers}
        >
          {loading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              <span>Saving...</span>
            </Box>
          ) : (
            `Save Payment`
          )}
        </Button>
      </DialogActions>
    </>
  );
};

export default AddPaymentGiven;