import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Divider,
  Stack,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PrintIcon from "@mui/icons-material/Print";
import SearchIcon from "@mui/icons-material/Search";
import GetAppOutlinedIcon from "@mui/icons-material/GetAppOutlined";
import { deleteProduct, getAllProducts } from "../../services/ProductService";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import BarcodePrinter from "./BarcodePrinter";
import PaginationComponent from "../shared/PaginationComponent";
import { exportToExcel, exportToPDF } from "../shared/Export";
import { useAuth } from "../../context/AuthContext";
import { getUserById } from "../../services/UserService";

const exportColumns = [
  { label: "HSN Code", key: "hsnCode" },
  { label: "Name", key: "name" },
  { label: "Category", key: "category" },
  { label: "Product Code", key: "productCode" },
];

const ProductList = () => {
  const { webuser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
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
  const pageSize = 6;
  
  const productInputRef = useRef(null);

  useEffect(() => {
    if (productInputRef.current) {
      productInputRef.current.focus();
    }
  }, []);

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
      setCurrentPage(1); // Reset to first page when data changes
    } catch (error) {
      console.error("Error fetching product data", error);
      setSnackbarMessage("Failed to load products");
      setSnackbarOpen(true);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleCloseEdit = () => setEdit(false);

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

  const filteredProducts = useMemo(() => {
    return products?.filter(
      (prod) =>
        prod.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        prod.hsnCode?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        prod.productCode?.toLowerCase().includes(searchQuery?.toLowerCase())
    );
  }, [products, searchQuery]);
  
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

  // Mobile Card View Component
  const MobileProductCard = ({ product, index }) => (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        // Not clickable - removed hover cursor
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                #{index + 1} • {product.name || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Code: {product.productCode || "N/A"} | HSN: {product.hsnCode || "N/A"}
              </Typography>
            </Box>
            <Chip
              label={`₹${product?.price?.toFixed(2) || "0.00"}`}
              color="primary"
              size="small"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Category
            </Typography>
            <Typography variant="body1" noWrap>
              {product.category?.categoryName || "N/A"}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between">
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Quantity
              </Typography>
              <Typography variant="body1">
                {product.quantity || "0"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Price
              </Typography>
              <Typography variant="body1">
                ₹{product.price || "0.00"}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Action Buttons */}
          <Box display="flex" justifyContent="space-between" mt={1}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(product)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              onClick={() => handlePrint(product)}
            >
              <PrintIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteClick(product._id)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // Desktop Table View
  const DesktopTableView = () => (
    <TableContainer
      component={Paper}
      sx={{
        maxHeight: 550,
        overflowY: "auto",
        [theme.breakpoints.down("md")]: {
          maxHeight: 500,
        },
      }}
    >
      <Table stickyHeader size={isTablet ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>#</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>HSN Code</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Product Code</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Product Name</strong>
            </TableCell>
            <TableCell sx={{ background: "#e0e0e0ff" }}>
              <strong>Category</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Price (₹)</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Quantity</strong>
            </TableCell>
            <TableCell align="center" sx={{ background: "#e0e0e0ff" }}>
              <strong>Actions</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedProducts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography color="textSecondary">
                  {searchQuery ? 'No products found for your search' : 'No products available'}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedProducts.map((product, index) => (
              <TableRow key={product._id} hover>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {product.hsnCode || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {product.productCode || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium" noWrap sx={{ maxWidth: 150 }}>
                    {product.name || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {product.category?.categoryName || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography fontWeight={500}>
                    ₹{product?.price?.toFixed(2) || "0.00"}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography>
                    {product.quantity || "0"}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 150 }}>
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleEdit(product)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    {/* <IconButton
                      color="inherit"
                      size="small"
                      onClick={() => handlePrint(product)}
                      title="Print Barcode"
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton> */}
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDeleteClick(product._id)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between" mb={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="h5" fontWeight={600}>
              Products
            </Typography>
            {paginatedProducts.length > 0 && (
              <Typography variant="body2" color="textSecondary" mt={0.5}>
                Total: {filteredProducts.length} products • Showing {paginatedProducts.length} on this page
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack 
              direction={{ xs: "column", sm: "row" }} 
              spacing={2} 
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="flex-end"
            >
              <TextField
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                size="small"
                fullWidth={isMobile}
                sx={{ 
                  minWidth: { xs: "100%", sm: 300 },
                  maxWidth: { xs: "100%", sm: 400 },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: 'background.paper',
                  },
                  '& .MuiOutlinedInput-input': {
                    fontSize: '0.875rem',
                    padding: '8.5px 14px',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                onClick={handleExportClick}
                size="small"
                sx={{ 
                  height: 40,
                  whiteSpace: 'nowrap',
                  minWidth: '40px',
                  px: isMobile ? 2 : 1,
                }}
              >
                <GetAppOutlinedIcon />
                {isMobile && ' Export'}
              </Button>
              <Button
                variant="contained"
                sx={{
                  background: "linear-gradient(135deg, #182848, #324b84ff)",
                  color: "#fff",
                  whiteSpace: "nowrap",
                  height: 40,
                }}
                onClick={handleOpen}
                ref={productInputRef}
                fullWidth={isMobile}
              >
                {isMobile ? "Add Product" : "Add Product (Alt + R)"}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Export Menu */}
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
            {paginatedProducts.length === 0 ? (
              <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight={200}
              >
                <Typography color="textSecondary">
                  {searchQuery ? 'No products found for your search' : 'No products available'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflowY: "auto" }}>
                {paginatedProducts.map((product, index) => (
                  <MobileProductCard 
                    key={product._id} 
                    product={product} 
                    index={(currentPage - 1) * pageSize + index} 
                  />
                ))}
              </Box>
            )}
          </Box>
        ) : (
          <DesktopTableView />
        )}
      </Box>

      {/* Pagination */}
      {filteredProducts && filteredProducts.length > 0 && totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', px: { xs: 1, sm: 2 } }}>
          <PaginationComponent
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={(page) => setCurrentPage(page)}
            size={isMobile ? "small" : "medium"}
          />
        </Box>
      )}

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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbarMessage.includes("Deleted") ? "error" : "success"}
          onClose={() => setSnackbarOpen(false)}
          variant="filled"
          sx={{ 
            width: '100%',
            fontSize: '0.875rem'
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

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

      <BarcodePrinter product={code} />
    </>
  );
};

export default ProductList;