import { Router } from "express";
import storageRoutes from "./storage";
import kycRoutes from "./kyc";
import adminKycRoutes from "./admin-kyc";
import adminDashboardRoutes from "./admin-dashboard";
import adminMultilevelRoutes from "./admin-multilevel";
import paymentsRoutes from "./payments";
import bodyParser from "body-parser";
import cors from "cors";

export default (rootDirectory: string): Router => {
  const router = Router();

  // Middleware
  router.use(cors());
  router.use(bodyParser.json());

  // Mount routes
  router.use(storageRoutes);
  router.use(kycRoutes);
  router.use(adminKycRoutes);
  router.use(adminDashboardRoutes);
  router.use(adminMultilevelRoutes);
  router.use(paymentsRoutes);

  return router;
};
