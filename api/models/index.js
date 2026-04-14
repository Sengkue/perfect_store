import sequelize from '../config/database.js';

// Import all models
import ShopSetting from './shopSetting.model.js';
import Province from './province.model.js';
import District from './district.model.js';
import Employee from './employee.model.js';
import User from './user.model.js';
import Customer from './customer.model.js';
import CustomerAddress from './customerAddress.model.js';
import Supplier from './supplier.model.js';
import Category from './category.model.js';
import Product from './product.model.js';
import ProductVariant from './productVariant.model.js';
import ProductImage from './productImage.model.js';
import Import from './import.model.js';
import ImportDetail from './importDetail.model.js';
import Promotion from './promotion.model.js';
import Sale from './sale.model.js';
import SaleDetail from './saleDetail.model.js';
import Return from './return.model.js';
import ReturnDetail from './returnDetail.model.js';
import Payment from './payment.model.js';

// ============================================
// ASSOCIATIONS
// ============================================

// --- Geography ---
Province.hasMany(District, { foreignKey: 'province_id', as: 'districts' });
District.belongsTo(Province, { foreignKey: 'province_id', as: 'province' });

// --- Employee ---
Employee.belongsTo(Province, { foreignKey: 'province_id', as: 'province' });
Employee.belongsTo(District, { foreignKey: 'district_id', as: 'district' });

// --- User → Employee ---
User.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasOne(User, { foreignKey: 'employee_id', as: 'user' });

// --- Customer → Addresses ---
Customer.hasMany(CustomerAddress, { foreignKey: 'customer_id', as: 'addresses', onDelete: 'CASCADE' });
CustomerAddress.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
CustomerAddress.belongsTo(Province, { foreignKey: 'province_id', as: 'province' });
CustomerAddress.belongsTo(District, { foreignKey: 'district_id', as: 'district' });

// --- Supplier ---
Supplier.belongsTo(Province, { foreignKey: 'province_id', as: 'province' });
Supplier.belongsTo(District, { foreignKey: 'district_id', as: 'district' });

// --- Category (self-referencing) ---
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });

// --- Product ---
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });

ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// --- Import ---
Import.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Import.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Import.hasMany(ImportDetail, { foreignKey: 'import_id', as: 'details', onDelete: 'CASCADE' });

ImportDetail.belongsTo(Import, { foreignKey: 'import_id', as: 'import' });
ImportDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ImportDetail.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- Sale ---
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Sale.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Sale.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
Sale.belongsTo(CustomerAddress, { foreignKey: 'address_id', as: 'address' });
Sale.hasMany(SaleDetail, { foreignKey: 'sale_id', as: 'details', onDelete: 'CASCADE' });
Sale.hasMany(Payment, { foreignKey: 'sale_id', as: 'payments' });
Sale.hasMany(Return, { foreignKey: 'sale_id', as: 'returns' });

SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
SaleDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SaleDetail.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- Return ---
Return.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });
Return.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Return.hasMany(ReturnDetail, { foreignKey: 'return_id', as: 'details', onDelete: 'CASCADE' });

ReturnDetail.belongsTo(Return, { foreignKey: 'return_id', as: 'return' });
ReturnDetail.belongsTo(SaleDetail, { foreignKey: 'sale_detail_id', as: 'saleDetail' });

// --- Payment ---
Payment.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

// --- Customer reverse ---
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });

export {
  sequelize,
  ShopSetting,
  Province,
  District,
  Employee,
  User,
  Customer,
  CustomerAddress,
  Supplier,
  Category,
  Product,
  ProductVariant,
  ProductImage,
  Import,
  ImportDetail,
  Promotion,
  Sale,
  SaleDetail,
  Return,
  ReturnDetail,
  Payment
};
