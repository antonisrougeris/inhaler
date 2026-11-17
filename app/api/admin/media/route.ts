import { z } from "zod";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/admin-auth";
import { apiError, assertOrigin, AppError } from "@/lib/security";
function client() {
  if (!process.env.S3_BUCKET) throw new AppError("MEDIA_NOT_CONFIGURED", 503);
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  });
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    await requireAdmin(true);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 10 * 1024 * 1024)
      throw new AppError("INVALID_FILE");
    const ext = (
      {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "application/pdf": "pdf",
      } as Record<string, string>
    )[file.type];
    if (!ext) throw new AppError("INVALID_FILE_TYPE");
    const bytes = Buffer.from(await file.arrayBuffer());
    const valid =
      ext === "pdf"
        ? bytes.subarray(0, 5).toString() === "%PDF-"
        : ext === "png"
          ? bytes.subarray(1, 4).toString() === "PNG"
          : ext === "jpg"
            ? bytes[0] === 255 && bytes[1] === 216
            : bytes.subarray(8, 12).toString() === "WEBP";
    if (!valid) throw new AppError("INVALID_FILE_SIGNATURE");
    const key = `private/${crypto.randomUUID()}.${ext}`;
    await client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: bytes,
        ContentType: file.type,
        ContentDisposition: "attachment",
      }),
    );
    return Response.json({ key });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const key = z
      .string()
      .regex(/^private\/[a-f0-9-]+\.(pdf|png|jpg|webp)$/)
      .parse(new URL(request.url).searchParams.get("key"));
    return Response.json({
      url: await getSignedUrl(
        client(),
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
        { expiresIn: 60 },
      ),
    });
  } catch (e) {
    return apiError(e);
  }
}
