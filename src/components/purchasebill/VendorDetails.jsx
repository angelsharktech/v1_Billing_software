import React from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Divider,
  MenuItem,
  Autocomplete,
} from "@mui/material";

const VendorDetails = ({
  vendor,
  isExistingVendor,
  handleVendorSelection,
  setVendor,
  setGstDetails,
  gstDetails,
  errors,
  billType,
  setErrors,
  supplierList = [],
}) => {
  return (
    <Box mt={3}>
      <Typography variant="h6">Supplier Details</Typography>
      <Divider />
      <Grid container spacing={2} mt={4}>
        {/* Supplier Name Dropdown */}

        <Grid item xs={12} sm={4}>
          <Autocomplete
            freeSolo // allows typing values not in list
            options={supplierList}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            value={
              supplierList.find((s) => s.name === vendor.name) ||
              vendor.name ||
              "" // keep typed value for new vendors
            }
            onChange={(event, newValue) => {
              if (typeof newValue === "string") {
                // User typed a new vendor name
                handleVendorSelection(newValue, "name");
              } else if (newValue && newValue.name) {
                // Selected existing vendor
                handleVendorSelection(newValue.name, "name");
              }
            }}
            onInputChange={(event, newInputValue) => {
              // This handles typing live into the field
              if (event && event.type === "change") {
                handleVendorSelection(newInputValue, "name");
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
                label="Supplier Name"
                sx={{ width: "200px" }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Mobile Number"
            fullWidth
            value={vendor.phone_number}
            onChange={(e) => handleVendorSelection(e.target.value, "phone")}
            error={Boolean(errors.phone_number)}
            helperText={errors.phone_number}
          />
        </Grid>

        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Address"
            fullWidth
            value={vendor.address}
            onChange={(e) => setVendor({ ...vendor, address: e.target.value })}
            disabled={isExistingVendor}
          />
        </Grid>
        <Grid item xs={12} sm={4} width={200}>
          <TextField
            fullWidth
            label="Current Balance "
            value={vendor.openingAmount}
            onChange={(e) =>
              setVendor({ ...vendor, openingAmount: e.target.value })
            }
            disabled={isExistingVendor}
          />
        </Grid>
        {/* Vendor Gst Details */}
        {billType === "gst" && (
          <>
            {Object.entries(gstDetails).map(([key, value], i) => (
              <Grid item xs={12} sm={6} key={key} width={200}>
                <TextField
                  fullWidth
                  label={
                    key === "legalName"
                      ? "Business Name"
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
                 
                />
              </Grid>
            ))}
          </>
        )}
        {/* <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="State Code"
            fullWidth
            value={gstDetails?.stateCode || ""}
            onChange={(e) => setGstDetails({ ...gstDetails, stateCode: e.target.value })}
            disabled={isExistingVendor}
          />
          
        </Grid> */}

        {/* <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="State Code"
            fullWidth
            value={gstDetails?.stateCode || ""}
            onChange={(e) => {
              const newValue = e.target.value;

              setGstDetails({ ...gstDetails, stateCode: newValue });

              // ✅ validate only for 2-digit state code
              const stateCodeRegex = /^\d{2}$/;
              if (!stateCodeRegex.test(newValue)) {
                setErrors((prev) => ({
                  ...prev,
                  stateCode: "State Code must be exactly 2 digits",
                }));
              } else {
                setErrors((prev) => ({ ...prev, stateCode: "" }));
              }
            }}
            error={Boolean(errors.stateCode)}
            helperText={errors.stateCode}
            disabled={isExistingVendor}
          />
        </Grid> */}
      </Grid>
    </Box>
  );
};

export default VendorDetails;
