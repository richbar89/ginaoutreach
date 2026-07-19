import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAccountForUser, sendMessage, textToHtml } from "@/lib/nylas";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { to, subject, body, replyToMessageId } = await request.json();
  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const account = await getAccountForUser(userId);
  if (!account) {
    return NextResponse.json({ error: "No email account connected. Connect one in Settings." }, { status: 401 });
  }

  try {
    await sendMessage(account.grantId, {
      to: { email: to },
      subject,
      htmlBody: textToHtml(body),
      replyToMessageId,
    });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
