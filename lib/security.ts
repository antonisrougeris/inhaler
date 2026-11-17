import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
export class AppError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}
export const token = () => randomBytes(32).toString("hex");
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function assertOrigin(request: Request) {
  const expected = new URL(process.env.APP_URL ?? "http://localhost:3000")
    .origin;
  if (request.headers.get("origin") !== expected)
    throw new AppError("INVALID_ORIGIN", 403);
}
export async function rateLimit(key: string, limit = 10) {
  const bucket = Math.floor(Date.now() / 600000);
  const id = hash(`${key}:${bucket}`);
  const record = await db.rateLimit.upsert({
    where: { key: id },
    create: { key: id, count: 1, expiresAt: new Date((bucket + 1) * 600000) },
    update: { count: { increment: 1 } },
  });
  if (record.count > limit) throw new AppError("TOO_MANY_REQUESTS", 429);
}
export function requestKey(request: Request) {
  // Only trust this header when the deployment proxy overwrites it (see ops/nginx.conf).
  return process.env.TRUST_PROXY === "true"
    ? (request.headers.get("x-real-ip") ?? "unknown")
    : "local";
}
export function apiError(error: unknown) {
  if (error instanceof AppError)
    return Response.json({ error: error.code }, { status: error.status });
  if (error instanceof Error && error.name === "ZodError")
    return Response.json({ error: "INVALID_INPUT" }, { status: 400 });
  console.error(
    "Request failed",
    error instanceof Error ? error.name : "unknown",
  );
  return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
}
export async function readJson(request: Request) {
  const body = await request.text();
  if (body.length > 32768) throw new AppError("BODY_TOO_LARGE", 413);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new AppError("INVALID_JSON");
  }
}
