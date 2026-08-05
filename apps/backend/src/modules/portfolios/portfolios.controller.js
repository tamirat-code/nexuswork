import { notImplemented } from "./portfolios.service.js";

export async function placeholder(req, res, next) {
  try {
    await notImplemented();
  } catch (err) {
    next(err);
  }
}
