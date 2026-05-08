import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function advanceToNextWindow(t: Date, windowStart: number, sendDays: string[]): Date {
  const d = new Date(t);
  for (let tries = 0; tries < 14; tries++) {
    const dayName = DAY_NAMES[d.getDay()];
    if (sendDays.includes(dayName)) {
      const hour = d.getHours();
      if (hour < windowStart) {
        d.setHours(windowStart, randomInt(0, 30), 0, 0);
        return d;
      }
      // Already in or past window — advance to next valid day
    }
    d.setDate(d.getDate() + 1);
    d.setHours(windowStart, randomInt(0, 30), 0, 0);
  }
  return d;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data: campaign, error: campErr } = await db
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campErr || !campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const contacts = (campaign.contacts as Array<{ email: string; name: string; company: string; position: string }>) || [];
  const delayMinMins: number = (campaign.delay_min_mins as number) || 3;
  const delayMaxMins: number = (campaign.delay_max_mins as number) || 10;
  const sendWindowStart: number = (campaign.send_window_start as number) ?? 8;
  const sendWindowEnd: number = (campaign.send_window_end as number) ?? 18;
  const sendDays: string[] = (campaign.send_days as string[]) || ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const emailsPerDay: number = (campaign.emails_per_day as number) || 25;

  // Skip already-enrolled contacts
  const { data: existing } = await db
    .from("sequence_contacts")
    .select("contact_email")
    .eq("campaign_id", id)
    .eq("user_id", userId);

  const alreadyEnrolled = new Set((existing || []).map((r) => (r.contact_email as string).toLowerCase()));
  const toEnroll = contacts.filter((c) => !alreadyEnrolled.has(c.email.toLowerCase()));

  if (toEnroll.length === 0) {
    return NextResponse.json({ enrolled: 0, message: "All contacts already enrolled" });
  }

  // Schedule with staggered send times, respecting window + daily limit
  let currentTime = new Date();
  const inWindow =
    DAY_NAMES[currentTime.getDay()] && sendDays.includes(DAY_NAMES[currentTime.getDay()]) &&
    currentTime.getHours() >= sendWindowStart &&
    currentTime.getHours() < sendWindowEnd;

  if (!inWindow) {
    currentTime = advanceToNextWindow(currentTime, sendWindowStart, sendDays);
  }

  let dailyCount = 0;
  let currentDay = currentTime.toDateString();

  const rows = toEnroll.map((contact) => {
    if (dailyCount >= emailsPerDay || currentTime.toDateString() !== currentDay) {
      if (currentTime.toDateString() !== currentDay) {
        dailyCount = 0;
        currentDay = currentTime.toDateString();
      }
      if (dailyCount >= emailsPerDay) {
        const nextDay = new Date(currentTime);
        nextDay.setDate(nextDay.getDate() + 1);
        nextDay.setHours(sendWindowStart, randomInt(0, 30), 0, 0);
        currentTime = advanceToNextWindow(nextDay, sendWindowStart, sendDays);
        dailyCount = 0;
        currentDay = currentTime.toDateString();
      }
    }

    const sendAt = new Date(currentTime);
    dailyCount++;

    // Advance by random delay for next contact
    const delaySecs = randomInt(delayMinMins * 60, delayMaxMins * 60);
    currentTime = new Date(currentTime.getTime() + delaySecs * 1000);

    // If we've passed the window end, move to next valid day
    if (currentTime.getHours() >= sendWindowEnd) {
      const nextDay = new Date(currentTime);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(sendWindowStart, randomInt(0, 30), 0, 0);
      currentTime = advanceToNextWindow(nextDay, sendWindowStart, sendDays);
      dailyCount = 0;
      currentDay = currentTime.toDateString();
    }

    return {
      campaign_id: id,
      user_id: userId,
      contact_email: contact.email,
      contact_name: contact.name,
      contact_company: contact.company,
      contact_position: contact.position,
      current_step: 1,
      next_send_at: sendAt.toISOString(),
      status: "active",
    };
  });

  const { error: insertErr } = await db.from("sequence_contacts").insert(rows);
  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  await db.from("campaigns").update({ status: "active" }).eq("id", id);

  return NextResponse.json({ enrolled: rows.length });
}
