import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";
import { getStripeService } from "../services/stripe";
import { LedgerService } from "../services/ledger";

const router = Router();

/**
 * POST /payments/create-intent
 * Create a payment intent (platform account - NO Stripe Connect)
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

      // Payment goes to PLATFORM account, not seller
      const stripeService = getStripeService();
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency || "brl",
        {
          seller_id,
          order_id,
          ...metadata,
        }
      );

      return res.json({
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
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
 * POST /webhooks/stripe
 * Stripe webhook handler
 */
router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    if (!signature) {
      return res.status(400).json({
        message: "Missing stripe-signature header",
      });
    }

    const stripeService = getStripeService();
    const event = stripeService.constructWebhookEvent(req.body, signature);

    console.log("Received Stripe webhook:", event.type);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("Payment succeeded:", event.data.object);
        // TODO: Update payment record in database
        // TODO: Credit seller ledger (pending)
        break;

      case "payment_intent.payment_failed":
        console.log("Payment failed:", event.data.object);
        // TODO: Update payment record in database
        break;

      case "charge.refunded":
        console.log("Charge refunded:", event.data.object);
        // TODO: Debit seller ledger
        break;

      default:
        console.log("Unhandled event type:", event.type);
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return res.status(400).json({
      message: "Webhook error",
    });
  }
});

export default router;
