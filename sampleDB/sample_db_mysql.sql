CREATE DATABASE IF NOT EXISTS typestats_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE typestats_test;

DROP TABLE IF EXISTS sales_data;

CREATE TABLE sales_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATE NOT NULL
);

INSERT INTO sales_data (product_name, category, price, quantity, is_active, created_at) VALUES
('Pro Laptop', 'Electronics', 1299.99, 15, 1, '2026-01-10'),
('Wireless Mouse', 'Electronics', 29.50, 120, 1, '2026-01-12'),
('Mechanical Keyboard', 'Electronics', 89.90, 45, 1, '2026-01-15'),
('27-inch Monitor', 'Electronics', 349.00, 20, 1, '2026-01-18'),
('USB-C Hub', 'Accessories', 45.00, 85, 1, '2026-01-20'),
('Ergonomic Chair', 'Furniture', 249.99, 12, 1, '2026-01-22'),
('Standing Desk', 'Furniture', 499.00, 8, 1, '2026-01-25'),
('Desk Pad', 'Accessories', 19.99, 150, 0, '2026-01-28'),
('Noise Canceling Headphones', 'Electronics', 199.50, 30, 1, '2026-02-01'),
('Webcam 4K', 'Electronics', 119.00, 25, 1, '2026-02-03'),
('External SSD 1TB', 'Storage', 99.99, 60, 1, '2026-02-05'),
('Graphic Tablet', 'Electronics', 179.00, 14, 0, '2026-02-08'),
('Monitor Arm', 'Accessories', 59.90, 40, 1, '2026-02-10'),
('Cable Organizer Set', 'Accessories', 12.49, 200, 1, '2026-02-12'),
('LED Desk Lamp', 'Furniture', 34.99, 50, 1, '2026-02-15'),
('Bluetooth Speaker', 'Electronics', 65.00, 35, 0, '2026-02-18'),
('Microphone USB', 'Electronics', 89.00, 22, 1, '2026-02-20'),
('Laptop Stand', 'Accessories', 39.99, 75, 1, '2026-02-22'),
('Power Bank 20000mAh', 'Accessories', 49.50, 90, 1, '2026-02-25'),
('Vertical Mouse', 'Electronics', 39.00, 18, 1, '2026-02-28');