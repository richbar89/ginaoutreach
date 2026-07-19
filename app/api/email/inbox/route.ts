import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAccountForUser, listInboxMessages } from "@/lib/nylas";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getAccountForUser(userId);
  if (!account) {
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
  }

  try {
    const messages = await listInboxMessages(account.grantId, 50);
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load inbox.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
