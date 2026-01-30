import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { Review, ReviewType, Order } from "../models/marketplace";

interface CreateReviewInput {
  order_id: string;
  reviewer_id: string;
  rating: number;
  comment?: string;
}

class ReviewService extends TransactionBaseService {
  protected reviewRepository_: Repository<Review>;
  protected orderRepository_: Repository<Order>;

  constructor(container: any) {
    super(container);
    this.reviewRepository_ = container.reviewRepository;
    this.orderRepository_ = container.orderRepository;
  }

  async createReview(input: CreateReviewInput): Promise<Review> {
    return await this.atomicPhase_(async (manager) => {
      const reviewRepo = manager.getRepository(Review);
      const orderRepo = manager.getRepository(Order);

      // Validate rating
      if (input.rating < 1 || input.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Get order
      const order = await orderRepo.findOne({
        where: { id: input.order_id },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Only allow reviews after order is completed
      if (order.status !== "COMPLETED") {
        throw new Error("Can only review completed orders");
      }

      // Check if user is buyer or seller
      let reviewType: ReviewType;
      let revieweeId: string;

      if (order.buyer_id === input.reviewer_id) {
        reviewType = ReviewType.BUYER_TO_SELLER;
        revieweeId = order.seller_id;
      } else if (order.seller_id === input.reviewer_id) {
        reviewType = ReviewType.SELLER_TO_BUYER;
        revieweeId = order.buyer_id;
      } else {
        throw new Error("You are not part of this order");
      }

      // Check if review already exists
      const existingReview = await reviewRepo.findOne({
        where: {
          order_id: input.order_id,
          reviewer_id: input.reviewer_id,
        },
      });

      if (existingReview) {
        throw new Error("You have already reviewed this order");
      }

      // Create review
      const review = reviewRepo.create({
        order_id: input.order_id,
        reviewer_id: input.reviewer_id,
        reviewee_id: revieweeId,
        rating: input.rating,
        comment: input.comment || null,
        type: reviewType,
      });

      return await reviewRepo.save(review);
    });
  }

  async getReviewsForUser(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ reviews: Review[]; total: number }> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository_.findAndCount({
      where: { reviewee_id: userId },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { reviews, total };
  }

  async getAverageRating(userId: string): Promise<{
    average_rating: number;
    total_reviews: number;
    rating_breakdown: {
      "1": number;
      "2": number;
      "3": number;
      "4": number;
      "5": number;
    };
  }> {
    const reviews = await this.reviewRepository_.find({
      where: { reviewee_id: userId },
      select: ["rating"],
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: {
          "1": 0,
          "2": 0,
          "3": 0,
          "4": 0,
          "5": 0,
        },
      };
    }

    // Calculate average
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / totalReviews;

    // Calculate breakdown
    const breakdown = reviews.reduce(
      (acc, review) => {
        const key = String(review.rating) as keyof typeof acc;
        acc[key]++;
        return acc;
      },
      { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
    );

    return {
      average_rating: Math.round(average * 100) / 100,
      total_reviews: totalReviews,
      rating_breakdown: breakdown,
    };
  }
}

export default ReviewService;
