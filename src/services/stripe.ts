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

    console.log("Stripe service initialized successfully");
  }

  /**
   * Create a Stripe Connect account for a seller
   */
  async createConnectedAccount(
    userId: string,
    email: string,
    country: string = "BR"
  ): Promise<Stripe.Account> {
    try {
      const account = await this.stripe.accounts.create({
        type: "express",
        country,
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          user_id: userId,
        },
      });

      console.log("Created Stripe Connect account:", account.id);
      return account;
    } catch (error) {
      console.error("Failed to create Stripe Connect account:", error);
      throw error;
    }
  }

  /**
   * Create account link for onboarding
   */
  async createAccountLink(
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<Stripe.AccountLink> {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
      });

      return accountLink;
    } catch (error) {
      console.error("Failed to create account link:", error);
      throw error;
    }
  }

  /**
   * Get account details
   */
  async getAccount(accountId: string): Promise<Stripe.Account> {
    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return account;
    } catch (error) {
      console.error("Failed to retrieve account:", error);
      throw error;
    }
  }

  /**
   * Create a payment intent with platform fee
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    sellerAccountId: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.PaymentIntent> {
    try {
      // Calculate platform fee
      const platformFee = Math.round(amount * (this.platformFeePercentage / 100));

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        application_fee_amount: platformFee,
        transfer_data: {
          destination: sellerAccountId,
        },
        metadata: metadata || {},
      });

      console.log("Created payment intent:", paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      console.error("Failed to create payment intent:", error);
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
