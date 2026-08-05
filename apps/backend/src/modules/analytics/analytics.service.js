// Business logic for the "analytics" module goes here.
// Keep controllers thin — controllers parse req/res, services do the work,
// so services stay testable without an HTTP layer.

export async function notImplemented() {
  throw Object.assign(new Error("Analytics module not implemented yet"), { status: 501 });
}
