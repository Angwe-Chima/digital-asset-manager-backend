import Folder from '../models/Folder.js';
import Asset from '../models/Asset.js';
import { validateFolder } from '../utils/validators.js';

// @desc    Get all folders
// @route   GET /api/folders
// @access  Private
export const getFolders = async (req, res, next) => {
  try {
    const { parentFolder } = req.query;

    // Build query
    const query = {};
    if (parentFolder !== undefined) {
      query.parentFolder = parentFolder === 'null' ? null : parentFolder;
    }

    const folders = await Folder.find(query)
      .populate('parentFolder', 'name color')
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    // Get asset count for each folder
    const foldersWithCount = await Promise.all(
      folders.map(async (folder) => {
        const assetCount = await Asset.countDocuments({ folder: folder._id });
        return {
          ...folder.toObject(),
          assetCount,
        };
      })
    );

    res.json({
      success: true,
      count: foldersWithCount.length,
      data: foldersWithCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single folder with assets
// @route   GET /api/folders/:id
// @access  Private
export const getFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('parentFolder', 'name color')
      .populate('createdBy', 'name email');

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    // Get assets in this folder
    const assets = await Asset.find({ folder: folder._id })
      .populate('tags', 'name color')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    // Get subfolders
    const subfolders = await Folder.find({ parentFolder: folder._id }).sort({
      name: 1,
    });

    res.json({
      success: true,
      data: {
        folder,
        assets,
        subfolders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create folder
// @route   POST /api/folders
// @access  Private (Admin only)
export const createFolder = async (req, res, next) => {
  try {
    const { name, description, parentFolder, color, isPublic } = req.body;

    // Validate input
    const { error } = validateFolder({
      name,
      description,
      parentFolder,
      color,
      isPublic,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if parent folder exists (if provided)
    if (parentFolder) {
      const parent = await Folder.findById(parentFolder);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found',
        });
      }
    }

    // Create folder
    const folder = await Folder.create({
      name,
      description,
      parentFolder: parentFolder || null,
      color: color || '#3B82F6',
      createdBy: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
    });

    const populatedFolder = await Folder.findById(folder._id)
      .populate('parentFolder', 'name color')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: populatedFolder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update folder
// @route   PUT /api/folders/:id
// @access  Private (Admin only)
export const updateFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    const { name, description, parentFolder, color, isPublic } = req.body;

    // Check if parent folder exists (if provided)
    if (parentFolder && parentFolder !== folder._id.toString()) {
      const parent = await Folder.findById(parentFolder);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: 'Parent folder not found',
        });
      }

      // Prevent circular reference
      if (parentFolder === folder._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Folder cannot be its own parent',
        });
      }
    }

    // Update fields
    folder.name = name || folder.name;
    folder.description =
      description !== undefined ? description : folder.description;
    folder.parentFolder =
      parentFolder !== undefined ? parentFolder : folder.parentFolder;
    folder.color = color || folder.color;
    folder.isPublic = isPublic !== undefined ? isPublic : folder.isPublic;

    const updatedFolder = await folder.save();

    const populatedFolder = await Folder.findById(updatedFolder._id)
      .populate('parentFolder', 'name color')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Folder updated successfully',
      data: populatedFolder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete folder
// @route   DELETE /api/folders/:id
// @access  Private (Admin only)
export const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
    }

    // Check if folder has assets
    const assetCount = await Asset.countDocuments({ folder: folder._id });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete folder with ${assetCount} assets. Please move or delete assets first.`,
      });
    }

    // Check if folder has subfolders
    const subfolderCount = await Folder.countDocuments({
      parentFolder: folder._id,
    });
    if (subfolderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete folder with ${subfolderCount} subfolders. Please delete subfolders first.`,
      });
    }

    await folder.deleteOne();

    res.json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get folder tree (hierarchical structure)
// @route   GET /api/folders/tree
// @access  Private
export const getFolderTree = async (req, res, next) => {
  try {
    // Get all folders
    const folders = await Folder.find().sort({ name: 1 });

    // Build tree structure
    const buildTree = (parentId = null) => {
      return folders
        .filter((folder) =>
          parentId
            ? folder.parentFolder?.toString() === parentId
            : !folder.parentFolder
        )
        .map((folder) => ({
          ...folder.toObject(),
          children: buildTree(folder._id.toString()),
        }));
    };

    const tree = buildTree();

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};