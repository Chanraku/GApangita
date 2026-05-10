CREATE USER 'gapangita_user'@'localhost' IDENTIFIED BY 'Gapangita_Secure_123!';
GRANT ALL PRIVILEGES ON gapangita_db.* TO 'gapangita_user'@'localhost';
FLUSH PRIVILEGES;


CREATE DATABASE IF NOT EXISTS gapangita_db;
USE gapangita_db;

CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_number VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(255) NOT NULL,
    DESCRIPTION TEXT,
    item_type ENUM('lost', 'found') NOT NULL,
    STATUS ENUM('open', 'resolved') DEFAULT 'open',
    category_id INT,
    location_id INT,
    reporter_user_id INT,
    date_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL,
    FOREIGN KEY (reporter_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Insert some default categories
INSERT IGNORE INTO categories (category_id, NAME) VALUES 
(1, 'Electronics'),
(2, 'Wallets & IDs'),
(3, 'Keys'),
(4, 'Bags & Luggage'),
(5, 'Eyewear'),
(6, 'Jewelry & Watches'),
(7, 'Clothing'),
(8, 'Books & Stationery'),
(9, 'Documents'),
(10, 'Sports & Outdoors'),
(11, 'Miscellaneous');

-- Insert some default locations
INSERT IGNORE INTO locations (location_id, NAME) VALUES 
(1, 'Academic Buildings'),
(2, 'Laboratories'),
(3, 'Libraries'),
(4, 'Student Centers'),
(5, 'Administrative Offices'),
(6, 'Cafeterias & Food Courts'),
(7, 'Sports & Athletics'),
(8, 'Religious Spaces'),
(9, 'Parking Areas'),
(10, 'Outdoor Areas'),
(11, 'Restrooms');

-- Insert a default anonymous user
INSERT IGNORE INTO users (user_id, username, email, contact_number) VALUES 
(1, 'Anonymous', 'anonymous@gapangita.local', '0000000000');
