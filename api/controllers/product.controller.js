import { Product, ProductVariant, ProductImage, Category, Supplier } from '../models/index.js';
import { getPagination, getPaginatedResponse } from '../utils/helpers.js';
import { Op } from 'sequelize';

// GET /api/products
export const getAll = async (req, res, next) => {
  try {
    const { limit, offset, page, pageSize } = getPagination(req.query);
    const where = {};

    // Search
    if (req.query.search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${req.query.search}%` } },
        { barcode: { [Op.like]: `%${req.query.search}%` } },
        { sku: { [Op.like]: `%${req.query.search}%` } }
      ];
    }

    // Filters
    if (req.query.category_id) where.category_id = req.query.category_id;
    if (req.query.supplier_id) where.supplier_id = req.query.supplier_id;
    if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';

    // Price range
    if (req.query.min_price || req.query.max_price) {
      where.selling_price = {};
      if (req.query.min_price) where.selling_price[Op.gte] = req.query.min_price;
      if (req.query.max_price) where.selling_price[Op.lte] = req.query.max_price;
    }

    const data = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'category_name'] },
        { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
        { model: ProductVariant, as: 'variants' },
        { model: ProductImage, as: 'images', where: { is_primary: true }, required: false }
      ]
    });

    res.json({
      success: true,
      ...getPaginatedResponse(data, page, pageSize)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id
export const getById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: ProductVariant, as: 'variants' },
        { model: ProductImage, as: 'images', order: [['sort_order', 'ASC']] }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products
export const create = async (req, res, next) => {
  try {
    const { variants, images, ...productData } = req.body;

    const product = await Product.create(productData);

    // Create variants if provided
    if (variants && Array.isArray(variants)) {
      const variantData = variants.map(v => ({ ...v, product_id: product.id }));
      await ProductVariant.bulkCreate(variantData);
    }

    // Create images if provided
    if (images && Array.isArray(images)) {
      const imageData = images.map((img, idx) => ({
        ...img,
        product_id: product.id,
        sort_order: img.sort_order || idx
      }));
      await ProductImage.bulkCreate(imageData);
    }

    // Reload with associations
    const result = await Product.findByPk(product.id, {
      include: [
        { model: ProductVariant, as: 'variants' },
        { model: ProductImage, as: 'images' }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id
export const update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const { variants, images, ...productData } = req.body;
    await product.update(productData);

    const result = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: ProductVariant, as: 'variants' },
        { model: ProductImage, as: 'images' }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id
export const remove = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await product.destroy();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Variants Sub-resource ---

// POST /api/products/:id/variants
export const addVariant = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = await ProductVariant.create({
      ...req.body,
      product_id: req.params.id
    });

    res.status(201).json({
      success: true,
      message: 'Variant added successfully',
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id/variants/:variantId
export const updateVariant = async (req, res, next) => {
  try {
    const variant = await ProductVariant.findOne({
      where: { id: req.params.variantId, product_id: req.params.id }
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    await variant.update(req.body);
    res.json({
      success: true,
      message: 'Variant updated successfully',
      data: variant
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/variants/:variantId
export const removeVariant = async (req, res, next) => {
  try {
    const variant = await ProductVariant.findOne({
      where: { id: req.params.variantId, product_id: req.params.id }
    });

    if (!variant) {
      return res.status(404).json({ success: false, message: 'Variant not found' });
    }

    await variant.destroy();
    res.json({ success: true, message: 'Variant deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Images Sub-resource ---

// POST /api/products/:id/images
export const addImage = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image file is required' });
    }

    const image = await ProductImage.create({
      product_id: req.params.id,
      image_url: `/uploads/${req.file.filename}`,
      is_primary: req.body.is_primary === 'true' || false,
      sort_order: parseInt(req.body.sort_order) || 0
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: image
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id/images/:imageId
export const removeImage = async (req, res, next) => {
  try {
    const image = await ProductImage.findOne({
      where: { id: req.params.imageId, product_id: req.params.id }
    });

    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    await image.destroy();
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    next(error);
  }
};
