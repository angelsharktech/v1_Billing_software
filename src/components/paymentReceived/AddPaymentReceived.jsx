import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Grid,
} from "@mui/material";
import { getAllUser, updateUser } from "../../services/UserService";
import { addPayment } from "../../services/PaymentModeService";

const CUSTOMER_ROLE_ID = "687883c32a1384f42ea5a1d4"; // <-- replace with actual
const SUPPLIER_ROLE_ID = "687883ba2a1384f42ea5a1d2"; // vendor role from your code

const AddPaymentReceived = ({
  onClose,
  onPaymentAdded,
  organizationId,
  webuser,
}) => {
  const [userType, setUserType] = useState("supplier"); // default supplier
  const [customerList, setCustomerList] = useState([]);
  const [supplierList, setSupplierList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [payment, setPayment] = useState({
    user: "",
    paymentType: "",
    advanceAmount: "",
    date: new Date().toISOString().split("T")[0],
    narration: "",
    openingAmount: "", // ✅ added
    closingAmount: "", // ✅ added
  });

  // When user changes
  const handleUserChange = (e) => {
    const selectedUserId = e.target.value;

    // Find selected user from either customers or suppliers
    const selectedUser = (
      userType === "customer" ? customerList : supplierList
    ).find((u) => u._id === selectedUserId);

    // Example: assume user object has openingBalance field
    const openingBalance = selectedUser?.openingAmount || 0;

    setPayment({
      ...payment,
      user: selectedUserId,
      openingAmount: openingBalance,
      closingAmount: openingBalance, // initial same as opening
    });
  };

  // When amount changes -> recalc closing balance
  const handleAmountChange = (e) => {
    const value = e.target.value;
    setPayment({
      ...payment,
      advanceAmount: value,
      closingAmount:userType === "customer" ? payment.openingAmount - Number(value) :payment.openingAmount + Number(value) , // ✅ auto calc
    });
  };
  // Fetch users (customers + suppliers)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUser();
        const customers = users.filter(
          (u) => u.role_id?._id === CUSTOMER_ROLE_ID
        );
        const suppliers = users.filter(
          (u) => u.role_id?._id === SUPPLIER_ROLE_ID
        );

        setCustomerList(customers);
        setSupplierList(suppliers);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newPayment = {
      paymentType: payment.paymentType,
      ...(userType === "customer"
    ? { advanceAmount: payment.advanceAmount }
    : { balance: payment.advanceAmount }),
      
      date: payment.date,
      client_id: payment.user,
      organization: organizationId || null,
      forPayment: userType === "customer" ? "sale" : "purchase", // ✅ differentiate
      createdBy: webuser?.id || null,
      narration: "Payment Received",
      closingAmount: payment.closingAmount ,
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>Payment Received</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {/* Radio: Customer or Supplier */}
          <RadioGroup
            row
            value={userType}
            onChange={(e) => {
              setUserType(e.target.value);
              setPayment({ ...payment, user: "" }); // reset user when switching
            }}
          >
            <FormControlLabel
              value="customer"
              control={<Radio />}
              label="Customer"
            />
            <FormControlLabel
              value="supplier"
              control={<Radio />}
              label="Supplier"
            />
            
          </RadioGroup>
          {/* Date */}
          <TextField
            label="Date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={payment.date}
            onChange={(e) => setPayment({ ...payment, date: e.target.value })}
            fullWidth
            required
          />

          {/* Select Customer or Supplier */}
          <TextField
            select
            label={
              userType === "customer" ? "Select Customer" : "Select Supplier"
            }
            value={payment.user}
            onChange={handleUserChange}
            // onChange={(e) => setPayment({ ...payment, user: e.target.value })}
            fullWidth
            required
          >
            {(userType === "customer" ? customerList : supplierList).map(
              (u) => (
                <MenuItem key={u._id} value={u._id}>
                  {u.first_name} {u.last_name}
                </MenuItem>
              )
            )}
          </TextField>
          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            value={payment.advanceAmount}
            onChange={handleAmountChange} // ✅ updated
            fullWidth
            required
          />
          {/* Payment Mode */}
          <TextField
            select
            label="Payment Mode"
            value={payment.paymentType}
            onChange={(e) =>
              setPayment({ ...payment, paymentType: e.target.value })
            }
            fullWidth
            required
          >
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="online">Online</MenuItem>
          </TextField>
{/* 
          <TextField
            label="Narration"
            value={payment.narration}
            onChange={(e) =>
              setPayment({ ...payment, narration: e.target.value })
            }
            fullWidth
            required
          /> */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Opening Amount"
                value={payment.openingAmount}
                InputProps={{ readOnly: true }} // ✅ readonly autofill
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Closing Amount"
                value={payment.closingAmount}
                InputProps={{ readOnly: true }} // ✅ readonly autofill
                fullWidth
              />
            </Grid>
          </Grid>
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
        >
          Save
        </Button>
      </DialogActions>
    </>
  );
};

export default AddPaymentReceived;
