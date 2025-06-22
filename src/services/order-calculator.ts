export interface OrderCalculationParams {
  currentPrice: number;
  buyPrice: number;
  takeProfitPrice?: number;
  stopLossPrice?: number;
  amountToSell: number;
  inputDecimals?: number;
  outputDecimals?: number;
}

export interface CalculatedOrder {
  type: 'BUY' | 'TAKE_PROFIT' | 'STOP_LOSS';
  makingAmount: string; // Input amount in lamports
  takingAmount: string; // Output amount in lamports
  targetPrice: number;
  expectedOutputAmount: number;
  description: string;
}

export interface OrderCalculations {
  buyOrder: CalculatedOrder;
  takeProfitOrder?: CalculatedOrder;
  stopLossOrder?: CalculatedOrder;
  summary: {
    totalOrders: number;
    totalInputAmount: number;
    totalExpectedOutput: number;
    riskRewardRatio?: number;
  };
}

class OrderCalculator {
  private defaultInputDecimals = 9;  // SOL
  private defaultOutputDecimals = 6; // USDC

  /**
   * Convert amount to lamports (smallest unit)
   */
  private convertToLamports(amount: number, decimals: number): string {
    return Math.floor(amount * Math.pow(10, decimals)).toString();
  }

  /**
   * Convert lamports back to regular amount
   */
  private convertFromLamports(lamports: string, decimals: number): number {
    return parseInt(lamports) / Math.pow(10, decimals);
  }

  /**
   * Calculate order amounts based on target price
   */
  private calculateOrderAmounts(
    inputAmount: number,
    targetPrice: number,
    inputDecimals: number,
    outputDecimals: number
  ): { makingAmount: string; takingAmount: string; expectedOutput: number } {
    const makingAmount = this.convertToLamports(inputAmount, inputDecimals);
    const expectedOutput = inputAmount * targetPrice;
    const takingAmount = this.convertToLamports(expectedOutput, outputDecimals);

    return {
      makingAmount,
      takingAmount,
      expectedOutput
    };
  }

  /**
   * Calculate all orders for a trading strategy
   */
  calculateOrders(params: OrderCalculationParams): OrderCalculations {
    const {
      currentPrice,
      buyPrice,
      takeProfitPrice,
      stopLossPrice,
      amountToSell,
      inputDecimals = this.defaultInputDecimals,
      outputDecimals = this.defaultOutputDecimals
    } = params;

    // Validate inputs
    this.validateInputs(params);

    // Calculate buy order
    const buyOrder = this.calculateBuyOrder(params);

    // Calculate take profit order (if provided)
    let takeProfitOrder: CalculatedOrder | undefined;
    if (takeProfitPrice && takeProfitPrice > buyPrice) {
      takeProfitOrder = this.calculateTakeProfitOrder(params);
    }

    // Calculate stop loss order (if provided)
    let stopLossOrder: CalculatedOrder | undefined;
    if (stopLossPrice && stopLossPrice < buyPrice) {
      stopLossOrder = this.calculateStopLossOrder(params);
    }

    // Calculate summary
    const summary = this.calculateSummary(buyOrder, takeProfitOrder, stopLossOrder);

    return {
      buyOrder,
      takeProfitOrder,
      stopLossOrder,
      summary
    };
  }

  /**
   * Calculate buy order (limit order to buy at target price)
   */
  private calculateBuyOrder(params: OrderCalculationParams): CalculatedOrder {
    const {
      buyPrice,
      amountToSell,
      inputDecimals = this.defaultInputDecimals,
      outputDecimals = this.defaultOutputDecimals
    } = params;

    const { makingAmount, takingAmount, expectedOutput } = this.calculateOrderAmounts(
      amountToSell,
      buyPrice,
      inputDecimals,
      outputDecimals
    );

    return {
      type: 'BUY',
      makingAmount,
      takingAmount,
      targetPrice: buyPrice,
      expectedOutputAmount: expectedOutput,
      description: `Buy ${amountToSell} tokens at ${buyPrice} price`
    };
  }

  /**
   * Calculate take profit order (sell order when price goes up)
   */
  private calculateTakeProfitOrder(params: OrderCalculationParams): CalculatedOrder {
    const {
      takeProfitPrice,
      amountToSell,
      inputDecimals = this.defaultInputDecimals,
      outputDecimals = this.defaultOutputDecimals
    } = params;

    if (!takeProfitPrice) {
      throw new Error('Take profit price is required for take profit order calculation');
    }

    // For take profit, we want to sell the tokens we bought
    // So we're selling the expected output amount from the buy order
    const expectedOutputFromBuy = amountToSell * params.buyPrice;
    
    const { makingAmount, takingAmount, expectedOutput } = this.calculateOrderAmounts(
      expectedOutputFromBuy, // We're selling the output tokens we bought
      takeProfitPrice,
      outputDecimals, // Now output tokens are our input
      inputDecimals   // And we want input tokens back
    );

    return {
      type: 'TAKE_PROFIT',
      makingAmount,
      takingAmount,
      targetPrice: takeProfitPrice,
      expectedOutputAmount: expectedOutput,
      description: `Sell ${expectedOutputFromBuy.toFixed(6)} tokens at ${takeProfitPrice} price (take profit)`
    };
  }

  /**
   * Calculate stop loss order (sell order when price goes down)
   */
  private calculateStopLossOrder(params: OrderCalculationParams): CalculatedOrder {
    const {
      stopLossPrice,
      amountToSell,
      inputDecimals = this.defaultInputDecimals,
      outputDecimals = this.defaultOutputDecimals
    } = params;

    if (!stopLossPrice) {
      throw new Error('Stop loss price is required for stop loss order calculation');
    }

    // For stop loss, we want to sell the tokens we bought
    // So we're selling the expected output amount from the buy order
    const expectedOutputFromBuy = amountToSell * params.buyPrice;
    
    const { makingAmount, takingAmount, expectedOutput } = this.calculateOrderAmounts(
      expectedOutputFromBuy, // We're selling the output tokens we bought
      stopLossPrice,
      outputDecimals, // Now output tokens are our input
      inputDecimals   // And we want input tokens back
    );

    return {
      type: 'STOP_LOSS',
      makingAmount,
      takingAmount,
      targetPrice: stopLossPrice,
      expectedOutputAmount: expectedOutput,
      description: `Sell ${expectedOutputFromBuy.toFixed(6)} tokens at ${stopLossPrice} price (stop loss)`
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    buyOrder: CalculatedOrder,
    takeProfitOrder?: CalculatedOrder,
    stopLossOrder?: CalculatedOrder
  ): OrderCalculations['summary'] {
    const orders = [buyOrder, takeProfitOrder, stopLossOrder].filter(Boolean) as CalculatedOrder[];
    
    let totalInputAmount = 0;
    let totalExpectedOutput = 0;

    // Calculate totals
    orders.forEach(order => {
      if (order.type === 'BUY') {
        totalInputAmount += this.convertFromLamports(order.makingAmount, 9); // Assuming SOL decimals
        totalExpectedOutput += order.expectedOutputAmount;
      }
    });

    // Calculate risk/reward ratio if both TP and SL exist
    let riskRewardRatio: number | undefined;
    if (takeProfitOrder && stopLossOrder) {
      const buyPrice = buyOrder.targetPrice;
      const tpPrice = takeProfitOrder.targetPrice;
      const slPrice = stopLossOrder.targetPrice;
      
      const potentialProfit = tpPrice - buyPrice;
      const potentialLoss = buyPrice - slPrice;
      
      if (potentialLoss > 0) {
        riskRewardRatio = potentialProfit / potentialLoss;
      }
    }

    return {
      totalOrders: orders.length,
      totalInputAmount,
      totalExpectedOutput,
      riskRewardRatio
    };
  }

  /**
   * Validate input parameters
   */
  private validateInputs(params: OrderCalculationParams): void {
    const { currentPrice, buyPrice, takeProfitPrice, stopLossPrice, amountToSell } = params;

    if (amountToSell <= 0) {
      throw new Error('Amount to sell must be greater than 0');
    }

    if (buyPrice <= 0) {
      throw new Error('Buy price must be greater than 0');
    }

    if (currentPrice <= 0) {
      throw new Error('Current price must be greater than 0');
    }

    if (takeProfitPrice && takeProfitPrice <= buyPrice) {
      throw new Error('Take profit price must be greater than buy price');
    }

    if (stopLossPrice && stopLossPrice >= buyPrice) {
      throw new Error('Stop loss price must be less than buy price');
    }

    if (takeProfitPrice && stopLossPrice && takeProfitPrice <= stopLossPrice) {
      throw new Error('Take profit price must be greater than stop loss price');
    }
  }

  /**
   * Get order type description
   */
  getOrderTypeDescription(type: CalculatedOrder['type']): string {
    switch (type) {
      case 'BUY':
        return 'Limit buy order - executes when price reaches or goes below target';
      case 'TAKE_PROFIT':
        return 'Take profit order - sells tokens when price reaches target profit level';
      case 'STOP_LOSS':
        return 'Stop loss order - sells tokens when price reaches target loss level';
      default:
        return 'Unknown order type';
    }
  }

  /**
   * Format price for display
   */
  formatPrice(price: number, decimals: number = 6): string {
    return price.toFixed(decimals);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, decimals: number = 6): string {
    return amount.toFixed(decimals);
  }
}

export default OrderCalculator; 