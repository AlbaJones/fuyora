import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";
import { getPaymentProvider } from "../services/providers/provider-factory";
import { LedgerService } from "../services/ledger";

const router = Router();

/**
 * POST /payments/create-intent
 * Create a payment via PagSeguro
 * All payments go directly to platform, seller gets ledger credit
 */
router.post(
  "/payments/create-intent",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { amount, currency, seller_id, order_id, metadata } = req.body;

      if (!amount || !seller_id) {
        return res.status(400).json({
          message: "Amount and seller_id are required",
        });
      }

      if (amount < 50) {
        return res.status(400).json({
          message: "Minimum amount is R$ 0.50 (50 cents)",
        });
      }

      // Payment goes to PLATFORM account via PagSeguro
      const paymentProvider = getPaymentProvider();
      const paymentResult = await paymentProvider.processPayment(
        amount,
        currency || "brl",
        {
          seller_id,
          order_id,
          ...metadata,
        }
      );

      return res.json({
        payment_id: paymentResult.id,
        status: paymentResult.status,
        amount: paymentResult.amount,
        currency: paymentResult.currency,
        message:
          "Payment will be processed via platform account. Seller will receive credit in internal ledger.",
      });
    } catch (error: any) {
      console.error("Create payment intent error:", error);
      return res.status(500).json({
        message: "Failed to create payment intent",
      });
    }
  }
);

/**
 * POST /webhooks/pagseguro
 * PagSeguro webhook handler
 */
router.post("/webhooks/pagseguro", async (req: Request, res: Response) => {
  try {
    const paymentProvider = getPaymentProvider();
    const webhookResult = await paymentProvider.handleWebhook(req.body);

    console.log("Received PagSeguro webhook:", webhookResult.event_type);

    // Handle different event types
    switch (webhookResult.event_type) {
      case "payment.approved":
      case "payment.paid":
        console.log("Payment succeeded:", webhookResult.data);
        // TODO: Update payment record in database
        // TODO: Credit seller ledger (pending)
        break;

      case "payment.failed":
      case "payment.cancelled":
        console.log("Payment failed:", webhookResult.data);
        // TODO: Update payment record in database
        break;

      case "payment.refunded":
        console.log("Payment refunded:", webhookResult.data);
        // TODO: Debit seller ledger
        break;

      default:
        console.log("Unhandled event type:", webhookResult.event_type);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(400).json({
      message: "Webhook error",
    });
  }
});

/**
 * POST /payments/boleto
 * Generate a boleto for payment
 * Expires in 48 hours (configurable via BOLETO_EXPIRATION_HOURS)
 */
router.post(
  "/payments/boleto",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { amount, seller_id, order_id, description } = req.body;

      if (!amount || !seller_id) {
        return res.status(400).json({
          message: "Amount and seller_id are required",
        });
      }

      if (amount < 500) {
        return res.status(400).json({
          message: "Minimum amount for boleto is R$ 5.00",
        });
      }

      // Get PagSeguro provider
      const { PaymentProviderFactory } = await import("../services/providers/provider-factory");
      const provider = PaymentProviderFactory.getProvider();

      // Generate boleto
      const result = await provider.generateBoleto(amount, {
        seller_id,
        order_id,
        description: description || `Pedido #${order_id}`,
      });

      return res.json({
        boleto_code: result.boletoCode,
        boleto_url: result.boletoUrl,
        boleto_barcode: result.boletoBarcode,
        expires_at: result.expiresAt,
        message: `Boleto expires in ${process.env.BOLETO_EXPIRATION_HOURS || 48} hours`,
      });
    } catch (error: any) {
      console.error("Generate boleto error:", error);
      return res.status(500).json({
        message: "Failed to generate boleto",
      });
    }
  }
);

/**
 * GET /payments/:id/boleto
 * Get boleto details for a payment
 */
router.get(
  "/payments/:id/boleto",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Get payment from database
      const paymentService = req.scope.resolve("paymentService");
      const payment = await paymentService.retrieve(id);

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
        });
      }

      if (payment.payment_method !== "BOLETO") {
        return res.status(400).json({
          message: "This payment is not a boleto",
        });
      }

      const now = new Date();
      const isExpired =
        payment.boleto_expires_at && payment.boleto_expires_at < now;

      return res.json({
        id: payment.id,
        boleto_code: payment.boleto_code,
        boleto_url: payment.boleto_url,
        boleto_barcode: payment.boleto_barcode,
        expires_at: payment.boleto_expires_at,
        status: payment.status,
        is_expired: isExpired,
        amount: payment.amount,
      });
    } catch (error: any) {
      console.error("Get boleto error:", error);
      return res.status(500).json({
        message: "Failed to get boleto details",
      });
    }
  }
);

export default router;
