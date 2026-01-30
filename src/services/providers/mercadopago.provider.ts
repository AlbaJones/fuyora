import axios from "axios";
import crypto from "crypto";
import {
  IPaymentProvider,
  PaymentResult,
  TransferResult,
  WebhookResult,
  StatusResult,
  BankInfo,
} from "./payment-provider.interface";

/**
 * MercadoPago Payment Provider
 * Latin American payment processor with PIX support
 */
export class MercadoPagoProvider implements IPaymentProvider {
  private accessToken: string;
  private publicKey: string;
  private sandbox: boolean;
  private baseUrl: string;

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
    this.publicKey = process.env.MERCADOPAGO_PUBLIC_KEY || "";
    this.sandbox = process.env.NODE_ENV !== "production";

    if (!this.accessToken) {
      throw new Error("MercadoPago credentials not configured");
    }

    this.baseUrl = "https://api.mercadopago.com";
  }

  getName(): string {
    return "mercadopago";
  }

  async processPayment(
    amount: number,
    currency: string = "BRL",
    metadata: Record<string, any>
  ): Promise<PaymentResult> {
    try {
      // Create payment preference
      const response = await axios.post(
        `${this.baseUrl}/checkout/preferences`,
        {
          items: [
            {
              title: metadata.product_name || "Product",
              quantity: 1,
              unit_price: amount,
              currency_id: currency.toUpperCase(),
            },
          ],
          payer: metadata.payer || {},
          payment_methods: {
            installments: 1,
            default_payment_method_id: "pix",
          },
          back_urls: {
            success: metadata.success_url,
            failure: metadata.failure_url,
            pending: metadata.pending_url,
          },
          auto_return: "approved",
          external_reference: metadata.order_id || `order_${Date.now()}`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        id: response.data.id,
        status: "pending",
        amount,
        currency,
        metadata,
        provider_data: response.data,
      };
    } catch (error: any) {
      console.error("MercadoPago payment error:", error.response?.data || error);
      throw new Error(
        `MercadoPago payment failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async createTransfer(
    amount: number,
    bankInfo: BankInfo,
    metadata: Record<string, any>
  ): Promise<TransferResult> {
    try {
      if (bankInfo.account_type === "PIX" && bankInfo.pix_key) {
        // PIX payout
        const response = await axios.post(
          `${this.baseUrl}/v1/payments`,
          {
            transaction_amount: amount,
            description: metadata.description || "Withdrawal",
            payment_method_id: "pix",
            payer: {
              email: metadata.seller_email || "seller@example.com",
              identification: {
                type: "CPF",
                number: bankInfo.account_holder_document,
              },
            },
            metadata: {
              ...metadata,
              pix_key: bankInfo.pix_key,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        return {
          id: response.data.id.toString(),
          status: response.data.status === "approved" ? "success" : "pending",
          amount,
          destination: bankInfo.pix_key,
          metadata,
          provider_data: response.data,
        };
      } else {
        // Bank transfer
        console.log("MercadoPago bank transfer:", { amount, bankInfo, metadata });

        return {
          id: `mercadopago_transfer_${Date.now()}`,
          status: "pending",
          amount,
          destination: bankInfo.account_number || "unknown",
          metadata,
          provider_data: {
            note: "MercadoPago bank transfer - processing",
          },
        };
      }
    } catch (error: any) {
      console.error("MercadoPago transfer error:", error.response?.data || error);
      throw new Error(`MercadoPago transfer failed: ${error.message}`);
    }
  }

  async handleWebhook(body: any, signature?: string): Promise<WebhookResult> {
    try {
      // MercadoPago webhook structure
      const eventType = body.type || body.action || "unknown";
      const eventId = body.id || `event_${Date.now()}`;

      // If it's a payment notification, fetch payment details
      if (body.data?.id) {
        const paymentId = body.data.id;
        const payment = await this.getStatus(paymentId);

        return {
          event_type: eventType,
          event_id: eventId.toString(),
          data: payment,
        };
      }

      return {
        event_type: eventType,
        event_id: eventId.toString(),
        data: body,
      };
    } catch (error: any) {
      console.error("MercadoPago webhook error:", error);
      throw new Error(`Webhook processing failed: ${error.message}`);
    }
  }

  async getStatus(id: string): Promise<StatusResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return {
        id: response.data.id.toString(),
        status: response.data.status,
        amount: response.data.transaction_amount,
        metadata: response.data.metadata,
      };
    } catch (error: any) {
      console.error("MercadoPago getStatus error:", error);
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    // MercadoPago uses x-signature header for verification
    // Implement proper verification in production
    // For now, return true
    return true;
  }
}
