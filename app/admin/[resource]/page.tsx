import { notFound } from "next/navigation";
import { resourceSchemas, readOnlyResources } from "@/lib/admin-resources";
import { ResourceManager } from "@/components/admin";
export default async function Page({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  if (
    !(resource in resourceSchemas) &&
    !readOnlyResources.some((x) => x === resource)
  )
    notFound();
  return (
    <>
      <p className="eyebrow">FORM AIR / STUDIO</p>
      <h1 style={{ marginTop: 20 }}>
        {resource.charAt(0).toUpperCase() + resource.slice(1)}.
      </h1>
      <ResourceManager key={resource} resource={resource} />
    </>
  );
}
