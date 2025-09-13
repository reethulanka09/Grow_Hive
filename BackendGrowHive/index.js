const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const { initializeSocket } = require('./utlis/socket'); // Corrected typo: utils -> utlis based on your file
const multer = require('multer'); // Multer for handling file uploads
const fs = require('fs'); // Node.js File System module, for creating directories

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const connection = require("./routes/connectionroute");
const skillRoutes = require("./routes/skillsRoutes");
const authRoutes = require('./routes/auth'); // Correct path for your auth routes
const eventRoutes = require('./routes/ScheduleRoutes'); // Assuming this is correct path for your event routes
const notificationRoutes = require('./routes/notificationRoutes'); // Your notification routes
// Middlewares

app.use('/api/connection', connection);
//fro skills
app.use('/api/auth/skills', skillRoutes);
app.use('/api', eventRoutes); // Your existing event routes (mounted at /api)
app.use('/api/notifications', notificationRoutes); // New notification routes


// --- Multer Storage Configuration for Audio ---
// Define where to store the audio files and how to name them
const audioStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const audioUploadPath = path.join(__dirname, 'uploads', 'audio');
        // Ensure the directory exists.
        if (!fs.existsSync(audioUploadPath)) {
            fs.mkdirSync(audioUploadPath, { recursive: true });
        }
        cb(null, audioUploadPath);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename using timestamp + original extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Multer upload middleware specifically for audio
const uploadAudio = multer({ storage: audioStorage });


// --- Multer Storage Configuration for Documents (NEW) ---
// Define where to store document files and how to name them
const documentStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const documentUploadPath = path.join(__dirname, 'uploads', 'documents');
        // Ensure the directory exists.
        if (!fs.existsSync(documentUploadPath)) {
            fs.mkdirSync(documentUploadPath, { recursive: true });
        }
        cb(null, documentUploadPath);
    },
    filename: function (req, file, cb) {
        // Generate a unique filename using timestamp + original extension
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Multer upload middleware specifically for documents
const uploadDocument = multer({ storage: documentStorage });


// --- Static Files ---
// Existing static routes
app.use('/uploads/certificates', express.static(path.join(__dirname, 'uploads/certificates')));
app.use('/uploads/profile_images', express.static(path.join(__dirname, 'uploads/profile_images')));
app.use('/uploads/audio', express.static(path.join(__dirname, 'uploads/audio')));
// NEW: Serve static files for documents
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads', 'documents')));


// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/uploadRoutes')); // Assuming this handles other general uploads
app.use('/api/messages', require('./routes/messageRoutes'));

// --- API Endpoint for Document Uploads (NEW) ---
// Handles POST requests to /api/upload-document.
// 'document' is the name of the form field that carries the file from your frontend.
app.post('/api/upload-document', uploadDocument.single('document'), (req, res) => {
    if (!req.file) {
        // If no file was provided in the request
        return res.status(400).json({ message: 'No document file uploaded.' });
    }

    // Construct the public URL for the newly uploaded document.
    // This uses your specified hardcoded base URL.
    const publicUrl = `http://10.239.62.149:5000/uploads/documents/${req.file.filename}`;

    console.log('✅ Document file uploaded:', req.file.filename);
    console.log('🔗 Public URL for document:', publicUrl);

    // Send the public URL back to the frontend.
    res.status(200).json({ url: publicUrl });
});

// --- API Endpoint for Audio Uploads (Existing, verified to use hardcoded URL) ---
app.post('/api/upload-audio', uploadAudio.single('audio'), (req, res) => {
    // 'audio' is the field name that your frontend is sending (formData.append('audio', ...))

    if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded.' });
    }

    // Construct the public URL for the uploaded audio file.
    // This uses your specified hardcoded base URL.
    const publicUrl = `http://10.239.62.149:5000/uploads/audio/${req.file.filename}`;

    console.log('✅ Audio file uploaded:', req.file.filename);
    console.log('🔗 Public URL for audio:', publicUrl);

    // Send the public URL back to the frontend
    res.status(200).json({ url: publicUrl });
});

// Test Route
app.get('/', (req, res) => {
    res.send('🚀 API is running...');
});

// Initialize Socket.IO connection and handlers
initializeSocket(server);

// Start Server
const PORT = process.env.PORT || 5000;
// Using your original server.listen call as requested.
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // console.log(`Port running on http://10.15.10.149:${PORT}`);
});
