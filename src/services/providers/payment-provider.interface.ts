/**
 * Payment Provider Interface
 * Allows pluggable payment providers (Stripe, PagSeguro, MercadoPago, etc.)
 */

export interface PaymentResult {
  id: string;
  status: "success" | "pending" | "failed";
  amount: number;
  currency: string;
  metadata?: Record<string, any>;
  provider_data?: any;
}

export interface TransferResult {
  id: string;
  status: "success" | "pending" | "failed";
  amount: number;
  destination: string;
  metadata?: Record<string, any>;
  provider_data?: any;
}

export interface WebhookResult {
  event_type: string;
  event_id: string;
  data: any;
}

export interface StatusResult {
  id: string;
  status: string;
  amount: number;
  metadata?: Record<string, any>;
}

export interface BoletoResult {
  boletoCode: string;
  boletoUrl: string;
  boletoBarcode: string;
  expiresAt: Date;
  paymentId?: string;
}

export interface BankInfo {
  account_type: "PIX" | "BANK_TRANSFER" | "CARD";
  pix_key?: string;
  bank_code?: string;
  account_number?: string;
  account_holder_name?: string;
  account_holder_document?: string;
  routing_number?: string; // For international
}

export interface IPaymentProvider {
  /**
   * Provider name
   */
  getName(): string;

  /**
   * Process a payment (buyer pays platform)
   */
  processPayment(
    amount: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<PaymentResult>;

  /**
   * Create a transfer/payout (platform pays seller)
   */
  createTransfer(
    amount: number,
    bankInfo: BankInfo,
    metadata: Record<string, any>
  ): Promise<TransferResult>;

  /**
   * Handle webhook from provider
   */
  handleWebhook(body: any, signature?: string): Promise<WebhookResult>;

  /**
   * Get payment/transfer status
   */
  getStatus(id: string): Promise<StatusResult>;

  /**
   * Generate boleto (Brazilian bank slip)
   * Only for providers that support boleto (PagSeguro, MercadoPago)
   */
  generateBoleto?(
    amount: number,
    metadata: Record<string, any>
  ): Promise<BoletoResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(body: any, signature: string): boolean;
}
