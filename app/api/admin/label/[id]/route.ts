import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { shippingProvider } from "@/lib/integrations/shipping";
import { apiError } from "@/lib/security";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const shipment = await db.shipment.findUniqueOrThrow({
      where: { id: (await params).id },
    });
    return new Response(await shippingProvider().label(shipment.parcelId), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="label.pdf"',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
