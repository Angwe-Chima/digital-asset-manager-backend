import express from 'express';
import {
  uploadSingle,
  uploadMultiple,
  deleteFile,
} from '../controllers/uploadController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All routes require authentication and admin role
router.post('/single', protect, admin, upload.single('file'), uploadSingle);
router.post('/multiple', protect, admin, upload.array('files', 10), uploadMultiple);
router.delete('/:filename', protect, admin, deleteFile);

export default router;