"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { createSupabaseClient } from "./supabase";

/**
 * Returns an async function that resolves to an authenticated Supabase client.
 * Use inside useEffect or event handlers — not during render.
 *
 * const getDb = useDb();
 * const db = await getDb();
 * const { data } = await db.from('deals').select('*');
 */
export function useDb() {
  const { getToken } = useAuth();
  return useCallback(async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Not authenticated");
    return createSupabaseClient(token);
  }, [getToken]);
}
