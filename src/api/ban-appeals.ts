import { Router } from "express";
import { ensureAdmin } from "../middleware/admin";
import { UnbanRequestStatus, PixKeyType, PreviousBanType, RefundDecision } from "../models/ban";

const router = Router();

/**
 * Submit a detailed ban appeal
 * POST /ban-appeals
 * NO AUTH REQUIRED - banned users can submit from ban screen
 */
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      username,
      email,
      full_name,
      cpf,
      previously_banned,
      previous_ban_type,
      knows_violated_rule,
      violated_rule_description,
      appeal_message,
      terms_acknowledged,
      information_truthful,
      false_info_consequence_acknowledged,
      pix_key,
      pix_key_type,
    } = req.body;

    // Validate all required fields
    if (
      !username ||
      !email ||
      !full_name ||
      !cpf ||
      !appeal_message ||
      !pix_key ||
      !pix_key_type
    ) {
      return res.status(400).json({
        error: "Todos os campos obrigatórios devem ser preenchidos",
        required_fields: [
          "username",
          "email",
          "full_name",
          "cpf",
          "appeal_message",
          "pix_key",
          "pix_key_type",
        ],
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Formato de email inválido" });
    }

    // Validate boolean fields
    if (
      typeof previously_banned !== "boolean" ||
      typeof knows_violated_rule !== "boolean" ||
      typeof terms_acknowledged !== "boolean" ||
      typeof information_truthful !== "boolean" ||
      typeof false_info_consequence_acknowledged !== "boolean"
    ) {
      return res.status(400).json({
        error: "Campos booleanos inválidos",
      });
    }

    // Validate all confirmations are true
    if (
      !terms_acknowledged ||
      !information_truthful ||
      !false_info_consequence_acknowledged
    ) {
      return res.status(400).json({
        error:
          "Todas as confirmações (termos, veracidade, consequências) devem ser marcadas",
      });
    }

    // Validate appeal message minimum length
    if (appeal_message.length < 50) {
      return res.status(400).json({
        error: "A mensagem de apelação deve ter pelo menos 50 caracteres",
      });
    }

    // Validate PIX key type
    const validPixKeyTypes = Object.values(PixKeyType);
    if (!validPixKeyTypes.includes(pix_key_type)) {
      return res.status(400).json({
        error: "Tipo de chave PIX inválido",
        valid_types: validPixKeyTypes,
      });
    }

    // If previously banned, validate previous ban type
    if (previously_banned) {
      const validPreviousBanTypes = Object.values(PreviousBanType);
      if (
        !previous_ban_type ||
        !validPreviousBanTypes.includes(previous_ban_type)
      ) {
        return res.status(400).json({
          error:
            "Tipo de banimento anterior é obrigatório quando você já foi banido",
          valid_types: validPreviousBanTypes,
        });
      }
    }

    // Get IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const banAppealService = req.scope.resolve("banAppealService");

    const appeal = await banAppealService.createAppeal({
      userId: user_id || null,
      username,
      email,
      fullName: full_name,
      cpf,
      previouslyBanned: previously_banned,
      previousBanType: previous_ban_type || null,
      knowsViolatedRule: knows_violated_rule,
      violatedRuleDescription: violated_rule_description || null,
      appealMessage: appeal_message,
      termsAcknowledged: terms_acknowledged,
      informationTruthful: information_truthful,
      falseInfoConsequenceAcknowledged: false_info_consequence_acknowledged,
      pixKey: pix_key,
      pixKeyType: pix_key_type,
      ipAddress,
      userAgent,
    });

    res.json({
      success: true,
      appeal: {
        id: appeal.id,
        email: appeal.email,
        status: appeal.status,
        submitted_at: appeal.submitted_at,
      },
      message:
        "Seu pedido de apelação foi enviado e será analisado em breve. Você receberá uma resposta no email informado.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * List ban appeals (admin)
 * GET /admin/ban-appeals
 */
router.get("/admin", ensureAdmin, async (req, res) => {
  try {
    const status = req.query.status as UnbanRequestStatus;
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.per_page as string) || 50;

    const banAppealService = req.scope.resolve("banAppealService");
    const { appeals, total } = await banAppealService.listAppeals(
      status,
      page,
      perPage
    );

    res.json({
      appeals: appeals.map((appeal) => ({
        id: appeal.id,
        user_id: appeal.user_id,
        username: appeal.username,
        email: appeal.email,
        full_name: appeal.full_name,
        cpf: appeal.cpf,
        previously_banned: appeal.previously_banned,
        previous_ban_type: appeal.previous_ban_type,
        knows_violated_rule: appeal.knows_violated_rule,
        violated_rule_description: appeal.violated_rule_description,
        appeal_message: appeal.appeal_message,
        pix_key: appeal.pix_key,
        pix_key_type: appeal.pix_key_type,
        status: appeal.status,
        submitted_at: appeal.submitted_at,
        reviewed_by: appeal.reviewed_by,
        reviewed_at: appeal.reviewed_at,
        admin_notes: appeal.admin_notes,
        close_account_financially: appeal.close_account_financially,
        refund_decision: appeal.refund_decision,
        refund_amount: appeal.refund_amount,
        refund_pix_key: appeal.refund_pix_key,
        refund_processed_at: appeal.refund_processed_at,
        ip_address: appeal.ip_address,
      })),
      total,
      page,
      per_page: perPage,
      total_pages: Math.ceil(total / perPage),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific appeal details (admin)
 * GET /admin/ban-appeals/:id
 */
router.get("/admin/:id", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const banAppealService = req.scope.resolve("banAppealService");
    const banService = req.scope.resolve("banService");
    const ledgerService = req.scope.resolve("ledgerService");

    const appeal = await banAppealService.getAppeal(id);

    // Get user's ban history
    let banHistory = null;
    if (appeal.user_id) {
      banHistory = await banAppealService.getUserBanHistory(appeal.user_id);
    }

    // Get current ban status
    let currentBan = null;
    if (appeal.user_id) {
      currentBan = await banService.checkBan(appeal.user_id);
    }

    // Get current balance (if user exists)
    let balance = null;
    if (appeal.user_id) {
      try {
        balance = await ledgerService.getBalance(appeal.user_id);
      } catch (e) {
        // Balance might not exist, that's ok
        balance = { available_balance: 0, pending_balance: 0, held_balance: 0 };
      }
    }

    res.json({
      appeal: {
        id: appeal.id,
        user_id: appeal.user_id,
        username: appeal.username,
        email: appeal.email,
        full_name: appeal.full_name,
        cpf: appeal.cpf,
        previously_banned: appeal.previously_banned,
        previous_ban_type: appeal.previous_ban_type,
        knows_violated_rule: appeal.knows_violated_rule,
        violated_rule_description: appeal.violated_rule_description,
        appeal_message: appeal.appeal_message,
        terms_acknowledged: appeal.terms_acknowledged,
        information_truthful: appeal.information_truthful,
        false_info_consequence_acknowledged:
          appeal.false_info_consequence_acknowledged,
        pix_key: appeal.pix_key,
        pix_key_type: appeal.pix_key_type,
        status: appeal.status,
        submitted_at: appeal.submitted_at,
        reviewed_by: appeal.reviewed_by,
        reviewed_at: appeal.reviewed_at,
        admin_notes: appeal.admin_notes,
        close_account_financially: appeal.close_account_financially,
        refund_decision: appeal.refund_decision,
        refund_amount: appeal.refund_amount,
        refund_pix_key: appeal.refund_pix_key,
        refund_processed_at: appeal.refund_processed_at,
        ip_address: appeal.ip_address,
        user_agent: appeal.user_agent,
      },
      ban_history: banHistory,
      current_ban: currentBan,
      current_balance: balance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve a ban appeal (admin) - Removes ban
 * POST /admin/ban-appeals/:id/approve
 */
router.post("/admin/:id/approve", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const banAppealService = req.scope.resolve("banAppealService");
    const banService = req.scope.resolve("banService");

    // Get the appeal
    const appeal = await banAppealService.getAppeal(id);

    // Approve the appeal
    const updatedAppeal = await banAppealService.approveAppeal(
      id,
      req.user.id,
      admin_notes
    );

    // If user_id exists, unban the user
    if (appeal.user_id) {
      // Find active bans for this user
      const ban = await banService.checkBan(appeal.user_id);
      if (ban) {
        await banService.unban(ban.id, req.user.id);
      }
    }

    res.json({
      success: true,
      appeal: {
        id: updatedAppeal.id,
        status: updatedAppeal.status,
        reviewed_at: updatedAppeal.reviewed_at,
      },
      message: "Apelação aprovada e usuário desbanido",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deny a ban appeal (admin) - Keeps ban
 * POST /admin/ban-appeals/:id/deny
 */
router.post("/admin/:id/deny", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    if (!admin_notes) {
      return res.status(400).json({
        error: "Nota administrativa é obrigatória ao negar uma apelação",
      });
    }

    const banAppealService = req.scope.resolve("banAppealService");

    const updatedAppeal = await banAppealService.denyAppeal(
      id,
      req.user.id,
      admin_notes
    );

    res.json({
      success: true,
      appeal: {
        id: updatedAppeal.id,
        status: updatedAppeal.status,
        reviewed_at: updatedAppeal.reviewed_at,
      },
      message: "Apelação negada, banimento mantido",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Deny appeal and close account financially (admin)
 * POST /admin/ban-appeals/:id/deny-and-close
 * Most severe action - permanent closure
 */
router.post("/admin/:id/deny-and-close", ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      admin_notes,
      refund_decision,
      refund_amount,
      refund_pix_key,
    } = req.body;

    if (!admin_notes) {
      return res.status(400).json({
        error:
          "Nota administrativa é obrigatória ao encerrar conta financeiramente",
      });
    }

    const validRefundDecisions = Object.values(RefundDecision);
    if (!refund_decision || !validRefundDecisions.includes(refund_decision)) {
      return res.status(400).json({
        error: "Decisão de reembolso é obrigatória",
        valid_decisions: validRefundDecisions,
      });
    }

    if (refund_decision === RefundDecision.REFUND && !refund_amount) {
      return res.status(400).json({
        error: "Valor de reembolso é obrigatório quando decisão é REFUND",
      });
    }

    const banAppealService = req.scope.resolve("banAppealService");

    const updatedAppeal = await banAppealService.denyAndCloseFinancially(
      id,
      req.user.id,
      admin_notes,
      refund_decision,
      refund_amount || null,
      refund_pix_key || null
    );

    res.json({
      success: true,
      appeal: {
        id: updatedAppeal.id,
        status: updatedAppeal.status,
        reviewed_at: updatedAppeal.reviewed_at,
        close_account_financially: updatedAppeal.close_account_financially,
        refund_decision: updatedAppeal.refund_decision,
        refund_amount: updatedAppeal.refund_amount,
        refund_pix_key: updatedAppeal.refund_pix_key,
      },
      message:
        "Apelação negada e conta encerrada financeiramente. Nenhum pagamento automático foi realizado.",
      warning:
        "Lembre-se: se a decisão foi REFUND, você deve processar o pagamento manualmente e depois marcar como processado.",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mark refund as processed (admin)
 * POST /admin/ban-appeals/:id/mark-refund-processed
 * Called AFTER admin manually processes the refund via PagSeguro
 */
router.post(
  "/admin/:id/mark-refund-processed",
  ensureAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      const banAppealService = req.scope.resolve("banAppealService");

      const updatedAppeal = await banAppealService.markRefundProcessed(
        id,
        req.user.id
      );

      res.json({
        success: true,
        appeal: {
          id: updatedAppeal.id,
          refund_processed_at: updatedAppeal.refund_processed_at,
          refund_processed_by: updatedAppeal.refund_processed_by,
        },
        message: "Reembolso marcado como processado",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
