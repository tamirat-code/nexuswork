import { jest } from "@jest/globals";

const contractFind = jest.fn();
const milestoneCount = jest.fn();

jest.unstable_mockModule("./src/modules/contracts/contracts.model.js", () => ({
  default: { find: contractFind },
}));
jest.unstable_mockModule("./src/modules/milestones/milestones.model.js", () => ({
  default: { countDocuments: milestoneCount },
}));
jest.unstable_mockModule("./src/config/payment.config.js", () => ({
  paymentConfig: {
    commissionRateBps: 1000,
    commissionWaiverMilestoneThreshold: 3,
  },
}));

const { getEffectiveCommissionRateBps } = await import("../../src/modules/payments/commission.service.js");

function mockContracts(ids) {
  contractFind.mockReturnValue({ distinct: jest.fn().mockResolvedValue(ids) });
}

describe("commission policy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("waives commission for a newly established student", async () => {
    mockContracts([]);

    await expect(getEffectiveCommissionRateBps("student-1")).resolves.toEqual({
      rateBps: 0,
      completedMilestones: 0,
      waiverThreshold: 3,
      waived: true,
    });
    expect(milestoneCount).not.toHaveBeenCalled();
  });

  it("applies the configured rate after the waiver threshold", async () => {
    mockContracts(["contract-1"]);
    milestoneCount.mockResolvedValue(3);

    await expect(getEffectiveCommissionRateBps("student-1")).resolves.toEqual({
      rateBps: 1000,
      completedMilestones: 3,
      waiverThreshold: 3,
      waived: false,
    });
    expect(milestoneCount).toHaveBeenCalledWith({ contract_id: { $in: ["contract-1"] }, status: "released" });
  });
});
