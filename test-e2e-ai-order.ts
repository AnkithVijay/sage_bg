// End-to-end test: Get AI suggestions, create order, fetch orders
// Run with: npx ts-node test-e2e-ai-order.ts

import io from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';
const TEST_WALLET_ADDRESS = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM';
const INPUT_MINT = 'So11111111111111111111111111111111111111112'; // SOL
const OUTPUT_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC

interface TradingSuggestionsResponse {
  success: boolean;
  data?: {
    currentPrice: number;
    suggestions: Array<any>;
  };
  error?: string;
}

interface OrderCreatedResponse {
  success: boolean;
  data?: {
    orders: Array<any>;
  };
  error?: string;
}

interface OrdersListResponse {
  success: boolean;
  data?: {
    orders: Array<any>;
  };
  error?: string;
}

async function runE2ETest() {
  const socket = io(SERVER_URL);

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      // Step 1: Get AI suggestions
      console.log('\n🤖 Requesting AI trading suggestions...');
      socket.emit('getTradingSuggestions', {
        tokenMint: INPUT_MINT,
        timeframe: '4h',
        riskLevel: 'moderate',
        userBalance: 10
      });
    });

    socket.on('tradingSuggestions', (response: TradingSuggestionsResponse) => {
      if (response.success && response.data && response.data.suggestions.length > 0) {
        const suggestion = response.data.suggestions[0];
        console.log('\n✅ AI Suggestion received:');
        console.log(suggestion);

        // Step 2: Create order using AI suggestion
        console.log('\n📝 Creating order using AI suggestion...');
        socket.emit('createOrder', {
          inputMint: INPUT_MINT,
          outputMint: OUTPUT_MINT,
          maker: TEST_WALLET_ADDRESS,
          payer: TEST_WALLET_ADDRESS,
          currentPrice: response.data.currentPrice,
          buyPrice: suggestion.entryPrice,
          takeProfitPrice: suggestion.takeProfitPrice,
          stopLossPrice: suggestion.stopLossPrice,
          amountToSell: suggestion.positionSize,
          inputDecimals: 9,
          outputDecimals: 6
        });
      } else {
        reject(new Error('Failed to get AI suggestion'));
      }
    });

    socket.on('orderCreated', (response: OrderCreatedResponse) => {
      if (response.success && response.data && response.data.orders) {
        console.log('\n✅ Order created successfully!');
        console.log('Order(s):', response.data.orders);

        // Step 3: Fetch orders for the wallet
        console.log('\n📋 Fetching orders for wallet...');
        socket.emit('getOrders', { walletAddress: TEST_WALLET_ADDRESS });
      } else {
        reject(new Error('Order creation failed: ' + (response.error || 'Unknown error')));
      }
    });

    socket.on('ordersList', (response: OrdersListResponse) => {
      if (response.success && response.data) {
        console.log('\n✅ Orders fetched for wallet:');
        response.data.orders.forEach((order: any, idx: number) => {
          console.log(`\nOrder ${idx + 1}:`);
          console.log(`  ID: ${order.id}`);
          console.log(`  Type: ${order.order_type}`);
          console.log(`  Status: ${order.status}`);
          console.log(`  Entry Price: $${order.entry_price}`);
          console.log(`  Created: ${order.created_at}`);
        });
        console.log('\n🎉 End-to-end test completed successfully!');
        socket.disconnect();
        resolve(true);
      } else {
        reject(new Error('Failed to fetch orders: ' + (response.error || 'Unknown error')));
      }
    });

    socket.on('connect_error', (error: Error) => {
      reject(error);
    });
  });
}

runE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n💥 E2E test failed:', err.message);
    process.exit(1);
  }); 