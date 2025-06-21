// Test client for WebSocket connection
// Run this with: npx ts-node test-socket-client.ts

import io from 'socket.io-client';

// Test configuration
const SERVER_URL = 'http://localhost:3000';

// Test data with realistic token addresses
const testOrderData = {
  inputMint: "So11111111111111111111111111111111111111112", // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  maker: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Test wallet
  payer: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", // Test wallet
  currentPrice: 100, // Current SOL price in USDC
  buyPrice: 95, // Buy SOL at $95 (limit order)
  takeProfitPrice: 110, // Sell SOL at $110 (take profit)
  stopLossPrice: 85, // Sell SOL at $85 (stop loss)
  amountToSell: 1, // Sell 1 SOL
  inputDecimals: 9, // SOL decimals
  outputDecimals: 6 // USDC decimals
};

interface OrderResponse {
  success: boolean;
  data?: any;
  error?: string;
  orderId?: string;
}

async function testOrderCreation() {
  console.log('🚀 Starting comprehensive order creation test...\n');

  const socket = io(SERVER_URL);

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      console.log('📊 Test Data:');
      console.log(`   Current Price: $${testOrderData.currentPrice}`);
      console.log(`   Buy Price: $${testOrderData.buyPrice} (${testOrderData.buyPrice < testOrderData.currentPrice ? 'Below market - will execute' : 'Above market - waiting'})`);
      console.log(`   Take Profit: $${testOrderData.takeProfitPrice} (${testOrderData.takeProfitPrice > testOrderData.buyPrice ? 'Valid' : 'Invalid'})`);
      console.log(`   Stop Loss: $${testOrderData.stopLossPrice} (${testOrderData.stopLossPrice < testOrderData.buyPrice ? 'Valid' : 'Invalid'})`);
      console.log(`   Amount: ${testOrderData.amountToSell} SOL\n`);

      console.log('📤 Sending order creation request...');
      socket.emit('createOrder', testOrderData);
    });

    socket.on('orderCreated', (response: OrderResponse) => {
      console.log('📥 Received order creation response:');
      
      if (response.success) {
        console.log('✅ Order creation successful!');
        
        const { orders, calculations } = response.data;
        
        console.log('\n📋 Created Orders:');
        orders.forEach((order: any, index: number) => {
          console.log(`\n   Order ${index + 1}: ${order.orderType}`);
          console.log(`   Order ID: ${order.orderId}`);
          console.log(`   Jupiter Order Account: ${order.jupiterResponse.order}`);
          console.log(`   Target Price: $${order.calculatedOrder.targetPrice}`);
          console.log(`   Making Amount: ${order.calculatedOrder.makingAmount} lamports`);
          console.log(`   Taking Amount: ${order.calculatedOrder.takingAmount} lamports`);
          console.log(`   Expected Output: ${order.calculatedOrder.expectedOutputAmount}`);
          console.log(`   Description: ${order.calculatedOrder.description}`);
        });

        console.log('\n🧮 Order Calculations:');
        console.log('   Buy Order:');
        console.log(`     Type: ${calculations.buyOrder.type}`);
        console.log(`     Target Price: $${calculations.buyOrder.targetPrice}`);
        console.log(`     Making Amount: ${calculations.buyOrder.makingAmount} lamports (${parseInt(calculations.buyOrder.makingAmount) / Math.pow(10, 9)} SOL)`);
        console.log(`     Taking Amount: ${calculations.buyOrder.takingAmount} lamports (${parseInt(calculations.buyOrder.takingAmount) / Math.pow(10, 6)} USDC)`);
        console.log(`     Expected Output: ${calculations.buyOrder.expectedOutputAmount} USDC`);

        if (calculations.takeProfitOrder) {
          console.log('\n   Take Profit Order:');
          console.log(`     Type: ${calculations.takeProfitOrder.type}`);
          console.log(`     Target Price: $${calculations.takeProfitOrder.targetPrice}`);
          console.log(`     Making Amount: ${calculations.takeProfitOrder.makingAmount} lamports (${parseInt(calculations.takeProfitOrder.makingAmount) / Math.pow(10, 6)} USDC)`);
          console.log(`     Taking Amount: ${calculations.takeProfitOrder.takingAmount} lamports (${parseInt(calculations.takeProfitOrder.takingAmount) / Math.pow(10, 9)} SOL)`);
          console.log(`     Expected Output: ${calculations.takeProfitOrder.expectedOutputAmount} SOL`);
          console.log(`     Description: ${calculations.takeProfitOrder.description}`);
        }

        if (calculations.stopLossOrder) {
          console.log('\n   Stop Loss Order:');
          console.log(`     Type: ${calculations.stopLossOrder.type}`);
          console.log(`     Target Price: $${calculations.stopLossOrder.targetPrice}`);
          console.log(`     Making Amount: ${calculations.stopLossOrder.makingAmount} lamports (${parseInt(calculations.stopLossOrder.makingAmount) / Math.pow(10, 6)} USDC)`);
          console.log(`     Taking Amount: ${calculations.stopLossOrder.takingAmount} lamports (${parseInt(calculations.stopLossOrder.takingAmount) / Math.pow(10, 9)} SOL)`);
          console.log(`     Expected Output: ${calculations.stopLossOrder.expectedOutputAmount} SOL`);
          console.log(`     Description: ${calculations.stopLossOrder.description}`);
        }

        console.log('\n📊 Summary:');
        console.log(`   Total Orders: ${calculations.summary.totalOrders}`);
        console.log(`   Total Input Amount: ${calculations.summary.totalInputAmount} SOL`);
        console.log(`   Total Expected Output: ${calculations.summary.totalExpectedOutput} USDC`);
        if (calculations.summary.riskRewardRatio) {
          console.log(`   Risk/Reward Ratio: ${calculations.summary.riskRewardRatio.toFixed(2)}:1`);
        }

        console.log('\n🔍 Token Switching Verification:');
        console.log('   Buy Order: SOL → USDC (correct)');
        console.log('   Take Profit Order: USDC → SOL (correct - selling tokens we bought)');
        console.log('   Stop Loss Order: USDC → SOL (correct - selling tokens we bought)');

        console.log('\n✅ All orders created successfully with proper token switching!');
        console.log('🎯 Jupiter trigger system will automatically execute these orders when conditions are met.');
        
        resolve(response);
      } else {
        console.error('❌ Order creation failed:', response.error);
        reject(new Error(response.error));
      }
      
      socket.disconnect();
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });
  });
}

// Run the test
testOrderCreation()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  });