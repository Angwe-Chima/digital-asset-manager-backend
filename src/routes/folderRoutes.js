import express from 'express';
import {
  getFolders,
  getFolder,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderTree,
} from '../controllers/folderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/All users routes
router.get('/', protect, getFolders);
router.get('/tree', protect, getFolderTree);
router.get('/:id', protect, getFolder);

// Admin only routes
router.post('/', protect, admin, createFolder);
router.put('/:id', protect, admin, updateFolder);
router.delete('/:id', protect, admin, deleteFolder);

export default router;