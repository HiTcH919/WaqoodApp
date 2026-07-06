import { createClient } from "@/lib/supabase/server";
import { currentMonthStr } from "@/lib/constants";
import { getSettings } from "@/lib/actions/settings";
import { ReportsClient } from "./reports-client";

interface Props {
  searchParams: Promise<{ month?: string }>;
}

export default async function ReportsPage({ searchParams }: Props) {
  const { month } = await searchParams;
  const selectedMonth = month || currentMonthStr();
  const supabase = await createClient();

  const [batchesRes, deductionsRes, settings] = await Promise.all([
    supabase
      .from("coupon_batches")
      .select("*, fuel_types(name), vehicles(plate), departments(name)")
      .eq("month", selectedMonth)
      .order("created_at", { ascending: false }),
    supabase
      .from("deductions")
      .select("*, vehicles(plate), departments(name)")
      .eq("month", selectedMonth)
      .order("created_at", { ascending: false }),
    getSettings(),
  ]);

  return (
    <ReportsClient
      batches={batchesRes.data || []}
      deductions={deductionsRes.data || []}
      month={selectedMonth}
      settings={settings}
    />
  );
}
