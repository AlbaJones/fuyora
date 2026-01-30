import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { Order, OrderStatus, Product, ProductStatus } from "../models/marketplace";

interface CreateOrderInput {
  buyer_id: string;
  product_id: string;
  delivery_info?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    notes?: string;
  };
}

class OrderService extends TransactionBaseService {
  protected orderRepository_: Repository<Order>;
  protected productRepository_: Repository<Product>;

  constructor(container: any) {
    super(container);
    this.orderRepository_ = container.orderRepository;
    this.productRepository_ = container.productRepository;
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const productRepo = manager.getRepository(Product);

      // Get product
      const product = await productRepo.findOne({
        where: { id: input.product_id },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (product.status !== "ACTIVE") {
        throw new Error("Product is not available for purchase");
      }

      // Prevent buying own product
      if (product.seller_id === input.buyer_id) {
        throw new Error("Cannot purchase your own product");
      }

      // Create order
      const order = orderRepo.create({
        buyer_id: input.buyer_id,
        seller_id: product.seller_id,
        product_id: product.id,
        amount: product.price,
        delivery_info: input.delivery_info || null,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await orderRepo.save(order);

      // Mark product as SOLD
      product.status = ProductStatus.SOLD;
      await productRepo.save(product);

      return savedOrder;
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order> {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getRepository(Order);

      const order = await orderRepo.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      order.status = status;

      if (status === OrderStatus.PAID) {
        order.paid_at = new Date();
      } else if (status === OrderStatus.DELIVERED) {
        order.delivered_at = new Date();
      } else if (status === OrderStatus.COMPLETED) {
        order.completed_at = new Date();
      } else if (status === OrderStatus.CANCELLED) {
        order.cancelled_at = new Date();
      }

      return await orderRepo.save(order);
    });
  }

  async linkPayment(orderId: string, paymentId: string): Promise<Order> {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getRepository(Order);

      const order = await orderRepo.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      order.payment_id = paymentId;
      order.status = OrderStatus.PAID;
      order.paid_at = new Date();

      return await orderRepo.save(order);
    });
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return await this.orderRepository_.findOne({
      where: { id: orderId },
    });
  }

  async getMyOrders(
    buyerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository_.findAndCount({
      where: { buyer_id: buyerId },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { orders, total };
  }

  async getMySales(
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ orders: Order[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository_.findAndCount({
      where: { seller_id: sellerId },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { orders, total };
  }

  async completeOrder(orderId: string, userId: string): Promise<Order> {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getRepository(Order);

      const order = await orderRepo.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Only buyer can mark as complete
      if (order.buyer_id !== userId) {
        throw new Error("Only buyer can complete order");
      }

      if (order.status !== OrderStatus.DELIVERED) {
        throw new Error("Order must be delivered before completing");
      }

      order.status = OrderStatus.COMPLETED;
      order.completed_at = new Date();

      return await orderRepo.save(order);
    });
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    return await this.atomicPhase_(async (manager) => {
      const orderRepo = manager.getRepository(Order);

      const order = await orderRepo.findOne({
        where: { id: orderId },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Only buyer or seller can cancel
      if (order.buyer_id !== userId && order.seller_id !== userId) {
        throw new Error("Permission denied");
      }

      // Cannot cancel paid orders
      if (order.status === OrderStatus.PAID || order.status === OrderStatus.DELIVERED) {
        throw new Error("Cannot cancel paid/delivered orders");
      }

      order.status = OrderStatus.CANCELLED;
      order.cancelled_at = new Date();

      return await orderRepo.save(order);
    });
  }
}

export default OrderService;
