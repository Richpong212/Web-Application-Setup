import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/team.controller";
import * as validation from "../validations/operations.validation";
import { validate } from "../validations/index.validation";
import { sendError } from "../utils/errorResponse";

export const teamRouter = Router({ mergeParams: true });
teamRouter.use(authenticate, validation.farmReference, validate);
teamRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
teamRouter.get("/", controller.listTeam);
teamRouter.post(
  "/invitations",
  validation.inviteValidation,
  validate,
  controller.inviteMember,
);
teamRouter.delete(
  "/invitations/:id",
  validation.resourceReference,
  validate,
  controller.cancelInvitation,
);
teamRouter.patch(
  "/members/:id",
  validation.resourceReference,
  validation.memberValidation,
  validate,
  controller.updateMember,
);
teamRouter.delete(
  "/members/:id",
  validation.resourceReference,
  validate,
  controller.removeMember,
);

export const invitationRouter = Router();
invitationRouter.use(
  rateLimit({
    windowMs: 900000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => sendError(res, "RATE_LIMITED"),
  }),
);
invitationRouter.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
invitationRouter.get(
  "/preview",
  validation.invitationPreviewValidation,
  validate,
  controller.previewInvitation,
);
invitationRouter.post(
  "/accept",
  authenticate,
  validation.invitationAcceptValidation,
  validate,
  controller.acceptInvitation,
);
