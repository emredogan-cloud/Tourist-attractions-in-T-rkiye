import { NextResponse } from "next/server";
import { AppError, type ProblemDetails } from "./errors";
import { logger } from "./logger";

const PROBLEM_CONTENT_TYPE = "application/problem+json; charset=utf-8";

type JsonInit = ResponseInit & { headers?: Record<string, string> };

export function ok<T>(data: T, init?: JsonInit): NextResponse {
  return NextResponse.json(data, init);
}

export function cached<T>(
  data: T,
  options: { sMaxAge: number; staleWhileRevalidate?: number; etag?: string } = {
    sMaxAge: 3600,
  },
): NextResponse {
  const swr = options.staleWhileRevalidate ?? options.sMaxAge * 24;
  const headers: Record<string, string> = {
    "Cache-Control": `public, s-maxage=${options.sMaxAge}, stale-while-revalidate=${swr}`,
  };
  if (options.etag) headers.ETag = `"${options.etag}"`;
  return NextResponse.json(data, { headers });
}

export function noStore<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export function problem(error: AppError | unknown, instance?: string): NextResponse {
  if (error instanceof AppError) {
    const body: ProblemDetails = error.toProblem(instance);
    return NextResponse.json(body, {
      status: body.status,
      headers: { "Content-Type": PROBLEM_CONTENT_TYPE },
    });
  }
  logger.error({ err: error, instance }, "unhandled error in route");
  const body: ProblemDetails = {
    type: "https://docs.turkiye-tourism.app/errors/internal_error",
    title: "Internal Server Error",
    status: 500,
    ...(instance ? { instance } : {}),
  };
  return NextResponse.json(body, {
    status: 500,
    headers: { "Content-Type": PROBLEM_CONTENT_TYPE },
  });
}

export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response> | Response,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      const req = args[0] as { url?: string } | undefined;
      return problem(err, req?.url);
    }
  };
}
