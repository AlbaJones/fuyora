import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

interface PresignedUrlResult {
  uploadUrl: string;
  url: string;
  expiresIn: number;
}

export class S3PresignService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    const endpoint = process.env.AWS_S3_ENDPOINT;
    const forcePathStyle = process.env.AWS_S3_FORCE_PATH_STYLE === "true";

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
      ...(endpoint && { endpoint }),
      forcePathStyle,
    });

    this.bucket = process.env.AWS_S3_BUCKET || "fuyora-uploads";
    this.region = process.env.AWS_REGION || "us-east-1";
  }

  async generatePresignedUrl(
    key: string,
    contentType: string,
    expiresIn: number = 900
  ): Promise<PresignedUrlResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

    // Generate the public URL
    const endpoint = process.env.AWS_S3_ENDPOINT;
    let url: string;

    if (endpoint) {
      // For S3-compatible services with custom endpoint
      url = `${endpoint}/${this.bucket}/${key}`;
    } else {
      // For AWS S3
      url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    return {
      uploadUrl,
      url,
      expiresIn,
    };
  }
}
