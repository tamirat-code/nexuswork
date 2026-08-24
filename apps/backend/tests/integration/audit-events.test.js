import request from "supertest";
import app from "../../src/app.js";
import { connectTestDB, clearDB, disconnectTestDB } from "../helpers/db.js";
import { createUser } from "../helpers/fixtures.js";
import AuditLog from "../../src/modules/audit-logs/audit-logs.model.js";
import AuditReview from "../../src/modules/audit-logs/audit-review.model.js";
import { recordEvent } from "../../src/modules/audit-logs/audit-logs.service.js";

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe("Audit event foundation", () => {
  it("generates unique event IDs and stores transition data", async () => {
    const { user: client } = await createUser("client");
    const correlationId = "request-test-1";

    const first = await recordEvent({
      actor: client,
      eventType: "MILESTONE_APPROVED",
      action: "approve",
      entityType: "milestone",
      entityId: client._id,
      previousState: "submitted",
      newState: "approved",
      correlationId,
      metadata: { source: "integration-test" },
    });
    const second = await recordEvent({
      actor: client,
      eventType: "MILESTONE_RELEASED",
      action: "release",
      entityType: "milestone",
      entityId: client._id,
      previousState: "release_pending",
      newState: "released",
      correlationId,
      metadata: { source: "integration-test-2" },
    });

    expect(first.eventId).toEqual(expect.any(String));
    expect(second.eventId).toEqual(expect.any(String));
    expect(first.eventId).not.toBe(second.eventId);
    expect(first.eventType).toBe("MILESTONE_APPROVED");
    expect(first.action).toBe("approve");
    expect(first.previousState).toBe("submitted");
    expect(first.newState).toBe("approved");
    expect(first.metadata).toEqual({ source: "integration-test" });
    expect(first.correlationId).toBe(correlationId);
    expect(first.actor_id.toString()).toBe(client._id.toString());
    expect(first.actor_role).toBe("client");
  });

  it("accepts client and student actors from server context", async () => {
    const { user: client } = await createUser("client");
    const { user: student } = await createUser("student");

    const clientEvent = await recordEvent({
      actor: client,
      eventType: "MILESTONE_APPROVED",
      action: "approve",
      entityType: "milestone",
      entityId: client._id,
      correlationId: "client-correlation",
    });
    const studentEvent = await recordEvent({
      actor: student,
      eventType: "MILESTONE_SUBMITTED",
      action: "submit",
      entityType: "milestone",
      entityId: student._id,
      correlationId: "student-correlation",
    });

    expect(clientEvent.actor_role).toBe("client");
    expect(studentEvent.actor_role).toBe("student");
  });

  it("uses the authenticated reviewer for flagging and never mutates the original event", async () => {
    const { user: admin, token: adminToken } = await createUser("admin");
    const { user: client } = await createUser("client");
    const event = await recordEvent({
      actor: client,
      eventType: "PAYMENT_CREATED",
      action: "create",
      entityType: "payment",
      entityId: client._id,
      correlationId: "flag-correlation",
    });

    const response = await request(app)
      .patch(`/v1/audit-logs/${event._id}/flag`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        reason: "Review this event",
        actorId: client._id,
        actorRole: "client",
        eventType: "FORGED_EVENT",
      });

    expect(response.status).toBe(200);
    const review = await AuditReview.findOne({ audit_log_id: event._id });
    expect(review.reviewer_id.toString()).toBe(admin._id.toString());
    expect(review.reviewer_role).toBe("admin");

    const original = await AuditLog.findById(event._id);
    expect(original.status).toBe("logged");
    expect(original.eventType).toBe("PAYMENT_CREATED");
    expect(original.actor_id.toString()).toBe(client._id.toString());
  });
});
