CREATE DATABASE IF NOT EXISTS gapangita_db;
USE gapangita_db;

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type ENUM('lost', 'found') NOT NULL,
    status ENUM('open', 'resolved') DEFAULT 'open',
    category_id INT,
    location_id INT,
    reporter_user_id INT,
    date_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    FOREIGN KEY (reporter_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert some default categories
INSERT IGNORE INTO categories (name) VALUES 
('Electronics'), ('Documents'), ('Clothing'), ('Accessories'), ('Other');

-- Insert some default locations
INSERT IGNORE INTO locations (name) VALUES 
('Library'), ('Cafeteria'), ('Main Gate'), ('Admin Building'), ('Other');
