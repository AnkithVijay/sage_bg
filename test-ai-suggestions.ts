// Test AI Trading Suggestions
// Run with: npx ts-node test-ai-suggestions.ts

import io from 'socket.io-client';

// Test configuration
const SERVER_URL = 'http://localhost:3000';

// Test data for AI suggestions
const testSuggestionData = {
  tokenMint: "So11111111111111111111111111111111111111112", // SOL
  timeframe: "4h",
  riskLevel: "moderate" as const,
  userBalance: 10, // 10 SOL
  preferences: {
    maxRiskPercentage: 5,
    preferredTimeframe: "4h"
  }
};

interface TradingSuggestionsResponse {
  success: boolean;
  data?: {
    currentPrice: number;
    suggestions: Array<{
      confidence: number;
      action: string;
      entryPrice: number;
      takeProfitPrice: number;
      stopLossPrice: number;
      positionSize: number;
      riskRewardRatio: number;
      reasoning: string;
      timeframe: string;
      riskLevel: string;
    }>;
    marketAnalysis: {
      trend: string;
      strength: number;
      support: number;
      resistance: number;
      volatility: string;
    };
    technicalIndicators: {
      priceChange: number;
      confidence: string;
      liquidity: string;
    };
  };
  error?: string;
}

async function testAISuggestions() {
  console.log('🤖 Starting AI Trading Suggestions test...\n');

  const socket = io(SERVER_URL);

  return new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      console.log('📊 Test Data:');
      console.log(`   Token: SOL`);
      console.log(`   Timeframe: ${testSuggestionData.timeframe}`);
      console.log(`   Risk Level: ${testSuggestionData.riskLevel}`);
      console.log(`   User Balance: ${testSuggestionData.userBalance} SOL\n`);

      console.log('🤖 Requesting AI trading suggestions...');
      socket.emit('getTradingSuggestions', testSuggestionData);
    });

    socket.on('tradingSuggestions', (response: TradingSuggestionsResponse) => {
      console.log('📥 Received AI suggestions response:');
      
      if (response.success && response.data) {
        console.log('✅ AI suggestions generated successfully!');
        
        const { currentPrice, suggestions, marketAnalysis, technicalIndicators } = response.data;
        
        console.log('\n💰 Current Market Data:');
        console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
        console.log(`   Price Change: ${technicalIndicators.priceChange > 0 ? '+' : ''}${technicalIndicators.priceChange.toFixed(2)}%`);
        console.log(`   Confidence: ${technicalIndicators.confidence}`);
        console.log(`   Liquidity: ${technicalIndicators.liquidity}`);

        console.log('\n📈 Market Analysis:');
        console.log(`   Trend: ${marketAnalysis.trend}`);
        console.log(`   Strength: ${(marketAnalysis.strength * 100).toFixed(1)}%`);
        console.log(`   Support: $${marketAnalysis.support.toFixed(2)}`);
        console.log(`   Resistance: $${marketAnalysis.resistance.toFixed(2)}`);
        console.log(`   Volatility: ${marketAnalysis.volatility}`);

        console.log('\n🤖 AI Trading Suggestions:');
        suggestions.forEach((suggestion: any, index: number) => {
          console.log(`\n   Suggestion ${index + 1}:`);
          console.log(`   Action: ${suggestion.action}`);
          console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
          console.log(`   Entry Price: $${suggestion.entryPrice.toFixed(2)}`);
          console.log(`   Take Profit: $${suggestion.takeProfitPrice.toFixed(2)}`);
          console.log(`   Stop Loss: $${suggestion.stopLossPrice.toFixed(2)}`);
          console.log(`   Position Size: ${suggestion.positionSize} SOL`);
          console.log(`   Risk/Reward: ${suggestion.riskRewardRatio.toFixed(2)}:1`);
          console.log(`   Timeframe: ${suggestion.timeframe}`);
          console.log(`   Risk Level: ${suggestion.riskLevel}`);
          console.log(`   Reasoning: ${suggestion.reasoning}`);
        });

        console.log('\n🎯 Demo Ready!');
        console.log('   - Real-time price data from Jupiter');
        console.log('   - AI-powered trading suggestions');
        console.log('   - Risk management recommendations');
        console.log('   - Market analysis and trends');
        
        resolve(response);
      } else {
        console.error('❌ AI suggestions failed:', response.error);
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
testAISuggestions()
  .then(() => {
    console.log('\n🎉 AI Suggestions test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 AI Suggestions test failed:', error.message);
    process.exit(1);
  }); 