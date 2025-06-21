import dotenv from 'dotenv';

dotenv.config();

// Types for Jupiter API
export interface CreateOrderRequest {
  inputMint: string;
  outputMint: string;
  maker: string;
  payer: string;
  params: {
    makingAmount: string;
    takingAmount: string;
    slippageBps?: string;
    expiredAt?: string;
    feeBps?: string;
  };
  computeUnitPrice: string;
  feeAccount?: string;
  wrapAndUnwrapSol?: boolean;
}

export interface CreateOrderResponse {
  tx: string;
  requestId: string;
  orderAccount: string;
  status: string;
}

export interface JupiterApiError {
  error: string;
  code: number;
  message: string;
}

class JupiterService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.JUPITER_API_BASE_URL || 'https://lite-api.jup.ag';
  }

  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('Creating Jupiter order:', orderData);

      const response = await fetch(`${this.baseUrl}/trigger/v1/createOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json() as CreateOrderResponse | JupiterApiError;

      if (!response.ok) {
        const errorResult = result as JupiterApiError;
        throw new Error(`Jupiter API error: ${errorResult.error || errorResult.message || 'Unknown error'}`);
      }

      console.log('Jupiter order created successfully:', result);
      return result as CreateOrderResponse;
    } catch (error) {
      console.error('Error creating Jupiter order:', error);
      throw error;
    }
  }

  // Helper function to convert token amounts to lamports
  convertToLamports(amount: number, decimals: number = 9): string {
    return (amount * Math.pow(10, decimals)).toString();
  }

  // Helper function to convert from lamports
  convertFromLamports(lamports: string, decimals: number = 9): number {
    return parseInt(lamports) / Math.pow(10, decimals);
  }

  // Calculate taking amount based on current price and target price
  calculateTakingAmount(
    makingAmount: number,
    currentPrice: number,
    targetPrice: number,
    outputDecimals: number = 6
  ): string {
    // For perpetual trading, we calculate the future amount
    const priceRatio = targetPrice / currentPrice;
    const takingAmount = makingAmount * priceRatio;
    return this.convertToLamports(takingAmount, outputDecimals);
  }
}

export default JupiterService; 