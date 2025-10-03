// src/components/shared/GenerateLedger.jsx
import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Divider } from "@mui/material";
import moment from "moment";

const GenerateLedger = ({ bill ,type }) => {
  if (!bill) return null;

  const { client, payments } = bill;

  return (
    <Box sx={{ p: 3, backgroundColor: "#fff", color: "#000" }}>
      {/* Header */}
      <Box textAlign="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          {type} Ledger
        </Typography>
        <Typography variant="subtitle1">
          {client?.name || "Unknown Supplier"}
        </Typography>
        {client?.organizationName && (
          <Typography variant="subtitle2">{client.organizationName}</Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Ledger Table */}
      <Table>
        <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
          <TableRow>
            <TableCell align="center">Date</TableCell>
            <TableCell align="center">Narration</TableCell>
            <TableCell align="center">Dr</TableCell>
            <TableCell align="center">Cr</TableCell>
            <TableCell align="center">Closing Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {payments?.map((p) => (
            <TableRow key={p._id}>
              <TableCell align="center">
                {p.date ? moment(p.date).format("DD/MM/YYYY") : "--"}
              </TableCell>
              <TableCell align="center">{p.narration || "--"}</TableCell>
              <TableCell align="center">₹ {p.balance || 0}</TableCell>
              <TableCell align="center">₹ {p.advanceAmount || 0}</TableCell>
              <TableCell align="center">₹ {p.closingAmount || 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box mt={3}>
        <Typography variant="body2">
          Generated on: {moment().format("DD/MM/YYYY HH:mm")}
        </Typography>
      </Box>
    </Box>
  );
};

export default GenerateLedger;
