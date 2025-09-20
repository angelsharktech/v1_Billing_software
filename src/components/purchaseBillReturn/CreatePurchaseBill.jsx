import React, { useEffect, useState } from "react";
import { Box, Snackbar, Alert, Modal, IconButton } from "@mui/material";
import GenerateBill from "../shared/GenerateBill";
import PurchaseBillForm from "./PurchaseBillForm";
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

const CreatePurchaseBill = ({ open, handleClose, refresh }) => {
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
 
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
    
        <PurchaseBillForm
          setShowPrint={setShowPrint}
          setPrintData={setPrintData}
          setSnackbarOpen={setSnackbarOpen}
          setSnackbarMessage={setSnackbarMessage}
          // setInvoiceNumber={newInvoiceNumber}
          refresh ={refresh}
          close={handleClose}
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
            snackbarMessage === "Purchase bill created successfully!"
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

export default CreatePurchaseBill;
