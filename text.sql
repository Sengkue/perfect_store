-- Create database
CREATE DATABASE IF NOT EXISTS perfect_store;
USE perfect_store;

-- ============================================
-- 1. SYSTEM CONFIGURATION
-- ============================================
CREATE TABLE shop_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    shop_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    logo_url TEXT,
    address TEXT,
    tax_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. GEOGRAPHY TABLES
-- ============================================
CREATE TABLE provinces (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_name VARCHAR(100) NOT NULL,
    province_code VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE districts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    province_id INT NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    postal_code VARCHAR(10),
    FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
);

-- ============================================
-- 3. PEOPLE MANAGEMENT
-- ============================================
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    province_id INT,
    district_id INT,
    address TEXT,
    hire_date DATE,
    salary DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    total_spent DECIMAL(12,2) DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    customer_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customer_addresses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(20),
    province_id INT,
    district_id INT,
    detailed_address TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    address_type ENUM('home', 'work', 'other') DEFAULT 'home',
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

-- ============================================
-- 4. PRODUCT MANAGEMENT
-- ============================================
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    province_id INT,
    district_id INT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (district_id) REFERENCES districts(id)
);

CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parent_id INT NULL,
    category_name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    description TEXT,
    image_url TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);

CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    supplier_id INT,
    name VARCHAR(200) NOT NULL,
    barcode VARCHAR(50) UNIQUE,
    sku VARCHAR(50) UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2) NOT NULL,
    weight DECIMAL(8,2),
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE product_variants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    color VARCHAR(50),
    size VARCHAR(20),
    variant_sku VARCHAR(50) UNIQUE,
    quantity_in_stock INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 5,
    additional_price DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- 5. INVENTORY & IMPORTS
-- ============================================
CREATE TABLE imports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    supplier_id INT,
    invoice_number VARCHAR(50) UNIQUE,
    receive_date DATE,
    total_amount DECIMAL(12,2),
    payment_status ENUM('pending', 'partial', 'paid') DEFAULT 'pending',
    status ENUM('draft', 'received', 'completed', 'cancelled') DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE import_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    import_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2),
    subtotal DECIMAL(12,2),
    FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- ============================================
-- 6. PROMOTIONS
-- ============================================
CREATE TABLE promotions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    promo_code VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed_amount', 'buy_x_get_y') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    usage_limit INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. SALES (UNIFIED - Online & In-Shop)
-- ============================================
CREATE TABLE sales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_type ENUM('in_shop', 'online') NOT NULL,
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NULL,
    employee_id INT NOT NULL,
    promotion_id INT NULL,
    address_id INT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'cod', 'qr_payment'),
    payment_status ENUM('pending', 'paid', 'failed', 'refunded', 'partial') DEFAULT 'pending',
    sale_status ENUM('pending', 'processing', 'completed', 'cancelled', 'returned') DEFAULT 'pending',
    
    -- Online specific fields
    tracking_code VARCHAR(100) UNIQUE NULL,
    delivery_status ENUM('pending', 'packed', 'shipped', 'delivered', 'returned') NULL,
    courier_name VARCHAR(100) NULL,
    estimated_delivery DATE NULL,
    actual_delivery DATE NULL,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (promotion_id) REFERENCES promotions(id),
    FOREIGN KEY (address_id) REFERENCES customer_addresses(id),
    
    INDEX idx_sale_date (sale_date),
    INDEX idx_customer (customer_id),
    INDEX idx_status (sale_status),
    INDEX idx_type (sale_type)
);

CREATE TABLE sale_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_per_item DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    
    INDEX idx_sale (sale_id),
    INDEX idx_product (product_id)
);

-- ============================================
-- 8. RETURNS & REFUNDS
-- ============================================
CREATE TABLE returns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    employee_id INT,
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10,2),
    reason TEXT,
    return_status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE return_details (
    id INT PRIMARY KEY AUTO_INCREMENT,
    return_id INT NOT NULL,
    sale_detail_id INT NOT NULL,
    quantity_returned INT,
    refund_amount DECIMAL(10,2),
    
    FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_detail_id) REFERENCES sale_details(id)
);

-- ============================================
-- 9. PAYMENTS TRACKING
-- ============================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_id INT NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    payment_reference VARCHAR(100),
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    INDEX idx_sale (sale_id)
);

-- ============================================
-- 10. REVIEWS & RATINGS
-- ============================================
CREATE TABLE product_reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    sale_detail_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sale_detail_id) REFERENCES sale_details(id),
    UNIQUE KEY unique_review (sale_detail_id, customer_id)
);

-- ============================================
-- 11. CARTS (For online customers)
-- ============================================
CREATE TABLE carts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    UNIQUE KEY unique_customer_cart (customer_id)
);

CREATE TABLE cart_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    variant_id INT NULL,
    quantity INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id),
    UNIQUE KEY unique_cart_product (cart_id, product_id, variant_id)
);

-- ============================================
-- 12. WISHLIST
-- ============================================
CREATE TABLE wishlists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE KEY unique_wishlist (customer_id, product_id)
);

-- ============================================
-- 13. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    customer_id INT,
    title VARCHAR(200),
    message TEXT,
    type ENUM('order', 'promotion', 'system', 'inventory'),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user (user_id),
    INDEX idx_customer (customer_id)
);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================
INSERT INTO provinces (province_name, province_code) VALUES 
('Bangkok', 'BKK'),
('Chiang Mai', 'CNX'),
('Phuket', 'PKT');

INSERT INTO districts (province_id, district_name, postal_code) VALUES 
(1, 'Sukhumvit', '10110'),
(1, 'Silom', '10500'),
(2, 'Muang', '50000'),
(3, 'Kathu', '83120');

INSERT INTO shop_settings (shop_name, phone, email, address, tax_number) VALUES 
('Perfect Store', '02-123-4567', 'info@perfectstore.com', '123 Main St, Bangkok', 'TAX123456789');

INSERT INTO employees (first_name, last_name, phone, email, hire_date, salary) VALUES 
('Admin', 'User', '0812345678', 'admin@perfectstore.com', '2024-01-01', 50000),
('John', 'Doe', '0823456789', 'john@perfectstore.com', '2024-01-15', 35000);

INSERT INTO users (employee_id, username, password_hash, role) VALUES 
(1, 'admin', '$2a$10$YourHashedPasswordHere', 'admin'),
(2, 'staff1', '$2a$10$YourHashedPasswordHere', 'staff');

INSERT INTO categories (category_name, slug) VALUES 
('Electronics', 'electronics'),
('Clothing', 'clothing'),
('Books', 'books');

INSERT INTO products (category_id, name, sku, selling_price, description) VALUES 
(1, 'Smartphone X', 'PHONE-001', 599.99, 'Latest smartphone with great features'),
(2, 'T-Shirt', 'TSHIRT-001', 29.99, 'Comfortable cotton t-shirt'),
(3, 'JavaScript Book', 'BOOK-001', 49.99, 'Learn JavaScript');

-- ============================================
-- CREATE VIEWS FOR REPORTS
-- ============================================
CREATE VIEW daily_sales_report AS
SELECT 
    DATE(sale_date) as sale_day,
    sale_type,
    COUNT(*) as total_transactions,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM sales
WHERE sale_status = 'completed'
GROUP BY DATE(sale_date), sale_type;

CREATE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    COUNT(sd.id) as times_sold,
    SUM(sd.quantity) as total_quantity_sold,
    SUM(sd.subtotal) as total_revenue
FROM products p
LEFT JOIN sale_details sd ON p.id = sd.product_id
GROUP BY p.id, p.name;

-- ============================================
-- STORED PROCEDURES
-- ============================================
DELIMITER //

CREATE PROCEDURE UpdateCustomerTier(IN customer_id INT)
BEGIN
    DECLARE total_spent_amount DECIMAL(12,2);
    
    SELECT total_spent INTO total_spent_amount 
    FROM customers WHERE id = customer_id;
    
    UPDATE customers SET customer_tier = 
        CASE 
            WHEN total_spent_amount >= 10000 THEN 'platinum'
            WHEN total_spent_amount >= 5000 THEN 'gold'
            WHEN total_spent_amount >= 1000 THEN 'silver'
            ELSE 'bronze'
        END
    WHERE id = customer_id;
END //

CREATE PROCEDURE GetLowStockProducts()
BEGIN
    SELECT 
        p.id,
        p.name,
        pv.color,
        pv.size,
        pv.quantity_in_stock,
        pv.reorder_level
    FROM products p
    JOIN product_variants pv ON p.id = pv.product_id
    WHERE pv.quantity_in_stock <= pv.reorder_level
    ORDER BY pv.quantity_in_stock ASC;
END //

DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================
DELIMITER //

CREATE TRIGGER update_stock_after_sale
AFTER INSERT ON sale_details
FOR EACH ROW
BEGIN
    IF NEW.variant_id IS NOT NULL THEN
        UPDATE product_variants 
        SET quantity_in_stock = quantity_in_stock - NEW.quantity
        WHERE id = NEW.variant_id;
    END IF;
END //

CREATE TRIGGER update_customer_spent
AFTER UPDATE ON sales
FOR EACH ROW
BEGIN
    IF NEW.sale_status = 'completed' AND OLD.sale_status != 'completed' THEN
        UPDATE customers 
        SET total_spent = total_spent + NEW.total_amount
        WHERE id = NEW.customer_id;
        
        CALL UpdateCustomerTier(NEW.customer_id);
    END IF;
END //

DELIMITER ;