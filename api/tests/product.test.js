import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';
import { Product, Category, Supplier, User, ProductVariant } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Product API', () => {
  let token;
  let categoryId;
  let supplierId;

  beforeAll(async () => {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('password', salt);
    const user = await User.create({
      username: 'root_user_' + Date.now(),
      password_hash,
      role: 'root'
    });

    token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'test_secret'
    );

    const cat = await Category.create({ category_name: 'Electronics', slug: 'electronics_' + Date.now() });
    categoryId = cat.id;

    const sup = await Supplier.create({ name: 'Main Supplier' });
    supplierId = sup.id;
  });

  it('should create a product with variants (Transaction Test)', async () => {
    const productData = {
      name: 'Test SmartPhone ' + Date.now(),
      category_id: categoryId,
      primary_supplier_id: supplierId,
      selling_price: 5000000,
      variants: [
        { color: 'Black', size: '128GB', quantity_in_stock: 10, variant_sku: 'UNIQUE_SKU_' + Date.now() }
      ]
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should rollback if variant creation fails due to duplicate SKU (Transaction Rollback Test)', async () => {
    const commonSku = 'COMMON_SKU_' + Date.now();
    const uniqueName = 'Rollback Product ' + Date.now();
    
    // Create an existing variant with this SKU
    await ProductVariant.create({
      product_id: 1, // Doesn't matter which one for SKU unique check
      variant_sku: commonSku
    });

    const productData = {
      name: uniqueName,
      selling_price: 1000,
      category_id: categoryId,
      variants: [
        { color: 'Blue', variant_sku: commonSku } // This will fail due to unique constraint on variant_sku
      ]
    };

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send(productData);

    expect(res.body.success).toBe(false);
    
    // The main product should NOT exist in DB because of rollback
    const p = await Product.findOne({ where: { name: uniqueName } });
    expect(p).toBeNull();
  });
});
