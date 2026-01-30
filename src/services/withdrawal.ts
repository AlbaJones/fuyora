import { EntityManager } from "typeorm";
import { Withdrawal, WithdrawalStatus } from "../models/ledger";
import { LedgerService } from "./ledger";
import { getStripeService } from "./stripe";

export class WithdrawalService {
  private manager: EntityManager;
  private ledgerService: LedgerService;

  constructor(manager: EntityManager) {
    this.manager = manager;
    this.ledgerService = new LedgerService(manager);
  }

  /**
   * Request a withdrawal (seller initiated)
   */
  async requestWithdrawal(
    sellerId: string,
    amount: number,
    bankInfo: {
      account_type: "PIX" | "BANK_TRANSFER";
      pix_key?: string;
      bank_code?: string;
      account_number?: string;
      account_holder_name?: string;
      account_holder_document?: string;
    }
  ): Promise<Withdrawal> {
    // Validate amount
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }

    // Check minimum withdrawal (e.g., R$ 10)
    const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || "10");
    if (amount < minWithdrawal) {
      throw new Error(`Minimum withdrawal amount is ${minWithdrawal}`);
    }

    // Check available balance
    const balance = await this.ledgerService.getBalance(sellerId);
    if (Number(balance.available_balance) < amount) {
      throw new Error(
        `Insufficient balance. Available: ${balance.available_balance}, Requested: ${amount}`
      );
    }

    // Validate bank info
    if (bankInfo.account_type === "PIX" && !bankInfo.pix_key) {
      throw new Error("PIX key is required for PIX withdrawals");
    }

    if (
      bankInfo.account_type === "BANK_TRANSFER" &&
      (!bankInfo.bank_code || !bankInfo.account_number)
    ) {
      throw new Error("Bank code and account number required for bank transfers");
    }

    // Create withdrawal request
    const withdrawal = this.manager.create(Withdrawal, {
      seller_id: sellerId,
      amount,
      status: WithdrawalStatus.PENDING,
      bank_info: bankInfo,
      requested_at: new Date(),
    });

    await this.manager.save(withdrawal);

    console.log(`Withdrawal requested: ${withdrawal.id} for seller ${sellerId}`);

    return withdrawal;
  }

  /**
   * Approve withdrawal (admin)
   */
  async approveWithdrawal(
    withdrawalId: string,
    adminId: string
  ): Promise<Withdrawal> {
    const withdrawal = await this.manager.findOne(Withdrawal, {
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error(`Cannot approve withdrawal in status: ${withdrawal.status}`);
    }

    // Re-check balance
    const balance = await this.ledgerService.getBalance(withdrawal.seller_id);
    if (Number(balance.available_balance) < withdrawal.amount) {
      throw new Error("Insufficient balance");
    }

    withdrawal.status = WithdrawalStatus.APPROVED;
    withdrawal.approved_by = adminId;
    withdrawal.approved_at = new Date();

    await this.manager.save(withdrawal);

    console.log(`Withdrawal approved: ${withdrawalId} by admin ${adminId}`);

    return withdrawal;
  }

  /**
   * Process withdrawal (admin - triggers Stripe transfer)
   */
  async processWithdrawal(
    withdrawalId: string,
    adminId: string
  ): Promise<Withdrawal> {
    const withdrawal = await this.manager.findOne(Withdrawal, {
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== WithdrawalStatus.APPROVED) {
      throw new Error(`Cannot process withdrawal in status: ${withdrawal.status}`);
    }

    withdrawal.status = WithdrawalStatus.PROCESSING;
    withdrawal.processed_by = adminId;
    withdrawal.processed_at = new Date();
    await this.manager.save(withdrawal);

    try {
      // Debit from ledger first
      await this.ledgerService.debitWithdrawal(
        withdrawal.seller_id,
        withdrawal.amount,
        withdrawal.id
      );

      // Process via Stripe
      const stripeService = getStripeService();
      const transfer = await stripeService.createTransfer(
        withdrawal.amount,
        withdrawal.bank_info,
        {
          withdrawal_id: withdrawal.id,
          seller_id: withdrawal.seller_id,
        }
      );

      // Update withdrawal with Stripe info
      withdrawal.status = WithdrawalStatus.COMPLETED;
      withdrawal.stripe_transfer_id = transfer.id;
      withdrawal.completed_at = new Date();
      await this.manager.save(withdrawal);

      console.log(`Withdrawal processed successfully: ${withdrawalId}`);

      return withdrawal;
    } catch (error: any) {
      // Failed - mark as failed but don't restore balance yet (admin decision)
      withdrawal.status = WithdrawalStatus.FAILED;
      withdrawal.failure_reason = error.message;
      await this.manager.save(withdrawal);

      console.error(`Withdrawal processing failed: ${withdrawalId}`, error);
      throw error;
    }
  }

  /**
   * Cancel withdrawal (admin or seller - only if PENDING)
   */
  async cancelWithdrawal(
    withdrawalId: string,
    reason: string,
    userId: string
  ): Promise<Withdrawal> {
    const withdrawal = await this.manager.findOne(Withdrawal, {
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new Error("Withdrawal not found");
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new Error(`Cannot cancel withdrawal in status: ${withdrawal.status}`);
    }

    withdrawal.status = WithdrawalStatus.CANCELLED;
    withdrawal.rejection_reason = reason;
    await this.manager.save(withdrawal);

    console.log(`Withdrawal cancelled: ${withdrawalId} by ${userId}`);

    return withdrawal;
  }

  /**
   * Get seller's withdrawals
   */
  async getSellerWithdrawals(
    sellerId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ withdrawals: Withdrawal[]; total: number }> {
    const [withdrawals, total] = await this.manager.findAndCount(Withdrawal, {
      where: { seller_id: sellerId },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return { withdrawals, total };
  }

  /**
   * Get all withdrawals (admin)
   */
  async getAllWithdrawals(
    status?: WithdrawalStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ withdrawals: Withdrawal[]; total: number }> {
    const where = status ? { status } : {};

    const [withdrawals, total] = await this.manager.findAndCount(Withdrawal, {
      where,
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return { withdrawals, total };
  }

  /**
   * Get withdrawal by ID
   */
  async getWithdrawal(withdrawalId: string): Promise<Withdrawal | null> {
    return this.manager.findOne(Withdrawal, {
      where: { id: withdrawalId },
    });
  }

  /**
   * Get pending withdrawals count
   */
  async getPendingCount(): Promise<number> {
    return this.manager.count(Withdrawal, {
      where: { status: WithdrawalStatus.PENDING },
    });
  }
}
