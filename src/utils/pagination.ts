export const buildPagination = (page = 1, limit = 20) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(Math.min(limit, 100), 1);
  const offset = (safePage - 1) * safeLimit;
  return { limit: safeLimit, offset };
};
