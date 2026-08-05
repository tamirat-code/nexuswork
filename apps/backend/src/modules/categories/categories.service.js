// Business logic for the "categories" module goes here.
// Keep controllers thin — controllers parse req/res, services do the work,
// so services stay testable without an HTTP layer.

export async function notImplemented() {
  throw Object.assign(new Error("Categories module not implemented yet"), { status: 501 });
}
