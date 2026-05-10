CREATE USER 'gapangita_user'@'localhost' IDENTIFIED BY 'Gapangita_Secure_123!';
GRANT ALL PRIVILEGES ON gapangita_db_test.* TO 'gapangita_user'@'localhost';
FLUSH PRIVILEGES;

DROP DATABASE gapangita_db_TEST;
CREATE DATABASE IF NOT EXISTS gapangita_db_TEST;
USE gapangita_db_TEST;

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

CREATE TABLE IF NOT EXISTS branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS locations (
    location_id INT AUTO_INCREMENT PRIMARY KEY,
    NAME VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS branchLocations (
    branchLocation_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT,
    location_id INT,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(location_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    NAME AS `name` VARCHAR(255) NOT NULL,
    DESCRIPTION TEXT,
    item_type ENUM('lost', 'found') NOT NULL,
    STATUS ENUM('open', 'resolved') DEFAULT 'open',
    category_id INT,
    branch_id INT,
    location_id INT,
    reporter_user_id INT,
    file_path VARCHAR(255),
    date_reported DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
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

-- Insert some default branches
INSERT IGNORE INTO branches (branch_id, NAME) VALUES 
(1, 'UM Tagum Main'),
(2, 'UM Tagum Visayan');

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

-- Insert some default branchLocations
INSERT IGNORE INTO branchLocations (branchLocation_id, branch_id, location_id) VALUES 
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 1, 4),
(5, 1, 5),
(6, 1, 6),
(7, 1, 7),
(8, 1, 8),
(9, 1, 9),
(10, 1, 10),
(11, 1, 11),

(12, 2, 1),
(13, 2, 2),
(14, 2, 3),
(15, 2, 4),
(16, 2, 6),
(17, 2, 7),
(18, 2, 9),
(19, 2, 10),
(20, 2, 11);

-- Insert a default anonymous user
INSERT IGNORE INTO users (user_id, username, email, contact_number) VALUES 
(1, 'Anonymous', 'anonymous@gapangita.local', '0000000000');

-- Create Views
DROP VIEW IF EXISTS vw_openItems;

CREATE VIEW vw_openItems AS
SELECT
	item_id,
	NAME AS `name`,
	DESCRIPTION AS `description`,
	item_type,
	STATUS AS `status`,
	category_id,
	branch_id,
	location_id,
	reporter_user_id,
	file_path,
	date_reported
FROM items
WHERE STATUS = 'open';

-- Create Stored Procedures
DROP PROCEDURE IF EXISTS sp_submit_report;

DELIMITER $$

CREATE PROCEDURE sp_submit_report(
    IN p_name VARCHAR(255),
    IN p_description TEXT,
    IN p_item_type ENUM('lost', 'found'),
    IN p_category_id INT,
    IN p_branch_id INT,
    IN p_location_id INT,
    IN p_reporter_user_id INT
)
BEGIN    
    INSERT INTO items (NAME, DESCRIPTION, item_type, category_id, branch_id, location_id, reporter_user_id)
    VALUES (p_name, p_description, p_item_type, p_category_id, p_branch_id, p_location_id, p_reporter_user_id);
END$$

DELIMITER ;
