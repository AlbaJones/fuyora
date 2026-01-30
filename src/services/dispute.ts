import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { Dispute, DisputeStatus, DisputeType } from "../models/dispute";
import { Order, OrderStatus } from "../models/marketplace";

interface CreateDisputeInput {
  buyer_id: string;
  order_id: string;
  type: DisputeType;
  description: string;
  buyer_evidence?: {
    images?: string[];
    documents?: string[];
    notes?: string;
  };
}

interface RespondToDisputeInput {
  seller_id: string;
  seller_response: string;
  seller_evidence?: {
    images?: string[];
    documents?: string[];
    notes?: string;
    tracking_number?: string;
  };
}

interface ResolveDisputeInput {
  admin_id: string;
  resolution: "BUYER" | "SELLER";
  notes: string;
}

class DisputeService extends TransactionBaseService {
  protected disputeRepository_: Repository<Dispute>;
  protected orderRepository_: Repository<Order>;

  constructor(container: any) {
    super(container);
    this.disputeRepository_ = container.disputeRepository;
    this.orderRepository_ = container.orderRepository;
  }

  /**
   * Create a dispute (buyer initiated)
   */
  async createDispute(input: CreateDisputeInput): Promise<Dispute> {
    return await this.atomicPhase_(async (manager) => {
      const disputeRepo = manager.getRepository(Dispute);
      const orderRepo = manager.getRepository(Order);

      // Get order
      const order = await orderRepo.findOne({
        where: { id: input.order_id },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Verify buyer owns the order
      if (order.buyer_id !== input.buyer_id) {
        throw new Error("You can only create disputes for your own orders");
      }

      // Check if order is in a state where disputes are allowed
      if (
        order.status !== OrderStatus.PAID &&
        order.status !== OrderStatus.DELIVERED &&
        order.status !== OrderStatus.COMPLETED
      ) {
        throw new Error("Cannot create dispute for order in this status");
      }

      // Check dispute window (e.g., 30 days after delivery/completion)
      const disputeWindowDays = parseInt(
        process.env.DISPUTE_WINDOW_DAYS || "30"
      );
      const referenceDate = order.completed_at || order.delivered_at || order.paid_at;
      if (!referenceDate) {
        throw new Error("Order not in valid state for dispute");
      }

      const daysSince =
        (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > disputeWindowDays) {
        throw new Error(
          `Dispute window expired. You can only create disputes within ${disputeWindowDays} days.`
        );
      }

      // Check if dispute already exists
      const existingDispute = await disputeRepo.findOne({
        where: {
          order_id: input.order_id,
        },
      });

      if (existingDispute) {
        throw new Error("Dispute already exists for this order");
      }

      // Create dispute
      const dispute = disputeRepo.create({
        buyer_id: input.buyer_id,
        seller_id: order.seller_id,
        order_id: input.order_id,
        type: input.type,
        description: input.description,
        buyer_evidence: input.buyer_evidence || null,
        status: DisputeStatus.OPEN,
      });

      const savedDispute = await disputeRepo.save(dispute);

      // Update order status to DISPUTED
      order.status = OrderStatus.DISPUTED;
      await orderRepo.save(order);

      console.log(`Dispute created: ${savedDispute.id} for order ${input.order_id}`);

      return savedDispute;
    });
  }

  /**
   * Seller responds to dispute
   */
  async respondToDispute(
    disputeId: string,
    input: RespondToDisputeInput
  ): Promise<Dispute> {
    return await this.atomicPhase_(async (manager) => {
      const disputeRepo = manager.getRepository(Dispute);

      const dispute = await disputeRepo.findOne({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new Error("Dispute not found");
      }

      // Verify seller owns the dispute
      if (dispute.seller_id !== input.seller_id) {
        throw new Error("You can only respond to your own disputes");
      }

      if (dispute.status !== DisputeStatus.OPEN) {
        throw new Error("Can only respond to OPEN disputes");
      }

      // Update dispute
      dispute.seller_response = input.seller_response;
      dispute.seller_evidence = input.seller_evidence || null;
      dispute.seller_responded_at = new Date();
      dispute.status = DisputeStatus.UNDER_REVIEW;

      return await disputeRepo.save(dispute);
    });
  }

  /**
   * Admin resolves dispute
   */
  async resolveDispute(
    disputeId: string,
    input: ResolveDisputeInput
  ): Promise<Dispute> {
    return await this.atomicPhase_(async (manager) => {
      const disputeRepo = manager.getRepository(Dispute);

      const dispute = await disputeRepo.findOne({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new Error("Dispute not found");
      }

      if (dispute.status === DisputeStatus.CLOSED) {
        throw new Error("Dispute already closed");
      }

      // Update dispute
      dispute.status =
        input.resolution === "BUYER"
          ? DisputeStatus.RESOLVED_BUYER
          : DisputeStatus.RESOLVED_SELLER;
      dispute.resolution = input.notes;
      dispute.resolved_by = input.admin_id;
      dispute.resolved_at = new Date();

      const savedDispute = await disputeRepo.save(dispute);

      console.log(
        `Dispute resolved: ${disputeId} in favor of ${input.resolution}`
      );

      return savedDispute;
    });
  }

  /**
   * Close dispute (admin)
   */
  async closeDispute(disputeId: string, adminId: string): Promise<Dispute> {
    return await this.atomicPhase_(async (manager) => {
      const disputeRepo = manager.getRepository(Dispute);

      const dispute = await disputeRepo.findOne({
        where: { id: disputeId },
      });

      if (!dispute) {
        throw new Error("Dispute not found");
      }

      dispute.status = DisputeStatus.CLOSED;
      if (!dispute.resolved_by) {
        dispute.resolved_by = adminId;
        dispute.resolved_at = new Date();
      }

      return await disputeRepo.save(dispute);
    });
  }

  /**
   * Get dispute by ID
   */
  async getDispute(disputeId: string): Promise<Dispute | null> {
    return await this.disputeRepository_.findOne({
      where: { id: disputeId },
    });
  }

  /**
   * Get buyer's disputes
   */
  async getBuyerDisputes(
    buyerId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ disputes: Dispute[]; total: number }> {
    const [disputes, total] = await this.disputeRepository_.findAndCount({
      where: { buyer_id: buyerId },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return { disputes, total };
  }

  /**
   * Get seller's disputes
   */
  async getSellerDisputes(
    sellerId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ disputes: Dispute[]; total: number }> {
    const [disputes, total] = await this.disputeRepository_.findAndCount({
      where: { seller_id: sellerId },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return { disputes, total };
  }

  /**
   * Get all disputes (admin)
   */
  async getAllDisputes(
    status?: DisputeStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ disputes: Dispute[]; total: number }> {
    const where = status ? { status } : {};

    const [disputes, total] = await this.disputeRepository_.findAndCount({
      where,
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return { disputes, total };
  }

  /**
   * Check if seller has active disputes
   * Used to block withdrawals
   */
  async hasActiveDisputes(sellerId: string): Promise<boolean> {
    const count = await this.disputeRepository_.count({
      where: {
        seller_id: sellerId,
        status: DisputeStatus.OPEN,
      },
    });

    return count > 0;
  }

  /**
   * Get active disputes count for seller
   */
  async getActiveDisputesCount(sellerId: string): Promise<number> {
    return await this.disputeRepository_.count({
      where: {
        seller_id: sellerId,
        status: DisputeStatus.OPEN,
      },
    });
  }
}

export default DisputeService;
