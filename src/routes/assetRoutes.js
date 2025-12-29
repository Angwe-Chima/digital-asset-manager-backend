import express from 'express';
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  incrementDownload,
  incrementView,
  searchAssets,
} from '../controllers/assetController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/All users routes
router.get('/', protect, getAssets);
router.get('/search/:query', protect, searchAssets);
router.get('/:id', protect, getAsset);
router.post('/:id/download', protect, incrementDownload);
router.post('/:id/view', protect, incrementView);

// Admin only routes
router.post('/', protect, admin, createAsset);
router.put('/:id', protect, admin, updateAsset);
router.delete('/:id', protect, admin, deleteAsset);

export default router;