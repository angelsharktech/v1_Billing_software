import React, { useEffect, useState } from "react";
import { Box, Snackbar, Alert, Modal, IconButton } from "@mui/material";
import SaleBillForm from "./SaleBillForm";
import GenerateBill from "../shared/GenerateBill";
import CloseIcon from '@mui/icons-material/Close';

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 3,
  minWidth: 1020,
  maxHeight: "90vh",
  overflowY: "auto",
};

const CreateSaleBill = ({ open, handleClose, refresh }) => {
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  // const [newInvoiceNumber, setNewInvoiceNumber] = useState("");

  // Fetch all bills and set the last invoice number
  //   useEffect(() => {
  //     const fetchLastInvoice = async () => {
  //       try {
  //         const response = await getAllSaleBills();

  //         if (response.success && response.data.docs.length > 0) {
  //           // Sort bills by creation date (newest first)
  //           const sortedBills = response.data.docs.sort(
  //             (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  //           );

  //           const lastBill = sortedBills[0];
  //           const lastInvoice = lastBill.bill_number;

  //           // Generate the new invoice number here
  //           const nextInvoiceNumber = generateNextInvoiceNumber(lastInvoice);
  //           setNewInvoiceNumber(nextInvoiceNumber);
  //         }
  //       } catch (error) {
  //         console.error("Failed to fetch invoices:", error);
  //       }
  //     };

  //     fetchLastInvoice();
  //   }, []);

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <SaleBillForm
            setShowPrint={setShowPrint}
            setPrintData={setPrintData}
            setSnackbarOpen={setSnackbarOpen}
            setSnackbarMessage={setSnackbarMessage}
            // setInvoiceNumber={newInvoiceNumber}
            close = {handleClose}
            refresh={refresh}
          />
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage === "Sale bill created successfully!"
              ? "success"
              : "error"
          }
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {showPrint && printData && (
        <div className="print-only">
          <GenerateBill bill={printData} billName={"SALE"} />
        </div>
      )}
    </>
  );
};

export default CreateSaleBill;
