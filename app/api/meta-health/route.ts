import { requireAdmin } from "@/lib/adminAuth";
import { NextResponse } from "next/server";
import { checkMetaHealth } from "@/lib/metaHealth";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  return NextResponse.json(await checkMetaHealth());
}
