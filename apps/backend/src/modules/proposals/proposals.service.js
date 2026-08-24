import Proposal from "./proposals.model.js";
import Project from "../projects/projects.model.js";
import Contract from "../contracts/contracts.model.js";
import { buildContractTerms } from "../contracts/contracts.service.js";
import User from "../users/users.model.js";
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

import {
  createNotification,
} from "../notifications/notifications.service.js";


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

  const student =
    await User.findById(studentId)
      .select(
        "name email university universityVerified"
      )
      .lean();


  if (
    !student ||
    !student.universityVerified
  ) {

    throw new ForbiddenError(
      "Your university verification must be approved before you can submit proposals"
    );

  }


  const proposal =
    await Proposal.create({
      ...data,
      student_id: studentId,
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

    .sort({
      createdAt: -1,
    })

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


  if (
    proposal.status !== "pending"
  ) {

    throw new ValidationError(
      `Cannot accept a proposal with status "${proposal.status}"`
    );

  }


  const project =
    proposal.project_id;


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
