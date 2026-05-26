export type ApiError = {
  code: string;
  message: string;
  field: string | null;
  details: Record<string, unknown>;
};

export type ApiResponse<T> = {
  data: T;
  meta: Record<string, unknown>;
  errors: ApiError[];
};

export class ApiClientError extends Error {
  errors: ApiError[];
  status: number;

  constructor(message: string, errors: ApiError[], status: number) {
    super(message);
    this.name = "ApiClientError";
    this.errors = errors;
    this.status = status;
  }
}
