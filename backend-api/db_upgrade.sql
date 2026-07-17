-- Egnaro Mart 3-Tier Location Hierarchy DB Upgrade Schema
-- Run this on your MySQL database to support cascading locations and Town hierarchy.

-- 1. Add 'town' column to the 'vendors' table (non-destructive, backward-compatible)
ALTER TABLE `vendors` ADD COLUMN `town` VARCHAR(255) DEFAULT NULL AFTER `city`;

-- 2. Create 'locations' table to store administrative State -> City -> Town relationships
CREATE TABLE IF NOT EXISTS `locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `state` VARCHAR(255) NOT NULL,
  `city` VARCHAR(255) NOT NULL,
  `town` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_location` (`state`, `city`, `town`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Populate initial production-grade seed locations for Tamil Nadu
INSERT IGNORE INTO `locations` (`state`, `city`, `town`) VALUES
('Tamil Nadu', 'Chennai', 'Velachery'),
('Tamil Nadu', 'Chennai', 'Adyar'),
('Tamil Nadu', 'Chennai', 'T Nagar'),
('Tamil Nadu', 'Chennai', 'Tambaram'),
('Tamil Nadu', 'Coimbatore', 'Gandhipuram'),
('Tamil Nadu', 'Coimbatore', 'Peelamedu'),
('Tamil Nadu', 'Coimbatore', 'RS Puram'),
('Tamil Nadu', 'Erode', 'Perundurai'),
('Tamil Nadu', 'Erode', 'Gobichettipalayam'),
('Tamil Nadu', 'Erode', 'Sathy');

-- 4. Upgrade 'categories' table to support town mappings and global (nullable) scopes
ALTER TABLE `categories` ADD COLUMN `town` VARCHAR(255) DEFAULT NULL AFTER `city`;
ALTER TABLE `categories` MODIFY COLUMN `state` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `categories` MODIFY COLUMN `city` VARCHAR(255) DEFAULT NULL;
