export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", code = "BAD_REQUEST", details?: unknown) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
    super(message, 401, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access", code = "FORBIDDEN") {
    super(message, 403, code);
  }
}

export class MacDeniedError extends AppError {
  public readonly requiredLevel: number;

  constructor(requiredLevel: number, message = "Access denied: insufficient security clearance") {
    super(message, 403, "MAC_DENIED", { requiredLevel });
    this.requiredLevel = requiredLevel;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", code = "NOT_FOUND") {
    super(message, 404, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", code = "CONFLICT") {
    super(message, 409, code);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Payload too large", code = "PAYLOAD_TOO_LARGE") {
    super(message, 413, code);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfterSeconds?: number;

  constructor(message = "Too many requests", retryAfterSeconds?: number) {
    super(message, 429, "RATE_LIMITED");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AccountLockedError extends AppError {
  constructor(remainingSeconds: number) {
    super(
      `Account temporarily locked due to consecutive failed attempts. Please retry in ${remainingSeconds}s.`,
      401,
      "LOCKED",
      { remainingSeconds }
    );
  }
}

export class NotImplementedError extends AppError {
  constructor(contractMessage: string) {
    super(`Not implemented: ${contractMessage}`, 501, "NOT_IMPLEMENTED");
  }
}
