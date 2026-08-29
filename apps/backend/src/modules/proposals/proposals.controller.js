import { asyncHandler } from "../../shared/utils/asyncHandler.js";

import {
  requireFields,
} from "../../shared/validators/validate.js";

import {
  ForbiddenError,
} from "../../shared/exceptions/AppError.js";

import {
  submitProposal,
  listForProject,
  listForClient,
  listForStudent,
  acceptProposal,
  rejectProposal,
  markCvViewed,
} from "./proposals.service.js";
import { getCommissionPreview } from "../payments/commission.service.js";

export const createProposal =
  asyncHandler(async (req, res) => {

    if (
      req.user.role !== "student"
    ) {

      throw new ForbiddenError(
        "Only students can submit proposals"
      );

    }


    requireFields(
      req.body,
      [
        "project_id",
        "price",
        "delivery_time_days",
        "cover_note",
      ]
    );


    try {

      const proposal =
        await submitProposal(
          req.user._id,
          req.body
        );
      const commissionPreview = await getCommissionPreview(req.user._id, {
        amount: req.body.price,
        currency: proposal.currency,
      });


      res.status(201).json({

        success:
          true,

        data: {
          ...(proposal.toObject ? proposal.toObject() : proposal),
          commission_rate_bps: commissionPreview.rateBps,
          commission_waived: commissionPreview.waived,
          commission_completed_milestones: commissionPreview.completedMilestones,
        },

      });

    } catch (err) {

      if (err.code === 11000) {

        err.status = 409;

        err.message =
          "You already submitted a proposal for this project";

      }

      throw err;

    }

  });

export const getIncomingProposals =
  asyncHandler(async (req, res) => {

    if (
      req.user.role !== "client" &&
      req.user.role !== "admin"
    ) {

      throw new ForbiddenError(
        "Only clients can view incoming proposals"
      );

    }


    const proposals =
      await listForClient(
        req.user
      );


    res.json({

      success:
        true,

      data:
        proposals,

    });

  });

export const getMyProposals = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new ForbiddenError("Only students can view their proposals");
  }

  const proposals = await listForStudent(req.user._id);
  res.json({ success: true, data: proposals });
});

export const getCommissionPreviewForStudent = asyncHandler(async (req, res) => {
  if (req.user.role !== "student") {
    throw new ForbiddenError("Only students can view their commission preview");
  }
  const preview = await getCommissionPreview(req.user._id, {
    amount: req.query.amount,
    currency: req.query.currency,
  });
  res.json({ success: true, data: preview });
});

export const getProjectProposals =
  asyncHandler(async (req, res) => {

    const proposals =
      await listForProject(
        req.params.projectId,
        req.user
      );


    res.json({

      success:
        true,

      data:
        proposals,

    });

  });


export const accept =
  asyncHandler(async (req, res) => {

    const result =
      await acceptProposal(
        req.params.id,
        req.user,
        { correlationId: req.correlationId }
      );


    res.json({

      success:
        true,

      data:
        result,

    });

  });

export const cvViewed = asyncHandler(async (req, res) => {
  const proposal = await markCvViewed(req.params.id, req.user, { correlationId: req.correlationId });
  res.json({ success: true, data: proposal });
});



export const reject =
  asyncHandler(async (req, res) => {

    const proposal =
      await rejectProposal(
        req.params.id,
        req.user
      );


    res.json({

      success:
        true,

      data:
        proposal,

    });

  });
