import nodemailer from "nodemailer";
import { read } from "./store.js";
import { periodOf, label } from "./periods.js";

const WORD = { week: "weekly", month: "monthly", year: "yearly" };

export const tx = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_TLS === "true",
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    })
  : null;

export async function notify(key, built) {
  if (!tx) return console.log("[MAIL] SMTP_URL not set, no emails sent");

  const users = read("users", {}),
    p = periodOf(key),
    base = process.env.BASE_URL || "http://localhost:3001";

  let sent = 0;

  for (const b of built) {
    const usr = users[b.uid];
    if (!usr) {
      console.log(`[MAIL] skip ${b.uid}: user does not exist`);
      continue;
    }

    if (!usr.email) {
      console.log(`[MAIL] skip ${usr.username}: no provided email address`);
      continue;
    }

    if (!usr.notify?.[p]) {
      console.log(`[MAIL] skip ${usr.username}: ${WORD[p]} emails are off`);
      continue;
    }

    try {
      await tx.sendMail({
        from: process.env.MAIL_FROM,
        to: usr.email,
        subject: `Your ${WORD[p]} Plex Rewind is ready`,
        html: `<h2>${label(key)}: ${b.hours} hours on Plex</h2><p>Your ${WORD[p]} Rewind is ready.</p><p><a href="${base}/rewind/${key}">Watch it now</a></p><p style="color:#888;font-size:12px">Change email settings on your Rewind home page.</p>`,
      });
      sent++;
      console.log(`[MAIL] sent to ${usr.email}`);
    } catch (e) {
      console.error(
        `[MAIL] FAILED for ${usr.email}: ${e.code || ""} ${e.message}`,
      );
    }
  }

  console.log(`[MAIL] ${sent}/${built.length} emails sent for ${key}`);
}
