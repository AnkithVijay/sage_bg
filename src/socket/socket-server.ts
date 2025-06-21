import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import JupiterService, { CreateOrderRequest } from '../services/jupiter-service';
import DatabaseClient from '../client/database';

export interface SocketOrderRequest {
  inputMint: string;
  outputMint: string;
  maker: string;
  payer: string;
  makingAmount: number;
  currentPrice: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  inputDecimals?: number;
  outputDecimals?: number;
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

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Configure this properly for production
        methods: ["GET", "POST"]
      }
    });

    this.jupiterService = new JupiterService();
    this.dbClient = DatabaseClient.getInstance();

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

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private async handleCreateOrder(data: SocketOrderRequest): Promise<SocketOrderResponse> {
    try {
      // Convert amounts to lamports
      const inputDecimals = data.inputDecimals || 9;
      const outputDecimals = data.outputDecimals || 6;
      
      const makingAmount = this.jupiterService.convertToLamports(data.makingAmount, inputDecimals);
      
      // Calculate taking amount based on current price
      const takingAmount = this.jupiterService.calculateTakingAmount(
        data.makingAmount,
        data.currentPrice,
        data.currentPrice, // For now, use current price as target
        outputDecimals
      );

      // Prepare Jupiter API request
      const jupiterRequest: CreateOrderRequest = {
        inputMint: data.inputMint,
        outputMint: data.outputMint,
        maker: data.maker,
        payer: data.payer,
        params: {
          makingAmount,
          takingAmount,
        },
        computeUnitPrice: "auto",
      };

      // Create order via Jupiter API
      const jupiterResponse = await this.jupiterService.createOrder(jupiterRequest);

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
        jupiterResponse.orderAccount,
        data.inputMint,
        data.outputMint,
        data.makingAmount,
        this.jupiterService.convertFromLamports(takingAmount, outputDecimals),
        data.currentPrice,
        data.takeProfitPrice,
        data.stopLossPrice,
        'LIMIT',
        'PENDING',
        jupiterResponse.requestId,
        jupiterResponse.tx,
        JSON.stringify({
          jupiterResponse,
          socketId: 'socket_id_here', // You can track this if needed
          timestamp: new Date().toISOString()
        })
      ]);

      const orderId = dbResult.rows[0].id;

      return {
        success: true,
        data: {
          orderId,
          jupiterResponse,
          dbOrder: dbResult.rows[0]
        },
        orderId
      };

    } catch (error) {
      console.error('Error in handleCreateOrder:', error);
      throw error;
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketServer; 