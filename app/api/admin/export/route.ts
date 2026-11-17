import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError } from "@/lib/security";
const csv = (s: string) =>
  '"' + (/^[=+@-]/.test(s) ? "'" : "") + s.replaceAll('"', '""') + '"';
export async function GET() {
  try {
    await requireAdmin();
    const rows = await db.subscriber.findMany({
      select: { email: true, status: true, source: true, consentAt: true },
    });
    return new Response(
      [
        "email,status,source,consentAt",
        ...rows.map((r) =>
          [r.email, r.status, r.source, r.consentAt.toISOString()]
            .map(csv)
            .join(","),
        ),
      ].join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="waitlist.csv"',
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return apiError(e);
  }
}
