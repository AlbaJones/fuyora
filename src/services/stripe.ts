import Stripe from "stripe";

export class StripeService {
  private stripe: Stripe;
  private platformFeePercentage: number;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });

    this.platformFeePercentage = parseFloat(
      process.env.PLATFORM_FEE_PERCENTAGE || "10"
    );

    console.log("Stripe service initialized successfully (Platform-only mode)");
  }

  /**
   * Create a payment intent (direct to platform account)
   * NO Stripe Connect - all payments go to platform
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        metadata: metadata || {},
        // NO transfer_data or application_fee_amount
        // Payment goes directly to platform account
      });

      console.log("Created payment intent:", paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      console.error("Failed to create payment intent:", error);
      throw error;
    }
  }

  /**
   * Create a transfer/payout for seller withdrawal
   * This is called ONLY when seller requests withdrawal
   * Money is sent from platform account to seller's bank
   */
  async createTransfer(
    amount: number,
    bankInfo: {
      account_type: "PIX" | "BANK_TRANSFER";
      pix_key?: string;
      bank_code?: string;
      account_number?: string;
      account_holder_name?: string;
      account_holder_document?: string;
    },
    metadata?: Record<string, string>
  ): Promise<Stripe.Transfer> {
    try {
      // IMPORTANT: This is a simplified implementation
      // In a real production environment, you would:
      // 1. For Brazilian PIX/bank transfers, integrate with a local payment provider
      //    (e.g., PagSeguro, MercadoPago, PicPay, etc.)
      // 2. For Stripe, create connected accounts or external bank accounts first
      
      // For now, this simulates the transfer
      // You'll need to replace this with actual bank transfer logic
      
      console.log("Creating transfer for withdrawal:", { amount, bankInfo });
      
      // Placeholder implementation
      // In production, replace with actual Stripe Payout or bank transfer API call
      const mockTransfer: any = {
        id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        object: "transfer",
        amount: Math.round(amount * 100), // Convert to cents
        currency: "brl",
        description: `Withdrawal - ${bankInfo.account_type}`,
        metadata: metadata || {},
        created: Math.floor(Date.now() / 1000),
        destination: "external_bank_account",
      };

      console.log("Created mock transfer:", mockTransfer.id);
      console.log("⚠️  IMPORTANT: Replace with real Stripe/bank integration");
      
      return mockTransfer as Stripe.Transfer;
    } catch (error) {
      console.error("Failed to create transfer:", error);
      throw error;
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethod: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: paymentMethod,
        }
      );

      return paymentIntent;
    } catch (error) {
      console.error("Failed to confirm payment intent:", error);
      throw error;
    }
  }

  /**
   * Create a refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });

      console.log("Created refund:", refund.id);
      return refund;
    } catch (error) {
      console.error("Failed to create refund:", error);
      throw error;
    }
  }

  /**
   * Construct webhook event from raw body
   */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );

      return event;
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw error;
    }
  }

  /**
   * Get balance
   */
  async getBalance(): Promise<Stripe.Balance> {
    try {
      const balance = await this.stripe.balance.retrieve();
      return balance;
    } catch (error) {
      console.error("Failed to retrieve balance:", error);
      throw error;
    }
  }
}

// Singleton instance
let stripeServiceInstance: StripeService | null = null;

export function getStripeService(): StripeService {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeService();
  }
  return stripeServiceInstance;
}
