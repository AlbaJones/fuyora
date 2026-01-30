import { Router, Request, Response } from "express";
import { ensureAuthenticated } from "../middleware/auth";
import { presignLimiter } from "../middleware/rate-limit";
import { S3PresignService } from "../utils/s3-presign";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const ALLOWED_TYPES = ["avatar", "kyc_doc", "kyc_selfie", "kyc_proof"];
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

router.post("/storage/presign", presignLimiter, ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const { type, content_type, content_length } = req.body;

    // Validate type
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        message: `Invalid type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
      });
    }

    // Validate content type
    if (!content_type || !ALLOWED_CONTENT_TYPES.includes(content_type)) {
      return res.status(400).json({
        message: `Invalid content_type. Allowed: ${ALLOWED_CONTENT_TYPES.join(", ")}`,
      });
    }

    // Validate content length
    const maxUploadBytes = parseInt(process.env.MAX_UPLOAD_BYTES || "10000000");
    if (!content_length || content_length <= 0 || content_length > maxUploadBytes) {
      return res.status(400).json({
        message: `Invalid content_length. Must be positive and maximum allowed: ${maxUploadBytes} bytes`,
      });
    }

    // Generate unique key
    const userId = req.user!.userId || (req.user as any).id;
    const fileExtension = content_type === "application/pdf" ? "pdf" : content_type.split("/")[1];
    const key = `${type}/${userId}/${uuidv4()}.${fileExtension}`;

    // Get presign TTL
    const presignTtl = parseInt(process.env.PRESIGN_TTL_SECONDS || "900");

    // Generate presigned URL
    const s3Service = new S3PresignService();
    const result = await s3Service.generatePresignedUrl(key, content_type, presignTtl);

    return res.json({
      upload_url: result.uploadUrl,
      url: result.url,
      expires_in: result.expiresIn,
    });
  } catch (error: any) {
    console.error("Presign error:", error);
    return res.status(500).json({
      message: "Failed to generate presigned URL",
    });
  }
});

export default router;
