import Joi from 'joi';

// User registration validation
export const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'guest').default('guest'),
  });

  return schema.validate(data);
};

// User login validation
export const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  return schema.validate(data);
};

// Asset validation
export const validateAsset = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).allow(''),
    fileType: Joi.string()
      .valid(
        'image',
        'pdf',
        'video',
        'document',
        'spreadsheet',
        'presentation',
        'other'
      )
      .required(),
    folder: Joi.string().allow(null),
    tags: Joi.array().items(Joi.string()),
    isPublic: Joi.boolean().default(true),
  });

  return schema.validate(data);
};

// Folder validation
export const validateFolder = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).allow(''),
    parentFolder: Joi.string().allow(null),
    color: Joi.string()
      .pattern(/^#[0-9A-F]{6}$/i)
      .default('#3B82F6'),
    isPublic: Joi.boolean().default(true),
  });

  return schema.validate(data);
};

// Tag validation
export const validateTag = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(50).required(),
    color: Joi.string()
      .pattern(/^#[0-9A-F]{6}$/i)
      .default('#9CA3AF'),
  });

  return schema.validate(data);
};