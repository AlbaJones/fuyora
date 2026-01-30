import Stripe from "stripe";
import {
  IPaymentProvider,
  PaymentResult,
  TransferResult,
  WebhookResult,
  StatusResult,
  BankInfo,
} from "./payment-provider.interface";

export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }

  getName(): string {
    return "stripe";
  }

  async processPayment(
    amount: number,
    currency: string = "brl",
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        capture_method: "automatic",
      });

      return {
        id: paymentIntent.id,
        status: paymentIntent.status === "succeeded" ? "success" : "pending",
        amount,
        currency,
        metadata,
        provider_data: paymentIntent,
      };
    } catch (error: any) {
      console.error("Stripe payment error:", error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async createTransfer(
    amount: number,
    bankInfo: BankInfo,
    metadata: Record<string, any>
  ): Promise<TransferResult> {
    try {
      // For Stripe, we'd create a payout to an external account
      // In real implementation, seller would need to connect their bank account first
      // This is a simplified version

      // Mock transfer for now - in production, you'd:
      // 1. Create an external account for the seller
      // 2. Create a payout to that account

      console.log("Stripe transfer:", { amount, bankInfo, metadata });

      // Simulated transfer
      return {
        id: `stripe_transfer_${Date.now()}`,
        status: "pending",
        amount,
        destination: bankInfo.pix_key || bankInfo.account_number || "unknown",
        metadata,
        provider_data: {
          note: "Stripe transfers require external account setup",
        },
      };
    } catch (error: any) {
      console.error("Stripe transfer error:", error);
      throw new Error(`Stripe transfer failed: ${error.message}`);
    }
  }

  async handleWebhook(body: any, signature?: string): Promise<WebhookResult> {
    if (!signature) {
      throw new Error("Webhook signature required");
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );

      return {
        event_type: event.type,
        event_id: event.id,
        data: event.data.object,
      };
    } catch (error: any) {
      console.error("Stripe webhook error:", error);
      throw new Error(`Webhook verification failed: ${error.message}`);
    }
  }

  async getStatus(id: string): Promise<StatusResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(id);

      return {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents
        metadata: paymentIntent.metadata,
      };
    } catch (error: any) {
      console.error("Stripe getStatus error:", error);
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return false;
    }

    try {
      this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
      return true;
    } catch {
      return false;
    }
  }
}
