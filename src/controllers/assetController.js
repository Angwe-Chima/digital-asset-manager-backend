import Asset from '../models/Asset.js';
import { validateAsset } from '../utils/validators.js';

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
export const getAssets = async (req, res, next) => {
  try {
    const {
      folder,
      fileType,
      tags,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build query
    const query = {};

    if (folder) {
      query.folder = folder === 'null' ? null : folder;
    }

    if (fileType) {
      query.fileType = fileType;
    }

    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const assets = await Asset.find(query)
      .populate('folder', 'name color')
      .populate('tags', 'name color')
      .populate('uploadedBy', 'name email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Asset.countDocuments(query);

    res.json({
      success: true,
      count: assets.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: assets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single asset
// @route   GET /api/assets/:id
// @access  Private
export const getAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('folder', 'name color')
      .populate('tags', 'name color')
      .populate('uploadedBy', 'name email');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    res.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create asset
// @route   POST /api/assets
// @access  Private (Admin only)
export const createAsset = async (req, res, next) => {
  try {
    const { name, description, fileUrl, fileType, fileSize, mimeType, folder, tags, thumbnail, isPublic } = req.body;

    // Validate input
    const { error } = validateAsset({ name, description, fileType, folder, tags, isPublic });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Create asset
    const asset = await Asset.create({
      name,
      description,
      fileUrl,
      fileType,
      fileSize,
      mimeType,
      folder: folder || null,
      tags: tags || [],
      thumbnail,
      uploadedBy: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    const populatedAsset = await Asset.findById(asset._id)
      .populate('folder', 'name color')
      .populate('tags', 'name color')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      data: populatedAsset,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update asset
// @route   PUT /api/assets/:id
// @access  Private (Admin only)
export const updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    const { name, description, folder, tags, isPublic } = req.body;

    // Update fields
    asset.name = name || asset.name;
    asset.description = description !== undefined ? description : asset.description;
    asset.folder = folder !== undefined ? folder : asset.folder;
    asset.tags = tags !== undefined ? tags : asset.tags;
    asset.isPublic = isPublic !== undefined ? isPublic : asset.isPublic;

    const updatedAsset = await asset.save();

    const populatedAsset = await Asset.findById(updatedAsset._id)
      .populate('folder', 'name color')
      .populate('tags', 'name color')
      .populate('uploadedBy', 'name email');

    res.json({
      success: true,
      message: 'Asset updated successfully',
      data: populatedAsset,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
// @access  Private (Admin only)
export const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    await asset.deleteOne();

    res.json({
      success: true,
      message: 'Asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment download count
// @route   POST /api/assets/:id/download
// @access  Private
export const incrementDownload = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    asset.downloads += 1;
    await asset.save();

    res.json({
      success: true,
      message: 'Download count incremented',
      downloads: asset.downloads,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Increment view count
// @route   POST /api/assets/:id/view
// @access  Private
export const incrementView = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    asset.views += 1;
    await asset.save();

    res.json({
      success: true,
      message: 'View count incremented',
      views: asset.views,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search assets
// @route   GET /api/assets/search/:query
// @access  Private
export const searchAssets = async (req, res, next) => {
  try {
    const { query } = req.params;

    const assets = await Asset.find({
      $text: { $search: query },
    })
      .populate('folder', 'name color')
      .populate('tags', 'name color')
      .populate('uploadedBy', 'name email')
      .limit(50);

    res.json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
};