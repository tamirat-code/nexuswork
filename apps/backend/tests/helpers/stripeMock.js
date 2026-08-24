import { jest } from "@jest/globals";


export function createStripeMock() {
  return {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    transfers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    accounts: {
      retrieve: jest.fn(),
      create: jest.fn(),
      createLoginLink: jest.fn(),
    },
    balance: {
      retrieve: jest.fn(),
    },
    webhooks: {
     
      constructEvent: jest.fn(),
    },
  };
}
