-- ==========================================
-- SUPERMARKET BILLING AND INVENTORY SYSTEM
-- DATABASE SCHEMA SCRIPT
-- ==========================================

DROP DATABASE IF EXISTS supermarket_db;
CREATE DATABASE IF NOT EXISTS supermarket_db;
USE supermarket_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'cashier') NOT NULL DEFAULT 'cashier',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category_id INT,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. INVENTORY TABLE (Reorder Alerts and Metadata)
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL UNIQUE,
    min_stock_level INT NOT NULL DEFAULT 10,
    remarks VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BILLS TABLE
CREATE TABLE IF NOT EXISTS bills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_id INT,
    customer_name VARCHAR(100) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(15) DEFAULT '',
    subtotal DECIMAL(10, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0.00,
    grand_total DECIMAL(10, 2) NOT NULL,
    payment_mode ENUM('Cash', 'UPI', 'Card') NOT NULL DEFAULT 'Cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. BILL ITEMS TABLE
CREATE TABLE IF NOT EXISTS bill_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bill_id INT NOT NULL,
    product_id INT,
    product_name VARCHAR(150) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    gst_percent DECIMAL(5, 2) NOT NULL,
    gst_amount DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ==========================================
-- INSERT SAMPLE DUMMY DATA
-- ==========================================

-- Seed Categories
INSERT INTO categories (name, description) VALUES
('Groceries', 'Daily essential food items, grains, spices, flour, and oils'),
('Dairy & Bakery', 'Milk, cheese, butter, bread, cakes, and dairy products'),
('Beverages', 'Soft drinks, fruit juices, tea, coffee, and energy drinks'),
('Packaged Foods', 'Noodles, chips, biscuits, chocolates, and ready-to-eat meals'),
('Personal Care', 'Soaps, shampoos, toothpaste, creams, and hygiene products'),
('Household Items', 'Detergents, cleaning liquids, scrubbers, and bin liners');

-- Seed Users (Passwords: admin -> admin123, cashier -> cashier123)
-- Using modern Werkzeug PBKDF2 / Scrypt compatible hashes
INSERT INTO users (username, password_hash, role, full_name, email) VALUES
('admin', 'scrypt:32768:8:1$mm7ZCUSGjCaMmQzn$dff2c1e279f20e8cf106cc1060bc03148862e8179608e6df41e28ca285292b34523683c9c6ac063d1ad8a055773b2d8d35723a643ef76af81d6f071fce7e6985', 'admin', 'System Administrator', 'admin@supermarket.com'),
('cashier', 'scrypt:32768:8:1$gPPaJc8HsdFjcIlU$f4e0bf7f6c07c30c0aae78d3f1915fce99f3291b9ce21b95ddc860d84117aa7f66b58acd624cfd855b6c3e7f77b4c7c0ad341b004508a5229761e11a87667ffc', 'cashier', 'Rajesh Kumar', 'rajesh@supermarket.com'),
('cashier2', 'scrypt:32768:8:1$gPPaJc8HsdFjcIlU$f4e0bf7f6c07c30c0aae78d3f1915fce99f3291b9ce21b95ddc860d84117aa7f66b58acd624cfd855b6c3e7f77b4c7c0ad341b004508a5229761e11a87667ffc', 'cashier', 'Sunita Sharma', 'sunita@supermarket.com');

-- Seed Products
INSERT INTO products (barcode, name, category_id, price, quantity, gst_percent) VALUES
('8901030752392', 'Fortune Premium Mustard Oil 1L', 1, 175.00, 50, 5.00),
('8901725181223', 'Aashirvaad Shudh Chakki Atta 5kg', 1, 260.00, 40, 0.00),
('8901262010017', 'Tata Salt 1kg', 1, 28.00, 100, 0.00),
('8901719124021', 'Amul Butter 500g', 2, 275.00, 25, 12.00),
('8901262020023', 'Amul Taaza Toned Milk 1L', 2, 66.00, 8, 0.00), -- Low Stock!
('8901138510252', 'Britannia Marie Gold Biscuits 250g', 2, 35.00, 60, 18.00),
('8901764032210', 'Coca Cola 1.25L', 3, 70.00, 45, 28.00),
('8901030654122', 'Red Label Tea 500g', 3, 210.00, 30, 5.00),
('8901063016201', 'Maggi 2-Minute Masala Noodles 70g', 4, 14.00, 120, 18.00),
('8901725191222', 'Kurkure Masala Munch 90g', 4, 20.00, 75, 18.00),
('8901030704155', 'Dettol Liquid Handwash Refill 175ml', 5, 99.00, 35, 18.00),
('8901525101221', 'Colgate MaxFresh Toothpaste 150g', 5, 115.00, 40, 18.00),
('8901030818227', 'Surf Excel Easy Wash 1kg', 6, 140.00, 5, 18.00), -- Low Stock!
('8901030847227', 'Vim Dishwash Gel 500ml', 6, 120.00, 28, 18.00);

-- Seed Inventory reorder levels mapping to products
INSERT INTO inventory (product_id, min_stock_level, remarks) VALUES
(1, 15, 'Fast moving oil category'),
(2, 10, 'Essential grain storage'),
(3, 20, 'High frequency purchase'),
(4, 8, 'Perishable refrigerator item'),
(5, 10, 'Daily fresh milk intake required'),
(6, 15, 'Biscuit racks standard'),
(7, 12, 'Beverage cooling rack'),
(8, 10, 'Beverage shelf dry'),
(9, 30, 'Fast food section staples'),
(10, 20, 'Snack counter display'),
(11, 10, 'Bathroom shelf items'),
(12, 12, 'Dental hygiene rack'),
(13, 8, 'Heavy detergents floor space'),
(14, 10, 'Kitchen cleaning section');

-- Seed initial sales (Bills)
INSERT INTO bills (bill_number, cashier_id, customer_name, customer_phone, subtotal, gst_amount, discount, grand_total, payment_mode, created_at) VALUES
('BILL-2026-00001', 2, 'Walk-in Customer', '', 535.00, 35.80, 10.00, 560.80, 'Cash', '2026-05-25 11:20:00'),
('BILL-2026-00002', 2, 'Aman Verma', '9876543210', 975.00, 93.60, 25.00, 1043.60, 'UPI', '2026-05-25 15:45:00'),
('BILL-2026-00003', 3, 'Walk-in Customer', '', 148.00, 25.20, 0.00, 173.20, 'Card', '2026-05-26 10:15:00'),
('BILL-2026-00004', 2, 'Pooja Sen', '9988776655', 380.00, 12.00, 15.00, 377.00, 'UPI', '2026-05-26 14:30:00');

-- Seed Bill Items
INSERT INTO bill_items (bill_id, product_id, product_name, price, quantity, gst_percent, gst_amount, total_price) VALUES
-- Bill 1 items
(1, 1, 'Fortune Premium Mustard Oil 1L', 175.00, 2, 5.00, 17.50, 367.50),
(1, 3, 'Tata Salt 1kg', 28.00, 3, 0.00, 0.00, 84.00),
(1, 11, 'Dettol Liquid Handwash Refill 175ml', 99.00, 1, 18.00, 17.82, 116.82),
-- Bill 2 items
(2, 2, 'Aashirvaad Shudh Chakki Atta 5kg', 260.00, 2, 0.00, 0.00, 520.00),
(2, 4, 'Amul Butter 500g', 275.00, 1, 12.00, 33.00, 308.00),
(2, 8, 'Red Label Tea 500g', 210.00, 1, 5.00, 10.50, 220.50),
(2, 9, 'Maggi 2-Minute Masala Noodles 70g', 14.00, 5, 18.00, 12.60, 82.60),
-- Bill 3 items
(3, 7, 'Coca Cola 1.25L', 70.00, 1, 28.00, 19.60, 89.60),
(3, 10, 'Kurkure Masala Munch 90g', 20.00, 2, 18.00, 7.20, 47.20),
(3, 9, 'Maggi 2-Minute Masala Noodles 70g', 14.00, 2, 18.00, 5.04, 33.04),
-- Bill 4 items
(4, 2, 'Aashirvaad Shudh Chakki Atta 5kg', 260.00, 1, 0.00, 0.00, 260.00),
(4, 14, 'Vim Dishwash Gel 500ml', 120.00, 1, 18.00, 21.60, 141.60);
