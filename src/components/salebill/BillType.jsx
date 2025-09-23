import React from "react";
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
  getRef, // ✅ from parent
  handleKeyDown,
}) => {
  return (
    <Box p={2} border="1px solid #ddd" borderRadius="8px" width={1200}>
      <Typography variant="h6" gutterBottom>
        Bill Details
      </Typography>
      <Divider sx={{ mb: 2 }} />

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
              slotProps={{
      textField: {
        inputRef: getRef(1),
        onKeyDown: (e) => handleKeyDown(e, 1, totalFields), // totalFields = number of fields in all components if you want global
      },
      inputProps: {
        tabIndex: 20, // optional, ensures proper tab order
      },
    }}
          />
        </LocalizationProvider>
      </Box>

      <FormControl component="fieldset">
        <Typography variant="subtitle1">Bill Type</Typography>
        <RadioGroup
          row
          value={billType}
          onChange={(e) => setBillType(e.target.value)}
        >
          <FormControlLabel
            value="gst"
            control={
              <Radio
                inputRef={getRef(2)} // ✅ ref for Non-GST radio
                onKeyDown={(e) => handleKeyDown(e, 2, totalFields)}
              />
            }
            label="GST Bill"
          />
          <FormControlLabel
            value="nongst"
            control={
              <Radio
                inputRef={getRef(3)} // ✅ ref for Non-GST radio
                onKeyDown={(e) => handleKeyDown(e, 3, totalFields)}
              />
            }
            label="Non-GST Bill"
          />
        </RadioGroup>
      </FormControl>

      {/* Within State / Out of State */}
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
                control={
                  <Radio
                    inputRef={getRef(4)} // ✅ within radio
                    onKeyDown={(e) => handleKeyDown(e, 4, totalFields)}
                  />
                }
                label="Within State"
              />
              <FormControlLabel
                value="out"
                control={
                  <Radio
                    inputRef={getRef(5)} // ✅ within radio
                    onKeyDown={(e) => handleKeyDown(e, 5, totalFields)}
                  />
                }
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
