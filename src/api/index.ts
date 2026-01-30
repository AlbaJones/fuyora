import { Router } from "express";
import storageRoutes from "./storage";
import kycRoutes from "./kyc";
import adminKycRoutes from "./admin-kyc";
import adminDashboardRoutes from "./admin-dashboard";
import adminMultilevelRoutes from "./admin-multilevel";
import paymentsRoutes from "./payments";
import productsRoutes from "./products";
import adminProductsRoutes from "./admin-products";
import ordersRoutes from "./orders";
import reviewsRoutes from "./reviews";
import withdrawalsRoutes from "./withdrawals";
import disputesRoutes from "./disputes";
import adminBansRoutes from "./admin-bans";
import unbanRequestsRoutes from "./unban-requests";
import banAppealsRoutes from "./ban-appeals";
import languageViolationsRoutes from "./language-violations";
import adminLanguageViolationsRoutes from "./admin-language-violations";
import bodyParser from "body-parser";
import cors from "cors";

export default (rootDirectory: string): Router => {
  const router = Router();

  // Middleware
  router.use(cors());
  router.use(bodyParser.json());

  // Mount routes
  router.use("/storage", storageRoutes);
  router.use("/kyc", kycRoutes);
  router.use("/admin/kyc", adminKycRoutes);
  router.use("/admin/dashboard", adminDashboardRoutes);
  router.use("/admin/kyc", adminMultilevelRoutes);
  router.use("/payments", paymentsRoutes);
  router.use("/products", productsRoutes);
  router.use("/admin/products", adminProductsRoutes);
  router.use("/orders", ordersRoutes);
  router.use("/reviews", reviewsRoutes);
  router.use("/withdrawals", withdrawalsRoutes);
  router.use("/disputes", disputesRoutes);
  router.use("/admin/bans", adminBansRoutes);
  router.use("/unban-requests", unbanRequestsRoutes);
  router.use("/auth", unbanRequestsRoutes); // For /auth/ban-status
  router.use("/ban-appeals", banAppealsRoutes);
  router.use("/admin/ban-appeals", banAppealsRoutes);
  router.use("/", languageViolationsRoutes); // For /user/language-violations and /language-violations/:id/appeal
  router.use("/admin", adminLanguageViolationsRoutes); // For /admin/language-violations

  return router;
};
