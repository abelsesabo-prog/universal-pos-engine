// --- 1. Master Data (Registry) ---
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected securely to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

  // Enable middleware to read JSON payloads
app.use(cors());
app.use(express.json());

// Serve static frontend files from a 'public' directory
app.use(express.static('public'));

// Base Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'online', database: 'connected' });
});

// Start listening for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🟢 POS Server running on: http://localhost:${PORT}`);
});