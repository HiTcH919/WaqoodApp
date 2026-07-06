"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { calculateSerials, calculateCost } from "@/lib/coupon-service";
import { requireAuth } from "@/lib/auth-utils";

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

async function checkSerialOverlap(
  supabase: ReturnType<typeof createClient>,
  startSerial: number,
  endSerial: number,
  excludeId?: string
) {
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

export async function issueCoupons(formData: FormData) {
  const supabase = await createClient();
  const user = await requireAuth();
  const vehicleId = formData.get("vehicle_id") as string;
  const month = formData.get("month") as string;
  const fuelTypeId = formData.get("fuel_type_id") as string;
  const count = parseInt(formData.get("count") as string, 10);
  const litresPerCoupon = parseFloat(formData.get("litres") as string);
  const startSerial = parseInt(formData.get("start_serial") as string, 10);
  const endSerial = parseInt(formData.get("end_serial") as string, 10);

  if (!vehicleId || !month || !fuelTypeId || !count || !litresPerCoupon) {
    throw new Error("جميع الحقول مطلوبة");
  }
  if (!startSerial || !endSerial || endSerial < startSerial) {
    throw new Error("أرقام المسلسل غير صالحة");
  }

  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, departments!inner(organization_id)")
    .eq("id", vehicleId)
    .single();
  if (!vehicle) throw new Error("المركبة غير موجودة");

  const { data: priceRow } = await supabase
    .from("fuel_prices")
    .select("price")
    .eq("fuel_type_id", fuelTypeId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();
  if (!priceRow) throw new Error("لا يوجد سعر للوقود المحدد");

  const cost = calculateCost(litresPerCoupon, count, parseFloat(priceRow.price));

  await checkSerialOverlap(supabase, startSerial, endSerial);

  const { error } = await supabase.from("coupon_batches").insert({
    organization_id: vehicle.departments.organization_id,
    vehicle_id: vehicleId,
    department_id: vehicle.department_id,
    month,
    count,
    coupon_capacity: litresPerCoupon,
    start_serial: startSerial,
    end_serial: endSerial,
    fuel_type_id: fuelTypeId,
    litres: litresPerCoupon,
    cost,
    is_excess: false,
    issued_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/coupons");
}

export async function updateCouponBatch(formData: FormData) {
  const supabase = await createClient();
  await requireAuth();
  const id = formData.get("id") as string;
  const count = parseInt(formData.get("count") as string, 10);
  const litresPerCoupon = parseFloat(formData.get("litres") as string);
  const startSerial = parseInt(formData.get("start_serial") as string, 10);
  const endSerial = parseInt(formData.get("end_serial") as string, 10);
  const fuelTypeId = formData.get("fuel_type_id") as string;

  if (!id || !count || !litresPerCoupon || !startSerial || !endSerial || endSerial < startSerial) {
    throw new Error("البيانات غير صالحة");
  }

  const { data: priceRow } = await supabase
    .from("fuel_prices")
    .select("price")
    .eq("fuel_type_id", fuelTypeId)
    .order("effective_from", { ascending: false })
    .limit(1)
    .single();
  if (!priceRow) throw new Error("لا يوجد سعر للوقود المحدد");

  const cost = calculateCost(litresPerCoupon, count, parseFloat(priceRow.price));

  await checkSerialOverlap(supabase, startSerial, endSerial, id);

  const { error } = await supabase
    .from("coupon_batches")
    .update({
      count,
      coupon_capacity: litresPerCoupon,
      litres: litresPerCoupon,
      start_serial: startSerial,
      end_serial: endSerial,
      cost,
    })
    .eq("id", id);

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
