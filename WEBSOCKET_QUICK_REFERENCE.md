# Sage BG - WebSocket Quick Reference

## 🔗 Connection
```javascript
const socket = io('http://192.168.2.187:3000');
```

## 📊 Main Events

### **Create Order**
```javascript
socket.emit('createOrder', {
  inputMint: "So11111111111111111111111111111111111111112", // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  maker: "YOUR_WALLET_ADDRESS",
  payer: "YOUR_WALLET_ADDRESS",
  currentPrice: 100,
  buyPrice: 95, // MANDATORY
  takeProfitPrice: 110, // OPTIONAL
  stopLossPrice: 85, // OPTIONAL
  amountToSell: 1,
  inputDecimals: 9,
  outputDecimals: 6
});

socket.on('orderCreated', (response) => {
  if (response.success) {
    console.log('Orders created:', response.data.orders);
    // Execute orders on frontend
    response.data.orders.forEach(order => {
      executeOrder(order.jupiterResponse.transaction, order.jupiterResponse.requestId);
    });
  }
});
```

### **Get Order Status**
```javascript
socket.emit('getOrderStatus', 'ORDER_ID');
socket.on('orderStatus', (response) => {
  if (response.success) {
    console.log('Status:', response.data.status);
  }
});
```

### **Cancel Order**
```javascript
socket.emit('cancelOrder', 'ORDER_ID');
socket.on('orderCancelled', (response) => {
  if (response.success) {
    console.log('Order cancelled');
  }
});
```

## 🔄 Frontend Order Execution
```javascript
async function executeOrder(transaction, requestId) {
  try {
    // 1. Sign with user's wallet
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
      console.log('✅ Order executed:', result.signature);
    }
  } catch (error) {
    console.error('❌ Execution failed:', error);
  }
}
```

## 📋 Response Structure
```javascript
{
  success: boolean,
  data?: any,
  error?: string,
  orderId?: string
}
```

## 🏷️ Order Types
- `BUY` - Limit buy order
- `TAKE_PROFIT` - Take profit sell order  
- `STOP_LOSS` - Stop loss sell order

## 📊 Order Status
- `PENDING` - Waiting for execution
- `EXECUTED` - Order completed
- `CANCELLED` - Order cancelled
- `EXPIRED` - Order expired

## 🪙 Token Addresses
- **SOL**: `So11111111111111111111111111111111111111112`
- **USDC**: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## ⚡ Quick Test
```javascript
// Connect and create order
const socket = io('http://192.168.2.187:3000');

socket.on('connect', () => {
  socket.emit('createOrder', {
    inputMint: "So11111111111111111111111111111111111111112",
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    maker: "YOUR_WALLET",
    payer: "YOUR_WALLET",
    currentPrice: 100,
    buyPrice: 95,
    takeProfitPrice: 110,
    stopLossPrice: 85,
    amountToSell: 1,
    inputDecimals: 9,
    outputDecimals: 6
  });
});

socket.on('orderCreated', (response) => {
  console.log('Success:', response.success);
  if (response.success) {
    console.log('Orders:', response.data.orders.length);
    console.log('Risk/Reward:', response.data.calculations.summary.riskRewardRatio);
    
    // Execute orders (frontend responsibility)
    response.data.orders.forEach(order => {
      executeOrder(order.jupiterResponse.transaction, order.jupiterResponse.requestId);
    });
  }
});
```

## ⚠️ Important Notes
- **Backend creates orders, Frontend executes them**
- Frontend must sign transactions with user's wallet
- Jupiter handles automatic price monitoring and execution
- Always handle transaction signing errors 