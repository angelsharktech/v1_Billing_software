// import React, { useState, useEffect, useMemo } from "react";
// import {
//   Box,
//   Grid,
//   TextField,
//   MenuItem,
//   RadioGroup,
//   Radio,
//   FormControlLabel,
//   FormControl,
//   Typography,
//   Divider,
// } from "@mui/material";

// const BillType = ({
//   billType,
//   setBillType,
//   gstPercent,
//   setGstPercent,
//   state,
//   totals, // expect at least: { subtotal }
//   isWithinState, // Receive from parent
//   setIsWithinState, // Receive from parent
// }) => {
//   const computed = useMemo(() => {
//     const subtotal = Number(totals?.subtotal || 0);
//     const rate = billType === "gst" ? Number(gstPercent || 0) : 0;
//     const gstAmount = +(subtotal * (rate / 100)).toFixed(2);

//     if (billType !== "gst") {
//       return {
//         subtotal,
//         cgstPercent: 0,
//         sgstPercent: 0,
//         igstPercent: 0,
//         cgst: 0,
//         sgst: 0,
//         igst: 0,
//         gstTotal: 0,
//         grandTotal: +(subtotal).toFixed(2),
//       };
//     }

//     if (isWithinState) {
//       // split percentage and amount
//       const cgstPercent = +(rate / 2).toFixed(2);
//       const sgstPercent = +(rate / 2).toFixed(2);
//       const cgst = +(subtotal * (cgstPercent / 100)).toFixed(2);
//       // ensure sum equals gstAmount (handle rounding)
//       const sgst = +(gstAmount - cgst).toFixed(2);

//       return {
//         subtotal,
//         cgstPercent,
//         sgstPercent,
//         igstPercent: 0,
//         cgst,
//         sgst,
//         igst: 0,
//         gstTotal: +(cgst + sgst).toFixed(2),
//         grandTotal: +(subtotal + cgst + sgst).toFixed(2),
//       };
//     } else {
//       const igstPercent = +rate.toFixed(2);
//       const igst = gstAmount;

//       return {
//         subtotal,
//         cgstPercent: 0,
//         sgstPercent: 0,
//         igstPercent,
//         cgst: 0,
//         sgst: 0,
//         igst,
//         gstTotal: igst,
//         grandTotal: +(subtotal + igst).toFixed(2),
//       };
//     }
//   }, [totals?.subtotal, gstPercent, billType, isWithinState]);

//   return (
//     <Box mt={3}>
//       <Typography variant="h6">Bill Type</Typography>
//       <Divider sx={{ mb: 2 }} />

//       <FormControl>
//         <RadioGroup
//           row
//           value={billType}
//           onChange={(e) => setBillType(e.target.value)}
//         >
//           <FormControlLabel value="gst" control={<Radio />} label="GST" />
//           <FormControlLabel value="non-gst" control={<Radio />} label="Non-GST" />
//         </RadioGroup>
//       </FormControl>

//       {billType === "gst" && (
//         <Box mt={2}>
//           <Typography variant="subtitle2">Supply Type</Typography>
//           <FormControl>
//             <RadioGroup
//               row
//               value={isWithinState ? "within" : "out"}
//               onChange={(e) => setIsWithinState(e.target.value === "within")}
//             >
//               <FormControlLabel value="within" control={<Radio />} label="Within State" />
//               <FormControlLabel value="out" control={<Radio />} label="Out of State" />
//             </RadioGroup>
//           </FormControl>
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default BillType;

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
  setBillDate,
  billDate,
}) => {
  return (
    <Box p={2} border="1px solid #ddd" borderRadius="8px" width={1100}>
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
      <Box mt={3}></Box>
    </Box>
  );
};

export default BillType;
