const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative']
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Quarantined', 'Expired'],
    default: 'Available'
  }
}, { timestamps: true });

// Prevent duplicate batch numbers for the exact same product
BatchSchema.index({ productId: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model('Batch', BatchSchema);