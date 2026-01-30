import { EntityManager } from "typeorm";
import {
  SellerBalance,
  Transaction,
  TransactionType,
  TransactionStatus,
  Withdrawal,
  WithdrawalStatus,
} from "../models/ledger";

export class LedgerService {
  private manager: EntityManager;

  constructor(manager: EntityManager) {
    this.manager = manager;
  }

  /**
   * Get or create seller balance
   */
  async getOrCreateBalance(sellerId: string): Promise<SellerBalance> {
    let balance = await this.manager.findOne(SellerBalance, {
      where: { seller_id: sellerId },
    });

    if (!balance) {
      balance = this.manager.create(SellerBalance, {
        seller_id: sellerId,
        available_balance: 0,
        pending_balance: 0,
        held_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
      });
      await this.manager.save(balance);
    }

    return balance;
  }

  /**
   * Get seller balance
   */
  async getBalance(sellerId: string): Promise<SellerBalance> {
    return this.getOrCreateBalance(sellerId);
  }

  /**
   * Credit sale to pending balance (when order is paid)
   * Sets pending_release_at to 72 hours from now (temporal release)
   */
  async creditSale(
    sellerId: string,
    amount: number,
    orderId: string,
    description?: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    // Calculate release time (72 hours by default)
    const releaseHours = parseInt(process.env.BALANCE_RELEASE_HOURS || "72");
    const pendingReleaseAt = new Date(Date.now() + releaseHours * 60 * 60 * 1000);

    // Update balance
    balance.pending_balance = Number(balance.pending_balance) + amount;
    balance.total_earned = Number(balance.total_earned) + amount;
    await this.manager.save(balance);

    // Create transaction with pending_release_at
    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.SALE,
      amount: amount,
      balance_after: Number(balance.pending_balance) + Number(balance.available_balance),
      reference_id: orderId,
      reference_type: "order",
      description: description || `Sale credit for order ${orderId}`,
      status: TransactionStatus.PENDING, // PENDING until auto-released
      metadata: {
        pending_release_at: pendingReleaseAt.toISOString(),
        order_id: orderId,
      },
    });

    return this.manager.save(transaction);
  }

  /**
   * Move from pending to available (temporal release after 72h)
   * Called by scheduled job, NOT by order completion
   */
  async makeSaleAvailable(
    sellerId: string,
    amount: number,
    orderId: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    // Update balance
    balance.pending_balance = Number(balance.pending_balance) - amount;
    balance.available_balance = Number(balance.available_balance) + amount;
    await this.manager.save(balance);

    // Create transaction
    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.SALE_AVAILABLE,
      amount: amount,
      balance_after: Number(balance.available_balance),
      reference_id: orderId,
      reference_type: "order",
      description: `Sale available for order ${orderId} (auto-released after holding period)`,
      status: TransactionStatus.COMPLETED,
    });

    return this.manager.save(transaction);
  }

  /**
   * Debit for withdrawal
   */
  async debitWithdrawal(
    sellerId: string,
    amount: number,
    withdrawalId: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    if (Number(balance.available_balance) < amount) {
      throw new Error("Insufficient available balance");
    }

    // Update balance
    balance.available_balance = Number(balance.available_balance) - amount;
    balance.total_withdrawn = Number(balance.total_withdrawn) + amount;
    await this.manager.save(balance);

    // Create transaction
    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.WITHDRAWAL,
      amount: -amount, // Negative for debit
      balance_after: Number(balance.available_balance),
      reference_id: withdrawalId,
      reference_type: "withdrawal",
      description: `Withdrawal ${withdrawalId}`,
      status: TransactionStatus.COMPLETED,
    });

    return this.manager.save(transaction);
  }

  /**
   * Process refund (debit from pending or available)
   */
  async processRefund(
    sellerId: string,
    amount: number,
    orderId: string,
    description?: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    // Try to debit from pending first, then available
    if (Number(balance.pending_balance) >= amount) {
      balance.pending_balance = Number(balance.pending_balance) - amount;
    } else if (Number(balance.available_balance) >= amount) {
      balance.available_balance = Number(balance.available_balance) - amount;
    } else {
      // Not enough balance - need to go negative (platform covers)
      balance.available_balance = Number(balance.available_balance) - amount;
    }

    balance.total_earned = Number(balance.total_earned) - amount;
    await this.manager.save(balance);

    // Create transaction
    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.REFUND,
      amount: -amount,
      balance_after: Number(balance.available_balance) + Number(balance.pending_balance),
      reference_id: orderId,
      reference_type: "order",
      description: description || `Refund for order ${orderId}`,
      status: TransactionStatus.COMPLETED,
    });

    return this.manager.save(transaction);
  }

  /**
   * Hold funds (move from available to held)
   */
  async holdFunds(
    sellerId: string,
    amount: number,
    referenceId: string,
    reason: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    if (Number(balance.available_balance) < amount) {
      throw new Error("Insufficient available balance to hold");
    }

    balance.available_balance = Number(balance.available_balance) - amount;
    balance.held_balance = Number(balance.held_balance) + amount;
    await this.manager.save(balance);

    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.HOLD,
      amount: -amount,
      balance_after: Number(balance.available_balance),
      reference_id: referenceId,
      reference_type: "dispute",
      description: `Funds held: ${reason}`,
      status: TransactionStatus.COMPLETED,
    });

    return this.manager.save(transaction);
  }

  /**
   * Release held funds (move from held to available)
   */
  async releaseFunds(
    sellerId: string,
    amount: number,
    referenceId: string,
    reason: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    if (Number(balance.held_balance) < amount) {
      throw new Error("Insufficient held balance to release");
    }

    balance.held_balance = Number(balance.held_balance) - amount;
    balance.available_balance = Number(balance.available_balance) + amount;
    await this.manager.save(balance);

    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.RELEASE,
      amount: amount,
      balance_after: Number(balance.available_balance),
      reference_id: referenceId,
      reference_type: "dispute",
      description: `Funds released: ${reason}`,
      status: TransactionStatus.COMPLETED,
    });

    return this.manager.save(transaction);
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    sellerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const [transactions, total] = await this.manager.findAndCount(Transaction, {
      where: { seller_id: sellerId },
      order: { created_at: "DESC" },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  /**
   * Manual adjustment (admin only)
   */
  async manualAdjustment(
    sellerId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<Transaction> {
    const balance = await this.getOrCreateBalance(sellerId);

    // Positive = credit, negative = debit
    balance.available_balance = Number(balance.available_balance) + amount;
    if (amount > 0) {
      balance.total_earned = Number(balance.total_earned) + amount;
    }
    await this.manager.save(balance);

    const transaction = this.manager.create(Transaction, {
      seller_id: sellerId,
      type: TransactionType.ADJUSTMENT,
      amount: amount,
      balance_after: Number(balance.available_balance),
      reference_id: adminId,
      reference_type: "admin",
      description: `Manual adjustment by admin: ${reason}`,
      status: TransactionStatus.COMPLETED,
      metadata: { admin_id: adminId, reason },
    });

    return this.manager.save(transaction);
  }
}
