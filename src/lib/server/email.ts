import { appendFile } from "node:fs/promises";
import nodemailer, { type Transporter } from "nodemailer";

import { SITE } from "@/config/site";
import { env } from "@/lib/server/env";

let transport: Transporter | undefined;

function transporter() {
  if (!env.smtp.host) return undefined;
  transport ??= nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user
      ? { user: env.smtp.user, pass: env.smtp.pass }
      : undefined,
  });
  return transport;
}

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function send(
  to: string,
  subject: string,
  lines: string[],
  action?: { label: string; url: string },
) {
  const text = [
    ...lines,
    ...(action ? ["", `${action.label}: ${action.url}`] : []),
    "",
    `— ${SITE.name}`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#1b2a3d">
${lines.map((line) => `<p>${escape(line)}</p>`).join("\n")}
${
  action
    ? `<p><a href="${escape(action.url)}" style="display:inline-block;padding:10px 18px;background:#164b91;color:#fff;border-radius:8px;text-decoration:none">${escape(action.label)}</a></p>
<p style="font-size:13px;color:#5b6b80">Or paste this link into your browser: ${escape(action.url)}</p>`
    : ""
}
<p style="color:#5b6b80">— ${escape(SITE.name)}</p></div>`;

  const mailer = transporter();
  if (!mailer) {
    if (env.isProd)
      console.warn("[email] SMTP_HOST is not set; email not sent to", to);
    const message = `\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`;
    console.info(message);
    if (env.mailOutbox) await appendFile(env.mailOutbox, message);
    return;
  }
  await mailer.sendMail({ from: env.smtp.from, to, subject, text, html });
}

const link = (path: string, token: string) =>
  `${env.appUrl}${path}/?token=${encodeURIComponent(token)}`;

export const emails = {
  signupLink: (to: string, firstName: string, token: string) =>
    send(
      to,
      `Finish joining ${SITE.name}`,
      [
        `Hello ${firstName},`,
        `Thank you for joining the ${SITE.name} member portal. Open the link below within 24 hours to confirm your email address and choose a password.`,
        "If you did not ask for this, you can ignore this email.",
      ],
      { label: "Set my password", url: link("/set-password", token) },
    ),

  alreadyRegistered: (to: string, firstName: string) =>
    send(
      to,
      `You already have a ${SITE.name} account`,
      [
        `Hello ${firstName},`,
        "Someone (hopefully you) tried to create a member account with this email address, but you already have one.",
        "You can sign in, or reset your password if you have forgotten it.",
      ],
      { label: "Sign in", url: `${env.appUrl}/login/` },
    ),

  resetLink: (to: string, firstName: string, token: string) =>
    send(
      to,
      `Reset your ${SITE.name} password`,
      [
        `Hello ${firstName},`,
        "We received a request to reset your password. The link below works once and expires in one hour.",
        "If you did not ask for this, you can ignore this email; your password will not change.",
      ],
      { label: "Choose a new password", url: link("/reset-password", token) },
    ),

  verifyEmail: (to: string, firstName: string, token: string) =>
    send(
      to,
      "Confirm your new email address",
      [
        `Hello ${firstName},`,
        `Please confirm that you want to use this address for your ${SITE.name} account. The link expires in 24 hours.`,
      ],
      {
        label: "Confirm this address",
        url: `${env.appUrl}/api/auth/verify-email/?token=${encodeURIComponent(token)}`,
      },
    ),

  approved: (to: string, firstName: string) =>
    send(
      to,
      `Your ${SITE.name} account is ready`,
      [
        `Hello ${firstName},`,
        "The church office has approved your member account. You can now sign in.",
      ],
      { label: "Sign in", url: `${env.appUrl}/login/` },
    ),

  deletionRequested: (to: string, memberName: string, memberUrl: string) =>
    send(
      to,
      "A member asked for their account to be deleted",
      [
        `${memberName} has asked for their account and personal data to be deleted.`,
        "Please confirm with them before removing the record, as the Nigeria Data Protection Act 2023 requires a timely response.",
      ],
      { label: "Open their record", url: memberUrl },
    ),
};
