import { headers } from "next/headers";
import { auth } from "./auth";
import { AppError } from "./security";
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new AppError("UNAUTHORIZED", 401);
  return session.user;
}
export async function requireAdmin(owner = false) {
  const user = await requireUser();
  if (
    !["ADMIN", "OWNER"].includes(user.role) ||
    (owner && user.role !== "OWNER")
  )
    throw new AppError("FORBIDDEN", 403);
  return user;
}
