import { Router } from "express";
import { EntityManager } from "typeorm";
import DisputeService from "../services/dispute";
import { DisputeType } from "../models/dispute";
import { ensureAuthenticated } from "../middleware/auth";
import { ensureAdmin } from "../middleware/admin";

const router = Router();

/**
 * POST /disputes
 * Create a dispute (buyer)
 */
router.post("/", ensureAuthenticated, async (req, res) => {
  try {
    const { order_id, type, description, buyer_evidence } = req.body;
    const buyer_id = req.user!.id;

    if (!order_id || !type || !description) {
      return res.status(400).json({
        error: "order_id, type, and description are required",
      });
    }

    if (!Object.values(DisputeType).includes(type)) {
      return res.status(400).json({
        error: `Invalid dispute type. Must be one of: ${Object.values(DisputeType).join(", ")}`,
      });
    }

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const dispute = await disputeService.createDispute({
      buyer_id,
      order_id,
      type,
      description,
      buyer_evidence,
    });

    res.status(201).json({
      dispute: {
        id: dispute.id,
        order_id: dispute.order_id,
        type: dispute.type,
        status: dispute.status,
        description: dispute.description,
        created_at: dispute.created_at,
      },
    });
  } catch (error: any) {
    console.error("Create dispute error:", error);
    res.status(400).json({ error: error.message || "Failed to create dispute" });
  }
});

/**
 * GET /disputes/:id
 * Get dispute details
 */
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user!.id;

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const dispute = await disputeService.getDispute(id);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    // Only buyer, seller, or admin can view
    const userService = req.scope.resolve("userService");
    const user = await userService.retrieve(user_id);
    const isAdmin = user.metadata?.role === "admin";

    if (
      dispute.buyer_id !== user_id &&
      dispute.seller_id !== user_id &&
      !isAdmin
    ) {
      return res.status(403).json({ error: "Not authorized to view this dispute" });
    }

    res.json({ dispute });
  } catch (error: any) {
    console.error("Get dispute error:", error);
    res.status(400).json({ error: error.message || "Failed to get dispute" });
  }
});

/**
 * GET /buyer/disputes
 * Get buyer's disputes
 */
router.get("/buyer/disputes", ensureAuthenticated, async (req, res) => {
  try {
    const buyer_id = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const result = await disputeService.getBuyerDisputes(buyer_id, limit, offset);

    res.json({
      disputes: result.disputes,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get buyer disputes error:", error);
    res.status(400).json({ error: error.message || "Failed to get disputes" });
  }
});

/**
 * GET /seller/disputes
 * Get seller's disputes
 */
router.get("/seller/disputes", ensureAuthenticated, async (req, res) => {
  try {
    const seller_id = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const result = await disputeService.getSellerDisputes(seller_id, limit, offset);

    res.json({
      disputes: result.disputes,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get seller disputes error:", error);
    res.status(400).json({ error: error.message || "Failed to get disputes" });
  }
});

/**
 * POST /disputes/:id/respond
 * Seller responds to dispute
 */
router.post("/:id/respond", ensureAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const seller_id = req.user!.id;
    const { seller_response, seller_evidence } = req.body;

    if (!seller_response) {
      return res.status(400).json({ error: "seller_response is required" });
    }

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const dispute = await disputeService.respondToDispute(id, {
      seller_id,
      seller_response,
      seller_evidence,
    });

    res.json({
      dispute: {
        id: dispute.id,
        status: dispute.status,
        seller_response: dispute.seller_response,
        seller_responded_at: dispute.seller_responded_at,
      },
    });
  } catch (error: any) {
    console.error("Respond to dispute error:", error);
    res.status(400).json({ error: error.message || "Failed to respond to dispute" });
  }
});

/**
 * POST /admin/disputes/:id/resolve
 * Admin resolves dispute
 */
router.post("/admin/disputes/:id/resolve", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const admin_id = req.user!.id;
    const { resolution, notes } = req.body;

    if (!resolution || !notes) {
      return res.status(400).json({
        error: "resolution (BUYER or SELLER) and notes are required",
      });
    }

    if (resolution !== "BUYER" && resolution !== "SELLER") {
      return res.status(400).json({
        error: "resolution must be either BUYER or SELLER",
      });
    }

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const dispute = await disputeService.resolveDispute(id, {
      admin_id,
      resolution,
      notes,
    });

    res.json({
      dispute: {
        id: dispute.id,
        status: dispute.status,
        resolution: dispute.resolution,
        resolved_by: dispute.resolved_by,
        resolved_at: dispute.resolved_at,
      },
    });
  } catch (error: any) {
    console.error("Resolve dispute error:", error);
    res.status(400).json({ error: error.message || "Failed to resolve dispute" });
  }
});

/**
 * GET /admin/disputes
 * Get all disputes (admin)
 */
router.get("/admin/disputes", ensureAdmin, async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const manager = req.scope.resolve("manager") as EntityManager;
    const disputeService = new DisputeService({
      manager,
      disputeRepository: manager.getRepository("Dispute"),
      orderRepository: manager.getRepository("Order"),
    });

    const result = await disputeService.getAllDisputes(status as any, limit, offset);

    res.json({
      disputes: result.disputes,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error("Get all disputes error:", error);
    res.status(400).json({ error: error.message || "Failed to get disputes" });
  }
});

export default router;
