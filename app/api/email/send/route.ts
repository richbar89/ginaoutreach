import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  const { to, subject, body, gmailEmail, appPassword } = await request.json();

  if (!to || !subject || !body || !gmailEmail || !appPassword) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailEmail, pass: appPassword },
  });

  try {
    await transporter.sendMail({ from: gmailEmail, to, subject, text: body });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to send.";
    const status = msg.includes("535") || msg.includes("Invalid login") || msg.includes("Username and Password not accepted") ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Invalid Gmail credentials. Check your App Password in Settings." : msg }, { status });
  }
}
