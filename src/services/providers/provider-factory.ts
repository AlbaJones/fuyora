import { IPaymentProvider } from "./payment-provider.interface";
import { StripeProvider } from "./stripe.provider";
import { PagSeguroProvider } from "./pagseguro.provider";
import { MercadoPagoProvider } from "./mercadopago.provider";

/**
 * Provider type enum
 */
export enum ProviderType {
  STRIPE = "stripe",
  PAGSEGURO = "pagseguro",
  MERCADOPAGO = "mercadopago",
}

/**
 * Factory to create payment providers based on environment configuration
 */
export class ProviderFactory {
  private static paymentProviderInstance: IPaymentProvider | null = null;
  private static withdrawalProviderInstance: IPaymentProvider | null = null;

  /**
   * Get payment provider instance (for processing customer payments)
   */
  static getPaymentProvider(): IPaymentProvider {
    if (!this.paymentProviderInstance) {
      const providerName = (
        process.env.PAYMENT_PROVIDER || "stripe"
      ).toLowerCase();
      this.paymentProviderInstance = this.createProvider(providerName);
    }
    return this.paymentProviderInstance;
  }

  /**
   * Get withdrawal provider instance (for seller payouts)
   */
  static getWithdrawalProvider(): IPaymentProvider {
    if (!this.withdrawalProviderInstance) {
      const providerName = (
        process.env.WITHDRAWAL_PROVIDER || "stripe"
      ).toLowerCase();
      this.withdrawalProviderInstance = this.createProvider(providerName);
    }
    return this.withdrawalProviderInstance;
  }

  /**
   * Create a provider instance based on provider name
   */
  private static createProvider(providerName: string): IPaymentProvider {
    try {
      switch (providerName) {
        case ProviderType.STRIPE:
          return new StripeProvider();
        case ProviderType.PAGSEGURO:
          return new PagSeguroProvider();
        case ProviderType.MERCADOPAGO:
          return new MercadoPagoProvider();
        default:
          console.warn(
            `Unknown provider "${providerName}", defaulting to Stripe`
          );
          return new StripeProvider();
      }
    } catch (error) {
      console.error(
        `Failed to initialize provider "${providerName}":`,
        error
      );
      throw new Error(
        `Failed to initialize payment provider "${providerName}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Reset provider instances (useful for testing)
   */
  static reset(): void {
    this.paymentProviderInstance = null;
    this.withdrawalProviderInstance = null;
  }
}
