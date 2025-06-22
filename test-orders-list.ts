// Test Orders List Functionality
// Run with: npx ts-node test-orders-list.ts

import io from 'socket.io-client';

// Test configuration
const SERVER_URL = 'http://localhost:3000';

// Test wallet address (you can change this)
const TEST_WALLET_ADDRESS = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

interface OrdersListResponse {
  success: boolean;
  data?: {
    orders: Array<{
      id: string;
      wallet_address: string;
      order_account: string;
      input_mint: string;
      output_mint: string;
      input_amount: string;
      output_amount: string;
      entry_price: string;
      take_profit_price: string | null;
      stop_loss_price: string | null;
      order_type: string;
      status: string;
      created_at: string;
      updated_at: string;
      expires_at: string | null;
      jupiter_request_id: string | null;
      transaction_signature: string | null;
      metadata: any;
    }>;
    total: number;
    filters: {
      walletAddress?: string;
      status?: string;
      limit?: number;
    };
  };
  error?: string;
}

interface OrderStatusUpdateResponse {
  success: boolean;
  data?: {
    orderId: string;
    status: string;
    updatedAt: string;
  };
  error?: string;
}

interface OrderDetailsResponse {
  success: boolean;
  data?: any;
  error?: string;
}

async function testOrdersList() {
  console.log('📋 Starting Orders List test...\n');

  const socket = io(SERVER_URL);

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      
      // Test 1: Get all orders
      console.log('\n📋 Test 1: Get all orders');
      socket.emit('getOrders', {});
    });

    socket.on('ordersList', (response: OrdersListResponse) => {
      console.log('📥 Received orders list response:');
      
      if (response.success && response.data) {
        console.log('✅ Orders list retrieved successfully!');
        console.log(`📊 Total orders: ${response.data.total}`);
        console.log(`🔍 Filters applied:`, response.data.filters);
        
        if (response.data.orders.length > 0) {
          console.log('\n📋 Orders:');
          response.data.orders.forEach((order: any, index: number) => {
            console.log(`\n   Order ${index + 1}:`);
            console.log(`   ID: ${order.id}`);
            console.log(`   Type: ${order.order_type}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Wallet: ${order.wallet_address}`);
            console.log(`   Input: ${order.input_amount} ${order.input_mint}`);
            console.log(`   Output: ${order.output_amount} ${order.output_mint}`);
            console.log(`   Entry Price: $${order.entry_price}`);
            console.log(`   Take Profit: ${order.take_profit_price ? '$' + order.take_profit_price : 'N/A'}`);
            console.log(`   Stop Loss: ${order.stop_loss_price ? '$' + order.stop_loss_price : 'N/A'}`);
            console.log(`   Created: ${new Date(order.created_at).toLocaleString()}`);
            console.log(`   Updated: ${new Date(order.updated_at).toLocaleString()}`);
          });
        } else {
          console.log('📭 No orders found');
        }

        // Test 2: Get orders by wallet address
        console.log('\n📋 Test 2: Get orders by wallet address');
        socket.emit('getOrders', { walletAddress: TEST_WALLET_ADDRESS });
        
      } else {
        console.error('❌ Orders list failed:', response.error);
        reject(new Error(response.error));
      }
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

// Test order status updates
async function testOrderStatusUpdate() {
  console.log('\n🔄 Testing Order Status Update...\n');

  const socket = io(SERVER_URL);

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      
      // First get an order to update
      socket.emit('getOrders', { limit: 1 });
    });

    socket.on('ordersList', (response: OrdersListResponse) => {
      if (response.success && response.data && response.data.orders.length > 0) {
        const order = response.data.orders[0];
        console.log(`🔄 Updating order ${order.id} status to 'ACTIVE'`);
        
        socket.emit('updateOrderStatus', {
          orderId: order.id,
          status: 'ACTIVE',
          transactionSignature: 'test_signature_123'
        });
      } else {
        console.log('📭 No orders to update');
        resolve(response);
      }
    });

    socket.on('orderStatusUpdated', (response: OrderStatusUpdateResponse) => {
      if (response.success) {
        console.log('✅ Order status updated successfully!');
        console.log('📊 Updated order:', response.data);
        resolve(response);
      } else {
        console.error('❌ Order status update failed:', response.error);
        reject(new Error(response.error));
      }
      
      socket.disconnect();
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });
  });
}

// Test get order by ID
async function testGetOrderById() {
  console.log('\n🔍 Testing Get Order by ID...\n');

  const socket = io(SERVER_URL);

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      
      // First get an order to get its ID
      socket.emit('getOrders', { limit: 1 });
    });

    socket.on('ordersList', (response: OrdersListResponse) => {
      if (response.success && response.data && response.data.orders.length > 0) {
        const order = response.data.orders[0];
        console.log(`🔍 Getting details for order ${order.id}`);
        
        socket.emit('getOrderById', { orderId: order.id });
      } else {
        console.log('📭 No orders to get details for');
        resolve(response);
      }
    });

    socket.on('orderDetails', (response: OrderDetailsResponse) => {
      if (response.success) {
        console.log('✅ Order details retrieved successfully!');
        console.log('📊 Order details:', response.data);
        resolve(response);
      } else {
        console.error('❌ Get order details failed:', response.error);
        reject(new Error(response.error));
      }
      
      socket.disconnect();
    });

    socket.on('connect_error', (error: Error) => {
      console.error('❌ Connection error:', error.message);
      reject(error);
    });
  });
}

// Run all tests
async function runAllTests() {
  try {
    await testOrdersList();
    await testOrderStatusUpdate();
    await testGetOrderById();
    
    console.log('\n🎉 All orders tests completed successfully!');
    console.log('\n📋 Available Order Statuses:');
    console.log('   - PENDING: Order created, waiting for execution');
    console.log('   - ACTIVE: Order is active and being monitored');
    console.log('   - EXECUTED: Order has been executed');
    console.log('   - CANCELLED: Order has been cancelled');
    console.log('   - EXPIRED: Order has expired');
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Orders tests failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run the tests
runAllTests(); 