export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
};

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, unknown>;
  readonly expose: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: Record<string, unknown>;
      expose?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = this.constructor.name;
    this.status = options.status ?? 500;
    this.code = options.code ?? "internal_error";
    this.details = options.details;
    this.expose = options.expose ?? this.status < 500;
  }

  toProblem(instance?: string): ProblemDetails {
    return {
      type: `https://docs.turkiye-tourism.app/errors/${this.code}`,
      title: this.message,
      status: this.status,
      ...(this.details ? { errors: this.details as Record<string, string[]> } : {}),
      ...(instance ? { instance } : {}),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: Record<string, unknown>) {
    super(message, { status: 400, code: "validation_error", details, expose: true });
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, { status: 404, code: "not_found", expose: true });
  }
}

export class AuthError extends AppError {
  constructor(message = "Authentication required") {
    super(message, { status: 401, code: "unauthorized", expose: true });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, { status: 403, code: "forbidden", expose: true });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, { status: 409, code: "conflict", expose: true });
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSec: number) {
    super("Rate limit exceeded", {
      status: 429,
      code: "rate_limit",
      details: { retryAfter: retryAfterSec },
      expose: true,
    });
  }
}

export class UpstreamError extends AppError {
  constructor(provider: string, message = "Upstream service unavailable", cause?: unknown) {
    super(message, {
      status: 502,
      code: "upstream_unavailable",
      details: { provider },
      expose: true,
      cause,
    });
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
