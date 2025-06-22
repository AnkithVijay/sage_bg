# Sage BG - WebSocket API Documentation

## 🌐 Connection Details

### **Server URLs:**
- **Local Development**: `ws://localhost:3000` or `http://localhost:3000`
- **Network Access**: `ws://0.0.0.0:3000` or `http://0.0.0.0:3000` (replace with your actual IP)
- **Docker**: `ws://localhost:3000` or `http://localhost:3000`

### **Connection Example:**
```javascript
// Using socket.io-client
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to Sage BG server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## 📊 Trading Order API

### **1. Create Trading Order**

**Event:** `createOrder`

**Description:** Creates a perpetual trading order with optional take profit and stop loss targets. The backend creates the orders and provides transaction data for frontend execution.

**Request:**
```javascript
const orderData = {
  inputMint: "So11111111111111111111111111111111111111112", // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  maker: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Your wallet address
  payer: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Your wallet address
  currentPrice: 100, // Current market price
  buyPrice: 95, // Target buy price (MANDATORY)
  takeProfitPrice: 110, // Take profit target (OPTIONAL)
  stopLossPrice: 85, // Stop loss target (OPTIONAL)
  amountToSell: 1, // Amount of input token to sell
  inputDecimals: 9, // Input token decimals (default: 9 for SOL)
  outputDecimals: 6 // Output token decimals (default: 6 for USDC)
};

socket.emit('createOrder', orderData);
```

**Response:**
```javascript
socket.on('orderCreated', (response) => {
  if (response.success) {
    console.log('Orders created successfully!');
    console.log('Orders:', response.data.orders);
    console.log('Calculations:', response.data.calculations);
    console.log('Order ID:', response.orderId);
    
    // Frontend should now execute these orders
    response.data.orders.forEach(order => {
      // Execute each order using the transaction data
      executeOrder(order.jupiterResponse.transaction, order.jupiterResponse.requestId);
    });
  } else {
    console.error('Order creation failed:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    orders: [
      {
        orderId: "uuid",
        orderType: "BUY|TAKE_PROFIT|STOP_LOSS",
        jupiterResponse: {
          order: "jupiter_order_account",
          transaction: "base64_transaction", // Frontend executes this
          requestId: "jupiter_request_id"
        },
        calculatedOrder: {
          type: "BUY|TAKE_PROFIT|STOP_LOSS",
          makingAmount: "lamports",
          takingAmount: "lamports",
          targetPrice: 95,
          expectedOutputAmount: 95,
          description: "Buy 1 tokens at 95 price"
        }
      }
    ],
    calculations: {
      buyOrder: { /* order details */ },
      takeProfitOrder: { /* order details */ },
      stopLossOrder: { /* order details */ },
      summary: {
        totalOrders: 3,
        totalInputAmount: 1,
        totalExpectedOutput: 95,
        riskRewardRatio: 1.5
      }
    },
    note: "Jupiter trigger system will automatically execute these orders when conditions are met"
  },
  orderId: "main_order_id"
}
```

**Frontend Execution Flow:**
```javascript
// After receiving orderCreated response
async function executeOrder(transaction, requestId) {
  try {
    // 1. Sign the transaction with user's wallet
    const signedTransaction = await wallet.signTransaction(transaction);
    
    // 2. Execute via Jupiter API
    const response = await fetch('https://lite-api.jup.ag/trigger/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransaction: signedTransaction,
        requestId: requestId
      })
    });
    
    const result = await response.json();
    
    if (result.signature) {
      console.log('Order executed successfully:', result.signature);
      // Update UI or notify user
    }
  } catch (error) {
    console.error('Order execution failed:', error);
  }
}
```

---

### **2. Get Order Status**

**Event:** `getOrderStatus`

**Description:** Retrieves the current status of a specific order.

**Request:**
```javascript
const orderId = "d8c25ea2-adb9-473d-946d-530aed3e8b5f";
socket.emit('getOrderStatus', orderId);
```

**Response:**
```javascript
socket.on('orderStatus', (response) => {
  if (response.success) {
    console.log('Order status:', response.data);
  } else {
    console.error('Failed to get order status:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    id: "uuid",
    wallet_address: "wallet_address",
    order_account: "jupiter_order_account",
    input_mint: "token_mint",
    output_mint: "token_mint",
    input_amount: 1,
    output_amount: 95,
    entry_price: 100,
    take_profit_price: 110,
    stop_loss_price: 85,
    order_type: "BUY|TAKE_PROFIT|STOP_LOSS",
    status: "PENDING|EXECUTED|CANCELLED|EXPIRED",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    jupiter_request_id: "jupiter_request_id",
    transaction_signature: "base64_transaction",
    metadata: { /* additional order data */ }
  }
}
```

---

### **3. Cancel Order**

**Event:** `cancelOrder`

**Description:** Cancels an existing order.

**Request:**
```javascript
const orderId = "d8c25ea2-adb9-473d-946d-530aed3e8b5f";
socket.emit('cancelOrder', orderId);
```

**Response:**
```javascript
socket.on('orderCancelled', (response) => {
  if (response.success) {
    console.log('Order cancelled successfully:', response.data);
  } else {
    console.error('Order cancellation failed:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  orderId: "uuid",
  data: {
    cancelledAt: "2024-01-01T00:00:00Z"
  }
}
```

---

### **4. Check Token Price**

**Event:** `checkPrice`

**Description:** Checks the current price of a token (placeholder - Jupiter handles monitoring).

**Request:**
```javascript
const tokenMint = "So11111111111111111111111111111111111111112"; // SOL
socket.emit('checkPrice', tokenMint);
```

**Response:**
```javascript
socket.on('priceChecked', (response) => {
  if (response.success) {
    console.log('Price check response:', response.data);
  } else {
    console.error('Price check failed:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    mint: "token_mint",
    message: "Price monitoring is handled by Jupiter trigger system"
  }
}
```

---

### **5. Get Monitoring Status**

**Event:** `getMonitoringStatus`

**Description:** Gets the current monitoring status (Jupiter handles all monitoring).

**Request:**
```javascript
socket.emit('getMonitoringStatus');
```

**Response:**
```javascript
socket.on('monitoringStatus', (response) => {
  if (response.success) {
    console.log('Monitoring status:', response.data);
  } else {
    console.error('Failed to get monitoring status:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    isMonitoring: true,
    message: "Jupiter trigger system handles all price monitoring and execution automatically"
  }
}
```

---

### **6. Get AI Trading Suggestions**

**Event:** `getTradingSuggestions`

**Description:** Get AI-powered trading suggestions based on current market data and user preferences.

**Request:**
```javascript
const suggestionData = {
  tokenMint: "So11111111111111111111111111111111111111112", // SOL
  timeframe: "4h", // 1min, 5min, 15min, 1h, 4h, 1d
  riskLevel: "moderate", // conservative, moderate, aggressive
  userBalance: 10, // User's available balance in SOL
  preferences: {
    maxRiskPercentage: 5, // Max 5% risk per trade
    preferredTimeframe: "4h"
  }
};

socket.emit('getTradingSuggestions', suggestionData);
```

**Response:**
```javascript
socket.on('tradingSuggestions', (response) => {
  if (response.success) {
    console.log('AI suggestions:', response.data);
  } else {
    console.error('AI suggestions failed:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    currentPrice: 100.50,
    suggestions: [
      {
        confidence: 0.85,
        action: "BUY",
        entryPrice: 100.50,
        takeProfitPrice: 110.55,
        stopLossPrice: 95.48,
        positionSize: 0.5,
        riskRewardRatio: 2.1,
        reasoning: "Strong bullish momentum with oversold RSI...",
        timeframe: "4h",
        riskLevel: "moderate"
      }
    ],
    marketAnalysis: {
      trend: "BULLISH",
      strength: 0.75,
      support: 95.00,
      resistance: 105.00,
      volatility: "MEDIUM"
    },
    technicalIndicators: {
      priceChange: 2.3,
      confidence: "high",
      liquidity: "medium"
    }
  }
}
```

---

### **7. Get Orders List**

**Event:** `getOrders`

**Description:** Get a list of orders with optional filtering by wallet address and status.

**Request:**
```javascript
// Get all orders
socket.emit('getOrders', {});

// Get orders for specific wallet
socket.emit('getOrders', { 
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" 
});

// Get orders with status filter
socket.emit('getOrders', { 
  status: "PENDING",
  limit: 50 
});

// Get orders for specific wallet with status filter
socket.emit('getOrders', { 
  walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  status: "PENDING",
  limit: 10 
});
```

**Response:**
```javascript
socket.on('ordersList', (response) => {
  if (response.success) {
    console.log('Orders:', response.data.orders);
  } else {
    console.error('Failed to get orders:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    orders: [
      {
        id: "uuid-here",
        wallet_address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        order_account: "order-account-here",
        input_mint: "So11111111111111111111111111111111111111112",
        output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        input_amount: "1.5",
        output_amount: "150.75",
        entry_price: "100.50",
        take_profit_price: "110.55",
        stop_loss_price: "95.48",
        order_type: "BUY",
        status: "PENDING",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
        expires_at: "2024-01-16T10:30:00Z",
        jupiter_request_id: "req-123",
        transaction_signature: "tx-signature-here",
        metadata: { /* order metadata */ }
      }
    ],
    total: 1,
    filters: {
      walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      status: "PENDING",
      limit: 10
    }
  }
}
```

---

### **8. Get Order by ID**

**Event:** `getOrderById`

**Description:** Get detailed information about a specific order by its ID.

**Request:**
```javascript
socket.emit('getOrderById', { 
  orderId: "uuid-of-the-order" 
});
```

**Response:**
```javascript
socket.on('orderDetails', (response) => {
  if (response.success) {
    console.log('Order details:', response.data);
  } else {
    console.error('Failed to get order details:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    id: "uuid-here",
    wallet_address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    order_account: "order-account-here",
    input_mint: "So11111111111111111111111111111111111111112",
    output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    input_amount: "1.5",
    output_amount: "150.75",
    entry_price: "100.50",
    take_profit_price: "110.55",
    stop_loss_price: "95.48",
    order_type: "BUY",
    status: "PENDING",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
    expires_at: "2024-01-16T10:30:00Z",
    jupiter_request_id: "req-123",
    transaction_signature: "tx-signature-here",
    metadata: { /* order metadata */ }
  }
}
```

---

### **9. Update Order Status**

**Event:** `updateOrderStatus`

**Description:** Update the status of an existing order.

**Request:**
```javascript
socket.emit('updateOrderStatus', { 
  orderId: "uuid-of-the-order",
  status: "EXECUTED",
  transactionSignature: "optional-transaction-signature" 
});
```

**Available Statuses:**
- `PENDING`: Order created, waiting for execution (default)
- `EXECUTED`: Order has been executed
- `CANCELLED`: Order has been cancelled
- `EXPIRED`: Order has expired

**Response:**
```javascript
socket.on('orderStatusUpdated', (response) => {
  if (response.success) {
    console.log('Order status updated:', response.data);
  } else {
    console.error('Failed to update order status:', response.error);
  }
});
```

**Response Structure:**
```javascript
{
  success: true,
  data: {
    orderId: "uuid-here",
    status: "EXECUTED",
    updatedAt: "2024-01-15T10:35:00Z"
  }
}
```

---

## 📋 Data Types

### **Order Types:**
- `BUY` - Limit buy order
- `TAKE_PROFIT` - Take profit sell order
- `STOP_LOSS` - Stop loss sell order

### **Order Status:**
- `PENDING` - Order is waiting for execution (default)
- `EXECUTED` - Order has been executed
- `CANCELLED` - Order has been cancelled
- `EXPIRED` - Order has expired

### **Token Addresses:**
- **SOL**: `So11111111111111111111111111111111111111112`
- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

---

## 🔄 Complete Trading Flow Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

// Connect to server
socket.on('connect', () => {
  console.log('Connected to Sage BG server');
  
  // Create a trading order with TP/SL
  const orderData = {
    inputMint: "So11111111111111111111111111111111111111112", // SOL
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    maker: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    payer: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
    currentPrice: 100,
    buyPrice: 95,
    takeProfitPrice: 110,
    stopLossPrice: 85,
    amountToSell: 1,
    inputDecimals: 9,
    outputDecimals: 6
  };
  
  socket.emit('createOrder', orderData);
});

// Handle order creation response
socket.on('orderCreated', async (response) => {
  if (response.success) {
    console.log('✅ Orders created successfully!');
    
    const { orders, calculations } = response.data;
    
    console.log(`📊 Created ${orders.length} orders:`);
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.orderType} Order: ${order.calculatedOrder.description}`);
    });
    
    console.log(`📈 Risk/Reward Ratio: ${calculations.summary.riskRewardRatio?.toFixed(2)}:1`);
    
    // Execute each order on the frontend
    for (const order of orders) {
      try {
        await executeOrder(order.jupiterResponse.transaction, order.jupiterResponse.requestId);
      } catch (error) {
        console.error(`Failed to execute ${order.orderType} order:`, error);
      }
    }
    
  } else {
    console.error('❌ Order creation failed:', response.error);
  }
});

// Frontend order execution function
async function executeOrder(transaction, requestId) {
  try {
    // 1. Sign the transaction with user's wallet
    const signedTransaction = await wallet.signTransaction(transaction);
    
    // 2. Execute via Jupiter API
    const response = await fetch('https://lite-api.jup.ag/trigger/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedTransaction: signedTransaction,
        requestId: requestId
      })
    });
    
    const result = await response.json();
    
    if (result.signature) {
      console.log('✅ Order executed successfully:', result.signature);
      return result;
    } else {
      throw new Error('Execution failed: ' + result.error);
    }
  } catch (error) {
    console.error('❌ Order execution failed:', error);
    throw error;
  }
}

// Handle order status updates
socket.on('orderStatus', (response) => {
  if (response.success && response.data) {
    console.log(`📋 Order Status: ${response.data.status}`);
    console.log(`💰 Entry Price: $${response.data.entry_price}`);
    console.log(`📊 Order Type: ${response.data.order_type}`);
  }
});

// Handle errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

---

## ⚠️ Important Notes

### **Security:**
- This is for development/testing only
- Use proper authentication for production
- Validate all input data on the frontend
- **Orders are executed by the frontend, not the backend**

### **Network:**
- Ensure both devices are on the same network
- Check firewall settings if connection fails
- IP address may change if you reconnect to WiFi
- Use `ifconfig` (macOS/Linux) or `ipconfig` (Windows) to find your IP

### **Jupiter Integration:**
- Backend creates orders and provides transaction data
- Frontend signs and executes transactions
- Jupiter handles price monitoring and automatic execution
- No manual intervention required after initial execution

### **Error Handling:**
- Always check `response.success` before processing data
- Handle connection errors gracefully
- Implement retry logic for failed requests
- Handle transaction signing failures

### **Health Check:**
- Server provides a health check endpoint at `http://localhost:3000/health`
- Useful for Docker health checks and monitoring

---

## 🧪 Testing

You can test the WebSocket API using the provided test client:

```bash
# Run the test client
npx ts-node test-socket-client.ts

# Run end-to-end test
npx ts-node test-e2e-ai-order.ts
```

This will create sample orders and demonstrate all the functionality.

---

## 📞 Support

For issues or questions:
1. Check the server logs for error messages
2. Verify network connectivity
3. Ensure all required fields are provided
4. Check token addresses and decimals are correct
5. Verify frontend wallet integration for transaction signing 