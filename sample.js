const mongoose = require('mongoose');
const PaymentMode = require('../models/PaymentMode');

// @desc    Get all payment modes
// @route   GET /api/v1/payment-modes
exports.getPaymentModes = async (req, res) => {
  try {
    // Build query based on organization if user is organization admin
    let query = {};
    if (req.user && req.user.organization) {
      query.organization = req.user.organization;
    }

    // Add filtering by paymentType if provided
    if (req.query.paymentType) {
      query.paymentType = req.query.paymentType.toLowerCase();
    }

    // Add filtering by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Add filtering by client_id if provided
    if (req.query.client_id) {
      query.client_id = req.query.client_id;
    }

    // Add filtering by associate_id if provided
    if (req.query.associate_id) {
      query.associate_id = req.query.associate_id;
    }

    // Add date range filtering if provided
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const paymentModes = await PaymentMode.find(query)
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('organization', 'name')
      .populate('created_by', 'name email')
      .sort({ date: -1 });
      
    res.status(200).json({
      success: true,
      count: paymentModes.length,
      data: paymentModes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get single payment mode
// @route   GET /api/v1/payment-modes/:id
exports.getPaymentMode = async (req, res) => {
  try {
    const paymentMode = await PaymentMode.findById(req.params.id)
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('organization', 'name')
      .populate('created_by', 'name email');

    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Check if user has access to this payment (organization check)
    if (req.user && req.user.organization && 
        paymentMode.organization && 
        paymentMode.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment'
      });
    }

    res.status(200).json({
      success: true,
      data: paymentMode
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Create payment mode
// @route   POST /api/v1/payment-modes
exports.createPaymentMode = async (req, res) => {
  try {
    // Add organization from user if not provided
    if (!req.body.organization && req.user && req.user.organization) {
      req.body.organization = req.user.organization;
    }

    // Add created_by from authenticated user if not provided
    if (!req.body.created_by && req.user) {
      req.body.created_by = req.user.id;
    }

    // Set default paymentType to 'cash' if not provided
    if (!req.body.paymentType) {
      req.body.paymentType = 'cash';
    }

    // Convert paymentType to lowercase to match enum values
    if (req.body.paymentType) {
      req.body.paymentType = req.body.paymentType.toLowerCase();
    }

    // Validate payment type specific fields
    const errors = validatePaymentFields(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    const paymentMode = await PaymentMode.create(req.body);
    
    // Populate references after creation
    const populatedPaymentMode = await PaymentMode.findById(paymentMode._id)
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('organization', 'name')
      .populate('created_by', 'name email');

    res.status(201).json({
      success: true,
      data: populatedPaymentMode
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Reference ID already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: error.message
    });
  }
};

// @desc    Update payment mode (PUT - Full Update)
// @route   PUT /api/v1/payment-modes/:id
exports.updatePaymentMode = async (req, res) => {
  try {
    // First get the existing payment to check organization
    const existingPayment = await PaymentMode.findById(req.params.id);
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Check organization access
    if (req.user && req.user.organization && 
        existingPayment.organization && 
        existingPayment.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this payment'
      });
    }

    // Convert paymentType to lowercase if provided
    if (req.body.paymentType) {
      req.body.paymentType = req.body.paymentType.toLowerCase();
    }

    // Validate payment type specific fields
    const errors = validatePaymentFields(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors
      });
    }

    const paymentMode = await PaymentMode.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('client_id', 'name email')
    .populate('associate_id', 'name email')
    .populate('salebill', 'invoiceNumber')
    .populate('purchasebill', 'invoiceNumber')
    .populate('organization', 'name')
    .populate('created_by', 'name email');

    res.status(200).json({
      success: true,
      data: paymentMode
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Reference ID already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: error.message
    });
  }
};

// @desc    Update payment mode (PATCH - Partial Update)
// @route   PATCH /api/v1/payment-modes/:id
exports.patchPaymentMode = async (req, res) => {
  try {
    // First get the existing payment to check organization
    const existingPayment = await PaymentMode.findById(req.params.id);
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Check organization access
    if (req.user && req.user.organization && 
        existingPayment.organization && 
        existingPayment.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this payment'
      });
    }

    // For PATCH requests, we need to validate only if paymentType is being updated
    if (req.body.paymentType) {
      req.body.paymentType = req.body.paymentType.toLowerCase();
      const paymentData = { ...existingPayment.toObject(), ...req.body };
      
      const errors = validatePaymentFields(paymentData);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: errors
        });
      }
    }

    const paymentMode = await PaymentMode.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    )
    .populate('client_id', 'name email')
    .populate('associate_id', 'name email')
    .populate('salebill', 'invoiceNumber')
    .populate('purchasebill', 'invoiceNumber')
    .populate('organization', 'name')
    .populate('created_by', 'name email');

    res.status(200).json({
      success: true,
      data: paymentMode
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Reference ID already exists'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      error: error.message
    });
  }
};

// @desc    Delete payment mode
// @route   DELETE /api/v1/payment-modes/:id
exports.deletePaymentMode = async (req, res) => {
  try {
    // First get the existing payment to check organization
    const existingPayment = await PaymentMode.findById(req.params.id);
    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    // Check organization access
    if (req.user && req.user.organization && 
        existingPayment.organization && 
        existingPayment.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this payment'
      });
    }

    await PaymentMode.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get payment modes by salebill ID
// @route   GET /api/v1/payment-modes/salebill/:salebillId
exports.getPaymentsBySaleBill = async (req, res) => {
  try {
    // Build query with organization check if user is organization admin
    let query = { salebill: req.params.salebillId };
    if (req.user && req.user.organization) {
      query.organization = req.user.organization;
    }

    const payments = await PaymentMode.find(query)
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('organization', 'name')
      .populate('created_by', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get payment modes by purchasebill ID
// @route   GET /api/v1/payment-modes/purchasebill/:purchasebillId
exports.getPaymentsByPurchaseBill = async (req, res) => {
  try {
    // Build query with organization check if user is organization admin
    let query = { purchasebill: req.params.purchasebillId };
    if (req.user && req.user.organization) {
      query.organization = req.user.organization;
    }

    const payments = await PaymentMode.find(query)
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('organization', 'name')
      .populate('created_by', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get payment modes by client ID
// @route   GET /api/v1/payment-modes/client/:clientId
exports.getPaymentsByClient = async (req, res) => {
  try {
    // Build query with organization check if user is organization admin
    let query = { client_id: req.params.clientId };
    if (req.user && req.user.organization) {
      query.organization = req.user.organization;
    }

    const payments = await PaymentMode.find(query)
      .populate('associate_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('organization', 'name')
      .populate('created_by', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get payment modes by organization ID
// @route   GET /api/v1/payment-modes/organization/:orgId
exports.getPaymentsByOrganization = async (req, res) => {
  try {
    // Check if user has access to this organization
    if (req.user && req.user.organization && 
        req.user.organization.toString() !== req.params.orgId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access payments for this organization'
      });
    }

    const payments = await PaymentMode.find({ organization: req.params.orgId })
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('created_by', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get payment modes by associate ID
// @route   GET /api/v1/payment-modes/associate/:associateId
exports.getPaymentsByAssociate = async (req, res) => {
  try {
    // Build query with organization check if user is organization admin
    let query = { associate_id: req.params.associateId };
    if (req.user && req.user.organization) {
      query.organization = req.user.organization;
    }

    const payments = await PaymentMode.find(query)
      .populate('client_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('organization', 'name')
      .populate('created_by', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get payment modes by created_by user ID
// @route   GET /api/v1/payment-modes/created-by/:userId
exports.getPaymentsByCreatedBy = async (req, res) => {
  try {
    // Build query with organization check if user is organization admin
    let query = { created_by: req.params.userId };
    if (req.user && req.user.organization) {
      query.organization = req.user.organization;
    }

    const payments = await PaymentMode.find(query)
      .populate('client_id', 'name email')
      .populate('associate_id', 'name email')
      .populate('salebill', 'invoiceNumber')
      .populate('purchasebill', 'invoiceNumber')
      .populate('organization', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Helper function to validate payment type specific fields
function validatePaymentFields(body) {
  const errors = [];
  const { paymentType } = body;

  // Basic validation
  if (!paymentType) {
    errors.push('Payment type is required');
    return errors; // Return early if no payment type
  }

  // Validate amount
  if (!body.amount || body.amount < 1) {
    errors.push('Amount must be at least 1');
  }

  // Payment type specific validations
  if (paymentType === 'online transfer') {
    if (!body.utrId) errors.push('UTR ID is required for online transfers');
    if (!body.bankName) errors.push('Bank name is required for online transfers');
  }

  if (paymentType === 'cheque') {
    if (!body.chequeNumber) errors.push('Cheque number is required');
    if (!body.chequeDate) errors.push('Cheque date is required');
    if (!body.bankName) errors.push('Bank name is required for cheques');
    
    // Validate cheque date is not in the future
    if (body.chequeDate && new Date(body.chequeDate) > new Date()) {
      errors.push('Cheque date cannot be in the future');
    }
  }

  if (paymentType === 'card') {
    if (!body.cardLastFour) errors.push('Card last 4 digits are required');
    if (!body.cardType) errors.push('Card type (Debit/Credit) is required');
    
    if (body.cardLastFour && !/^[0-9]{4}$/.test(body.cardLastFour)) {
      errors.push('Last 4 digits must be exactly 4 numbers');
    }
  }

  if (paymentType === 'upi') {
    if (!body.upiId) errors.push('UPI ID is required');
    if (body.upiId && !/\S+@\S+/.test(body.upiId)) {
      errors.push('Invalid UPI ID format');
    }
  }

  // Validate reference ID format if provided
  if (body.referenceId && typeof body.referenceId !== 'string') {
    errors.push('Reference ID must be a string');
  }

  // Validate status
  if (body.status && !['Pending', 'Completed', 'Failed', 'Cancelled'].includes(body.status)) {
    errors.push('Invalid status value');
  }

  return errors;
}