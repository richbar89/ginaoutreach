import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import PostalMime from "postal-mime";

export async function POST(request: Request) {
  const { gmailEmail, appPassword, uid } = await request.json();
  if (!gmailEmail || !appPassword || !uid) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
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
      // Fetch full source
      const msg = await client.fetchOne(`${uid}`, { source: true, envelope: true, flags: true }, { uid: true });
      if (!msg) return NextResponse.json({ error: "Message not found." }, { status: 404 });

      // Mark as read
      await client.messageFlagsAdd(`${uid}`, ["\\Seen"], { uid: true });

      if (!msg.source) return NextResponse.json({ error: "Could not read message." }, { status: 500 });

      // Parse email
      const parsed = await PostalMime.parse(msg.source as unknown as ArrayBuffer);
      const body = parsed.text || parsed.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";

      const env = msg.envelope;
      const sender = env?.from?.[0];
      const envDate = env?.date instanceof Date ? env.date.toISOString() : "";

      return NextResponse.json({
        uid: msg.uid,
        subject: env?.subject || "(no subject)",
        from: {
          name: sender?.name || sender?.address || "",
          address: sender?.address || "",
        },
        date: envDate,
        isRead: true,
        body,
      });
    } finally {
      lock.release();
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}
