import { riskFactors } from "../../src/modules/oversight/oversight.service.js";

const now = new Date("2026-09-16T12:00:00.000Z");

function milestone(overrides = {}) {
  return {
    status: "in_progress",
    due_date: new Date("2026-09-20T12:00:00.000Z"),
    ...overrides,
  };
}

describe("project oversight risk factors", () => {
  it("does not mark a released milestone at risk", () => {
    expect(riskFactors({ milestone: milestone({ status: "released" }), tasks: [], latestCheckIn: null, now })).toEqual([]);
  });

  it("detects overdue milestones and incomplete overdue tasks", () => {
    const factors = riskFactors({
      milestone: milestone({ due_date: new Date("2026-09-15T12:00:00.000Z") }),
      tasks: [{ status: "todo", due_date: new Date("2026-09-14T12:00:00.000Z") }],
      latestCheckIn: { createdAt: new Date("2026-09-15T12:00:00.000Z") },
      now,
    });

    expect(factors.map((factor) => factor.code)).toEqual(expect.arrayContaining(["overdue_milestone", "overdue_tasks"]));
  });

  it("detects an approaching deadline, blocked work, and a stale check-in", () => {
    const factors = riskFactors({
      milestone: milestone({ due_date: new Date("2026-09-17T12:00:00.000Z") }),
      tasks: [{ status: "blocked", due_date: new Date("2026-09-18T12:00:00.000Z") }],
      latestCheckIn: { createdAt: new Date("2026-09-08T12:00:00.000Z") },
      now,
    });

    expect(factors.map((factor) => factor.code)).toEqual(expect.arrayContaining(["deadline_within_48_hours", "blocked_tasks", "stale_check_in"]));
  });

  it("uses configured deadline and stale check-in thresholds", () => {
    const factors = riskFactors({
      milestone: milestone({ due_date: new Date("2026-09-17T12:00:00.000Z") }),
      tasks: [],
      latestCheckIn: { createdAt: new Date("2026-09-12T12:00:00.000Z") },
      now,
      deadlineWarningHours: 24,
      staleCheckInDays: 3,
    });

    expect(factors).toEqual(expect.arrayContaining([
      { code: "deadline_within_24_hours", severity: "medium" },
      { code: "stale_check_in", severity: "medium" },
    ]));
  });

  it("does not count completed tasks as overdue", () => {
    const factors = riskFactors({
      milestone: milestone(),
      tasks: [{ status: "completed", due_date: new Date("2026-09-14T12:00:00.000Z") }],
      latestCheckIn: { createdAt: now },
      now,
    });

    expect(factors.map((factor) => factor.code)).not.toContain("overdue_tasks");
  });
});
