# Sage BG - Perpetual Trading Platform
## Project Tracking & Documentation

### Project Overview
Sage BG is a backend service that adds perpetual trading capabilities to a non-perpetual Solana trading platform using Jupiter's Trigger API. The system creates limit orders and lets Jupiter's trigger system handle all price monitoring and automatic execution.

### Architecture Overview
```
Frontend (UI) → Sage BG Backend → Jupiter Trigger API → Solana Network
     ↓              ↓                    ↓
  Create Order → Store in DB → Jupiter Auto-Executes
```

### Core Features
- **Order Creation**: Create limit orders via Jupiter API with buy price targets
- **Database Tracking**: Store order information and track status
- **Automatic Execution**: Jupiter's trigger system handles all price monitoring and execution
- **Order Cancellation**: Cancel orders when needed
- **Status Tracking**: Monitor order status and execution results

### Technology Stack
- **Backend**: Node.js + TypeScript
- **Database**: PostgreSQL
- **API**: Jupiter Trigger API (Lite endpoints)
- **Blockchain**: Solana (Helius RPC)
- **Real-time**: WebSocket communication
- **Authentication**: TBD

---

## Simplified Flow

### Order Creation Process
1. **Frontend sends order request** via WebSocket with:
   - `buyPrice` (MANDATORY) - Target price for the order
   - `takeProfitPrice` (OPTIONAL) - Take profit target
   - `stopLossPrice` (OPTIONAL) - Stop loss target
   - Other trading parameters

2. **Backend creates Jupiter order**:
   - Calculates amounts based on buy price
   - Sends order to Jupiter Trigger API
   - Stores order in database with all parameters

3. **Jupiter handles everything else**:
   - Monitors prices automatically
   - Executes order when buy price is reached
   - Updates order status when executed

4. **Backend tracks status**:
   - Can query order status
   - Can cancel orders if needed
   - Stores execution results

### Key Benefits
- **Simplified Architecture**: No need for manual price monitoring
- **Reliable Execution**: Jupiter's proven trigger system
- **Automatic Handling**: No manual intervention required
- **Cost Effective**: Leverages Jupiter's infrastructure

---

## API Integration Plan

### Jupiter Trigger API Endpoints
Based on the [Jupiter Trigger API documentation](https://dev.jup.ag/docs/trigger-api/):

#### 1. Create Order
- **Endpoint**: `https://lite-api.jup.ag/trigger/v1/createOrder`
- **Method**: POST
- **Purpose**: Create trigger orders with price targets
- **Key Features**:
  - Automatic price monitoring
  - Transaction signing and execution
  - Priority fee handling
  - RPC connection management

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

---

## Core Service Modules

### 1. Jupiter Service
**Responsibilities**:
- Create trigger orders via Jupiter API
- Cancel orders when needed
- Handle API responses and errors
- Manage transaction signing

**Key Methods**:
```typescript
interface JupiterService {
  createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse>;
  cancelOrder(cancelData: CancelOrderRequest): Promise<CancelOrderResponse>;
  getOrderStatus(orderAccount: string): Promise<OrderStatus>;
}
```

### 2. Database Service
**Responsibilities**:
- CRUD operations for orders
- Data validation and sanitization
- Transaction management
- Query optimization

### 3. WebSocket Service
**Responsibilities**:
- Real-time communication with frontend
- Order creation requests
- Order cancellation requests
- Status updates

---

## WebSocket Events

### Client to Server
- `createOrder` - Create a new trading order
- `cancelOrder` - Cancel an existing order
- `getOrderStatus` - Get status of an order
- `checkPrice` - Check current price (placeholder)
- `getMonitoringStatus` - Get monitoring status (placeholder)

### Server to Client
- `orderCreated` - Order creation response
- `orderCancelled` - Order cancellation response
- `orderStatus` - Order status response
- `priceChecked` - Price check response
- `monitoringStatus` - Monitoring status response

---

## Implementation Status

### ✅ Completed
- [x] Node.js + TypeScript project setup
- [x] Database setup and schema creation
- [x] Jupiter API integration setup
- [x] WebSocket server implementation
- [x] Order creation via Jupiter API
- [x] Order cancellation via Jupiter API
- [x] Database integration for order tracking
- [x] Basic error handling and logging
- [x] Environment configuration
- [x] Order calculator service with robust pricing calculations
- [x] Take profit order creation (when takeProfitPrice is provided)
- [x] Stop loss order creation (when stopLossPrice is provided)
- [x] Multiple order creation in single request
- [x] Risk/reward ratio calculations
- [x] TypeScript test client

### 🔄 Current Focus
- [ ] Order status monitoring and updates
- [ ] Frontend integration testing
- [ ] Error handling improvements
- [ ] Performance optimization

### 📋 Future Enhancements
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
- Load testing for order creation
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
- Order validation before creation
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
- Order creation metrics
- API response times
- Error rates and types
- Database performance metrics

### Business Metrics
- Total orders created
- Success/failure rates
- Execution tracking
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
3. **Take Profit/Stop Loss**: Should these be implemented as separate orders or integrated into the main order?
4. **Multi-wallet Support**: Should the system support multiple wallets per user?
5. **Real-time Updates**: Do you need WebSocket support for real-time updates?
6. **Backup Strategy**: What are the requirements for data backup and recovery?

---

## Next Steps

1. **Take Profit Orders**: Implement take profit order creation when takeProfitPrice is provided
2. **Stop Loss Orders**: Implement stop loss order creation when stopLossPrice is provided
3. **Order Status Updates**: Implement status monitoring and updates
4. **Frontend Integration**: Test with actual frontend application
5. **Error Handling**: Enhance error handling and recovery mechanisms

---

## References

- [Jupiter Trigger API Documentation](https://dev.jup.ag/docs/trigger-api/)
- [Create Order Documentation](https://dev.jup.ag/docs/trigger-api/create-order)
- [Cancel Order Documentation](https://dev.jup.ag/docs/trigger-api/cancel-order)
- [Solana Web3.js Documentation](https://docs.solana.com/developing/clients/javascript-api) 