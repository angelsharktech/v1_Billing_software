import React, { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Collapse,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterData from "../shared/FilterData";
import { getPaymentByOrganization } from "../../services/PaymentModeService";
import { getUserById } from "../../services/UserService";
import { useAuth } from "../../context/AuthContext";

const CustomerLedger = () => {
  const { webuser } = useAuth();
  const [mainUser, setMainUser] = useState();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [openRows, setOpenRows] = useState({});

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // fetch logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      const res = await getUserById(webuser.id);
      setMainUser(res);
    };
    fetchUser();
  }, [webuser]);

  // fetch supplier payments
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = async () => {
    if (!mainUser?.organization_id?._id) return;
    try {
      const data = await getPaymentByOrganization(mainUser.organization_id._id);
      
      const bills = data.data.filter((bill) => bill.forPayment.toLowerCase() === "sale");
      
      setRows(bills);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  useEffect(() => {
    refresh();
  }, [mainUser]);

  // group payments by supplier
  const groupedPayments = {};
  rows.forEach((p) => {
    if (p.client_id?._id) {
      if (!groupedPayments[p.client_id._id]) {
        groupedPayments[p.client_id._id] = {
          client: p.client_id,
          payments: [],
        };
      }
      groupedPayments[p.client_id._id].payments.push(p);
    }
  });
  // search filter
  const filteredSuppliers = Object.values(groupedPayments).filter(
    ({ payments }) => {
      const matchesSearch = payments.some(
        (row) =>
          row.paymentType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          row.client_id.first_name
            ?.toLowerCase()
            .includes(searchQuery.toLocaleLowerCase()) ||
          row.client_id.last_name
            ?.toLowerCase()
            .includes(searchQuery.toLocaleLowerCase()) ||
          row.salebill?.bill_number?.includes(searchQuery) ||
          String(row.advanceAmount).includes(searchQuery)
      );
      return matchesSearch;
    }
  );

  const toggleRow = (clientId) => {
    setOpenRows((prev) => ({ ...prev, [clientId]: !prev[clientId] }));
  };
  return (
    <>
      <Box sx={{ p: isExtraSmallScreen ? 1 : 3 }}>
        {/* Header */}
        <Box
          display="flex"
          flexDirection={isSmallScreen ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isSmallScreen ? "flex-start" : "center"}
          mb={2}
          gap={isSmallScreen ? 2 : 0}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={600}>
            Customer Ledger
          </Typography>

          <FilterData
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>

        {/* Supplier Ledger Table */}
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: "lightgrey" }}>
              <TableRow>
                <TableCell />
                <TableCell align="center">
                  <strong>Customer</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Total Transactions</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSuppliers.map(({ client, payments }) => (
                <React.Fragment key={client._id}>
                  <TableRow>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => toggleRow(client._id)}
                      >
                        {openRows[client._id] ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      {client.first_name} {client.last_name || ""}
                    </TableCell>
                    <TableCell align="center">{payments.length}</TableCell>
                  </TableRow>

                  {/* Expanded Ledger */}
                  <TableRow>
                    <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
                      <Collapse
                        in={openRows[client._id]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box m={2}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            gutterBottom
                          >
                            Transactions
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell align="center">
                                  <strong>Date</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Narration</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Dr</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Cr</strong>
                                </TableCell>
                                <TableCell align="center">
                                  <strong>Closing Balance</strong>
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {payments.map((p, index) => {
                                const dr = 0;
                                const cr= 0;
                                // const previous = payments[index - 1];
                                // const previousBillNumber =
                                //   previous?.purchasebill?.bill_number;
                                // const currentBillNumber =
                                //   p.purchasebill?.bill_number;

                                // const openingBalance =
                                //   index === 0 ? 0 : previous.closingAmount || 0;
                                // const total = p.purchasebill?.grandTotal || 0;
                                // const moneyReceived =
                                //   Number(p.advanceAmount) || 0;
                                // const moneyGiven = 0;

                                // let closingAmount;

                                // if (index === 0) {
                                //   closingAmount =
                                //     total - moneyReceived + moneyGiven;
                                // } else if (
                                //   currentBillNumber === previousBillNumber
                                // ) {
                                //   closingAmount =
                                //     openingBalance - moneyReceived + moneyGiven;
                                // } else {
                                //   closingAmount =
                                //     openingBalance + total - moneyReceived;
                                // }

                                // // Save for next iteration (if needed)
                                // p.closingAmount = closingAmount;

                                return (
                                  <TableRow key={p._id}>
                                    <TableCell align="center">
                                      {p.date
                                        ? new Date(p.date).toLocaleDateString()
                                        : "--"}
                                    </TableCell>
                                    <TableCell align="center">
                                      {p.narration || "--"}
                                    </TableCell>
                                    <TableCell align="center">
                                      {/* ₹ {p?.advanceAmount || 0} */}
                                      ₹ {p?.balance || 0}
                                    </TableCell>
                                    {/* <TableCell align="center">
                                      ₹ {total}
                                    </TableCell> */}
                                    <TableCell align="center">
                                        ₹ {p?.advanceAmount || 0}
                                      {/* ₹ {p?.balance || 0} */}
                                    </TableCell>
                                    {/* <TableCell align="center">
                                      ₹ {moneyGiven}
                                    </TableCell> */}
                                    <TableCell align="center">
                                      ₹ {p?.closingAmount}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};


export default CustomerLedger;
