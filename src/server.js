import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import tagRoutes from './routes/tagRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'DAM API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════════╗
    ║   DAM API Server Running               ║
    ║   Port: ${PORT}                         ║
    ║   Mode: ${process.env.NODE_ENV}        ║
    ║   URL: http://localhost:${PORT}        ║
    ║                                        ║
    ║   ✅ Authentication API                ║
    ║   ✅ Asset Management API              ║
    ║   ✅ File Upload API                   ║
    ║   ✅ Folder Management API             ║
    ║   ✅ Tag Management API                ║
    ╚════════════════════════════════════════╝
  `);
});
