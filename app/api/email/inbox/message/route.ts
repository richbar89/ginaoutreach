import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAccountForUser, getMessage } from "@/lib/nylas";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "Missing message id." }, { status: 400 });

  const account = await getAccountForUser(userId);
  if (!account) return NextResponse.json({ error: "No email account connected." }, { status: 401 });

  try {
    const message = await getMessage(account.grantId, id);
    return NextResponse.json(message);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load message.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
