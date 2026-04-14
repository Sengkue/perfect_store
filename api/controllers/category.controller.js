import { Category } from '../models/index.js';
import { generateSlug } from '../utils/helpers.js';

// GET /api/categories
export const getAll = async (req, res, next) => {
  try {
    // If tree=true, return hierarchical structure (only root categories with children)
    if (req.query.tree === 'true') {
      const categories = await Category.findAll({
        where: { parent_id: null },
        include: [{
          model: Category,
          as: 'children',
          include: [{ model: Category, as: 'children' }]
        }],
        order: [['category_name', 'ASC']]
      });

      return res.json({ success: true, data: categories });
    }

    // Flat list
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'parent', attributes: ['id', 'category_name'] }],
      order: [['category_name', 'ASC']]
    });

    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
export const getById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'parent', attributes: ['id', 'category_name'] },
        {
          model: Category,
          as: 'children',
          include: [{ model: Category, as: 'children' }]
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
export const create = async (req, res, next) => {
  try {
    const data = { ...req.body };

    // Auto-generate slug if not provided
    if (!data.slug && data.category_name) {
      data.slug = generateSlug(data.category_name);
    }

    // Validate parent_id
    if (data.parent_id) {
      const parent = await Category.findByPk(data.parent_id);
      if (!parent) {
        return res.status(404).json({ success: false, message: 'Parent category not found' });
      }
    }

    const category = await Category.create(data);
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/categories/:id
export const update = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const data = { ...req.body };

    // Prevent self-referencing
    if (data.parent_id && parseInt(data.parent_id) === parseInt(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'A category cannot be its own parent.'
      });
    }

    if (data.category_name && !data.slug) {
      data.slug = generateSlug(data.category_name);
    }

    await category.update(data);
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/categories/:id
export const remove = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check for child categories
    const childCount = await Category.count({ where: { parent_id: req.params.id } });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with child categories. Delete children first.'
      });
    }

    await category.destroy();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
