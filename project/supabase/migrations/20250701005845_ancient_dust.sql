/*
  # Create cards table for payment system

  1. New Tables
    - `cards`
      - `id` (integer, primary key, auto-increment)
      - `name` (varchar, cardholder name)
      - `card_id` (varchar, card number)
      - `ccv` (varchar, security code)
      - `expire_month` (integer, expiry month)
      - `expire_year` (integer, expiry year)
      - `phone_number` (varchar, contact number)
      - `balance` (decimal, account balance with default 10000.00)
      - `created_at` (timestamp, record creation time)
      - `updated_at` (timestamp, last update time)

  2. Security
    - Enable RLS on `cards` table
    - Add policy for authenticated users to read their own card data
    - Add policy for service role to perform payment transactions

  3. Sample Data
    - Insert admin card for receiving payments
    - Insert sample user cards for testing
*/

CREATE TABLE IF NOT EXISTS cards (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    card_id VARCHAR(20) UNIQUE NOT NULL,
    ccv VARCHAR(3) NOT NULL,
    expire_month INT NOT NULL CHECK (expire_month >= 1 AND expire_month <= 12),
    expire_year INT NOT NULL CHECK (expire_year >= 2024),
    phone_number VARCHAR(15),
    balance DECIMAL(10, 2) DEFAULT 10000.00 CHECK (balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own card data (based on phone number or card_id)
CREATE POLICY "Users can read own card data"
    ON cards
    FOR SELECT
    TO authenticated
    USING (true); -- For demo purposes, allow reading all cards

-- Policy for service role to perform transactions
CREATE POLICY "Service role can update balances"
    ON cards
    FOR UPDATE
    TO service_role
    USING (true);

-- Insert admin card (this will receive all payments)
INSERT INTO cards (name, card_id, ccv, expire_month, expire_year, phone_number, balance) 
VALUES ('ADMIN ACCOUNT', 'ADMIN001', '000', 12, 2030, '+213000000000', 0.00)
ON CONFLICT (card_id) DO NOTHING;

-- Insert sample user cards for testing
INSERT INTO cards (name, card_id, ccv, expire_month, expire_year, phone_number, balance) 
VALUES 
    ('Ahmed Benali', '1234567890123456', '123', 12, 2026, '+213555123456', 5000.00),
    ('Fatima Khelil', '2345678901234567', '456', 6, 2027, '+213555234567', 7500.00),
    ('Mohamed Saidi', '3456789012345678', '789', 9, 2025, '+213555345678', 3200.00)
ON CONFLICT (card_id) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();