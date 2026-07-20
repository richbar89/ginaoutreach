import { NextResponse } from "next/server";
import crypto from "crypto";
import { processIncomingReply } from "@/lib/replies";

export const dynamic = "force-dynamic";

// Nylas verifies the endpoint by asking us to echo a challenge
export async function GET(request: Request) {
  const challenge = new URL(request.url).searchParams.get("challenge");
  if (challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const raw = await request.text();

  // Verify the payload came from Nylas when a secret is configured
  const secret = process.env.NYLAS_WEBHOOK_SECRET;
  if (secret) {
    const signature = request.headers.get("x-nylas-signature") ?? "";
    const expected = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("hex");
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  try {
    const event = JSON.parse(raw);
    if (event?.type === "message.created") {
      const msg = event?.data?.object;
      const grantId: string | undefined = event?.data?.grant_id ?? msg?.grant_id;
      const fromEmail: string | undefined = msg?.from?.[0]?.email;
      if (grantId && fromEmail) {
        await processIncomingReply(
          grantId,
          fromEmail,
          msg?.subject ?? "",
          msg?.snippet ?? ""
        );
      }
    }
  } catch {
    // Malformed payloads are acknowledged, not retried forever
  }

  return NextResponse.json({ ok: true });
}
