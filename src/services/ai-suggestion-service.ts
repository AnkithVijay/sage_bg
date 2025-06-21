import dotenv from 'dotenv';
import PriceService, { PriceData } from './price-service';

dotenv.config();

export interface TradingSuggestion {
  confidence: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  positionSize: number;
  riskRewardRatio: number;
  reasoning: string;
  timeframe: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

export interface MarketAnalysis {
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number;
  support: number;
  resistance: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface TradingSuggestionsResponse {
  currentPrice: number;
  suggestions: TradingSuggestion[];
  marketAnalysis: MarketAnalysis;
  technicalIndicators: {
    priceChange: number;
    confidence: string;
    liquidity: string;
  };
}

export interface SuggestionRequest {
  tokenMint: string;
  timeframe: string;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
  userBalance?: number;
  preferences?: {
    maxRiskPercentage?: number;
    preferredTimeframe?: string;
  };
}

class AISuggestionService {
  private priceService: PriceService;
  private openRouterApiKey: string;
  private openRouterUrl: string;

  constructor() {
    this.priceService = new PriceService();
    this.openRouterApiKey = process.env.OPENROUTER_API_KEY || '';
    this.openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  /**
   * Generate trading suggestions using AI
   */
  async generateTradingSuggestions(request: SuggestionRequest): Promise<TradingSuggestionsResponse> {
    try {
      console.log('Generating AI trading suggestions for:', request.tokenMint);

      // Get current price data
      const priceData = await this.priceService.getPriceWithExtraInfo(request.tokenMint);
      
      if (!priceData) {
        throw new Error('Failed to fetch price data');
      }

      const currentPrice = parseFloat(priceData.price);
      const priceChange = this.priceService.getSimulatedPriceChange();

      // Prepare market data for AI
      const marketData = this.prepareMarketData(priceData, priceChange);

      // Generate AI suggestion
      const aiSuggestion = await this.getAISuggestion(marketData, request);

      // Process AI response and create structured suggestions
      const suggestions = this.processAISuggestion(aiSuggestion, currentPrice, request);

      // Create market analysis
      const marketAnalysis = this.createMarketAnalysis(priceData, priceChange);

      return {
        currentPrice,
        suggestions,
        marketAnalysis,
        technicalIndicators: {
          priceChange,
          confidence: priceData.extraInfo?.confidenceLevel || 'medium',
          liquidity: this.assessLiquidity(priceData)
        }
      };

    } catch (error) {
      console.error('Error generating trading suggestions:', error);
      throw error;
    }
  }

  /**
   * Prepare market data for AI analysis
   */
  private prepareMarketData(priceData: PriceData, priceChange: number): string {
    const currentPrice = parseFloat(priceData.price);
    const confidence = priceData.extraInfo?.confidenceLevel || 'medium';
    
    let marketData = `Current SOL Price: $${currentPrice.toFixed(2)}
Price Change (24h): ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%
Confidence Level: ${confidence}
Time: ${new Date().toISOString()}`;

    if (priceData.extraInfo) {
      const { quotedPrice, depth } = priceData.extraInfo;
      
      marketData += `
Buy Price: $${parseFloat(quotedPrice.buyPrice).toFixed(2)}
Sell Price: $${parseFloat(quotedPrice.sellPrice).toFixed(2)}
Spread: ${((parseFloat(quotedPrice.sellPrice) - parseFloat(quotedPrice.buyPrice)) / currentPrice * 100).toFixed(3)}%`;
    }

    return marketData;
  }

  /**
   * Get AI suggestion from OpenRouter
   */
  private async getAISuggestion(marketData: string, request: SuggestionRequest): Promise<string> {
    try {
      const prompt = this.createAIPrompt(marketData, request);

      const response = await fetch(this.openRouterUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': 'https://sage-bg.com',
          'X-Title': 'Sage BG Trading Bot'
        },
        body: JSON.stringify({
          model: 'mistralai/mistral-small-3.2-24b-instruct:free', // Updated model
          messages: [
            {
              role: 'system',
              content: 'You are a professional cryptocurrency trading advisor. Provide concise, actionable trading suggestions based on market data. Always include specific price targets and risk management advice.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as any;
      
      if (result.choices && result.choices[0] && result.choices[0].message) {
        return result.choices[0].message.content;
      }

      throw new Error('Invalid response from AI model');

    } catch (error) {
      console.error('Error getting AI suggestion:', error);
      // Return fallback suggestion if AI fails
      return this.getFallbackSuggestion(request);
    }
  }

  /**
   * Create AI prompt for trading suggestions
   */
  private createAIPrompt(marketData: string, request: SuggestionRequest): string {
    return `Based on the following market data for SOL/USDC, provide a trading suggestion:

${marketData}

Risk Level: ${request.riskLevel}
Timeframe: ${request.timeframe}
User Balance: ${request.userBalance || 'Not specified'} SOL

Please provide a JSON response with the following structure:
{
  "action": "BUY/SELL/HOLD",
  "confidence": 0.85,
  "entryPrice": 100.50,
  "takeProfitPrice": 110.55,
  "stopLossPrice": 95.48,
  "positionSize": 0.5,
  "reasoning": "Brief explanation of the suggestion",
  "timeframe": "4h"
}

Focus on ${request.riskLevel} risk level. Be realistic with price targets and provide clear reasoning.`;
  }

  /**
   * Process AI suggestion and create structured response
   */
  private processAISuggestion(aiResponse: string, currentPrice: number, request: SuggestionRequest): TradingSuggestion[] {
    try {
      // Try to parse JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const suggestion = JSON.parse(jsonMatch[0]);
        
        return [{
          confidence: suggestion.confidence || 0.7,
          action: suggestion.action || 'HOLD',
          entryPrice: suggestion.entryPrice || currentPrice,
          takeProfitPrice: suggestion.takeProfitPrice || currentPrice * 1.05,
          stopLossPrice: suggestion.stopLossPrice || currentPrice * 0.95,
          positionSize: suggestion.positionSize || 0.1,
          riskRewardRatio: this.calculateRiskReward(suggestion.entryPrice, suggestion.takeProfitPrice, suggestion.stopLossPrice),
          reasoning: suggestion.reasoning || 'AI-generated suggestion based on current market conditions',
          timeframe: suggestion.timeframe || request.timeframe,
          riskLevel: request.riskLevel
        }];
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback to default suggestion
    return [this.createDefaultSuggestion(currentPrice, request)];
  }

  /**
   * Create fallback suggestion when AI fails
   */
  private getFallbackSuggestion(request: SuggestionRequest): string {
    return `{
      "action": "HOLD",
      "confidence": 0.6,
      "entryPrice": 100.00,
      "takeProfitPrice": 105.00,
      "stopLossPrice": 95.00,
      "positionSize": 0.1,
      "reasoning": "Market conditions unclear, recommend holding and monitoring",
      "timeframe": "${request.timeframe}"
    }`;
  }

  /**
   * Create default suggestion
   */
  private createDefaultSuggestion(currentPrice: number, request: SuggestionRequest): TradingSuggestion {
    const riskMultiplier = request.riskLevel === 'aggressive' ? 1.5 : request.riskLevel === 'moderate' ? 1.0 : 0.5;
    
    return {
      confidence: 0.6,
      action: 'HOLD',
      entryPrice: currentPrice,
      takeProfitPrice: currentPrice * (1 + 0.05 * riskMultiplier),
      stopLossPrice: currentPrice * (1 - 0.03 * riskMultiplier),
      positionSize: 0.1 * riskMultiplier,
      riskRewardRatio: 1.67,
      reasoning: 'Default suggestion - monitor market conditions',
      timeframe: request.timeframe,
      riskLevel: request.riskLevel
    };
  }

  /**
   * Calculate risk/reward ratio
   */
  private calculateRiskReward(entry: number, takeProfit: number, stopLoss: number): number {
    const potentialProfit = takeProfit - entry;
    const potentialLoss = entry - stopLoss;
    
    if (potentialLoss <= 0) return 0;
    return potentialProfit / potentialLoss;
  }

  /**
   * Create market analysis
   */
  private createMarketAnalysis(priceData: PriceData, priceChange: number): MarketAnalysis {
    const currentPrice = parseFloat(priceData.price);
    
    // Simple trend analysis based on price change
    let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (priceChange > 2) trend = 'BULLISH';
    else if (priceChange < -2) trend = 'BEARISH';

    // Calculate support and resistance (simplified)
    const support = currentPrice * 0.95;
    const resistance = currentPrice * 1.05;

    // Assess volatility based on price change
    let volatility: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (Math.abs(priceChange) > 5) volatility = 'HIGH';
    else if (Math.abs(priceChange) < 1) volatility = 'LOW';

    return {
      trend,
      strength: Math.abs(priceChange) / 10, // Normalized strength
      support,
      resistance,
      volatility
    };
  }

  /**
   * Assess liquidity based on depth data
   */
  private assessLiquidity(priceData: PriceData): string {
    if (!priceData.extraInfo?.depth) return 'medium';
    
    const { buyPriceImpactRatio, sellPriceImpactRatio } = priceData.extraInfo.depth;
    
    // Simple liquidity assessment based on price impact
    const avgBuyImpact = Object.values(buyPriceImpactRatio.depth).reduce((a, b) => a + b, 0) / 3;
    const avgSellImpact = Object.values(sellPriceImpactRatio.depth).reduce((a, b) => a + b, 0) / 3;
    
    const avgImpact = (avgBuyImpact + avgSellImpact) / 2;
    
    if (avgImpact < 0.1) return 'high';
    else if (avgImpact > 0.3) return 'low';
    else return 'medium';
  }
}

export default AISuggestionService; 