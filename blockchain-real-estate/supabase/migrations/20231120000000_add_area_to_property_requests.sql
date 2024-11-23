-- Add area column to property_requests table
ALTER TABLE property_requests ADD COLUMN area DECIMAL(10,2) NOT NULL DEFAULT 0;
