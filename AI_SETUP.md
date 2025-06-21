# AI Trading Suggestions Setup Guide

## 🤖 **OpenRouter API Setup**

### **1. Get OpenRouter API Key**
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### **2. Rate Limits**
- **Free Tier**: 10 requests/minute
- **Paid Plans**: Higher limits available
- **Model Used**: `mistralai/mistral-7b-instruct` (free)

## 🚀 **Quick Start**

### **1. Add Environment Variable**
```bash
# Add to your .env file
OPENROUTER_API_KEY=your_api_key_here
```

### **2. Test AI Suggestions**
```bash
# Test the AI suggestions feature
npx ts-node test-ai-suggestions.ts
```

### **3. Frontend Integration**
```javascript
// Request AI trading suggestions
socket.emit('getTradingSuggestions', {
  tokenMint: "So11111111111111111111111111111111111111112", // SOL
  timeframe: "4h",
  riskLevel: "moderate",
  userBalance: 10
});

// Handle AI suggestions
socket.on('tradingSuggestions', (response) => {
  if (response.success) {
    console.log('AI Suggestions:', response.data);
    // Use suggestions to create orders
  }
});
```

## 📊 **Features**

### **Real-time Data Sources:**
- **Jupiter Price API V2**: Real-time SOL/USDC prices
- **Market Depth**: Liquidity and confidence levels
- **Price Impact**: Buy/sell impact analysis

### **AI Capabilities:**
- **Trading Suggestions**: BUY/SELL/HOLD recommendations
- **Risk Management**: Stop loss and take profit targets
- **Position Sizing**: Based on user balance and risk level
- **Market Analysis**: Trend, support, resistance, volatility

### **Risk Levels:**
- **Conservative**: Lower position sizes, tighter stops
- **Moderate**: Balanced risk/reward
- **Aggressive**: Larger positions, wider targets

## 🎯 **Demo Features**

### **Perfect for Hackathon Demo:**
- ✅ Real-time price data from Jupiter
- ✅ AI-powered trading suggestions
- ✅ Risk management recommendations
- ✅ Market analysis and trends
- ✅ Easy frontend integration
- ✅ Fallback suggestions if AI fails

### **Response Includes:**
- Current market price
- AI trading suggestions with confidence
- Entry, take profit, and stop loss prices
- Risk/reward ratios
- Market trend analysis
- Technical indicators

## ⚠️ **Important Notes**

### **Rate Limiting:**
- OpenRouter free tier: 10 requests/minute
- Implement caching for demo
- Consider paid plan for production

### **Fallback System:**
- If AI fails, returns default suggestions
- No downtime during demo
- Graceful error handling

### **Demo Optimization:**
- Cache suggestions for 1 minute
- Use simulated price changes
- Focus on SOL/USDC pair

## 🔧 **Troubleshooting**

### **API Key Issues:**
```bash
# Check if API key is set
echo $OPENROUTER_API_KEY
```

### **Rate Limit Issues:**
- Wait 1 minute between requests
- Implement request caching
- Use fallback suggestions

### **Network Issues:**
- Check internet connection
- Verify Jupiter API access
- Test with fallback mode

## 🎉 **Ready for Demo!**

Your AI trading suggestions system is now ready for the hackathon demo! The system provides:

1. **Real-time market data** from Jupiter
2. **AI-powered suggestions** from OpenRouter
3. **Risk management** recommendations
4. **Easy integration** with your frontend
5. **Fallback system** for reliability

Perfect for showcasing AI + DeFi integration! 🚀 