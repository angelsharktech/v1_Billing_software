import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import moment from "moment";
import { deleteIncome, getAllIncomesByOrganization } from "../../services/IncomeService";
import CreateIncome from "./CreateIncome";
import EditIncome from "./EditIncome";


const IncomeList = () => {
  const { webuser } = useAuth();
  const incomeInputRef = useRef(null);
  const [data, setData] = useState();
  const [editData, setEditData] = useState();
  const [edit, setEdit] = useState(false);
  const [mainUser, setMainUser] = useState();
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  useEffect(() => {
    if (incomeInputRef.current) {
      incomeInputRef.current.focus();
    }
  }, []);
  useEffect(() => {
    fetchIncomes();
  }, []);

  const fetchIncomes = async () => {
    try {
      const result = await getUserById(webuser.id);
      setMainUser(result);
      const data = await getAllIncomesByOrganization(
        result?.organization_id?._id
      );
      console.log(data);
      setData(data.data);
    } catch (error) {
      console.error("Error fetching income data", error);
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setEdit(true);
  };

  const handleDelete = (id) => {
    setIncomeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (incomeToDelete) {
      try {
        const res = await deleteIncome(incomeToDelete);
        if (res) {
          setSnackbarMessage("Income Deleted!");
          setSnackbarOpen(true);
          fetchIncomes();
        }
      } catch (error) {
        console.error("Error deleting income", error);
        setSnackbarMessage("Failed to delete income.");
        setSnackbarOpen(true);
      }
    }
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setIncomeToDelete(null);
  };

  return (
    <>
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h5" fontWeight={600}>
            Incomes
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={2} mr={4}>
            <Button
              // accessKey="s"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
              }}
              onClick={handleOpen}
              ref={incomeInputRef}
            >
              Create Income
            </Button>
          </Box>
        </Box>
        <TableContainer
          component={Paper}
          sx={{ mt: 3, borderRadius: 2, boxShadow: 3 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                  Date
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                  Name
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                  Amount (₹)
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                  Income Type
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                  Description
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", textAlign: "center" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.length > 0 ? (
                data?.map((exp) => (
                  <TableRow key={exp._id}>
                    <TableCell sx={{ textAlign: "center" }}>
                      {moment(exp.date).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {exp.name}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {exp.amount}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {exp.groupOfIncome}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {exp.description ? exp.description : "--"}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(exp)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(exp._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                    No incomes found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this income?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

     <CreateIncome
        user={mainUser}
        open={open}
        handleClose={handleClose}
        refresh={fetchIncomes}
      />
      <EditIncome
        open={edit}
        data={editData}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchIncomes}
      /> 
    </>
  );
};

export default IncomeList;
