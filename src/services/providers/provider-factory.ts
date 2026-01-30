import { IPaymentProvider } from "./payment-provider.interface";
import { PagSeguroProvider } from "./pagseguro.provider";

/**
 * Payment provider factory - PagSeguro only
 * PagSeguro is the Brazilian market leader with native PIX and Boleto support
 */
export class PaymentProviderFactory {
  private static providerInstance: IPaymentProvider | null = null;

  /**
   * Get PagSeguro provider instance
   * Used for both payments and withdrawals
   */
  static getProvider(): IPaymentProvider {
    if (!this.providerInstance) {
      try {
        this.providerInstance = new PagSeguroProvider();
      } catch (error) {
        console.error("Failed to initialize PagSeguro provider:", error);
        throw new Error(
          `Failed to initialize PagSeguro: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
    return this.providerInstance;
  }

  /**
   * Get payment provider (alias for getProvider)
   */
  static getPaymentProvider(): IPaymentProvider {
    return this.getProvider();
  }

  /**
   * Get withdrawal provider (alias for getProvider)
   */
  static getWithdrawalProvider(): IPaymentProvider {
    return this.getProvider();
  }

  /**
   * Reset provider instance (useful for testing)
   */
  static reset(): void {
    this.providerInstance = null;
  }
}

/**
 * Helper functions for easier access
 */
export function getPaymentProvider(): IPaymentProvider {
  return PaymentProviderFactory.getPaymentProvider();
}

export function getWithdrawalProvider(): IPaymentProvider {
  return PaymentProviderFactory.getWithdrawalProvider();
}

export function getProvider(): IPaymentProvider {
  return PaymentProviderFactory.getProvider();
}
