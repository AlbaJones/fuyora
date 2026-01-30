import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";
import { getStripeService } from "../services/stripe";

const router = Router();

// Create/Connect Stripe account for seller
router.post(
  "/seller/stripe-account",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const { email, country } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      // TODO: Check if user has approved KYC
      // const kycService = req.scope.resolve("kycService");
      // const kyc = await kycService.getMine(userId);
      // if (!kyc || kyc.status !== "APROVADO") {
      //   return res.status(403).json({
      //     message: "KYC must be approved before creating seller account",
      //   });
      // }

      const stripeService = getStripeService();
      const account = await stripeService.createConnectedAccount(
        userId,
        email,
        country || "BR"
      );

      // Create account link for onboarding
      const refreshUrl = `${process.env.FRONTEND_URL}/seller/stripe/refresh`;
      const returnUrl = `${process.env.FRONTEND_URL}/seller/stripe/return`;

      const accountLink = await stripeService.createAccountLink(
        account.id,
        refreshUrl,
        returnUrl
      );

      return res.json({
        account_id: account.id,
        onboarding_url: accountLink.url,
        message: "Stripe account created. Complete onboarding to start selling.",
      });
    } catch (error: any) {
      console.error("Create Stripe account error:", error);
      return res.status(500).json({
        message: "Failed to create Stripe account",
      });
    }
  }
);

// Get seller Stripe account status
router.get(
  "/seller/stripe-account",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;

      // TODO: Fetch from database
      // const sellerAccountRepo = req.scope.resolve("sellerAccountRepository");
      // const sellerAccount = await sellerAccountRepo.findOne({ where: { user_id: userId } });

      // Placeholder response
      return res.json({
        message: "Seller account status endpoint - implementation pending",
        user_id: userId,
      });
    } catch (error: any) {
      console.error("Get Stripe account error:", error);
      return res.status(500).json({
        message: "Failed to get Stripe account",
      });
    }
  }
);

// Create payment intent
router.post(
  "/payments/create-intent",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { amount, currency, seller_id, metadata } = req.body;

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

      // TODO: Fetch seller Stripe account ID from database
      // const sellerAccountRepo = req.scope.resolve("sellerAccountRepository");
      // const sellerAccount = await sellerAccountRepo.findOne({ where: { user_id: seller_id } });

      // Placeholder - use test account
      const sellerStripeAccountId = process.env.TEST_SELLER_ACCOUNT_ID || "";

      if (!sellerStripeAccountId) {
        return res.status(400).json({
          message: "Seller has not connected Stripe account",
        });
      }

      const stripeService = getStripeService();
      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        currency || "brl",
        sellerStripeAccountId,
        metadata
      );

      return res.json({
        payment_intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      });
    } catch (error: any) {
      console.error("Create payment intent error:", error);
      return res.status(500).json({
        message: "Failed to create payment intent",
      });
    }
  }
);

// Stripe webhook handler
router.post(
  "/webhooks/stripe",
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["stripe-signature"] as string;

      if (!signature) {
        return res.status(400).json({
          message: "Missing stripe-signature header",
        });
      }

      const stripeService = getStripeService();
      const event = stripeService.constructWebhookEvent(
        req.body,
        signature
      );

      console.log("Received Stripe webhook:", event.type);

      // Handle different event types
      switch (event.type) {
        case "payment_intent.succeeded":
          console.log("Payment succeeded:", event.data.object);
          // TODO: Update payment record in database
          break;

        case "payment_intent.payment_failed":
          console.log("Payment failed:", event.data.object);
          // TODO: Update payment record in database
          break;

        case "account.updated":
          console.log("Account updated:", event.data.object);
          // TODO: Update seller account in database
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
  }
);

export default router;
