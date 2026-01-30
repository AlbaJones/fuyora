import nodemailer from "nodemailer";
import { Transporter } from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface KycApprovalEmailData {
  user_email: string;
  user_name: string;
  approved_at: Date;
}

interface KycRejectionEmailData {
  user_email: string;
  user_name: string;
  rejection_reason: string;
  rejected_at: Date;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig | null = null;
  private enabled: boolean;

  constructor() {
    // Check if email is configured
    this.enabled = !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );

    if (!this.enabled) {
      console.warn("Email service not configured. Set SMTP_* environment variables to enable.");
      return;
    }

    this.config = {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      from: process.env.SMTP_FROM || "noreply@fuyora.com",
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });

    console.log("Email service initialized successfully");
  }

  async sendKycApprovalEmail(data: KycApprovalEmailData): Promise<void> {
    if (!this.enabled || !this.transporter) {
      console.log("[EMAIL DISABLED] Would send KYC approval email to:", data.user_email);
      return;
    }

    const subject = "KYC Aprovado - Fuyora Marketplace";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">✅ KYC Aprovado!</h2>
        <p>Olá ${data.user_name},</p>
        <p>Temos o prazer de informar que sua verificação KYC foi <strong>aprovada</strong>!</p>
        <p>Você agora pode vender produtos e serviços no Fuyora Marketplace.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Data de aprovação: ${data.approved_at.toLocaleDateString('pt-BR')}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Esta é uma mensagem automática. Por favor, não responda a este email.
        </p>
      </div>
    `;

    const text = `
KYC Aprovado - Fuyora Marketplace

Olá ${data.user_name},

Temos o prazer de informar que sua verificação KYC foi aprovada!

Você agora pode vender produtos e serviços no Fuyora Marketplace.

Data de aprovação: ${data.approved_at.toLocaleDateString('pt-BR')}

Esta é uma mensagem automática. Por favor, não responda a este email.
    `;

    try {
      await this.transporter.sendMail({
        from: this.config!.from,
        to: data.user_email,
        subject,
        text,
        html,
      });
      console.log("KYC approval email sent to:", data.user_email);
    } catch (error) {
      console.error("Failed to send KYC approval email:", error);
      // Don't throw - email failure shouldn't block the approval
    }
  }

  async sendKycRejectionEmail(data: KycRejectionEmailData): Promise<void> {
    if (!this.enabled || !this.transporter) {
      console.log("[EMAIL DISABLED] Would send KYC rejection email to:", data.user_email);
      return;
    }

    const subject = "KYC Recusado - Fuyora Marketplace";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">❌ KYC Recusado</h2>
        <p>Olá ${data.user_name},</p>
        <p>Infelizmente, sua verificação KYC foi <strong>recusada</strong>.</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <strong>Motivo da recusa:</strong>
          <p style="margin: 10px 0 0 0;">${data.rejection_reason}</p>
        </div>
        <p>Você pode submeter uma nova verificação KYC com documentos atualizados.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Data da recusa: ${data.rejected_at.toLocaleDateString('pt-BR')}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          Esta é uma mensagem automática. Por favor, não responda a este email.
        </p>
      </div>
    `;

    const text = `
KYC Recusado - Fuyora Marketplace

Olá ${data.user_name},

Infelizmente, sua verificação KYC foi recusada.

Motivo da recusa:
${data.rejection_reason}

Você pode submeter uma nova verificação KYC com documentos atualizados.

Data da recusa: ${data.rejected_at.toLocaleDateString('pt-BR')}

Esta é uma mensagem automática. Por favor, não responda a este email.
    `;

    try {
      await this.transporter.sendMail({
        from: this.config!.from,
        to: data.user_email,
        subject,
        text,
        html,
      });
      console.log("KYC rejection email sent to:", data.user_email);
    } catch (error) {
      console.error("Failed to send KYC rejection email:", error);
      // Don't throw - email failure shouldn't block the rejection
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.enabled || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("Email service connection verified");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}
