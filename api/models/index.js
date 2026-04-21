import sequelize from '../config/database.js';

// Import all 23 models
import ShopSetting from './shopSetting.model.js';
import User from './user.model.js';
import UserProfile from './userProfile.model.js';
import Permission from './permission.model.js';
import RolePermission from './rolePermission.model.js';
import UserPermission from './userPermission.model.js';
import Customer from './customer.model.js';
import CustomerAddress from './customerAddress.model.js';
import Supplier from './supplier.model.js';
import Category from './category.model.js';
import Product from './product.model.js';
import ProductVariant from './productVariant.model.js';
import ProductImage from './productImage.model.js';
import PurchaseOrder from './purchaseOrder.model.js';
import PurchaseOrderDetail from './purchaseOrderDetail.model.js';
import Import from './import.model.js';
import ImportDetail from './importDetail.model.js';
import Promotion from './promotion.model.js';
import Sale from './sale.model.js';
import SaleDetail from './saleDetail.model.js';
import Return from './return.model.js';
import ReturnDetail from './returnDetail.model.js';
import Payment from './payment.model.js';
import ProductSupplier from './productSupplier.model.js';

// ============================================
// ASSOCIATIONS
// ============================================

// --- People ---
User.hasOne(UserProfile, { foreignKey: 'user_id', as: 'profile', onDelete: 'CASCADE' });
UserProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- Access Control ---
RolePermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission', onDelete: 'CASCADE' });
Permission.hasMany(RolePermission, { foreignKey: 'permission_id', as: 'role_permissions' });

UserPermission.belongsTo(User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
User.hasMany(UserPermission, { foreignKey: 'user_id', as: 'user_permissions' });

UserPermission.belongsTo(Permission, { foreignKey: 'permission_id', as: 'permission', onDelete: 'CASCADE' });
Permission.hasMany(UserPermission, { foreignKey: 'permission_id', as: 'user_grants' });

UserPermission.belongsTo(User, { foreignKey: 'granted_by', as: 'granter' });

// --- Customer ---
Customer.hasMany(CustomerAddress, { foreignKey: 'customer_id', as: 'addresses', onDelete: 'CASCADE' });
CustomerAddress.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });

// --- Products & Inventory ---
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

Product.belongsTo(Supplier, { foreignKey: 'primary_supplier_id', as: 'primary_supplier' });
Supplier.hasMany(Product, { foreignKey: 'primary_supplier_id', as: 'primary_products' });

// Many-to-Many Suppliers
Product.belongsToMany(Supplier, { 
  through: ProductSupplier, 
  foreignKey: 'product_id', 
  otherKey: 'supplier_id',
  as: 'suppliers' 
});
Supplier.belongsToMany(Product, { 
  through: ProductSupplier, 
  foreignKey: 'supplier_id', 
  otherKey: 'product_id',
  as: 'products' 
});

Product.hasMany(ProductSupplier, { foreignKey: 'product_id', as: 'product_supplier_details' });
ProductSupplier.belongsTo(Product, { foreignKey: 'product_id' });

Supplier.hasMany(ProductSupplier, { foreignKey: 'supplier_id', as: 'supplier_product_details' });
ProductSupplier.belongsTo(Supplier, { foreignKey: 'supplier_id' });

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants', onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// --- Purchase Orders ---
PurchaseOrder.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(PurchaseOrder, { foreignKey: 'user_id', as: 'purchase_orders' });

PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });

PurchaseOrder.hasMany(PurchaseOrderDetail, { foreignKey: 'po_id', as: 'details', onDelete: 'CASCADE' });
PurchaseOrderDetail.belongsTo(PurchaseOrder, { foreignKey: 'po_id', as: 'purchase_order' });

PurchaseOrderDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
PurchaseOrderDetail.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- Imports (Receiving) ---
Import.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchase_order' });
PurchaseOrder.hasMany(Import, { foreignKey: 'purchase_order_id', as: 'imports' });

Import.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Import, { foreignKey: 'user_id', as: 'imports' });

Import.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Supplier.hasMany(Import, { foreignKey: 'supplier_id', as: 'imports' });

Import.hasMany(ImportDetail, { foreignKey: 'import_id', as: 'details', onDelete: 'CASCADE' });
ImportDetail.belongsTo(Import, { foreignKey: 'import_id', as: 'import' });

ImportDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ImportDetail.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

// --- Sales (Unified) ---
Sale.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(Sale, { foreignKey: 'customer_id', as: 'sales' });

Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Sale, { foreignKey: 'user_id', as: 'sales' });

Sale.belongsTo(Promotion, { foreignKey: 'promotion_id', as: 'promotion' });
Promotion.hasMany(Sale, { foreignKey: 'promotion_id', as: 'sales' });

Sale.belongsTo(CustomerAddress, { foreignKey: 'address_id', as: 'address' });

Sale.hasMany(SaleDetail, { foreignKey: 'sale_id', as: 'details', onDelete: 'CASCADE' });
SaleDetail.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

SaleDetail.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
SaleDetail.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

Sale.hasMany(Payment, { foreignKey: 'sale_id', as: 'payments' });
Payment.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

Sale.hasMany(Return, { foreignKey: 'sale_id', as: 'returns' });
Return.belongsTo(Sale, { foreignKey: 'sale_id', as: 'sale' });

// --- Returns ---
Return.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Return.hasMany(ReturnDetail, { foreignKey: 'return_id', as: 'details', onDelete: 'CASCADE' });
ReturnDetail.belongsTo(Return, { foreignKey: 'return_id', as: 'return' });

ReturnDetail.belongsTo(SaleDetail, { foreignKey: 'sale_detail_id', as: 'saleDetail' });

// Export all models & sequelize instance
export {
  sequelize,
  ShopSetting,
  User,
  UserProfile,
  Permission,
  RolePermission,
  UserPermission,
  Customer,
  CustomerAddress,
  Supplier,
  Category,
  Product,
  ProductVariant,
  ProductImage,
  PurchaseOrder,
  PurchaseOrderDetail,
  Import,
  ImportDetail,
  Promotion,
  Sale,
  SaleDetail,
  Return,
  ReturnDetail,
  Payment,
  ProductSupplier
};
