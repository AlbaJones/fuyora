import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { authLimiter, generalLimiter } from "../middleware/rate-limit";

const router = Router();

// Create review (authenticated users)
router.post(
  "/reviews",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const { order_id, rating, comment } = req.body;

      if (!order_id || !rating) {
        return res.status(400).json({
          message: "Order ID and rating are required",
        });
      }

      const reviewService = req.scope.resolve("reviewService");
      const review = await reviewService.createReview({
        order_id,
        reviewer_id: userId,
        rating: parseInt(rating),
        comment,
      });

      return res.status(201).json(review);
    } catch (error: any) {
      console.error("Create review error:", error);

      if (
        error.message.includes("Rating must") ||
        error.message.includes("not found") ||
        error.message.includes("completed") ||
        error.message.includes("not part") ||
        error.message.includes("already reviewed")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to create review",
      });
    }
  }
);

// Get reviews for a user (public)
router.get(
  "/users/:id/reviews",
  generalLimiter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { page = "1", limit = "20" } = req.query;

      const reviewService = req.scope.resolve("reviewService");
      const result = await reviewService.getReviewsForUser(
        id,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Get reviews error:", error);
      return res.status(500).json({
        message: "Failed to get reviews",
      });
    }
  }
);

// Get average rating for a user (public)
router.get(
  "/users/:id/rating",
  generalLimiter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const reviewService = req.scope.resolve("reviewService");
      const rating = await reviewService.getAverageRating(id);

      return res.json(rating);
    } catch (error: any) {
      console.error("Get rating error:", error);
      return res.status(500).json({
        message: "Failed to get rating",
      });
    }
  }
);

export default router;
