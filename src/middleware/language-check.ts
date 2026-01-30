import { Request, Response, NextFunction } from "express";

/**
 * Language Check Middleware
 * Checks user-submitted content for inappropriate language
 * Applies progressive penalties based on violation history
 */
export const checkLanguage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const moderationService = req.scope.resolve("moderationService");
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return next(); // Skip check if not authenticated
    }

    // Fields to check (customize based on your needs)
    const fieldsToCheck: string[] = [];
    
    // Check common text fields
    if (req.body.message) fieldsToCheck.push(req.body.message);
    if (req.body.description) fieldsToCheck.push(req.body.description);
    if (req.body.comment) fieldsToCheck.push(req.body.comment);
    if (req.body.content) fieldsToCheck.push(req.body.content);
    if (req.body.text) fieldsToCheck.push(req.body.text);
    if (req.body.title) fieldsToCheck.push(req.body.title);

    // Check all text fields
    for (const text of fieldsToCheck) {
      const result = await moderationService.checkText(text);

      if (result.isInappropriate) {
        // Create violation record
        const violation = await moderationService.flagMessage(
          userId,
          text,
          result.detectedWords,
          result.severity
        );

        // Calculate penalty based on history
        const penalty = await moderationService.calculatePenalty(userId, result.severity);

        // Apply penalty
        await moderationService.applyPenalty(violation.id, penalty);

        // Get penalty description
        const penaltyDescription = getPenaltyDescription(penalty);

        // Return error with violation details
        return res.status(400).json({
          error: "Linguagem inadequada detectada",
          message: `Sua mensagem contém linguagem inadequada. ${penaltyDescription}`,
          violation_id: violation.id,
          detected_words: result.detectedWords,
          penalty,
          can_appeal: true,
          appeal_url: `/language-violations/${violation.id}/appeal`
        });
      }
    }

    // No violations, continue
    next();
  } catch (error) {
    console.error("Language check error:", error);
    // Don't block request on error, just log it
    next();
  }
};

/**
 * Get human-readable penalty description
 */
function getPenaltyDescription(penalty: string): string {
  switch (penalty) {
    case "WARNING":
      return "Esta é uma advertência. Reincidências resultarão em banimento temporário.";
    case "BAN_24H":
      return "Sua conta foi suspensa por 24 horas devido a reincidência.";
    case "BAN_72H":
      return "Sua conta foi suspensa por 72 horas devido a múltiplas violações.";
    case "BAN_7D":
      return "Sua conta foi suspensa por 7 dias devido a violações repetidas.";
    default:
      return "Ação tomada devido a violação das regras da plataforma.";
  }
}
