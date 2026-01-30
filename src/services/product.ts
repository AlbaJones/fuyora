import { TransactionBaseService } from "@medusajs/medusa";
import { Repository } from "typeorm";
import { Product, ProductStatus, ProductReviewStatus } from "../models/marketplace";

interface CreateProductInput {
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images?: string[];
  digital_product?: boolean;
  file_url?: string;
  metadata?: Record<string, any>;
}

interface UpdateProductInput {
  title?: string;
  description?: string;
  price?: number;
  category?: string;
  status?: ProductStatus;
  images?: string[];
  file_url?: string;
  metadata?: Record<string, any>;
}

class ProductService extends TransactionBaseService {
  protected productRepository_: Repository<Product>;

  constructor(container: any) {
    super(container);
    this.productRepository_ = container.productRepository;
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getRepository(Product);

      // TODO: Verify seller has approved KYC
      // const kycService = this.container_.resolve("kycService");
      // const kyc = await kycService.getMine(input.seller_id);
      // if (!kyc || kyc.status !== "APROVADO") {
      //   throw new Error("KYC must be approved before creating products");
      // }

      const product = productRepo.create({
        seller_id: input.seller_id,
        title: input.title,
        description: input.description,
        price: input.price,
        category: input.category,
        images: input.images || null,
        digital_product: input.digital_product || false,
        file_url: input.file_url || null,
        metadata: input.metadata || null,
        status: ProductStatus.DRAFT,
      });

      return await productRepo.save(product);
    });
  }

  async updateProduct(
    productId: string,
    sellerId: string,
    input: UpdateProductInput
  ): Promise<Product> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getRepository(Product);

      const product = await productRepo.findOne({
        where: { id: productId, seller_id: sellerId },
      });

      if (!product) {
        throw new Error("Product not found or you don't have permission");
      }

      Object.assign(product, input);

      // When product is updated, it goes back to pending review
      product.review_status = ProductReviewStatus.PENDING;
      product.rejection_reason = null;
      product.reviewed_by = null;
      product.reviewed_at = null;

      return await productRepo.save(product);
    });
  }

  async deleteProduct(productId: string, sellerId: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getRepository(Product);

      const product = await productRepo.findOne({
        where: { id: productId, seller_id: sellerId },
      });

      if (!product) {
        throw new Error("Product not found or you don't have permission");
      }

      product.status = ProductStatus.INACTIVE;
      await productRepo.save(product);
    });
  }

  async getProduct(productId: string): Promise<Product | null> {
    return await this.productRepository_.findOne({
      where: { id: productId },
    });
  }

  async listProducts(
    filters: {
      category?: string;
      seller_id?: string;
      status?: ProductStatus;
      search?: string;
    } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: Product[]; total: number }> {
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.seller_id) {
      whereClause.seller_id = filters.seller_id;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    } else {
      // Default to only show ACTIVE products for public listing
      whereClause.status = ProductStatus.ACTIVE;
    }

    // TODO: Implement search functionality with LIKE query
    // if (filters.search) {
    //   // Search in title and description
    // }

    const [products, total] = await this.productRepository_.findAndCount({
      where: whereClause,
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { products, total };
  }

  async getMyProducts(
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: Product[]; total: number }> {
    const skip = (page - 1) * limit;

    const [products, total] = await this.productRepository_.findAndCount({
      where: { seller_id: sellerId },
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return { products, total };
  }

  // Admin methods for product moderation
  async getPendingProducts(
    page: number = 1,
    limit: number = 20
  ): Promise<{ products: Product[]; total: number }> {
    const skip = (page - 1) * limit;

    const [products, total] = await this.productRepository_.findAndCount({
      where: { review_status: ProductReviewStatus.PENDING },
      order: { created_at: "ASC" },
      skip,
      take: limit,
    });

    return { products, total };
  }

  async approveProduct(
    productId: string,
    adminId: string
  ): Promise<Product> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getRepository(Product);

      const product = await productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      product.review_status = ProductReviewStatus.APPROVED;
      product.status = ProductStatus.ACTIVE;
      product.rejection_reason = null;
      product.reviewed_by = adminId;
      product.reviewed_at = new Date();

      return await productRepo.save(product);
    });
  }

  async rejectProduct(
    productId: string,
    adminId: string,
    reason: string
  ): Promise<Product> {
    return await this.atomicPhase_(async (manager) => {
      const productRepo = manager.getRepository(Product);

      const product = await productRepo.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error("Rejection reason is required");
      }

      product.review_status = ProductReviewStatus.REJECTED;
      product.status = ProductStatus.DRAFT;
      product.rejection_reason = reason;
      product.reviewed_by = adminId;
      product.reviewed_at = new Date();

      return await productRepo.save(product);
    });
  }
}

export default ProductService;
