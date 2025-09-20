import React, { useMemo } from "react";
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  Typography,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import moment from "moment";
const BillType = ({
  billType,
  setBillType,
  isWithinState,
  setIsWithinState,
  billDate,
  setBillDate,
}) => {
  return (
    <Box p={2} border="1px solid #ddd" borderRadius="8px" width={1100}>
      <Typography variant="h6" gutterBottom>
        Bill Details
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {/* <Box mb={4}>
        <Typography variant="subtitle1">Bill Date</Typography>
        <TextField
          type="date"
          value={billDate}
          onChange={(e) => setBillDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box> */}
      <Box mb={4}>
        {/* <Typography variant="subtitle1">Bill Date</Typography> */}
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <DatePicker
            label="Bill Date"
            value={moment(billDate, "DD-MM-YYYY")}
            onChange={(newValue) =>
              setBillDate(moment(newValue).format("DD-MM-YYYY"))
            }
            format="DD-MM-YYYY"
          />
        </LocalizationProvider>
      </Box>

      {/* Bill Type  */}
      <FormControl component="fieldset">
        <Typography variant="subtitle1">Bill Type</Typography>
        <RadioGroup
          row
          value={billType}
          onChange={(e) => setBillType(e.target.value)}
        >
          <FormControlLabel value="gst" control={<Radio />} label="GST Bill" />
          <FormControlLabel
            value="nongst"
            control={<Radio />}
            label="Non-GST Bill"
          />
        </RadioGroup>
      </FormControl>

      {/* Supply Type (only for GST) */}
      {billType === "gst" && (
        <Box mt={3}>
          <FormControl component="fieldset">
            <Typography variant="subtitle1">Billing Location</Typography>
            <RadioGroup
              row
              value={isWithinState ? "within" : "out"} // <-- now string for UI
              onChange={(e) => setIsWithinState(e.target.value === "within")}
            >
              <FormControlLabel
                value="within"
                control={<Radio />}
                label="Within State"
              />
              <FormControlLabel
                value="out"
                control={<Radio />}
                label="Out of State"
              />
            </RadioGroup>
          </FormControl>
        </Box>
      )}
    </Box>
  );
};

export default BillType;
