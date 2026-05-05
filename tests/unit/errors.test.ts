import { describe, expect, it } from "vitest";
import { AppError, NotFoundError, ValidationError, RateLimitError, isAppError } from "~/lib/errors";

describe("AppError hierarchy", () => {
  it("AppError defaults", () => {
    const e = new AppError("boom");
    expect(e.status).toBe(500);
    expect(e.code).toBe("internal_error");
    expect(isAppError(e)).toBe(true);
  });

  it("NotFoundError", () => {
    const e = new NotFoundError("Attraction");
    expect(e.status).toBe(404);
    expect(e.code).toBe("not_found");
    expect(e.message).toBe("Attraction not found");
  });

  it("ValidationError carries details", () => {
    const e = new ValidationError("bad", { name: ["required"] });
    expect(e.status).toBe(400);
    const problem = e.toProblem("/api/v1/attractions");
    expect(problem.status).toBe(400);
    expect(problem.errors).toEqual({ name: ["required"] });
    expect(problem.instance).toBe("/api/v1/attractions");
  });

  it("RateLimitError exposes retryAfter", () => {
    const e = new RateLimitError(30);
    expect(e.status).toBe(429);
    expect(e.details).toEqual({ retryAfter: 30 });
  });

  it("isAppError", () => {
    expect(isAppError(new Error("plain"))).toBe(false);
    expect(isAppError(new AppError("x"))).toBe(true);
  });
});
