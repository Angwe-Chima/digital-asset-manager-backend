import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import tagRoutes from './routes/tagRoutes.js';

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

// App init
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://chima-angwe.github.io',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, Postman, curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Digital Asset Manager API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
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

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   DIGITAL ASSET MANAGER API            ║
║----------------------------------------║
║   Status: Running                      ║
║   Port: ${PORT}                        ║
║   Env:  ${process.env.NODE_ENV || 'dev'}║
║                                        ║
║   Frontend (Prod):                     ║
║   https://angwe-chima.github.io         ║
║                                        ║
║   Frontend (Dev):                      ║
║   http://localhost:5173                ║
╚════════════════════════════════════════╝
`);
});
