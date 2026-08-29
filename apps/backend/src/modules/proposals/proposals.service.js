import Proposal from "./proposals.model.js";
import Project from "../projects/projects.model.js";
import Contract from "../contracts/contracts.model.js";
import { buildContractTerms } from "../contracts/contracts.service.js";
import User from "../users/users.model.js";
import StudentProfile from "../students/students.model.js";
import Category from "../categories/categories.model.js";
import Skill from "../skills/skills.model.js";
import { recordEvent } from "../audit-logs/audit-logs.service.js";
import crypto from "node:crypto";

import {
  isOrgMember,
} from "../clients/clients.service.js";

import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../shared/exceptions/AppError.js";
import { moneyFromLegacyMajorUnits } from "../../shared/money/money.js";

import {
  createNotification,
} from "../notifications/notifications.service.js";

async function getProposalPriceFloor(project, studentId) {
  const [category, profile] = await Promise.all([
    project.category
      ? Category.findOne({ $or: [{ slug: project.category }, { name: project.category }], is_active: true }).select("proposal_price_floor_minor").lean()
      : null,
    StudentProfile.findOne({ user_id: studentId }).select("skills").lean(),
  ]);

  let floorMinor = Number(category?.proposal_price_floor_minor || 0);
  const requiredSkills = new Set((project.required_skills || []).map((skill) => String(skill).toLowerCase()));
  if (requiredSkills.size) {
    const skills = await Skill.find({ is_active: true }).select("name slug proposal_price_floor_minor_by_level").lean();
    for (const skill of skills) {
      if (!requiredSkills.has(String(skill.name).toLowerCase()) && !requiredSkills.has(String(skill.slug).toLowerCase())) continue;
      const studentSkill = (profile?.skills || []).find((candidate) =>
        requiredSkills.has(String(candidate.name).toLowerCase()) &&
        (String(candidate.name).toLowerCase() === String(skill.name).toLowerCase() || String(candidate.name).toLowerCase() === String(skill.slug).toLowerCase())
      );
      const level = studentSkill?.level || project.experience_level || "beginner";
      floorMinor = Math.max(floorMinor, Number(skill.proposal_price_floor_minor_by_level?.[level] || 0));
    }
  }
  return { floorMinor, currency: String(project.currency || "USD").toLowerCase() };
}

async function assertProposalPriceFloor(project, studentId, price) {
  const projectMoney = moneyFromLegacyMajorUnits(price, project.currency || "USD", "proposal.price");
  const { floorMinor, currency } = await getProposalPriceFloor(project, studentId);
  if (projectMoney.amountMinor < floorMinor) {
    throw new ValidationError(`Proposal price must be at least ${(floorMinor / 100).toFixed(2)} ${currency.toUpperCase()} for this category and skill level`);
  }
  return projectMoney;
}


export async function submitProposal(
  studentId,
  data
) {

  const project =
    await Project.findById(
      data.project_id
    );

  if (
    !project ||
    project.status !== "open"
  ) {

    throw new ValidationError(
      "Project is not open for proposals"
    );

  }

  const proposalMoney = await assertProposalPriceFloor(project, studentId, data.price);

  const student =
    await User.findById(studentId)
      .select(
        "name email university universityVerified cv_file_id"
      )
      .lean();


  if (!student || !student.universityVerified) {

    throw new ForbiddenError(
      "Your university verification must be approved before you can submit proposals"
    );

  }

  if (!student.cv_file_id) {
    throw new ValidationError("Upload your CV from your profile before submitting a proposal");
  }


  const proposal =
    await Proposal.create({
      ...data,
      student_id: studentId,
      price_minor: proposalMoney.amountMinor,
      currency: proposalMoney.currency,
      cv_file_id: student.cv_file_id,
    });


  await createNotification({

    userId: project.client_id,

    type: "proposal_received",

    title: "New proposal received",

    body:
      `${student.name} submitted a ` +
      `$${Number(data.price).toFixed(2)} proposal ` +
      `for "${project.title}".`,

    data: {

      proposal_id:
        proposal._id,

      project_id:
        project._id,

      action:
        "review_proposal",

    },

  });


  return proposal;
}

export async function listForProject(
  projectId,
  requestingUser
) {

  const project =
    await Project.findById(
      projectId
    );

  if (!project) {
    throw new NotFoundError(
      "Project not found"
    );
  }


  if (
    String(project.client_id) !==
      String(requestingUser._id) &&
    requestingUser.role !== "admin"
  ) {

    const allowed =
      await isOrgMember(
        project.client_id,
        requestingUser._id
      );

    if (!allowed) {

      throw new ForbiddenError(
        "Not authorized to view these proposals"
      );

    }

  }


  return Proposal.find({
    project_id: projectId,
  })

    .populate(
      "student_id",
      [
        "name",
        "email",
        "headline",
        "bio",
        "location",
        "university",
        "skills",
        "avatarUrl",
        "universityVerified",
      ].join(" ")
    )

    .populate(
      "project_id",
      [
        "title",
        "description",
        "budget",
        "deadline",
        "status",
      ].join(" ")
    )

    .populate("cv_file_id", "original_name url mimetype size")

    .sort({
      createdAt: -1,
    })

    .lean();
}

export async function markCvViewed(proposalId, requestingUser, auditContext = {}) {
  const proposal = await Proposal.findById(proposalId).populate("project_id");
  if (!proposal) throw new NotFoundError("Proposal not found");
  await assertCanManageProposal(proposal, requestingUser);
  if (!proposal.cv_file_id) throw new ValidationError("This proposal has no CV attached");

  proposal.cv_viewed_by = requestingUser._id;
  proposal.cv_viewed_at = new Date();
  await proposal.save();
  await recordEvent({
    actor: requestingUser,
    eventType: "PROPOSAL_CV_VIEWED",
    action: "proposal.cv_viewed",
    entityType: "proposal",
    entityId: proposal._id,
    previousState: null,
    newState: "cv_viewed",
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { cvFileId: proposal.cv_file_id },
  });
  return proposal;
}

export async function listForStudent(studentId) {
  return Proposal.find({ student_id: studentId })
    .populate("cv_file_id", "original_name url mimetype size")
    .populate(
      "project_id",
      ["title", "description", "budget", "deadline", "status", "currency"].join(" ")
    )
    .sort({ createdAt: -1 })
    .lean();
}

export async function listForClient(
  requestingUser
) {

  let projectQuery;


  if (
    requestingUser.role === "admin"
  ) {

    projectQuery = {};

  } else {

    const ownedProjectIds =
      await Project.find({
        client_id:
          requestingUser._id,
      }).distinct("_id");

    const clientProfiles =
      await Project.find({
        client_id: {
          $exists: true,
        },
      })
        .select("client_id")
        .lean();


    const ownerIds = [
      ...new Set(
        clientProfiles.map(
          (item) =>
            String(item.client_id)
        )
      ),
    ];


    const memberOwnerIds = [];

    for (const ownerId of ownerIds) {

      const allowed =
        await isOrgMember(
          ownerId,
          requestingUser._id
        );

      if (allowed) {
        memberOwnerIds.push(
          ownerId
        );
      }

    }


    const projectIds =
      await Project.find({
        client_id: {
          $in: [
            requestingUser._id,
            ...memberOwnerIds,
          ],
        },
      }).distinct("_id");


    projectQuery = {
      _id: {
        $in: [
          ...new Set([
            ...ownedProjectIds.map(String),
            ...projectIds.map(String),
          ]),
        ],
      },
    };

  }


  const projects =
    await Project.find(
      projectQuery
    )
      .select(
        "_id title description budget deadline status client_id"
      )
      .lean();


  const projectIds =
    projects.map(
      (project) =>
        project._id
    );


  if (!projectIds.length) {
    return [];
  }


  return Proposal.find({
    project_id: {
      $in: projectIds,
    },
  })

    .populate(
      "student_id",
      [
        "name",
        "email",
        "headline",
        "bio",
        "location",
        "university",
        "skills",
        "avatarUrl",
        "universityVerified",
      ].join(" ")
    )

    .populate(
      "project_id",
      [
        "title",
        "description",
        "budget",
        "deadline",
        "status",
      ].join(" ")
    )

    .populate("cv_file_id", "original_name url mimetype size")

    .sort({
      createdAt: -1,
    })

    .lean();
}



async function assertCanManageProposal(
  proposal,
  requestingUser
) {

  const project =
    proposal.project_id;

  if (!project) {
    throw new NotFoundError(
      "Project not found"
    );
  }


  if (
    String(project.client_id) ===
    String(requestingUser._id)
  ) {
    return;
  }


  if (
    requestingUser.role === "admin"
  ) {
    return;
  }


  const allowed =
    await isOrgMember(
      project.client_id,
      requestingUser._id
    );


  if (!allowed) {

    throw new ForbiddenError(
      "You are not authorized to manage this proposal"
    );

  }

}



export async function acceptProposal(
  proposalId,
  requestingUser,
  auditContext = {}
) {

  const proposal =
    await Proposal.findById(
      proposalId
    )
      .populate("project_id")
      .populate(
        "student_id",
        "name email"
      );


  if (!proposal) {
    throw new NotFoundError(
      "Proposal not found"
    );
  }


  await assertCanManageProposal(
    proposal,
    requestingUser
  );

  if (!proposal.cv_file_id || String(proposal.cv_viewed_by) !== String(requestingUser._id)) {
    throw new ValidationError("You must view the student's CV before accepting this proposal", "CV_REVIEW_REQUIRED");
  }


  if (
    proposal.status !== "pending"
  ) {

    throw new ValidationError(
      `Cannot accept a proposal with status "${proposal.status}"`
    );

  }


  const project =
    proposal.project_id;

  await assertProposalPriceFloor(project, proposal.student_id._id, proposal.price);


  if (
    project.status !== "open"
  ) {

    throw new ValidationError(
      "This project is no longer accepting proposals"
    );

  }


  
  const existingContract =
    await Contract.findOne({
      proposal_id:
        proposal._id,
    });


  if (existingContract) {

    throw new ValidationError(
      "A contract already exists for this proposal"
    );

  }


  proposal.status =
    "accepted";

  await proposal.save();


  project.status =
    "in_progress";

  await project.save();


  const competingProposals =
    await Proposal.find({
      project_id:
        project._id,

      _id: {
        $ne:
          proposal._id,
      },

      status:
        "pending",
    })
      .select(
        "_id student_id"
      )
      .lean();


  await Proposal.updateMany(

    {
      project_id:
        project._id,

      _id: {
        $ne:
          proposal._id,
      },

      status:
        "pending",
    },

    {
      status:
        "rejected",
    }

  );


 
  const { terms, terms_fingerprint } = buildContractTerms({
    project,
    proposal,
  });

  const contract = await Contract.create({
    proposal_id: proposal._id,
    project_id: project._id,
    client_id: project.client_id,
    student_id: proposal.student_id._id,
    status: "pending_review",
    version: 1,
    terms,
    terms_fingerprint,
  });

  await recordEvent({
    actor: requestingUser,
    eventType: "CONTRACT_CREATED",
    action: "contract.created",
    entityType: "contract",
    entityId: contract._id,
    previousState: null,
    newState: contract.status,
    correlationId: auditContext.correlationId || crypto.randomUUID(),
    metadata: { proposalId: proposal._id, projectId: project._id },
  });


 
  await createNotification({

    userId:
      proposal.student_id._id,

    type:
      "proposal_accepted",

    title:
      "Your proposal was accepted",

    body:
      `Your proposal for "${project.title}" ` +
      `was accepted. A contract is ready for review. Both parties must review and sign it before work can begin.`,

    data: {

      proposal_id:
        proposal._id,

      project_id:
        project._id,

      contract_id:
        contract._id,

      action:
        "view_contract",

    },

  });



  await Promise.all(

    competingProposals.map(
      (item) =>
        createNotification({

          userId:
            item.student_id,

          type:
            "proposal_rejected",

          title:
            "Proposal not selected",

          body:
            `The client selected another proposal ` +
            `for "${project.title}".`,

          data: {

            proposal_id:
              item._id,

            project_id:
              project._id,

            action:
              "view_proposal",

          },

        })
    )

  );


  return {

    proposal,

    contract,

    rejected_count:
      competingProposals.length,

  };
}

export async function rejectProposal(
  proposalId,
  requestingUser
) {

  const proposal =
    await Proposal.findById(
      proposalId
    )
      .populate("project_id")
      .populate(
        "student_id",
        "name email"
      );


  if (!proposal) {

    throw new NotFoundError(
      "Proposal not found"
    );

  }


  await assertCanManageProposal(
    proposal,
    requestingUser
  );


  if (
    proposal.status !== "pending"
  ) {

    throw new ValidationError(
      `Cannot reject a proposal with status "${proposal.status}"`
    );

  }


  proposal.status =
    "rejected";

  await proposal.save();


  const project =
    proposal.project_id;


  /*
   * Tell the student.
   */
  await createNotification({

    userId:
      proposal.student_id._id,

    type:
      "proposal_rejected",

    title:
      "Proposal not selected",

    body:
      `Your proposal for "${project.title}" ` +
      `was not selected by the client.`,

    data: {

      proposal_id:
        proposal._id,

      project_id:
        project._id,

      action:
        "view_proposal",

    },

  });


  return proposal;
}
