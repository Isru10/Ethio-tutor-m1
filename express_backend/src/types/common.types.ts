export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export const paginate = <T>(items: T[], total: number, page: number, pageSize: number): PaginatedResponse<T> => ({
  data: items,
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
});
