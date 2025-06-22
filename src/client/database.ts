import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

class DatabaseClient {
  private pool: Pool;
  private static instance: DatabaseClient;

  private constructor() {
    console.log('Initializing database client...', process.env.POSTGRESS_URL);
    
    this.pool = new Pool({
      connectionString: process.env.POSTGRESS_URL,
      ssl: {
        rejectUnauthorized: false
      },
    });

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  public static getInstance(): DatabaseClient {
    if (!DatabaseClient.instance) {
      DatabaseClient.instance = new DatabaseClient();
    }
    return DatabaseClient.instance;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async initializeTables(): Promise<void> {
    try {
      console.log('Initializing database tables...');
      
      // Check if tables exist
      const tableCheckQuery = `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('orders', 'positions')
      `;
      
      const existingTables = await this.query(tableCheckQuery);
      const existingTableNames = existingTables.rows.map((row: any) => row.table_name);
      
      console.log('Existing tables:', existingTableNames);

      // Create orders table if it doesn't exist
      if (!existingTableNames.includes('orders')) {
        console.log('Creating orders table...');
        await this.createOrdersTable();
      } else {
        console.log('Orders table already exists');
        // Run migration to fix transaction_signature field
        await this.migrateTransactionField();
      }

      // Create positions table if it doesn't exist
      if (!existingTableNames.includes('positions')) {
        console.log('Creating positions table...');
        await this.createPositionsTable();
      } else {
        console.log('Positions table already exists');
      }

      console.log('Database initialization completed successfully!');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw error;
    }
  }

  private async migrateTransactionField(): Promise<void> {
    try {
      console.log('Running migration for transaction_signature field...');
      await this.query('ALTER TABLE orders ALTER COLUMN transaction_signature TYPE TEXT');
      console.log('Migration completed successfully');
    } catch (error) {
      console.log('Migration not needed or already applied:', error);
    }
  }

  private async createOrdersTable(): Promise<void> {
    const sqlPath = path.join(__dirname, 'sql', 'create-orders-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    await this.query(sqlContent);
    console.log('Orders table created successfully');
  }

  private async createPositionsTable(): Promise<void> {
    const sqlPath = path.join(__dirname, 'sql', 'create-positions-table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    await this.query(sqlContent);
    console.log('Positions table created successfully');
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Get all orders for a wallet address
   */
  public async getOrders(walletAddress: string, status?: string): Promise<any[]> {
    try {
      let query = `
        SELECT 
          id,
          wallet_address,
          order_account,
          input_mint,
          output_mint,
          input_amount,
          output_amount,
          entry_price,
          take_profit_price,
          stop_loss_price,
          order_type,
          status,
          created_at,
          updated_at,
          expires_at,
          jupiter_request_id,
          transaction_signature,
          metadata
        FROM orders 
        WHERE wallet_address = $1
      `;
      
      const params: any[] = [walletAddress];
      
      if (status) {
        query += ' AND status = $2';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Get all orders with optional status filter
   */
  public async getAllOrders(status?: string, limit: number = 100): Promise<any[]> {
    try {
      let query = `
        SELECT 
          id,
          wallet_address,
          order_account,
          input_mint,
          output_mint,
          input_amount,
          output_amount,
          entry_price,
          take_profit_price,
          stop_loss_price,
          order_type,
          status,
          created_at,
          updated_at,
          expires_at,
          jupiter_request_id,
          transaction_signature,
          metadata
        FROM orders 
      `;
      
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE status = $1';
        params.push(status);
      }
      
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);
      
      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }

  /**
   * Update order status
   */
  public async updateOrderStatus(orderId: string, status: string, transactionSignature?: string): Promise<void> {
    try {
      let query = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
      `;
      
      const params: any[] = [status];
      
      if (transactionSignature) {
        query += ', transaction_signature = $2';
        params.push(transactionSignature);
      }
      
      query += ' WHERE id = $' + (params.length + 1);
      params.push(orderId);
      
      await this.query(query, params);
      console.log(`Order ${orderId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  public async getOrderById(orderId: string): Promise<any> {
    try {
      const query = `
        SELECT 
          id,
          wallet_address,
          order_account,
          input_mint,
          output_mint,
          input_amount,
          output_amount,
          entry_price,
          take_profit_price,
          stop_loss_price,
          order_type,
          status,
          created_at,
          updated_at,
          expires_at,
          jupiter_request_id,
          transaction_signature,
          metadata
        FROM orders 
        WHERE id = $1
      `;
      
      const result = await this.query(query, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  }
}

export default DatabaseClient; 