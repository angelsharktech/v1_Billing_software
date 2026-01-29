import React, { useEffect, useState } from 'react';
import {
  Box,
  Divider,
  IconButton,
  Modal,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
  Grid,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import { getQuotationById } from '../../services/QuotationService';
import moment from 'moment';
import { Print } from "@mui/icons-material";

const ViewQuotation = ({ open, data, handleCloseView }) => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: { xs: 2, sm: 3, md: 4 },
    width: { xs: '95%', sm: '90%', md: '80%' },
    maxWidth: 800,
    maxHeight: "90vh",
    overflow: 'auto',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f1f1',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#888',
      borderRadius: '4px',
    },
  };

  useEffect(() => {
    const fetchQuote = async () => {
      if (!data) return;
      
      setLoading(true);
      try {
        const res = await getQuotationById(data);
        setQuote(res);
      } catch (err) {
        console.error("Error loading quotation", err);
      } finally {
        setLoading(false);
      }
    };

    if (data) {
      fetchQuote();
    }
  }, [data]);

  const handlePrint = () => {
    // Don't open a new window here
    // The print functionality should be handled by the parent component (QuotationList)
    // or use a different approach
    
    // Option 1: Simply close the modal and let parent handle printing
    handleCloseView();
    
    // Option 2: Trigger print on current window (less recommended)
    // window.print();
    
    // Option 3: Dispatch an event to parent component
    // window.dispatchEvent(new CustomEvent('printQuotation', { detail: quote }));
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return 'success';
      case 'pending':
      case 'draft':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'sent':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Modal open={open} onClose={handleCloseView}>
        <Box sx={modalStyle}>
          <Typography align="center">Loading...</Typography>
        </Box>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleCloseView}>
      <Box sx={modalStyle}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box>
            <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600}>
              Quotation Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              #{quote?.quotationNo}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size={isMobile ? "medium" : "small"}
              onClick={handleCloseView}
              sx={{ color: theme.palette.grey[600] }}
            >
              <CloseIcon fontSize={isMobile ? "medium" : "small"} />
            </IconButton>
          </Box>
        </Box>

        <Stack spacing={3}>
          {/* Document Info Card */}
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Quotation Details
                    </Typography>
                    <Box>
                      <Typography variant="body2">
                        <strong>Quotation No:</strong> {quote?.quotationNo}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date:</strong> {moment(quote?.date).format("DD/MM/YYYY")}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Valid Until:</strong> {moment(quote?.validUpTo).format("DD/MM/YYYY")}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status & Total
                    </Typography>
                    <Box>
                      <Chip
                        label={quote?.status || "Draft"}
                        color={getStatusColor(quote?.status)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="h6" color="primary" fontWeight={600}>
                        ₹ {(quote?.grandTotal || 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Customer Info Card */}
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Customer Information
              </Typography>
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Name:</strong> {quote?.customer?.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {quote?.customer?.email || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {quote?.customer?.phone}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Address:</strong> {quote?.customer?.address || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card variant="outlined">
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Products & Services ({quote?.products?.length || 0})
              </Typography>
              
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Price</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Tax %</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {quote?.products?.map((p, i) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Typography variant="body2">
                            {p.productName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {p.quantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ₹ {p.unitPrice}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {p.tax}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500}>
                            ₹ {(p.total || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {/* Totals */}
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                backgroundColor: theme.palette.grey[50], 
                borderRadius: 1 
              }}>
                <Stack spacing={1} sx={{ maxWidth: 300, ml: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ₹ {(quote?.subtotal || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Tax Total:
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      ₹ {(quote?.taxTotal || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" fontWeight={600}>
                      Grand Total:
                    </Typography>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      ₹ {(quote?.grandTotal || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          {/* Terms & Conditions Card */}
          {(quote?.terms || quote?.customer?.terms) && (
            <Card variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Terms & Conditions
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-line',
                    lineHeight: 1.6,
                    color: theme.palette.text.secondary
                  }}
                >
                  {quote?.terms || quote?.customer?.terms}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Footer Actions */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Button
              variant="outlined"
              size={isMobile ? "medium" : "small"}
              onClick={handleCloseView}
              sx={{ minWidth: isMobile ? 120 : 100 }}
            >
              Close
            </Button>
          </Box>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ViewQuotation;