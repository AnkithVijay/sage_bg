import dotenv from 'dotenv';

dotenv.config();

export interface PriceData {
  id: string;
  type: string;
  price: string;
  extraInfo?: {
    lastSwappedPrice: {
      lastJupiterSellAt: number;
      lastJupiterSellPrice: string;
      lastJupiterBuyAt: number;
      lastJupiterBuyPrice: string;
    };
    quotedPrice: {
      buyPrice: string;
      buyAt: number;
      sellPrice: string;
      sellAt: number;
    };
    confidenceLevel: string;
    depth: {
      buyPriceImpactRatio: {
        depth: {
          [key: string]: number;
        };
        timestamp: number;
      };
      sellPriceImpactRatio: {
        depth: {
          [key: string]: number;
        };
        timestamp: number;
      };
    };
  };
}

export interface PriceResponse {
  data: {
    [tokenId: string]: PriceData;
  };
  timeTaken: number;
}

class PriceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://lite-api.jup.ag/price/v2';
  }

  /**
   * Get current price for a token
   */
  async getPrice(tokenMint: string, vsToken?: string): Promise<PriceData | null> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('ids', tokenMint);
      
      if (vsToken) {
        url.searchParams.append('vsToken', vsToken);
      }

      console.log('Fetching price from Jupiter:', url.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as PriceResponse;
      
      if (result.data && result.data[tokenMint]) {
        console.log('Price fetched successfully:', result.data[tokenMint]);
        return result.data[tokenMint];
      }

      return null;
    } catch (error) {
      console.error('Error fetching price:', error);
      throw error;
    }
  }

  /**
   * Get price with extra information (confidence, depth, etc.)
   */
  async getPriceWithExtraInfo(tokenMint: string): Promise<PriceData | null> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('ids', tokenMint);
      url.searchParams.append('showExtraInfo', 'true');

      console.log('Fetching price with extra info from Jupiter:', url.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as PriceResponse;
      
      if (result.data && result.data[tokenMint]) {
        console.log('Price with extra info fetched successfully:', result.data[tokenMint]);
        return result.data[tokenMint];
      }

      return null;
    } catch (error) {
      console.error('Error fetching price with extra info:', error);
      throw error;
    }
  }

  /**
   * Get multiple token prices
   */
  async getMultiplePrices(tokenMints: string[], vsToken?: string): Promise<PriceResponse> {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.append('ids', tokenMints.join(','));
      
      if (vsToken) {
        url.searchParams.append('vsToken', vsToken);
      }

      console.log('Fetching multiple prices from Jupiter:', url.toString());

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Jupiter Price API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as PriceResponse;
      console.log('Multiple prices fetched successfully');
      return result;
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      throw error;
    }
  }

  /**
   * Get SOL price in USDC
   */
  async getSOLPrice(): Promise<number> {
    const solMint = "So11111111111111111111111111111111111111112";
    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    
    const priceData = await this.getPrice(solMint, usdcMint);
    
    if (priceData) {
      return parseFloat(priceData.price);
    }
    
    throw new Error('Failed to fetch SOL price');
  }

  /**
   * Get price change percentage (simulated for demo)
   * In a real implementation, you'd compare with historical data
   */
  getSimulatedPriceChange(): number {
    // Simulate price change for demo purposes
    // In real implementation, you'd calculate from historical data
    const changes = [-2.5, -1.8, -0.5, 0.2, 1.1, 2.3, 3.7, 4.2];
    return changes[Math.floor(Math.random() * changes.length)];
  }
}

export default PriceService; 