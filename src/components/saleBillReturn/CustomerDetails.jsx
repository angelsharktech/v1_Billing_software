import React from 'react';
import { Box, Grid, TextField, Typography, Divider, Autocomplete } from '@mui/material';

const CustomerDetails = ({
  customer,
  isExistingCustomer,
  handleMobile,
  handleCustomerSelection,
  errors,
  setCustomer,
  gstDetails,
  setGstDetails ,
  customerList = [],
}) => {
  return (
    <Box mt={3}>
      <Typography variant="h6">Customer Details</Typography>
      <Divider />
      <Grid container spacing={2} mt={4}>
          <Autocomplete
            freeSolo // allows typing values not in list
            options={customerList}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : option.first_name + " " + (option.last_name || "")
            }
            value={
              customerList.find((s) => s.first_name === customer.first_name) ||
              customer.first_name ||
              "" // keep typed value for new customer
            }
            onChange={(event, newValue) => {
              if (typeof newValue === "string") {
                // User typed a new vendor name
                handleCustomerSelection(newValue, "name");
              } else if (newValue && newValue.first_name) {
                // Selected existing vendor
                handleCustomerSelection(newValue.first_name, "name");
              }
            }}
            onInputChange={(event, newInputValue) => {
              // This handles typing live into the field
              if (event && event.type === "change") {
                handleCustomerSelection(newInputValue, "name");
              }
            }}
            ListboxProps={{
              style: {
                maxHeight: 300,
                overflowY: "auto",
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer Name"
                sx={{ width: "200px" }}
              />
            )}
          />


        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Mobile Number"
            fullWidth
            value={customer.phone_number}
            onChange={(e) => handleCustomerSelection(e.target.value, "phone")}
            error={Boolean(errors.phone_number)}
            helperText={errors.phone_number}
          />
        </Grid>
       
        <Grid item xs={12} sm={4}width={200}>
          <TextField
            label="Address"
            fullWidth
            value={customer.address}
            onChange={(e) =>
              setCustomer({ ...customer, address: e.target.value })
            }
            disabled={isExistingCustomer}
          />
        </Grid>
        <Grid item xs={12} sm={4}width={200}>
          <TextField
            label="Opening Balance"
            fullWidth
            value={customer.openingAmount}
            onChange={(e) =>
              setCustomer({ ...customer, openingAmount: e.target.value })
            }
            disabled={isExistingCustomer}
          />
        </Grid>
        <Grid container spacing={2} mt={1}>
          {Object.entries(gstDetails).map(([key, value]) => (
            <Grid item xs={12} sm={6} key={key} width={200}>
              <TextField
                fullWidth
                label={key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (s) => s.toUpperCase())}
                name={key}
                value={value}
                onChange={(e) =>
                  setGstDetails((prev) => ({
                    ...prev,
                    [key]: e.target.value,
                  }))
                }
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDetails;