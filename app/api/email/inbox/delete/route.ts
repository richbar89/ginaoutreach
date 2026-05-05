import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";

export async function POST(request: Request) {
  const { gmailEmail, appPassword, uid, uids } = await request.json();

  // Accept either a single uid or an array of uids
  const uidList: number[] = Array.isArray(uids) ? uids : uid ? [uid] : [];

  if (!gmailEmail || !appPassword || uidList.length === 0) {
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
      await client.messageMove(uidList.join(","), "[Gmail]/Trash", { uid: true });
    } finally {
      lock.release();
    }
    return NextResponse.json({ success: true, deleted: uidList.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete.";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await client.logout().catch(() => {});
  }
}
