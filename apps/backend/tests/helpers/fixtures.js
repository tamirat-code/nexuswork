import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authConfig } from "../../src/config/auth.config.js";
import User from "../../src/modules/users/users.model.js";
import Project from "../../src/modules/projects/projects.model.js";
import Proposal from "../../src/modules/proposals/proposals.model.js";
import Contract from "../../src/modules/contracts/contracts.model.js";
import Milestone from "../../src/modules/milestones/milestones.model.js";
import Payment from "../../src/modules/payments/payments.model.js";
import Wallet from "../../src/modules/wallets/wallets.model.js";
import { paymentConfig } from "../../src/config/payment.config.js";

let seq = 0;
function unique(prefix) {
  seq += 1;
  return `${prefix}${Date.now()}-${seq}`;
}

export function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    authConfig.jwtSecret,
    {
      expiresIn: "1h",
      jwtid: `test-${user._id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,
    }
  );
}


export async function createUser(role, overrides = {}) {
  const password_hash = await bcrypt.hash("Password123!", 4);
  const user = await User.create({
    email: overrides.email || `${unique(role)}@example.com`,
    password_hash,
    role,
    name: overrides.name || `Test ${role}`,
    email_verified: true,
    status: "active",
    ...overrides,
  });
  return { user, token: signToken(user) };
}


export async function createActiveContractWithMilestone({
  client,
  student,
  milestoneAmount = 100,
  totalAmount,
} = {}) {
  const total = totalAmount ?? milestoneAmount;

  const project = await Project.create({
    client_id: client._id,
    title: unique("Test project "),
    description: "Test project description for fixture purposes.",
    budget: total,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: "in_progress",
  });

  const proposal = await Proposal.create({
    project_id: project._id,
    student_id: student._id,
    price: total,
    delivery_time_days: 14,
    cover_note: "Test proposal cover note.",
    status: "accepted",
  });

  const contract = await Contract.create({
    proposal_id: proposal._id,
    project_id: project._id,
    client_id: client._id,
    student_id: student._id,
    status: "active",
    terms: {
      title: project.title,
      description: "Test contract terms.",
      total_amount: total,
      currency: "USD",
      delivery_time_days: 14,
      deadline: project.deadline,
    },
    terms_fingerprint: unique("fingerprint-"),
    signed_at: new Date(),
  });

  const milestone = await Milestone.create({
    contract_id: contract._id,
    title: "Milestone 1",
    amount: milestoneAmount,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    sequence: 1,
    status: "not_funded",
    payout_status: "not_applicable",
  });

  return { project, proposal, contract, milestone };
}

/** Marks a milestone as funded by writing the succeeded deposit Payment directly. */
export async function fundMilestone(milestone) {
  await Payment.create({
    milestone_id: milestone._id,
    amount: milestone.amount,
    currency: paymentConfig.currency,
    direction: "deposit",
    status: "succeeded",
    stripe_payment_intent_id: unique("pi_"),
  });
  milestone.status = "funded";
  milestone.funded_at = new Date();
  await milestone.save();
  return milestone;
}

export async function createWallet(user, overrides = {}) {
  return Wallet.create({ user_id: user._id, ...overrides });
}