import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { kycSubmissionLimiter, authLimiter } from "../middleware/rate-limit";
import { validateCpf } from "../utils/cpf-validator";

const router = Router();

router.post("/kyc/submissions", kycSubmissionLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { full_name, cpf, address, documents } = req.body;

    // Validate required fields
    if (!full_name || !cpf || !address || !documents) {
      return res.status(400).json({
        message: "Missing required fields: full_name, cpf, address, documents",
      });
    }

    // Validate CPF
    const cpfValidation = validateCpf(cpf);
    if (!cpfValidation.valid) {
      return res.status(400).json({
        message: `Invalid CPF: ${cpfValidation.error}`,
      });
    }

    // Validate address fields
    if (!address.line || !address.city || !address.state || !address.zip || !address.country) {
      return res.status(400).json({
        message: "Address must include: line, city, state, zip, country",
      });
    }

    // Validate documents fields
    if (!documents.doc_url || !documents.selfie_url || !documents.proof_url) {
      return res.status(400).json({
        message: "Documents must include: doc_url, selfie_url, proof_url",
      });
    }

    const userId = req.user!.userId || (req.user as any).id;
    const kycService = req.scope.resolve("kycService");

    // Use formatted CPF for storage
    const submission = await kycService.submitKyc(userId, {
      full_name,
      cpf: cpfValidation.formatted!,
      address,
      documents,
    });

    return res.status(201).json({
      id: submission.id,
      status: submission.status,
    });
  } catch (error: any) {
    console.error("KYC submission error:", error);

    if (error.message.includes("already in analysis")) {
      return res.status(409).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to submit KYC",
    });
  }
});

router.get("/kyc/submissions/me", authLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId || (req.user as any).id;
    const kycService = req.scope.resolve("kycService");

    const submission = await kycService.getMine(userId);

    if (!submission) {
      return res.json({
        current_status: "NOT_SUBMITTED",
        submission: null,
      });
    }

    return res.json({
      current_status: submission.status,
      submission: {
        id: submission.id,
        status: submission.status,
        rejection_reason: submission.rejection_reason,
        submitted_at: submission.submitted_at,
        reviewed_at: submission.reviewed_at,
        documents: submission.documents,
      },
    });
  } catch (error: any) {
    console.error("Get KYC error:", error);
    return res.status(500).json({
      message: "Failed to get KYC submission",
    });
  }
});

export default router;
