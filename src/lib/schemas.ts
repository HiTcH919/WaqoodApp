import { z } from "zod";

// ─── Base Patterns ──────────────────────────────────────
export const MonthString = z.string().regex(/^\d{4}-\d{2}$/, {
  message: "يجب أن يكون الشهر بالصيغة YYYY-MM",
});

export const Uuid = z.string().uuid({ message: "معرف غير صالح" });

export const PositiveInt = z.number().int().positive();

// ─── Vehicle ────────────────────────────────────────────
export const VehicleSchema = z.object({
  name: z.string().min(1, "اسم المركبة مطلوب").max(200),
  plate: z.string().min(1, "رقم اللوحة مطلوب").max(50),
  department_id: Uuid,
  vehicle_type_id: z.string().uuid().optional().nullable(),
  fuel_type_id: z.string().uuid().optional().nullable(),
});

export const UpdateVehicleSchema = z.object({
  id: Uuid,
  ...VehicleSchema.shape,
});

// ─── Department ─────────────────────────────────────────
export const DepartmentSchema = z.object({
  name: z.string().min(1, "اسم القسم مطلوب").max(200),
});

export const UpdateDepartmentSchema = z.object({
  id: Uuid,
  ...DepartmentSchema.shape,
});

// ─── Coupon Batch ───────────────────────────────────────
export const IssueCouponSchema = z.object({
  vehicle_id: Uuid,
  month: MonthString,
  fuel_type_id: Uuid,
  count: PositiveInt.max(100, "الحد الأقصى 100 بون"),
  litres: z.number().positive("الكمية يجب أن تكون أكبر من 0"),
  start_serial: PositiveInt,
  end_serial: PositiveInt,
}).refine((data) => data.end_serial >= data.start_serial, {
  message: "نهاية المسلسل يجب أن تكون أكبر من أو تساوي البداية",
  path: ["end_serial"],
});

export const UpdateCouponBatchSchema = z.object({
  id: Uuid,
  count: PositiveInt.max(100, "الحد الأقصى 100 بون"),
  litres: z.number().positive("الكمية يجب أن تكون أكبر من 0"),
  start_serial: PositiveInt,
  end_serial: PositiveInt,
  fuel_type_id: Uuid,
}).refine((data) => data.end_serial >= data.start_serial, {
  message: "نهاية المسلسل يجب أن تكون أكبر من أو تساوي البداية",
  path: ["end_serial"],
});

// ─── Deduction ────────────────────────────────────────
export const DeductionSchema = z.object({
  vehicle_id: z.string().uuid().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من 0"),
  reason: z.string().min(1, "السبب مطلوب").max(500),
  month: MonthString,
}).refine(
  (data) => data.vehicle_id || data.department_id,
  { message: "يجب اختيار مركبة أو قسم", path: ["vehicle_id"] }
);

// ─── Fuel Price ─────────────────────────────────────────
export const FuelPriceSchema = z.object({
  fuel_type_id: Uuid,
  price: z.number().positive("السعر يجب أن يكون أكبر من 0"),
  effective_from: z.string().datetime(),
});

// ─── Fuel Price ─────────────────────────────────────────
export const SetPriceSchema = z.object({
  fuel_type_id: Uuid,
  price: z.number().positive("السعر يجب أن يكون أكبر من 0"),
});

// ─── Fuel Type ─────────────────────────────────────────
export const FuelTypeSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(100),
  category: z.enum(["بنزين", "سولار"]),
  default_litres: z.number().positive().default(20),
});

export const UpdateFuelTypeSchema = z.object({
  id: Uuid,
  ...FuelTypeSchema.shape,
});

// ─── Vehicle Type ───────────────────────────────────────
export const VehicleTypeSchema = z.object({
  category: z.string().min(1, "الفئة مطلوبة").max(100),
  name: z.string().min(1, "الاسم مطلوب").max(200),
});

export const UpdateVehicleTypeSchema = z.object({
  id: Uuid,
  ...VehicleTypeSchema.shape,
});

// ─── Odometer Reading ───────────────────────────────────
export const OdometerReadingSchema = z.object({
  vehicle_id: Uuid,
  month: MonthString,
  start_reading: z.number().min(0).default(0),
  end_reading: z.number().min(0).default(0),
  distance: z.number().min(0).optional().nullable(),
});

// ─── Auth ───────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});
