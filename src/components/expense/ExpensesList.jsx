import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import { deleteExpense, getAllExpensesByOrganization } from "../../services/ExpenseService";
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
import CreateExpense from "./CreateExpense";
import moment from "moment";
import EditExpense from "./EditExpense";

const ExpensesList = () => {
  const { webuser } = useAuth();
  const expenseInputRef = useRef(null);
  const [data, setData] = useState();
  const [editData, setEditData] = useState();
  const [edit, setEdit] = useState(false);
  const [mainUser, setMainUser] = useState();
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  useEffect(() => {
    if (expenseInputRef.current) {
      expenseInputRef.current.focus();
    }
  }, []);
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const result = await getUserById(webuser.id);
      setMainUser(result);
      const data = await getAllExpensesByOrganization(
        result?.organization_id?._id
      );
      console.log(data);
      setData(data.data);
    } catch (error) {
      console.error("Error fetching expense data", error);
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setEdit(true);
  };

  const handleDelete = (id) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (expenseToDelete) {
      try {
        const res = await deleteExpense(expenseToDelete);
        if (res) {
          setSnackbarMessage("Expense Deleted!");
          setSnackbarOpen(true);
          fetchExpenses();
        }
      } catch (error) {
        console.error("Error deleting expense", error);
        setSnackbarMessage("Failed to delete expense.");
        setSnackbarOpen(true);
      }
    }
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
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
            Expenses
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
              ref={expenseInputRef}
            >
              Create Expense
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
                  Expense Type
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
                      {exp.groupOfExpense}
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
                    No expenses found.
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
          <Typography>Are you sure you want to delete this expense?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <CreateExpense
        user={mainUser}
        open={open}
        handleClose={handleClose}
        refresh={fetchExpenses}
      />
      <EditExpense
        open={edit}
        data={editData}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchExpenses}
      />
    </>
  );
};

export default ExpensesList;
