"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateCost } from "@/lib/coupon-service";
import { requireAuth } from "@/lib/auth-utils";
import { IssueCouponSchema, UpdateCouponBatchSchema } from "@/lib/schemas";
import { z } from "zod";

// ─── Queries ──────────────────────────────────────────────

export async function getVehicleBatches(vehicleId: string, month: string) {
  const supabase = await createClient();
  await requireAuth();
  const { data, error } = await supabase
    .from("coupon_batches")
    .select("*, fuel_types(name), vehicles(plate)")
    .eq("vehicle_id", vehicleId)
    .eq("month", month)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllBatches(month: string) {
  const supabase = await createClient();
  await requireAuth();
  const { data, error } = await supabase
    .from("coupon_batches")
    .select("*, fuel_types(name), vehicles(plate), departments(name)")
    .eq("month", month)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

// ─── Helpers ────────────────────────────────────────────

async function checkSerialOverlap(
  startSerial: number,
  endSerial: number,
  excludeId?: string
) {
  const supabase = await createClient();
  let query = supabase
    .from("coupon_batches")
    .select("id, start_serial, end_serial")
    .or(`start_serial.lte.${endSerial},end_serial.gte.${startSerial}`);
  if (excludeId) query = query.neq("id", excludeId);
  const { data } = await query;
  if (data && data.length > 0) {
    throw new Error("نطاق الأرقام المسلسلة يتداخل مع دفعة موجودة مسبقاً");
  }
}

async function getCurrentFuelPrice(fuelTypeId: string): Promise<number> {
  const supabase = await createClient();
  const { data: priceRow, error } = await supabase
    .from("fuel_prices")
    .select("price")
    .eq("fuel_type_id", fuelTypeId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();
  if (error || !priceRow) throw new Error("لا يوجد سعر للوقود المحدد");
  return parseFloat(String(priceRow.price));
}

// ─── Mutations ──────────────────────────────────────────

export async function issueCoupons(input: z.infer<typeof IssueCouponSchema>) {
  const validated = IssueCouponSchema.parse(input);
  const supabase = await createClient();
  const user = await requireAuth();

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, departments!inner(organization_id)")
    .eq("id", validated.vehicle_id)
    .single();
  if (!vehicle) throw new Error("المركبة غير موجودة");

  const pricePerLitre = await getCurrentFuelPrice(validated.fuel_type_id);
  const cost = calculateCost(validated.litres, validated.count, pricePerLitre);

  await checkSerialOverlap(validated.start_serial, validated.end_serial);

  const { error } = await supabase.from("coupon_batches").insert({
    organization_id: (vehicle as any).departments.organization_id,
    vehicle_id: validated.vehicle_id,
    department_id: (vehicle as any).department_id,
    month: validated.month,
    count: validated.count,
    coupon_capacity: validated.litres,
    start_serial: validated.start_serial,
    end_serial: validated.end_serial,
    fuel_type_id: validated.fuel_type_id,
    litres: validated.litres,
    cost,
    is_excess: false,
    issued_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/coupons");
}

export async function updateCouponBatch(input: z.infer<typeof UpdateCouponBatchSchema>) {
  const validated = UpdateCouponBatchSchema.parse(input);
  const supabase = await createClient();
  await requireAuth();

  const pricePerLitre = await getCurrentFuelPrice(validated.fuel_type_id);
  const cost = calculateCost(validated.litres, validated.count, pricePerLitre);

  await checkSerialOverlap(validated.start_serial, validated.end_serial, validated.id);

  const { error } = await supabase
    .from("coupon_batches")
    .update({
      count: validated.count,
      coupon_capacity: validated.litres,
      litres: validated.litres,
      start_serial: validated.start_serial,
      end_serial: validated.end_serial,
      cost,
    })
    .eq("id", validated.id);

  if (error) throw new Error(error.message);
  revalidatePath("/coupons");
}

export async function deleteCouponBatch(id: string) {
  const supabase = await createClient();
  await requireAuth();
  const { error } = await supabase.from("coupon_batches").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/coupons");
}
