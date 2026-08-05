// Business logic for the "search" module goes here.
// Keep controllers thin — controllers parse req/res, services do the work,
// so services stay testable without an HTTP layer.

export async function notImplemented() {
  throw Object.assign(new Error("Search module not implemented yet"), { status: 501 });
}
