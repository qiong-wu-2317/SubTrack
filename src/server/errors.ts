import "server-only";
import type { z } from "zod";

export type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "INVALID_TRANSITION" | "INTERNAL";

export type ErrorBody = {
  error: { code: ErrorCode; message: string; fields?: Record<string, string> };
};

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  INVALID_TRANSITION: 409,
  INTERNAL: 500,
};

export function errorResponse(
  code: ErrorCode,
  message: string,
  fields?: Record<string, string>,
): Response {
  const body: ErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  return Response.json(body, { status: HTTP_STATUS[code] });
}

/** API.md error shape: first message per top-level field. */
export function validationErrorResponse(error: z.ZodError): Response {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    fields[String(issue.path[0] ?? "_")] ??= issue.message;
  }
  return errorResponse("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid input", fields);
}

/** Log server-side and return a generic 500, so stack traces never reach the client. */
export function internalErrorResponse(err: unknown): Response {
  console.error(err);
  return errorResponse("INTERNAL", "Something went wrong");
}
