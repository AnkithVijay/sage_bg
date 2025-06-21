-- Migration script to update transaction_signature field
-- Run this if the table already exists with the old schema

-- First, drop the existing table (WARNING: This will delete all data)
-- DROP TABLE IF EXISTS positions;
-- DROP TABLE IF EXISTS orders;

-- Or alternatively, alter the existing table:
ALTER TABLE orders ALTER COLUMN transaction_signature TYPE TEXT; 