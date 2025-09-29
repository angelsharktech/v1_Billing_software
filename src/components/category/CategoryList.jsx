import React, { useEffect, useRef, useState } from "react";
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
  Button,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  deleteCategory,
  getAllCategories,
} from "../../services/CategoryService";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import PaginationComponent from "../shared/PaginationComponent";
import FilterData from "../shared/FilterData";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";

const CategoryList = () => {
  const { webuser } = useAuth();
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState();
  const [edit, setEdit] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const isExtraSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);
  const categoryInputRef = useRef(null);

  useEffect(() => {
    if (categoryInputRef.current) {
      categoryInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const result = await getUserById(webuser.id);
      const res = await getAllCategories();

      if (res.success) {
        const flattened = [];

        res.data
          .filter(
            (cat) => cat?.organization_id._id === result.organization_id?._id
          )
          .forEach((cat) => {
            flattened.push({
              id: cat._id,
              categoryName: cat.categoryName,
              slug: cat.slug,
              description: cat.description,
            });
          });
        setRows(flattened);
      }
    } catch (err) {
      console.error("Error loading categories", err);
    }
  };

  const filteredCategory = rows?.filter((cat) =>
    cat.categoryName?.toLowerCase().includes(searchQuery?.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    if (filteredCategory) {
      setTotalPages(Math.ceil(filteredCategory.length / pageSize));
    }
  }, [filteredCategory]);

  const paginatedCategory = filteredCategory?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleEdit = (rowData) => {
    setData(rowData);
    setEdit(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const res = await deleteCategory(id);
        if (res) {
          setSnackbarMessage("Category Deleted!");
          setSnackbarOpen(true);
          fetchCategories(); // Refresh the list
        }
      } catch (error) {
        console.error("Error deleting category", error);
        alert("Failed to delete category.");
      }
    }
  };

  // Mobile-friendly category card component
  const MobileCategoryCard = ({ category }) => (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, boxShadow: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {category.name}
        </Typography>
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleEdit(category)}
            sx={{ mr: 0.5 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(category.id)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );

  return (
    <>
      <Box sx={{ p: isExtraSmallScreen ? 1 : 3 }}>
        {/* Combined header with title, search, and button in one row */}
        <Box
          display="flex"
          flexDirection={isSmallScreen ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isSmallScreen ? "flex-start" : "center"}
          mb={2}
          gap={isSmallScreen ? 2 : 0}
        >
          <Typography variant={isSmallScreen ? "h5" : "h4"} fontWeight={600}>
            Categories
          </Typography>

          {/* Combined search and button container */}
          <Box
            display="flex"
            flexDirection={isSmallScreen ? "column" : "row"}
            alignItems={isSmallScreen ? "stretch" : "center"}
            gap={2}
            width={isSmallScreen ? "100%" : "auto"}
          >
            <Box flexGrow={1} width={isSmallScreen ? "100%" : "auto"} mt={2}>
              <Button
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #182848, #324b84ff)",
                color: "#fff",
                whiteSpace: "nowrap",
                mr:'10px',
                width: isSmallScreen ? "100%" : "auto",
              }}
              onClick={handleOpen}
              ref={categoryInputRef}
            >
              {isSmallScreen ? "Add Category" : "Add Category (alt+x)"}
            </Button>
              <FilterData
                value={searchQuery}
                onChange={handleSearchChange}
                fullWidth={isSmallScreen}
                autoFocusOnMount
              />
            </Box>
            
          </Box>
        </Box>

        {isSmallScreen ? (
          // Mobile view with cards
          <Box>
            {paginatedCategory?.map((category, index) => (
              <MobileCategoryCard key={index} category={category} />
            ))}
          </Box>
        ) : (
          // Desktop view with table
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{ height: "422px" }}
          >
            <Table>
              <TableHead sx={{ backgroundColor: "lightgrey" }}>
                <TableRow>
                  <TableCell align="center">
                    <strong>Category</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Actions</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedCategory?.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell align="center">{row.categoryName}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleEdit(row)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={
            snackbarMessage === "Category Deleted!" ? "success" : "error"
          }
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <AddCategory
        open={open}
        handleClose={handleClose}
        refresh={fetchCategories}
      />
      <EditCategory
        edit={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchCategories}
      />

      {filteredCategory && filteredCategory.length > 0 && (
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
};

export default CategoryList;
