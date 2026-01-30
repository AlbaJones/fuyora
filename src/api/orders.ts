import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { authLimiter } from "../middleware/rate-limit";

const router = Router();

// Create order
router.post(
  "/orders",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const { product_id, delivery_info } = req.body;

      if (!product_id) {
        return res.status(400).json({
          message: "Product ID is required",
        });
      }

      const orderService = req.scope.resolve("orderService");
      const order = await orderService.createOrder({
        buyer_id: userId,
        product_id,
        delivery_info,
      });

      return res.status(201).json(order);
    } catch (error: any) {
      console.error("Create order error:", error);

      if (
        error.message.includes("not found") ||
        error.message.includes("not available") ||
        error.message.includes("own product")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to create order",
      });
    }
  }
);

// Get order details
router.get(
  "/orders/:id",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId || (req.user as any).id;

      const orderService = req.scope.resolve("orderService");
      const order = await orderService.getOrder(id);

      if (!order) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      // Check permission
      if (order.buyer_id !== userId && order.seller_id !== userId) {
        return res.status(403).json({
          message: "Permission denied",
        });
      }

      return res.json(order);
    } catch (error: any) {
      console.error("Get order error:", error);
      return res.status(500).json({
        message: "Failed to get order",
      });
    }
  }
);

// Get my orders (as buyer)
router.get(
  "/buyer/orders",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const { page = "1", limit = "20" } = req.query;

      const orderService = req.scope.resolve("orderService");
      const result = await orderService.getMyOrders(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Get my orders error:", error);
      return res.status(500).json({
        message: "Failed to get orders",
      });
    }
  }
);

// Get my sales (as seller)
router.get(
  "/seller/orders",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const { page = "1", limit = "20" } = req.query;

      const orderService = req.scope.resolve("orderService");
      const result = await orderService.getMySales(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Get my sales error:", error);
      return res.status(500).json({
        message: "Failed to get sales",
      });
    }
  }
);

// Complete order (buyer only)
router.post(
  "/orders/:id/complete",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId || (req.user as any).id;

      const orderService = req.scope.resolve("orderService");
      const order = await orderService.completeOrder(id, userId);

      return res.json(order);
    } catch (error: any) {
      console.error("Complete order error:", error);

      if (
        error.message.includes("not found") ||
        error.message.includes("Only buyer") ||
        error.message.includes("must be delivered")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to complete order",
      });
    }
  }
);

// Cancel order
router.post(
  "/orders/:id/cancel",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId || (req.user as any).id;

      const orderService = req.scope.resolve("orderService");
      const order = await orderService.cancelOrder(id, userId);

      return res.json(order);
    } catch (error: any) {
      console.error("Cancel order error:", error);

      if (
        error.message.includes("not found") ||
        error.message.includes("Permission denied") ||
        error.message.includes("Cannot cancel")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to cancel order",
      });
    }
  }
);

export default router;
