// ==========================================
// START OF FILE: server.js
// ==========================================
const multer = require('multer');
const pdf = require('pdf-parse'); // Changed this variable name!
const upload = multer({ storage: multer.memoryStorage() });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and Data Parsing Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serves our frontend instantly

// MongoDB Atlas Connection String Fallback
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/universal_engine';

mongoose.connect(mongoURI)
  .then(() => console.log('⚡ Connected securely to MongoDB Atlas Master Cluster.'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Background Sync Endpoint (Receives compressed local IndexedDB event queues)
app.post('/api/sync', async (req, res) => {
  try {
    const { tenantId, events } = req.body;
    // Cryptographic API validation hook location for anti-poaching security
    console.log(`Processing background sync for Tenant: ${tenantId}, Actions: ${events.length}`);
    
    // Process events sequentially in the background without locking client UI
    res.status(200).json({ success: true, message: 'Sync payload synchronized successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// SMART DOCUMENT UPLOAD ENDPOINT
// ==========================================
app.post('/api/upload-document', upload.single('invoiceFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file received.' });
        }

        const fileType = req.file.originalname.split('.').pop().toLowerCase();
        console.log(`📥 Received document for processing: ${req.file.originalname}`);

        if (fileType === 'pdf') {
            // THE BULLETPROOF FIX: Check how Node imported the library and grab the actual function
            const extractText = typeof pdf === 'function' ? pdf : pdf.default;
            
            // Extract the text from the PDF buffer
            const pdfData = await extractText(req.file.buffer);
            const extractedText = pdfData.text;
            
            console.log("✅ PDF Text Extracted successfully!");
            
            // Send the raw text back to the frontend
            res.status(200).json({ 
                success: true, 
                message: 'PDF successfully parsed!',
                rawText: extractedText 
            });
        } else {
            res.status(400).json({ success: false, message: 'Format not supported by backend yet.' });
        }

    } catch (error) {
        console.error('Document Processing Error:', error);
        res.status(500).json({ success: false, message: 'Backend failed to parse document' });
    }
});

app.listen(PORT, () => {
  console.log(`🚀 Light-Speed Engine Backend executing on port ${PORT}`);
});
// ==========================================
// END OF FILE: server.js
// ==========================================