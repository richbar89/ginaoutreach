import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const { gmailEmail, appPassword } = await request.json();

  if (!gmailEmail || !appPassword) {
    return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailEmail, pass: appPassword },
  });

  try {
    await transporter.verify();
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Verification failed.";
    const status = msg.includes("535") || msg.includes("Invalid login") || msg.includes("Username and Password not accepted") ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Invalid credentials. Make sure you're using an App Password, not your regular Gmail password." : msg }, { status });
  }
}
