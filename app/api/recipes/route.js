import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error, count } = await supabase
    .from("recipes")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  return NextResponse.json({ 
    data: data ?? [], 
    error: error?.message ?? null,
    count,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30)
  });
}