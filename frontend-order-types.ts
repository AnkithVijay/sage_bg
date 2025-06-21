// Types for Order Form Data
export interface OrderFormData {
  // Required fields from database schema
  wallet_address: string;
  order_account: string;
  input_mint: string;
  output_mint: string;
  input_amount: number;
  output_amount: number;
  entry_price: number;
  
  // Optional fields
  take_profit_price?: number;
  stop_loss_price?: number;
  order_type: 'LIMIT' | 'TAKE_PROFIT' | 'STOP_LOSS';
  expires_at?: string; // ISO date string
  jupiter_request_id?: string;
  metadata?: Record<string, any>;
}

export interface PositionFormData {
  wallet_address: string;
  order_id: string;
  entry_price: number;
  position_size: number;
  take_profit_price?: number;
  stop_loss_price?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Function to validate order data
export function validateOrderData(data: Partial<OrderFormData>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required field validation
  if (!data.wallet_address) errors.push('Wallet address is required');
  if (!data.order_account) errors.push('Order account is required');
  if (!data.input_mint) errors.push('Input mint is required');
  if (!data.output_mint) errors.push('Output mint is required');
  if (!data.input_amount || data.input_amount <= 0) errors.push('Input amount must be greater than 0');
  if (!data.output_amount || data.output_amount <= 0) errors.push('Output amount must be greater than 0');
  if (!data.entry_price || data.entry_price <= 0) errors.push('Entry price must be greater than 0');
  if (!data.order_type) errors.push('Order type is required');
  
  // Price validation
  if (data.take_profit_price && data.entry_price && data.take_profit_price <= data.entry_price) {
    errors.push('Take profit price must be higher than entry price');
  }
  
  if (data.stop_loss_price && data.entry_price && data.stop_loss_price >= data.entry_price) {
    errors.push('Stop loss price must be lower than entry price');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Function to submit order data to backend
export async function submitOrderData(orderData: OrderFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit order');
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Function to submit position data to backend
export async function submitPositionData(positionData: PositionFormData): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/positions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionData),
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit position');
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Example usage function
export function createOrderFormHandler() {
  return async (formData: OrderFormData) => {
    // Validate the data first
    const validation = validateOrderData(formData);
    
    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }
    
    // Submit to backend
    const result = await submitOrderData(formData);
    
    if (result.success) {
      console.log('Order submitted successfully:', result.data);
    } else {
      console.error('Failed to submit order:', result.error);
    }
    
    return result;
  };
}

// Example form data structure
export const exampleOrderData: OrderFormData = {
  wallet_address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
  order_account: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
  input_mint: "So11111111111111111111111111111111111111112", // SOL
  output_mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  input_amount: 1.5,
  output_amount: 150.0,
  entry_price: 100.0,
  take_profit_price: 110.0,
  stop_loss_price: 90.0,
  order_type: "LIMIT",
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  metadata: {
    source: "frontend",
    user_id: "user123",
    session_id: "session456"
  }
}; 