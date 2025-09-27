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
  setGstDetails,gstDetails,
  errors,
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
              typeof option === "string"
                ? option
                : option.first_name + " " + (option.last_name || "")
            }
            value={
              supplierList.find((s) => s.first_name === vendor.first_name) ||
              vendor.first_name ||
              "" // keep typed value for new vendors
            }
            onChange={(event, newValue) => {
              if (typeof newValue === "string") {
                // User typed a new vendor name
                handleVendorSelection(newValue, "name");
              } else if (newValue && newValue.first_name) {
                // Selected existing vendor
                handleVendorSelection(newValue.first_name, "name");
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

        {/* Vendor Gst Details */}
        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="GST Number"
            fullWidth
            value={gstDetails?.gstNumber || ""}
            onChange={(e) => setGstDetails({ ...gstDetails, gstNumber: e.target.value })}
            disabled={isExistingVendor}
          />
          
        </Grid>
        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Legal Name"
            fullWidth
            value={gstDetails?.legalName || ""}
            onChange={(e) => setGstDetails({ ...gstDetails, legalName: e.target.value })}
            disabled={isExistingVendor}
          />
          
        </Grid>
        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="State"
            fullWidth
            value={gstDetails?.state || ""}
            onChange={(e) => setGstDetails({ ...gstDetails, state: e.target.value })}
            disabled={isExistingVendor}
          />
          
        </Grid>
        {/* <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="State Code"
            fullWidth
            value={gstDetails?.stateCode || ""}
            onChange={(e) => setGstDetails({ ...gstDetails, stateCode: e.target.value })}
            disabled={isExistingVendor}
          />
          
        </Grid> */}
        <Grid item xs={12} sm={4} width={200}>
          <TextField
            label="Opening Balance"
            fullWidth
            value={vendor.openingAmount || ""}
            onChange={(e) => setVendor({ ...vendor, openingAmount: e.target.value })}
            disabled={isExistingVendor}
          />
          
        </Grid>

      </Grid>
    </Box>
  );
};

export default VendorDetails;
