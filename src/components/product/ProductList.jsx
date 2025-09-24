import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import { deleteProduct, getAllProducts } from "../../services/ProductService";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import BarcodePrinter from "./BarcodePrinter";
import PaginationComponent from "../shared/PaginationComponent";
import { exportToExcel, exportToPDF } from "../shared/Export";
import FilterData from "../shared/FilterData";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";

const exportColumns = [
  { label: "HSN Code", key: "hsnCode" },
  { label: "Name", key: "name" },
  { label: "Short Description", key: "shortDescription" },
  { label: "Price", key: "price" },
  { label: "MRP", key: "compareAtPrice" },
  { label: "Discount (%)", key: "discountPercentage" },
  { label: "Quantity", key: "quantity" },
  { label: "Status", key: "status" },
  {
    label: "Tags",
    key: "tags",
    render: (rowData) => rowData.tags?.join(", "),
  },
];

const ProductList = () => {
  const { webuser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const [mainUser, setMainUser] = useState();
  const [products, setProducts] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [data, setData] = useState();
  const [edit, setEdit] = useState(false);
  const [code, setCode] = useState();
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const openExportMenu = Boolean(anchorEl);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

  const pageSize = 4;

  useEffect(() => {
    fetchProducts();
  }, []);
  
  const fetchProducts = async () => {
    try {
      const result = await getUserById(webuser.id);
      setMainUser(result);

      const data = await getAllProducts();

      const org_prod = data.data.filter(
        (prod) => prod?.organization_id === result?.organization_id?._id 
      );
      setProducts(org_prod);
    } catch (error) {
      console.error("Error fetching product data", error);
    }
  };

  const handleEdit = (rowData) => {
    setData(rowData);
    setEdit(true);
  };
  
  const handleDeleteClick = (id) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        const res = await deleteProduct(productToDelete);
        if (res) {
          setSnackbarMessage("Product Deleted!");
          setSnackbarOpen(true);
          fetchProducts();
        }
      } catch (error) {
        console.error("Error deleting product", error);
        setSnackbarMessage("Failed to delete product.");
        setSnackbarOpen(true);
      }
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handlePrint = async (prod) => {
    try {
      setCode(prod);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const filteredProducts = products?.filter(
    (prod) =>
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  useEffect(() => {
    if (filteredProducts) {
      setTotalPages(Math.ceil(filteredProducts.length / pageSize));
    }
  }, [filteredProducts]);
  
  const paginatedProducts = filteredProducts?.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const handleExportClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleExportClose = () => {
    setAnchorEl(null);
  };

  // Mobile Card View for Products
  const renderMobileCards = () => {
    return paginatedProducts?.map((prod) => (
      <Card key={prod._id} sx={{ mb: 2, boxShadow: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {prod.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                HSN: {prod.hsnCode}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {prod.shortDescription}
              </Typography>
            </Box>
            <Chip
              label={prod.status.charAt(0).toUpperCase() + prod.status.slice(1)}
              color={prod.status === "active" ? "success" : "default"}
              size="small"
            />
          </Box>
          
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Price:</strong> ₹{prod.price}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>MRP:</strong> ₹{prod.compareAtPrice}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Discount:</strong> {prod.discountPercentage}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>Qty:</strong> {prod.quantity}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" component="span">
              <strong>Tags: </strong>
            </Typography>
            {prod.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ m: 0.2, fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
          <IconButton color="primary" onClick={() => handleEdit(prod)} size="small">
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={() => handleDeleteClick(prod._id)} size="small">
            <DeleteIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => handlePrint(prod)} size="small">
            <PrintIcon />
          </IconButton>
        </CardActions>
      </Card>
    ));
  };

  return (
    <>
      <Box>
        <Box
          display="flex"
          flexDirection={isSmallMobile ? "column" : "row"}
          justifyContent="space-between"
          alignItems={isSmallMobile ? "flex-start" : "center"}
          mb={2}
          gap={isSmallMobile ? 2 : 0}
        >
          <Typography variant="h4" fontWeight={600}>
            Products
          </Typography>
          
          <Box 
            display="flex" 
            flexDirection={isSmallMobile ? "column" : "row"} 
            gap={1} 
            width={isSmallMobile ? "100%" : "auto"}
          >
            
            <FilterData 
                value={searchQuery} 
                onChange={handleSearchChange} 
                fullWidth={isSmallMobile}
                autoFocusOnMount
              />
            
            <Box display="flex" gap={1} ml={isSmallMobile ? 0 : 1}>
              <Button
                variant="contained"
                sx={{ 
                 background: "linear-gradient(135deg, #182848, #324b84ff)",color: "#fff",
                  whiteSpace: 'nowrap',
                  minWidth: 'auto',
                  height:'40px'
                }}
                onClick={handleOpen}
                fullWidth={isSmallMobile}
              >
                {isSmallMobile ? 'Add Product' : 'Add Product (alt+r)'}
              </Button>

              <Button
                variant="outlined"
                onClick={handleExportClick}
                fullWidth={isSmallMobile}
                sx={{ whiteSpace: 'nowrap', minWidth: 'auto' ,height:'40px'}}
              >
                <GetAppOutlinedIcon titleAccess="Download As" />
                {isSmallMobile && ' Export'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={openExportMenu}
          onClose={handleExportClose}
          
        >
          <MenuItem
            onClick={() => {
              exportToPDF(products, exportColumns, "Products");
              handleExportClose();
            }}
          >
            PDF
          </MenuItem>
          <MenuItem
            onClick={() => {
              exportToExcel(products, exportColumns, "Products");
              handleExportClose();
            }}
          >
            Excel
          </MenuItem>
        </Menu>

        {isMobile ? (
          <Box>
            {renderMobileCards()}
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <Table sx={{ minWidth: 650 }}>
              <TableHead sx={{ backgroundColor: "lightgrey" }}>
                <TableRow>
                  <TableCell><strong>HSN Code</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Short Description</strong></TableCell>
                  <TableCell><strong>Price (₹)</strong></TableCell>
                  <TableCell><strong>MRP (₹)</strong></TableCell>
                  <TableCell><strong>Discount (%)</strong></TableCell>
                  <TableCell><strong>Quantity</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Tags</strong></TableCell>
                  <TableCell width={120}><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts?.map((prod) => (
                  <TableRow key={prod._id}>
                    <TableCell>{prod.hsnCode}</TableCell>
                    <TableCell>{prod.name}</TableCell>
                    <TableCell>{prod.shortDescription}</TableCell>
                    <TableCell>{prod.price}</TableCell>
                    <TableCell>{prod.compareAtPrice}</TableCell>
                    <TableCell>{prod.discountPercentage}%</TableCell>
                    <TableCell>{prod.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={prod.status.charAt(0).toUpperCase() + prod.status.slice(1)}
                        color={prod.status === "active" ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {prod.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ m: 0.2 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" onClick={() => handleEdit(prod)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDeleteClick(prod._id)}>
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
          severity={snackbarMessage === "Product Deleted!" ? "success" : "error"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this product?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <AddProduct
        open={open}
        handleClose={handleClose}
        refresh={fetchProducts}
      />

      <EditProduct
        open={edit}
        data={data}
        handleCloseEdit={handleCloseEdit}
        refresh={fetchProducts}
      />

      {filteredProducts.length > 0 && (
        <PaginationComponent
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}

      <BarcodePrinter product={code} />
    </>
  );
};

export default ProductList;