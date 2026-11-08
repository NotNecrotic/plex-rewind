import { tx } from "../server/notify.js";

const to = process.argv[2];

if (!tx) {
  console.error("SMTP_URL is not set in config");
  process.exit(1);
}

console.log(
  `Connecting to ${tx.options.host}:${tx.options.port} (secure=${tx.options.secure}) ...`,
);

try {
  await tx.verify();
  console.log("Connected and logged in OK");
} catch (e) {
  console.error("Connection/login FAILED:", e.code || "", e.message);
  process.exit(1);
}

if (!to) process.exit(0);

try {
  const r = await tx.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: "We've been watching...",
    text: "Your Plex history knows what you did. Fortunately, this is just a test.",
  });
  console.log(
    "Server response:",
    r.response,
    "| accepted:",
    r.accepted,
    "| rejected:",
    r.rejected,
  );
} catch (e) {
  console.error("Send FAILED:", e.code || "", e.message);
}
