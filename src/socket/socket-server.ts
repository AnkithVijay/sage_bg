import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import JupiterService, { CreateOrderRequest } from '../services/jupiter-service';
import DatabaseClient from '../client/database';
import OrderCalculator, { OrderCalculationParams, CalculatedOrder } from '../services/order-calculator';
import AISuggestionService, { SuggestionRequest } from '../services/ai-suggestion-service';

export interface SocketOrderRequest {
  inputMint: string;        // Token to sell (e.g., SOL)
  outputMint: string;       // Token to buy (e.g., USDC)
  maker: string;           // User wallet address
  payer: string;           // User wallet address (same as maker)
  currentPrice: number;    // Current market price
  buyPrice: number;        // Target buy price for the order (MANDATORY)
  takeProfitPrice?: number; // Take profit target (OPTIONAL)
  stopLossPrice?: number;   // Stop loss target (OPTIONAL)
  amountToSell: number;    // Amount of input token to sell
  inputDecimals?: number;  // Decimals for input token (default 9)
  outputDecimals?: number; // Decimals for output token (default 6)
}

export interface SocketOrderResponse {
  success: boolean;
  data?: any;
  error?: string;
  orderId?: string;
}

class SocketServer {
  private io: SocketIOServer;
  private jupiterService: JupiterService;
  private dbClient: DatabaseClient;
  private orderCalculator: OrderCalculator;
  private aiSuggestionService: AISuggestionService;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Configure this properly for production
        methods: ["GET", "POST"]
      }
    });

    this.jupiterService = new JupiterService();
    this.dbClient = DatabaseClient.getInstance();
    this.orderCalculator = new OrderCalculator();
    this.aiSuggestionService = new AISuggestionService();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle create order request
      socket.on('createOrder', async (data: SocketOrderRequest) => {
        try {
          console.log('Received create order request:', data);
          
          const result = await this.handleCreateOrder(data);
          
          socket.emit('orderCreated', result);
        } catch (error) {
          console.error('Error creating order:', error);
          socket.emit('orderCreated', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle order status request
      socket.on('getOrderStatus', async (orderId: string) => {
        try {
          const order = await this.dbClient.query(
            'SELECT * FROM orders WHERE id = $1',
            [orderId]
          );
          
          socket.emit('orderStatus', {
            success: true,
            data: order.rows[0] || null
          });
        } catch (error) {
          socket.emit('orderStatus', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle order cancellation
      socket.on('cancelOrder', async (orderId: string) => {
        try {
          console.log('Order cancellation requested for:', orderId);
          
          // Get order details
          const order = await this.dbClient.query(
            'SELECT * FROM orders WHERE id = $1',
            [orderId]
          );

          if (order.rows.length === 0) {
            socket.emit('orderCancelled', {
              success: false,
              orderId,
              error: 'Order not found'
            });
            return;
          }

          const orderData = order.rows[0];

          // Cancel via Jupiter API
          const cancelResponse = await this.jupiterService.cancelOrder({
            orderAccount: orderData.order_account,
            maker: orderData.wallet_address,
            payer: orderData.wallet_address
          });

          // Update order status
          await this.dbClient.query(`
            UPDATE orders 
            SET status = 'CANCELLED', 
                updated_at = NOW(),
                metadata = jsonb_set(
                  metadata, 
                  '{cancellation}', 
                  $1::jsonb
                )
            WHERE id = $2
          `, [
            JSON.stringify({
              cancelledAt: new Date().toISOString(),
              jupiterResponse: cancelResponse
            }),
            orderId
          ]);
          
          socket.emit('orderCancelled', {
            success: true,
            orderId,
            data: { cancelledAt: new Date().toISOString() }
          });
          
        } catch (error) {
          console.error('Error cancelling order:', error);
          socket.emit('orderCancelled', {
            success: false,
            orderId,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle price check request
      socket.on('checkPrice', async (tokenMint: string) => {
        try {
          // For now, just return a placeholder response
          // Price checking will be handled by Jupiter's trigger system
          socket.emit('priceChecked', {
            success: true,
            data: {
              mint: tokenMint,
              message: 'Price monitoring is handled by Jupiter trigger system'
            }
          });
          
        } catch (error) {
          console.error('Error checking price:', error);
          socket.emit('priceChecked', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle monitoring status request
      socket.on('getMonitoringStatus', () => {
        // Jupiter handles all monitoring automatically
        socket.emit('monitoringStatus', {
          success: true,
          data: {
            isMonitoring: true,
            message: 'Jupiter trigger system handles all price monitoring and execution automatically'
          }
        });
      });

      // Handle AI trading suggestions request
      socket.on('getTradingSuggestions', async (data: SuggestionRequest) => {
        try {
          console.log('AI trading suggestions requested:', data);
          
          const suggestions = await this.aiSuggestionService.generateTradingSuggestions(data);
          
          socket.emit('tradingSuggestions', {
            success: true,
            data: suggestions
          });
        } catch (error) {
          console.error('Error generating trading suggestions:', error);
          socket.emit('tradingSuggestions', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle get orders request
      socket.on('getOrders', async (data: { walletAddress?: string; status?: string; limit?: number }) => {
        try {
          console.log('Get orders requested:', data);
          
          let orders;
          if (data.walletAddress) {
            orders = await this.dbClient.getOrders(data.walletAddress, data.status);
          } else {
            orders = await this.dbClient.getAllOrders(data.status, data.limit);
          }
          
          socket.emit('ordersList', {
            success: true,
            data: {
              orders,
              total: orders.length,
              filters: {
                walletAddress: data.walletAddress,
                status: data.status,
                limit: data.limit
              }
            }
          });
        } catch (error) {
          console.error('Error fetching orders:', error);
          socket.emit('ordersList', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle get order by ID request
      socket.on('getOrderById', async (data: { orderId: string }) => {
        try {
          console.log('Get order by ID requested:', data.orderId);
          
          const order = await this.dbClient.getOrderById(data.orderId);
          
          if (order) {
            socket.emit('orderDetails', {
              success: true,
              data: order
            });
          } else {
            socket.emit('orderDetails', {
              success: false,
              error: 'Order not found'
            });
          }
        } catch (error) {
          console.error('Error fetching order by ID:', error);
          socket.emit('orderDetails', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle update order status request
      socket.on('updateOrderStatus', async (data: { orderId: string; status: string; transactionSignature?: string }) => {
        try {
          console.log('Update order status requested:', data);
          
          await this.dbClient.updateOrderStatus(data.orderId, data.status, data.transactionSignature);
          
          socket.emit('orderStatusUpdated', {
            success: true,
            data: {
              orderId: data.orderId,
              status: data.status,
              updatedAt: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('Error updating order status:', error);
          socket.emit('orderStatusUpdated', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async handleCreateOrder(data: SocketOrderRequest): Promise<SocketOrderResponse> {
    try {
      console.log('Processing perpetual trading order:', data);
      
      // Use order calculator to get all order calculations
      const calculationParams: OrderCalculationParams = {
        currentPrice: data.currentPrice,
        buyPrice: data.buyPrice,
        takeProfitPrice: data.takeProfitPrice,
        stopLossPrice: data.stopLossPrice,
        amountToSell: data.amountToSell,
        inputDecimals: data.inputDecimals,
        outputDecimals: data.outputDecimals
      };

      const calculations = this.orderCalculator.calculateOrders(calculationParams);
      
      console.log('Order calculations:', {
        buyOrder: calculations.buyOrder,
        takeProfitOrder: calculations.takeProfitOrder,
        stopLossOrder: calculations.stopLossOrder,
        summary: calculations.summary
      });

      // Create orders array to track all created orders
      const createdOrders = [];

      // 1. Create the main buy order
      const buyOrderResult = await this.createJupiterOrder(
        data,
        calculations.buyOrder,
        'BUY'
      );
      createdOrders.push(buyOrderResult);

      // 2. Create take profit order if provided
      if (calculations.takeProfitOrder) {
        const tpOrderResult = await this.createJupiterOrder(
          data,
          calculations.takeProfitOrder,
          'TAKE_PROFIT'
        );
        createdOrders.push(tpOrderResult);
      }

      // 3. Create stop loss order if provided
      if (calculations.stopLossOrder) {
        const slOrderResult = await this.createJupiterOrder(
          data,
          calculations.stopLossOrder,
          'STOP_LOSS'
        );
        createdOrders.push(slOrderResult);
      }

      console.log('All orders created successfully:', createdOrders);

      return {
        success: true,
        data: {
          orders: createdOrders,
          calculations: {
            buyOrder: calculations.buyOrder,
            takeProfitOrder: calculations.takeProfitOrder,
            stopLossOrder: calculations.stopLossOrder,
            summary: calculations.summary
          },
          note: 'Jupiter trigger system will automatically execute these orders when conditions are met'
        },
        orderId: buyOrderResult.orderId // Return the main buy order ID
      };

    } catch (error) {
      console.error('Error in handleCreateOrder:', error);
      throw error;
    }
  }

  /**
   * Create a single Jupiter order
   */
  private async createJupiterOrder(
    data: SocketOrderRequest,
    calculatedOrder: CalculatedOrder,
    orderType: 'BUY' | 'TAKE_PROFIT' | 'STOP_LOSS'
  ): Promise<{
    orderId: string;
    jupiterResponse: any;
    calculatedOrder: CalculatedOrder;
    orderType: string;
  }> {
    // Determine the correct input and output mints based on order type
    const isBuyOrder = orderType === 'BUY';
    const inputMint = isBuyOrder ? data.inputMint : data.outputMint;
    const outputMint = isBuyOrder ? data.outputMint : data.inputMint;
    
    // Determine the correct decimals for input and output tokens
    const inputDecimals = isBuyOrder ? (data.inputDecimals || 9) : (data.outputDecimals || 6);
    const outputDecimals = isBuyOrder ? (data.outputDecimals || 6) : (data.inputDecimals || 9);

    // Prepare Jupiter API request
    const jupiterRequest: CreateOrderRequest = {
      inputMint,
      outputMint,
      maker: data.maker,
      payer: data.payer,
      params: {
        makingAmount: calculatedOrder.makingAmount,
        takingAmount: calculatedOrder.takingAmount,
      },
      computeUnitPrice: "auto",
    };

    console.log(`Creating ${orderType} order via Jupiter:`, {
      ...jupiterRequest,
      orderType,
      targetPrice: calculatedOrder.targetPrice,
      description: calculatedOrder.description
    });

    // Create order via Jupiter API
    const jupiterResponse = await this.jupiterService.createOrder(jupiterRequest);

    // Calculate the correct amounts for database storage
    const inputAmount = this.convertFromLamports(calculatedOrder.makingAmount, inputDecimals);
    const outputAmount = this.convertFromLamports(calculatedOrder.takingAmount, outputDecimals);

    // Save order to database
    const dbResult = await this.dbClient.query(`
      INSERT INTO orders (
        wallet_address, order_account, input_mint, output_mint,
        input_amount, output_amount, entry_price, take_profit_price, stop_loss_price,
        order_type, status, jupiter_request_id, transaction_signature, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id
    `, [
      data.maker,
      jupiterResponse.order,
      inputMint,
      outputMint,
      inputAmount,
      outputAmount,
      data.currentPrice,
      data.takeProfitPrice,
      data.stopLossPrice,
      orderType,
      'PENDING',
      jupiterResponse.requestId,
      jupiterResponse.transaction,
      JSON.stringify({
        jupiterResponse,
        calculatedOrder,
        orderType,
        targetPrice: calculatedOrder.targetPrice,
        inputDecimals,
        outputDecimals,
        timestamp: new Date().toISOString(),
        note: `Jupiter trigger system will automatically execute this ${orderType.toLowerCase()} order when price reaches ${calculatedOrder.targetPrice}`
      })
    ]);

    const orderId = dbResult.rows[0].id;

    console.log(`${orderType} order created successfully:`, {
      orderId,
      jupiterOrderAccount: jupiterResponse.order,
      targetPrice: calculatedOrder.targetPrice,
      inputAmount,
      outputAmount,
      description: calculatedOrder.description
    });

    return {
      orderId,
      jupiterResponse,
      calculatedOrder,
      orderType
    };
  }

  /**
   * Helper method to convert lamports back to regular amounts
   */
  private convertFromLamports(lamports: string, decimals: number): number {
    return parseInt(lamports) / Math.pow(10, decimals);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketServer; 