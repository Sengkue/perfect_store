import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log error using Winston
  logger.error('%s %s - %s', req.method, req.originalUrl, err.message, { 
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'anonymous'
  });

  // Sequelize validation errors
  if (err instanceof ValidationError) {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors
    });
  }

  // Sequelize unique constraint errors
  if (err instanceof UniqueConstraintError) {
    const fields = Object.keys(err.fields || {});
    return res.status(409).json({
      success: false,
      message: `Duplicate entry. The value for ${fields.join(', ')} already exists.`,
      fields
    });
  }

  // Sequelize foreign key constraint errors
  if (err instanceof ForeignKeyConstraintError) {
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found or cannot be deleted due to existing references.'
    });
  }

  // Express-validator errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body.'
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected file field.'
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;
