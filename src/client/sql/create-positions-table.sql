CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    entry_price DECIMAL NOT NULL,
    current_price DECIMAL,
    take_profit_price DECIMAL,
    stop_loss_price DECIMAL,
    position_size DECIMAL NOT NULL,
    unrealized_pnl DECIMAL,
    realized_pnl DECIMAL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_positions_wallet_address ON positions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_order_id ON positions(order_id);
CREATE INDEX IF NOT EXISTS idx_positions_created_at ON positions(created_at); 