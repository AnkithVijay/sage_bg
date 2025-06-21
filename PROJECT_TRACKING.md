# Sage BG - Perpetual Trading Platform
## Project Tracking & Documentation

### Project Overview
Sage BG is a backend service that adds perpetual trading capabilities to a non-perpetual Solana trading platform using Jupiter's Trigger API. The system manages limit orders, take profit, and stop loss functionality through automated order execution and cancellation.

### Architecture Overview
```
Frontend (UI) → Sage BG Backend → Jupiter Trigger API → Solana Network
     ↓              ↓                    ↓
  Create Order → Store in DB → Execute/Cancel Orders
```

### Core Features
- **Order Management**: Execute and cancel trigger orders via Jupiter API
- **Position Tracking**: Monitor entry prices, take profit, and stop loss levels
- **Database Integration**: Store order information from frontend
- **Automated Execution**: Handle order execution when conditions are met
- **Order Cancellation**: Cancel orders when needed

### Technology Stack
- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL
- **API**: Jupiter Trigger API (Lite endpoints)
- **Blockchain**: Solana (Helius RPC)
- **Authentication**: TBD

---

## API Integration Plan

### Jupiter Trigger API Endpoints
Based on the [Jupiter Trigger API documentation](https://dev.jup.ag/docs/trigger-api/):

#### 1. Execute Order
- **Endpoint**: `https://lite-api.jup.ag/trigger/v1/execute`
- **Method**: POST
- **Purpose**: Execute trigger orders when conditions are met
- **Key Features**:
  - Transaction signing and execution
  - Priority fee handling
  - RPC connection management
  - Error handling and status reporting

#### 2. Cancel Order
- **Endpoint**: `https://lite-api.jup.ag/trigger/v1/cancelOrder`
- **Method**: POST
- **Purpose**: Cancel existing trigger orders
- **Key Features**:
  - Single order cancellation
  - Multiple order cancellation (batched)
  - Order account management

#### 3. Get Trigger Orders
- **Endpoint**: `https://lite-api.jup.ag/trigger/v1/getTriggerOrders`
- **Method**: GET
- **Purpose**: Retrieve active/historical orders for wallet addresses

---

## Database Schema Design

### Orders Table
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) NOT NULL,
    order_account VARCHAR(44) NOT NULL,
    input_mint VARCHAR(44) NOT NULL,
    output_mint VARCHAR(44) NOT NULL,
    input_amount DECIMAL NOT NULL,
    output_amount DECIMAL NOT NULL,
    entry_price DECIMAL NOT NULL,
    take_profit_price DECIMAL,
    stop_loss_price DECIMAL,
    order_type VARCHAR(20) NOT NULL, -- 'LIMIT', 'TAKE_PROFIT', 'STOP_LOSS'
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'EXECUTED', 'CANCELLED', 'EXPIRED'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    jupiter_request_id VARCHAR(36),
    transaction_signature VARCHAR(88),
    metadata JSONB
);
```

### Positions Table
```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address VARCHAR(44) NOT NULL,
    order_id UUID REFERENCES orders(id),
    entry_price DECIMAL NOT NULL,
    current_price DECIMAL,
    take_profit_price DECIMAL,
    stop_loss_price DECIMAL,
    position_size DECIMAL NOT NULL,
    unrealized_pnl DECIMAL,
    realized_pnl DECIMAL,
    status VARCHAR(20) NOT NULL, -- 'OPEN', 'CLOSED', 'LIQUIDATED'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    closed_at TIMESTAMP
);
```

---

## Core Service Modules

### 1. Order Service
**Responsibilities**:
- Execute trigger orders via Jupiter API
- Cancel orders when needed
- Monitor order status
- Handle transaction signing and submission

**Key Methods**:
```typescript
interface OrderService {
  executeOrder(orderData: ExecuteOrderRequest): Promise<ExecuteOrderResponse>;
  cancelOrder(cancelData: CancelOrderRequest): Promise<CancelOrderResponse>;
  cancelMultipleOrders(orders: string[]): Promise<CancelOrdersResponse>;
  getOrderStatus(orderAccount: string): Promise<OrderStatus>;
}
```

### 2. Position Service
**Responsibilities**:
- Track entry prices and current positions
- Calculate take profit and stop loss levels
- Monitor price movements
- Execute TP/SL orders automatically

**Key Methods**:
```typescript
interface PositionService {
  createPosition(positionData: CreatePositionRequest): Promise<Position>;
  updatePosition(positionId: string, updates: PositionUpdates): Promise<Position>;
  checkTakeProfit(positionId: string): Promise<boolean>;
  checkStopLoss(positionId: string): Promise<boolean>;
  closePosition(positionId: string): Promise<Position>;
}
```

### 3. Price Monitoring Service
**Responsibilities**:
- Monitor token prices in real-time
- Trigger take profit/stop loss orders
- Update position P&L calculations
- Handle price feed integration

### 4. Database Service
**Responsibilities**:
- CRUD operations for orders and positions
- Data validation and sanitization
- Transaction management
- Query optimization

---

## API Endpoints Design

### Order Management
```
POST /api/orders/execute
POST /api/orders/cancel
POST /api/orders/cancel-multiple
GET /api/orders/:walletAddress
GET /api/orders/status/:orderAccount
```

### Position Management
```
POST /api/positions
GET /api/positions/:walletAddress
PUT /api/positions/:positionId
DELETE /api/positions/:positionId
GET /api/positions/:positionId/pnl
```

### Price Monitoring
```
GET /api/prices/:tokenMint
GET /api/prices/stream/:tokenMint
POST /api/prices/check-tp-sl
```

---

## Implementation Phases

### Phase 1: Foundation Setup
- [x] Node.js + TypeScript project setup
- [ ] Database setup and schema creation
- [ ] Jupiter API integration setup
- [ ] Basic error handling and logging
- [ ] Environment configuration

### Phase 2: Core API Integration
- [ ] Implement Execute Order functionality
- [ ] Implement Cancel Order functionality
- [ ] Implement Get Trigger Orders
- [ ] Transaction signing and submission
- [ ] API response handling and validation

### Phase 3: Database Integration
- [ ] Database connection setup
- [ ] Order table implementation
- [ ] Position table implementation
- [ ] CRUD operations for orders and positions
- [ ] Data validation and sanitization

### Phase 4: Position Management
- [ ] Position creation and tracking
- [ ] Entry price management
- [ ] Take profit calculation and monitoring
- [ ] Stop loss calculation and monitoring
- [ ] P&L calculations

### Phase 5: Price Monitoring
- [ ] Real-time price feed integration
- [ ] Automated TP/SL order execution
- [ ] Price change monitoring
- [ ] Position updates based on price movements

### Phase 6: Advanced Features
- [ ] Order batching and optimization
- [ ] Error recovery and retry mechanisms
- [ ] Performance monitoring and optimization
- [ ] Security enhancements
- [ ] Rate limiting and API key management

---

## Configuration Requirements

### Environment Variables
```env
# Database
POSTGRESS_URL=postgresql://user:password@localhost:5432/sage_bg

# Solana RPC
HELIUS_RPC=https://rpc.helius.xyz/?api-key=your_helius_api_key

# Jupiter API (Lite endpoints)
JUPITER_API_BASE_URL=https://lite-api.jup.ag

# Application
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
JWT_SECRET=your_jwt_secret_here
API_RATE_LIMIT=100
```

---

## Error Handling Strategy

### Jupiter API Errors
- Network timeouts and retries
- Transaction failures and recovery
- Rate limiting handling
- Invalid order parameters

### Database Errors
- Connection failures
- Constraint violations
- Deadlock handling
- Data consistency issues

### Solana Network Errors
- RPC connection issues
- Transaction confirmation failures
- Blockhash expiration
- Insufficient funds

---

## Testing Strategy

### Unit Tests
- Service layer testing
- Database operations testing
- API integration testing
- Error handling testing

### Integration Tests
- End-to-end order flow testing
- Database integration testing
- Jupiter API integration testing

### Performance Tests
- Load testing for order execution
- Database performance testing
- API response time testing

---

## Security Considerations

### API Security
- API key management and rotation
- Rate limiting implementation
- Input validation and sanitization
- SQL injection prevention

### Transaction Security
- Transaction signing verification
- Order validation before execution
- Duplicate order prevention
- Authorization checks

### Data Security
- Sensitive data encryption
- Database access controls
- Audit logging
- Backup and recovery procedures

---

## Monitoring and Logging

### Application Monitoring
- Order execution metrics
- API response times
- Error rates and types
- Database performance metrics

### Business Metrics
- Total orders executed
- Success/failure rates
- P&L tracking
- User activity metrics

### Logging Strategy
- Structured logging with correlation IDs
- Error logging with stack traces
- Performance logging
- Audit logging for compliance

---

## Deployment Strategy

### Development Environment
- Local development setup
- Database migrations
- Environment configuration
- Hot reloading

### Staging Environment
- Production-like setup
- Integration testing
- Performance testing
- User acceptance testing

### Production Environment
- High availability setup
- Load balancing
- Database clustering
- Monitoring and alerting

---

## Questions and Clarifications Needed

1. **Authentication**: How will users authenticate with the backend?
2. **Rate Limiting**: What are the expected order volumes and rate limits?
3. **Price Feeds**: Which price feed service should we integrate with?
4. **Order Types**: What specific order types need to be supported beyond basic TP/SL?
5. **Multi-wallet Support**: Should the system support multiple wallets per user?
6. **Real-time Updates**: Do you need WebSocket support for real-time updates?
7. **Backup Strategy**: What are the requirements for data backup and recovery?

---

## Next Steps

1. **Database Setup**: Configure PostgreSQL connection using POSTGRESS_URL
2. **Jupiter API Integration**: Implement basic API integration with lite endpoints
3. **Order Service**: Build the core order execution and cancellation logic
4. **Database Schema**: Create and test the database schema
5. **Position Tracking**: Implement position management functionality

---

## References

- [Jupiter Trigger API Documentation](https://dev.jup.ag/docs/trigger-api/)
- [Execute Order Documentation](https://dev.jup.ag/docs/trigger-api/execute-order)
- [Cancel Order Documentation](https://dev.jup.ag/docs/trigger-api/cancel-order)
- [Solana Web3.js Documentation](https://docs.solana.com/developing/clients/javascript-api) 