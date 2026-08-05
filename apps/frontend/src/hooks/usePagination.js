import { useState } from "react";

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  return { page, limit, setPage, setLimit, next: () => setPage((p) => p + 1), prev: () => setPage((p) => Math.max(1, p - 1)) };
}
