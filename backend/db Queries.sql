-- SHOW ALL DATABASES
SHOW DATABASES;

-- USE YOUR DATABASE
USE supermarket_db;

-- SHOW ALL TABLES
SHOW TABLES;

--------------------------------------------------
-- PRODUCTS TABLE
--------------------------------------------------

-- VIEW ALL PRODUCTS
SELECT * FROM products;

-- VIEW PRODUCT TABLE STRUCTURE
DESCRIBE products;

-- INSERT NEW PRODUCT
INSERT INTO products
(barcode, name, category_id, price, quantity, gst_percent)
VALUES
('890100000001', 'Dairy Milk Chocolate', 2, 50.00, 25, 18.00);

-- UPDATE PRODUCT
UPDATE products
SET name = 'Fortune Premium Mustard Oil 1L Edited',
    price = 180.00,
    quantity = 50
WHERE id = 1;

-- DELETE PRODUCT
DELETE FROM products
WHERE id = 18;

-- SEARCH PRODUCT
SELECT * FROM products
WHERE name LIKE '%Milk%';

-- CHECK LOW STOCK PRODUCTS
SELECT * FROM products
WHERE quantity < 20;

--------------------------------------------------
-- BILLS TABLE
--------------------------------------------------

-- VIEW ALL BILLS
SELECT * FROM bills;

-- VIEW BILL TABLE STRUCTURE
DESCRIBE bills;

-- CHECK TOTAL SALES
SELECT SUM(grand_total) AS total_sales
FROM bills;

-- VIEW RECENT BILLS
SELECT * FROM bills
ORDER BY created_at DESC;

-- VIEW CASH PAYMENTS
SELECT * FROM bills
WHERE payment_mode = 'Cash';

--------------------------------------------------
-- BILL_ITEMS TABLE
--------------------------------------------------

-- VIEW ALL BILL ITEMS
SELECT * FROM bill_items;

-- VIEW BILL ITEMS STRUCTURE
DESCRIBE bill_items;

-- CHECK PRODUCTS INSIDE BILL
SELECT *
FROM bill_items
WHERE bill_id = 1;

--------------------------------------------------
-- USERS TABLE
--------------------------------------------------

-- VIEW ALL USERS
SELECT * FROM users;

-- VIEW USERS TABLE STRUCTURE
DESCRIBE users;

-- CHECK ACTIVE USERS
SELECT * FROM users
WHERE is_active = 1;

--------------------------------------------------
-- JOIN QUERIES
--------------------------------------------------

-- VIEW BILL DETAILS WITH PRODUCT NAMES
SELECT bills.bill_number,
       bill_items.product_name,
       bill_items.quantity,
       bill_items.total_price
FROM bills
JOIN bill_items
ON bills.id = bill_items.bill_id;

-- VIEW PRODUCTS WITH CATEGORY ID
SELECT id,
       name,
       category_id,
       price,
       quantity
FROM products;

--------------------------------------------------
-- COUNT QUERIES
--------------------------------------------------

-- TOTAL NUMBER OF PRODUCTS
SELECT COUNT(*) AS total_products
FROM products;

-- TOTAL NUMBER OF BILLS
SELECT COUNT(*) AS total_bills
FROM bills;

-- TOTAL NUMBER OF USERS
SELECT COUNT(*) AS total_users
FROM users;

--------------------------------------------------
-- INVENTORY CHECK
--------------------------------------------------

-- CHECK AVAILABLE STOCK
SELECT name,
       quantity
FROM products;

--------------------------------------------------
-- BILLING CHECK
--------------------------------------------------

-- CHECK GRAND TOTAL OF A BILL
SELECT bill_number,
       grand_total
FROM bills
WHERE id = 1;

--------------------------------------------------
-- GST CHECK
--------------------------------------------------

-- VIEW GST DETAILS
SELECT name,
       gst_percent
FROM products;

--------------------------------------------------
-- DATABASE TESTING
--------------------------------------------------

-- TEST CREATE OPERATION
INSERT INTO products
(barcode, name, category_id, price, quantity, gst_percent)
VALUES
('890100000999', 'Test Product', 1, 99.00, 10, 5.00);

-- TEST READ OPERATION
SELECT * FROM products
WHERE name = 'Test Product';

-- TEST UPDATE OPERATION
UPDATE products
SET price = 120.00
WHERE name = 'Test Product';

-- TEST DELETE OPERATION
DELETE FROM products
WHERE name = 'Test Product';