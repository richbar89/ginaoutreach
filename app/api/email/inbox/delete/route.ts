import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

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
      await client.messageMove(`${uid}`, "[Gmail]/Trash", { uid: true });
    } finally {
      lock.release();
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete.";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}
