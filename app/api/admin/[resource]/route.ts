import { requireAdmin } from "@/lib/admin-auth";
import {
  listResource,
  saveResource,
  deleteResource,
} from "@/lib/admin-resources";
import { apiError, assertOrigin, readJson } from "@/lib/security";
type Context = { params: Promise<{ resource: string }> };
export async function GET(_: Request, c: Context) {
  try {
    await requireAdmin();
    return Response.json(await listResource((await c.params).resource));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request, c: Context) {
  try {
    assertOrigin(request);
    const resource = (await c.params).resource;
    const user = await requireAdmin(
      ["settings", "compliance"].includes(resource),
    );
    const id = new URL(request.url).searchParams.get("id") ?? undefined;
    return Response.json(
      await saveResource(resource, await readJson(request), user.id, id),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, c: Context) {
  try {
    assertOrigin(request);
    const user = await requireAdmin();
    await deleteResource(
      (await c.params).resource,
      new URL(request.url).searchParams.get("id") ?? "",
      user.id,
    );
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
