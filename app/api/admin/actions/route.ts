import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, assertOrigin, readJson, AppError } from "@/lib/security";
import {
  serial,
  createShipment,
  refundOrder,
  commerceGate,
} from "@/lib/services/commerce";
import { sendPendingEmails } from "@/lib/email";
import { shippingProvider } from "@/lib/integrations/shipping";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("stock"),
    id: z.string(),
    delta: z.number().int().min(-100000).max(100000),
    reason: z.string().min(5).max(200),
  }),
  z.object({
    action: z.literal("mode"),
    mode: z.enum(["PRELAUNCH", "TEST", "LIVE"]),
  }),
  z.object({ action: z.literal("approve-product"), id: z.string() }),
  z.object({
    action: z.literal("approvals"),
    complianceApproved: z.boolean(),
    merchantApproved: z.boolean(),
  }),
  z.object({ action: z.literal("shipment"), id: z.string() }),
  z.object({ action: z.literal("refund"), id: z.string() }),
  z.object({ action: z.literal("tracking"), id: z.string() }),
  z.object({
    action: z.literal("review"),
    id: z.string(),
    approved: z.boolean(),
  }),
  z.object({ action: z.literal("send-emails") }),
]);
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const input = schema.parse(await readJson(request));
    const user = await requireAdmin(
      ["mode", "approve-product", "approvals", "refund"].includes(input.action),
    );
    let result: unknown = { ok: true };
    if (input.action === "stock")
      result = await serial(async (tx) => {
        const inventory = await tx.inventory.findUniqueOrThrow({
          where: { variantId: input.id },
        });
        if (inventory.onHand + input.delta < inventory.reserved)
          throw new AppError("STOCK_BELOW_RESERVED");
        await tx.inventory.update({
          where: { variantId: input.id },
          data: { onHand: { increment: input.delta } },
        });
        return tx.inventoryMovement.create({
          data: {
            variantId: input.id,
            delta: input.delta,
            reason: input.reason,
            actorId: user.id,
          },
        });
      });
    if (input.action === "mode")
      result = await serial(async (tx) => {
        await tx.storeSettings.update({
          where: { id: "store" },
          data: { mode: input.mode },
        });
        if (input.mode !== "PRELAUNCH") await commerceGate(tx);
        return { ok: true };
      });
    if (input.action === "approvals")
      await db.storeSettings.update({
        where: { id: "store" },
        data: {
          complianceApproved: input.complianceApproved,
          merchantApproved: input.merchantApproved,
        },
      });
    if (input.action === "approve-product") {
      const product = await db.product.findUniqueOrThrow({
        where: { id: input.id },
        include: { compliance: true, variants: true },
      });
      if (
        product.demo ||
        !product.manufacturer ||
        !product.manufacturerContact ||
        !product.responsibleOperator ||
        !product.warningsEl ||
        !product.instructionsEl ||
        !product.variants.length ||
        product.variants.some((x) => !x.confirmedSpecifications) ||
        !product.compliance.some(
          (x) =>
            x.type === "INHALATION_ASSESSMENT" &&
            x.status === "APPROVED" &&
            x.reviewAt > new Date(),
        )
      )
        throw new AppError("COMPLIANCE_INCOMPLETE");
      await db.product.update({
        where: { id: input.id },
        data: { complianceStatus: "APPROVED" },
      });
    }
    if (input.action === "shipment")
      result = await createShipment(input.id, user.id);
    if (input.action === "refund")
      result = await refundOrder(input.id, user.id);
    if (input.action === "tracking") {
      const shipment = await db.shipment.findUniqueOrThrow({
        where: { id: input.id },
      });
      const status = await shippingProvider().track(shipment.parcelId);
      result = await db.shipment.update({
        where: { id: input.id },
        data: { status, tracking: { create: { status } } },
      });
    }
    if (input.action === "review")
      await db.review.update({
        where: { id: input.id },
        data: { approved: input.approved },
      });
    if (input.action === "send-emails") result = await sendPendingEmails();
    await db.auditLog.create({
      data: {
        actorId: user.id,
        action: input.action,
        entity: "admin",
        entityId: "id" in input ? input.id : "store",
        details: input,
      },
    });
    return Response.json(result);
  } catch (e) {
    return apiError(e);
  }
}
