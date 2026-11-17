import { z } from "zod";
import { db } from "@/lib/db";
import {
  apiError,
  assertOrigin,
  rateLimit,
  requestKey,
  readJson,
} from "@/lib/security";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await rateLimit(`feedback:${requestKey(request)}`, 5);
    const data = z
      .object({
        kind: z.enum(["SURVEY", "CONTACT"]),
        email: z.union([z.email(), z.literal("")]).optional(),
        answers: z.object({
          interest: z.string().max(100).optional(),
          design: z.string().max(100).optional(),
          budget: z.string().max(100).optional(),
          concern: z.string().max(2000).optional(),
          message: z.string().min(5).max(3000).optional(),
        }),
        website: z.literal("").default(""),
      })
      .parse(await readJson(request));
    await db.feedback.create({
      data: {
        kind: data.kind,
        email: data.email || null,
        answers: data.answers,
      },
    });
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
