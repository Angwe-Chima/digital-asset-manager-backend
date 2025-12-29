import express from 'express';
import {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
} from '../controllers/tagController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public/All users routes
router.get('/', protect, getTags);
router.get('/popular', protect, getPopularTags);
router.get('/:id', protect, getTag);

// Admin only routes
router.post('/', protect, admin, createTag);
router.put('/:id', protect, admin, updateTag);
router.delete('/:id', protect, admin, deleteTag);

export default router;