import Tag from '../models/Tag.js';
import Asset from '../models/Asset.js';
import { validateTag } from '../utils/validators.js';

// @desc    Get all tags
// @route   GET /api/tags
// @access  Private
export const getTags = async (req, res, next) => {
  try {
    const tags = await Tag.find()
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    // Get asset count for each tag
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const assetCount = await Asset.countDocuments({ tags: tag._id });
        return {
          ...tag.toObject(),
          assetCount,
        };
      })
    );

    res.json({
      success: true,
      count: tagsWithCount.length,
      data: tagsWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tag with assets
// @route   GET /api/tags/:id
// @access  Private
export const getTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id).populate(
      'createdBy',
      'name email'
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    // Get assets with this tag
    const assets = await Asset.find({ tags: tag._id })
      .populate('folder', 'name color')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        tag,
        assets,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create tag
// @route   POST /api/tags
// @access  Private (Admin only)
export const createTag = async (req, res, next) => {
  try {
    const { name, color } = req.body;

    // Validate input
    const { error } = validateTag({ name, color });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if tag already exists
    const tagExists = await Tag.findOne({ name: name.toLowerCase() });
    if (tagExists) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name already exists',
      });
    }

    // Create tag
    const tag = await Tag.create({
      name: name.toLowerCase(),
      color: color || '#9CA3AF',
      createdBy: req.user._id,
    });

    const populatedTag = await Tag.findById(tag._id).populate(
      'createdBy',
      'name email'
    );

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: populatedTag,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tag
// @route   PUT /api/tags/:id
// @access  Private (Admin only)
export const updateTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    const { name, color } = req.body;

    // Check if new name already exists (if name is being changed)
    if (name && name.toLowerCase() !== tag.name) {
      const tagExists = await Tag.findOne({ name: name.toLowerCase() });
      if (tagExists) {
        return res.status(400).json({
          success: false,
          message: 'Tag with this name already exists',
        });
      }
    }

    // Update fields
    tag.name = name ? name.toLowerCase() : tag.name;
    tag.color = color || tag.color;

    const updatedTag = await tag.save();

    const populatedTag = await Tag.findById(updatedTag._id).populate(
      'createdBy',
      'name email'
    );

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data: populatedTag,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete tag
// @route   DELETE /api/tags/:id
// @access  Private (Admin only)
export const deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findById(req.params.id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
    }

    // Remove tag from all assets
    await Asset.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });

    await tag.deleteOne();

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular tags
// @route   GET /api/tags/popular
// @access  Private
export const getPopularTags = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const tags = await Tag.find().populate('createdBy', 'name email');

    // Get asset count for each tag
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const assetCount = await Asset.countDocuments({ tags: tag._id });
        return {
          ...tag.toObject(),
          assetCount,
        };
      })
    );

    // Sort by asset count and limit
    const popularTags = tagsWithCount
      .sort((a, b) => b.assetCount - a.assetCount)
      .slice(0, limit);

    res.json({
      success: true,
      count: popularTags.length,
      data: popularTags,
    });
  } catch (error) {
    next(error);
  }
};