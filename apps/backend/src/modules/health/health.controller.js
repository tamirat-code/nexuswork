import { getHealth } from "./health.service.js";

export function check(req, res) {
  res.json({ success: true, data: getHealth() });
}
