import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/pagination.constants.js";

export function parsePagination(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(MAX_PAGE_SIZE, Number(query.limit) || DEFAULT_PAGE_SIZE);
  return { page, limit, skip: (page - 1) * limit };
}
