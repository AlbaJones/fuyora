import { Router } from "express";
import storageRoutes from "./storage";
import kycRoutes from "./kyc";
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

  return router;
};
