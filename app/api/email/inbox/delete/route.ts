import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteMessage, getAccountForUser } from "@/lib/nylas";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ids } = await request.json();
  const idList: string[] = Array.isArray(ids) ? ids : id ? [id] : [];
  if (idList.length === 0) {
    return NextResponse.json({ error: "Missing message ids." }, { status: 400 });
  }

  const account = await getAccountForUser(userId);
  if (!account) return NextResponse.json({ error: "No email account connected." }, { status: 401 });

  try {
    for (const messageId of idList) {
      await deleteMessage(account.grantId, messageId);
    }
    return NextResponse.json({ success: true, deleted: idList.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
