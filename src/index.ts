import { createServer } from 'http';
import DatabaseClient from './client/database';
import SocketServer from './socket/socket-server';

async function main() {
  console.log('🚀 Starting Sage BG - Perpetual Trading Platform');
  
  try {
    // Initialize database client
    const dbClient = DatabaseClient.getInstance();
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const isConnected = await dbClient.testConnection();
    
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    
    // Initialize database tables
    console.log('🗄️ Initializing database tables...');
    await dbClient.initializeTables();
    
    console.log('✅ Database setup completed successfully!');
    
    // Create HTTP server
    const httpServer = createServer();
    const PORT = process.env.PORT || 3000;
    
    // Initialize WebSocket server
    const socketServer = new SocketServer(httpServer);
    console.log('🔌 WebSocket server initialized');
    
    // Start HTTP server
    httpServer.listen({
      port: PORT,
      host: '0.0.0.0'
    }, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`🔌 WebSocket server ready for connections`);
      console.log(`📱 Network accessible at:`);
      console.log(`   Local: http://localhost:${PORT}`);
      console.log(`   Network: http://192.168.2.187:${PORT}`);
      console.log(`   WebSocket: ws://192.168.2.187:${PORT}`);
    });
    
    // Keep the process running
    console.log('🔄 Server is running... Press Ctrl+C to stop');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down gracefully...');
      httpServer.close();
      await dbClient.close();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error during startup:', error);
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
