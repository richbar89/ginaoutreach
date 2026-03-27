import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { subject, body } = await req.json();
  if (!subject && !body) {
    return NextResponse.json({ positive: false, reason: "No content" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `You are classifying a brand reply email to a food content creator's partnership pitch.

Email subject: ${subject}
Email body: ${body?.slice(0, 1000)}

Is this a POSITIVE reply? A positive reply shows interest, asks for more info, proposes a call, offers a deal, or is generally warm/encouraging. A negative reply declines or says not interested. Neutral/out-of-office/auto-replies are not positive.

Reply with JSON only: {"positive": true/false, "confidence": 0-100, "reason": "one sentence"}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text.match(/\{.*\}/s)?.[0] || "{}");

    return NextResponse.json({
      positive: parsed.positive ?? false,
      confidence: parsed.confidence ?? 0,
      reason: parsed.reason ?? "",
    });
  } catch {
    return NextResponse.json({ positive: false, reason: "Classification unavailable" });
  }
}
