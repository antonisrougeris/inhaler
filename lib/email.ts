import nodemailer from "nodemailer";
import { db } from "./db";
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function emailTemplate(
  brand: string,
  title: string,
  body: string,
  url?: string,
) {
  return `<!doctype html><html><body style="margin:0;background:#eeeae3;font-family:Arial,sans-serif;color:#28251f"><table role="presentation" width="100%"><tr><td style="padding:48px 24px"><table role="presentation" style="max-width:560px;margin:auto;background:#fffdf8;width:100%;padding:40px"><tr><td><p style="letter-spacing:5px">${escapeHtml(brand)}</p><h1>${escapeHtml(title)}</h1><p style="line-height:1.7">${escapeHtml(body)}</p>${url ? `<a style="display:inline-block;padding:16px 24px;background:#28251f;color:white" href="${escapeHtml(url)}">Continue / Συνέχεια →</a>` : ""}<p style="font-size:12px;margin-top:40px">${escapeHtml(brand)} · Greece</p></td></tr></table></td></tr></table></body></html>`;
}
export async function queueEmail(
  to: string,
  subject: string,
  body: string,
  url?: string,
  dedupeKey = crypto.randomUUID(),
) {
  const settings = await db.storeSettings.findUniqueOrThrow({
    where: { id: "store" },
  });
  const job = await db.emailJob.upsert({
    where: { dedupeKey },
    update: {},
    create: {
      to,
      subject,
      html: emailTemplate(settings.brandName, subject, body, url),
      dedupeKey,
    },
  });
  await sendPendingEmails();
  return job;
}
export async function sendPendingEmails() {
  if (!process.env.SMTP_HOST) return { sent: 0, configured: false };
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  const jobs = await db.emailJob.findMany({
    where: { status: "PENDING", nextAttemptAt: { lte: new Date() } },
    take: 25,
  });
  let sent = 0;
  for (const job of jobs) {
    const locked = await db.emailJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: { status: "SENDING", attempts: { increment: 1 } },
    });
    if (!locked.count) continue;
    try {
      await transport.sendMail({
        from: process.env.EMAIL_FROM,
        to: job.to,
        subject: job.subject,
        html: job.html,
        messageId: `<${job.id}@${new URL(process.env.APP_URL!).hostname}>`,
      });
      await db.emailJob.update({
        where: { id: job.id },
        data: { status: "SENT", html: "" },
      });
      sent++;
    } catch {
      await db.emailJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 4 ? "FAILED" : "PENDING",
          nextAttemptAt: new Date(Date.now() + 60000 * 2 ** job.attempts),
        },
      });
    }
  }
  return { sent, configured: true };
}
