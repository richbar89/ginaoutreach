import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

export async function POST(request: Request) {
  const { gmailEmail, appPassword } = await request.json();
  if (!gmailEmail || !appPassword) {
    return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: gmailEmail, pass: appPassword },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages ?? 0;
      if (total === 0) return NextResponse.json({ messages: [] });

      const from = Math.max(1, total - 49);
      const messages: unknown[] = [];

      for await (const msg of client.fetch(`${from}:*`, {
        envelope: true,
        flags: true,
        internalDate: true,
      })) {
        const env = msg.envelope;
        if (!env) continue;
        const sender = env.from?.[0];
        const envDate = env.date instanceof Date ? env.date.toISOString() : "";
        const intDate = msg.internalDate instanceof Date ? msg.internalDate.toISOString() : "";
        messages.push({
          uid: msg.uid,
          subject: env.subject || "(no subject)",
          from: {
            name: sender?.name || sender?.address || "",
            address: sender?.address || "",
          },
          date: envDate || intDate,
          isRead: msg.flags?.has("\\Seen") ?? false,
        });
      }

      return NextResponse.json({ messages: messages.reverse() });
    } finally {
      lock.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect.";
    if (msg.includes("AUTHENTICATIONFAILED") || msg.includes("Invalid credentials") || msg.includes("535")) {
      return NextResponse.json({ error: "Invalid credentials. Check your App Password." }, { status: 401 });
    }
    if (msg.includes("WEBALERT") || msg.includes("IMAP access") || msg.includes("[ALERT]")) {
      return NextResponse.json({ error: "IMAP_DISABLED" }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}
