"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

export async function getPrices() {
  const supabase = await createClient();
  await requireAuth();

  const { data: fuelTypes, error: ftError } = await supabase
    .from("fuel_types")
    .select("*")
    .order("name");
  if (ftError) throw new Error(ftError.message);

  const prices = await Promise.all(
    fuelTypes.map(async (ft) => {
      const { data } = await supabase
        .from("fuel_prices")
        .select("*")
        .eq("fuel_type_id", ft.id)
        .order("effective_from", { ascending: false })
        .limit(1)
        .maybeSingle();
      return {
        fuel_type: ft,
        current_price: data,
      };
    })
  );

  return prices;
}

export async function setPrice(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const fuelTypeId = formData.get("fuel_type_id") as string;
  const price = formData.get("price") as string;
  if (!fuelTypeId || !price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) throw new Error("بيانات غير صالحة");

  const today = new Date().toISOString().split("T")[0];
  const numericPrice = parseFloat(price);

  const { data: existing } = await supabase
    .from("fuel_prices")
    .select("id")
    .eq("fuel_type_id", fuelTypeId)
    .eq("effective_from", today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("fuel_prices")
      .update({ price: numericPrice })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("fuel_prices").insert({
      fuel_type_id: fuelTypeId,
      price: numericPrice,
      effective_from: today,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/prices");
}

export async function getHistory(fuelTypeId: string) {
  const supabase = await createClient();
  await requireAuth();
  const { data, error } = await supabase
    .from("fuel_prices")
    .select("*")
    .eq("fuel_type_id", fuelTypeId)
    .order("effective_from", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
