import { getEmailService } from "../services/email";

class KycSubscriber {
  constructor({ eventBusService }: any) {
    // Subscribe to KYC approval events
    eventBusService.subscribe("user.kyc_approved", async (data: any) => {
      try {
        console.log("Received user.kyc_approved event:", data);
        
        // TODO: Fetch user email and name from userService
        // For now, this is a placeholder
        const emailService = getEmailService();
        
        // In production, you would fetch user data:
        // const userService = container.resolve("userService");
        // const user = await userService.retrieve(data.user_id);
        
        // await emailService.sendKycApprovalEmail({
        //   user_email: user.email,
        //   user_name: user.first_name || "User",
        //   approved_at: new Date(),
        // });
        
        console.log("[KYC Subscriber] Would send approval email for user:", data.user_id);
      } catch (error) {
        console.error("Error handling KYC approval event:", error);
      }
    });

    // Subscribe to KYC rejection events
    eventBusService.subscribe("user.kyc_rejected", async (data: any) => {
      try {
        console.log("Received user.kyc_rejected event:", data);
        
        // TODO: Fetch user email and name from userService
        const emailService = getEmailService();
        
        // In production, you would fetch user data:
        // const userService = container.resolve("userService");
        // const user = await userService.retrieve(data.user_id);
        
        // await emailService.sendKycRejectionEmail({
        //   user_email: user.email,
        //   user_name: user.first_name || "User",
        //   rejection_reason: data.rejection_reason,
        //   rejected_at: new Date(),
        // });
        
        console.log("[KYC Subscriber] Would send rejection email for user:", data.user_id);
      } catch (error) {
        console.error("Error handling KYC rejection event:", error);
      }
    });
  }
}

export default KycSubscriber;
