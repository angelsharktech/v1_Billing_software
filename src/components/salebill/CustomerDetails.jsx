import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Divider,
  Autocomplete,
} from "@mui/material";

const CustomerDetails = ({
  customer,
  isExistingCustomer,
  handleMobile,
  handleCustomerSelection,
  errors,
  setErrors,
  setCustomer,
  gstDetails,
  billType,
  setGstDetails,
  customerList = [],
  getRef, // ✅ from parent
  handleKeyDown,
  // totalFields
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
            typeof option === "string" ? option : option.name + " "
          }
          value={
            customerList.find((s) => s.name === customer.name) ||
            customer.name ||
            "" // keep typed value for new customer
          }
          onChange={(event, newValue) => {
            if (typeof newValue === "string") {
              // User typed a new vendor name
              handleCustomerSelection(newValue, "name");
            } else if (newValue && newValue.name) {
              // Selected existing vendor
              handleCustomerSelection(newValue.name, "name");
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
              inputRef={getRef(5)} // ✅ index 5
              onKeyDown={(e) => handleKeyDown(e, 5, totalFields)} // 20 = total fields across all components
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
            inputRef={getRef(6)} // ✅ index 5
            onKeyDown={(e) => handleKeyDown(e, 6, totalFields)}
          />
        </Grid>

        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Address"
            fullWidth
            value={customer.address}
            onChange={(e) =>
              setCustomer({ ...customer, address: e.target.value })
            }
            disabled={isExistingCustomer}
            inputRef={getRef(7)} // ✅ index 7
            onKeyDown={(e) => handleKeyDown(e, 7, totalFields)}
          />
        </Grid>
        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Current Balance"
            fullWidth
            value={customer.openingAmount}
            onChange={(e) =>
              setCustomer({ ...customer, openingAmount: e.target.value })
            }
            disabled={isExistingCustomer}
            inputRef={getRef(8)} // ✅ index 8
            onKeyDown={(e) => handleKeyDown(e, 8, totalFields)}
          />
        </Grid>
        <Grid container spacing={2} mt={1}>
          {billType === "gst" && (
            <>
              {Object.entries(gstDetails).map(([key, value], i) => (
                <Grid item xs={12} sm={6} key={key} width={200}>
                  <TextField
                    fullWidth
                    label={
                      key === "legalName"
                        ? "Business Name"
                        : key === "gstNumber"
                        ? "GST Number"
                        : key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (s) => s.toUpperCase())
                    }
                    name={key}
                    value={value}
                    onChange={(e) => {
                      const newValue = e.target.value;

                      setGstDetails((prev) => ({
                        ...prev,
                        [key]: newValue,
                      }));

                      if (key === "gstNumber") {
                        const gstPattern =
                          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
                        if (newValue && !gstPattern.test(newValue)) {
                          setErrors((prev) => ({
                            ...prev,
                            gstNumber: "Invalid GST number format",
                          }));
                        } else {
                          setErrors((prev) => ({ ...prev, gstNumber: "" }));
                        }
                      }
                    }}
                    error={key === "gstNumber" && Boolean(errors?.gstNumber)}
                    helperText={key === "gstNumber" ? errors?.gstNumber : ""}
                    inputRef={getRef(9 + i)} // ✅ start index 9, increment for each GST field
                    onKeyDown={(e) => handleKeyDown(e, 9 + i, totalFields)}
                  />
                </Grid>
              ))}
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerDetails;
