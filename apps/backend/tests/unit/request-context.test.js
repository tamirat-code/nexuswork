import { jest } from "@jest/globals";
import { requestContext } from "../../src/middleware/request-context.middleware.js";

describe("request context", () => {
  test("creates one request ID and preserves the correlation ID contract", () => {
    const headers = {};
    const req = { headers: {} };
    const res = { setHeader: (name, value) => { headers[name] = value; } };
    const next = jest.fn();

    requestContext(req, res, next);

    expect(req.requestId).toEqual(expect.any(String));
    expect(req.correlationId).toBe(req.requestId);
    expect(headers["X-Request-Id"]).toBe(req.requestId);
    expect(next).toHaveBeenCalledTimes(1);
  });
});
