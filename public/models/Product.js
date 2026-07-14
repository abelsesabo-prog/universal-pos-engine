const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    default: 'General'
  },
  // Stage 4: Stores resolved semantic synonyms (e.g., "viazi vitamu")
  aliases: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);