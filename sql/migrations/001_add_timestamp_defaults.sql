-- Migration: Add default values for timestamp fields
-- Description: Set default values for created_at and updated_at fields to ensure data integrity
-- Date: 2026-03-26

-- For users table
-- Note: MySQL BIGINT type doesn't support CURRENT_TIMESTAMP default directly
-- We use DEFAULT (UNIX_TIMESTAMP()) for initial values
-- Updated_at will be handled by application layer or triggers
ALTER TABLE users 
MODIFY COLUMN created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
MODIFY COLUMN updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP());

-- For students table
ALTER TABLE students 
MODIFY COLUMN created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
MODIFY COLUMN updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP());

-- For jobs table
ALTER TABLE jobs 
MODIFY COLUMN created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
MODIFY COLUMN updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP());

-- For career_reports table
ALTER TABLE career_reports 
MODIFY COLUMN created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP()),
MODIFY COLUMN updated_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP());

-- For match_records table
ALTER TABLE match_records 
MODIFY COLUMN created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP());

-- Create trigger for auto-updating updated_at on users table
DELIMITER //
CREATE TRIGGER IF NOT EXISTS users_before_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//
DELIMITER ;

-- Create trigger for auto-updating updated_at on students table
DELIMITER //
CREATE TRIGGER IF NOT EXISTS students_before_update
BEFORE UPDATE ON students
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//
DELIMITER ;

-- Create trigger for auto-updating updated_at on jobs table
DELIMITER //
CREATE TRIGGER IF NOT EXISTS jobs_before_update
BEFORE UPDATE ON jobs
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//
DELIMITER ;

-- Create trigger for auto-updating updated_at on career_reports table
DELIMITER //
CREATE TRIGGER IF NOT EXISTS career_reports_before_update
BEFORE UPDATE ON career_reports
FOR EACH ROW
BEGIN
    SET NEW.updated_at = UNIX_TIMESTAMP();
END//
DELIMITER ;