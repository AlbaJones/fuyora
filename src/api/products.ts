import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { authLimiter, generalLimiter } from "../middleware/rate-limit";

const router = Router();

// Create product (authenticated sellers only)
router.post(
  "/products",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const {
        title,
        description,
        price,
        category,
        images,
        digital_product,
        file_url,
        metadata,
      } = req.body;

      if (!title || !description || !price || !category) {
        return res.status(400).json({
          message: "Title, description, price, and category are required",
        });
      }

      if (price <= 0) {
        return res.status(400).json({
          message: "Price must be greater than 0",
        });
      }

      const productService = req.scope.resolve("productService");
      const product = await productService.createProduct({
        seller_id: userId,
        title,
        description,
        price,
        category,
        images,
        digital_product,
        file_url,
        metadata,
      });

      return res.status(201).json(product);
    } catch (error: any) {
      console.error("Create product error:", error);

      if (error.message.includes("KYC")) {
        return res.status(403).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to create product",
      });
    }
  }
);

// List products (public)
router.get(
  "/products",
  generalLimiter,
  async (req: Request, res: Response) => {
    try {
      const {
        category,
        seller_id,
        status,
        search,
        page = "1",
        limit = "20",
      } = req.query;

      const productService = req.scope.resolve("productService");
      const result = await productService.listProducts(
        {
          category: category as string,
          seller_id: seller_id as string,
          status: status as any,
          search: search as string,
        },
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.json(result);
    } catch (error: any) {
      console.error("List products error:", error);
      return res.status(500).json({
        message: "Failed to list products",
      });
    }
  }
);

// Get product details (public)
router.get(
  "/products/:id",
  generalLimiter,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const productService = req.scope.resolve("productService");
      const product = await productService.getProduct(id);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      return res.json(product);
    } catch (error: any) {
      console.error("Get product error:", error);
      return res.status(500).json({
        message: "Failed to get product",
      });
    }
  }
);

// Update product (seller only)
router.put(
  "/products/:id",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId || (req.user as any).id;
      const updateData = req.body;

      const productService = req.scope.resolve("productService");
      const product = await productService.updateProduct(
        id,
        userId,
        updateData
      );

      return res.json(product);
    } catch (error: any) {
      console.error("Update product error:", error);

      if (error.message.includes("not found") || error.message.includes("permission")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to update product",
      });
    }
  }
);

// Delete product (seller only)
router.delete(
  "/products/:id",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.userId || (req.user as any).id;

      const productService = req.scope.resolve("productService");
      await productService.deleteProduct(id, userId);

      return res.json({
        message: "Product deleted successfully",
      });
    } catch (error: any) {
      console.error("Delete product error:", error);

      if (error.message.includes("not found") || error.message.includes("permission")) {
        return res.status(404).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message: "Failed to delete product",
      });
    }
  }
);

// Get my products (seller)
router.get(
  "/seller/products",
  authLimiter,
  ensureAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId || (req.user as any).id;
      const { page = "1", limit = "20" } = req.query;

      const productService = req.scope.resolve("productService");
      const result = await productService.getMyProducts(
        userId,
        parseInt(page as string),
        parseInt(limit as string)
      );

      return res.json(result);
    } catch (error: any) {
      console.error("Get my products error:", error);
      return res.status(500).json({
        message: "Failed to get products",
      });
    }
  }
);

export default router;
