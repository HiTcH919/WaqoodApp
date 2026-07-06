"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface VehicleFormState {
  name: string;
  plate: string;
  department_id: string;
  vehicle_type_id: string;
  fuel_type_id: string;
}

export const emptyVehicleForm: VehicleFormState = {
  name: "",
  plate: "",
  department_id: "",
  vehicle_type_id: "",
  fuel_type_id: "",
};

interface VehicleFormProps {
  form: VehicleFormState;
  setForm: (form: VehicleFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  departments: { id: string; name: string }[];
  vehicleTypes: { id: string; category: string; name: string }[];
  fuelTypes: { id: string; name: string }[];
}

export function VehicleForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  submitLabel,
  departments,
  vehicleTypes,
  fuelTypes,
}: VehicleFormProps) {
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const vtOptions = vehicleTypes.map((vt) => ({ value: vt.id, label: `${vt.category} - ${vt.name}` }));
  const ftOptions = fuelTypes.map((ft) => ({ value: ft.id, label: ft.name }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      <Input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="اسم ونوع المركبة (مثال: هايلكس 2015)"
        autoFocus
      />
      <Input
        value={form.plate}
        onChange={(e) => setForm({ ...form, plate: e.target.value })}
        placeholder="رقم اللوحة"
      />
      <Select
        options={deptOptions}
        placeholder="اختر القسم"
        value={form.department_id}
        onChange={(e) => setForm({ ...form, department_id: e.target.value })}
      />
      <Select
        options={vtOptions}
        placeholder="نوع المركبة (اختياري)"
        value={form.vehicle_type_id}
        onChange={(e) => setForm({ ...form, vehicle_type_id: e.target.value })}
      />
      <Select
        options={ftOptions}
        placeholder="نوع الوقود (اختياري)"
        value={form.fuel_type_id}
        onChange={(e) => setForm({ ...form, fuel_type_id: e.target.value })}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit" disabled={!form.plate.trim() || !form.department_id}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
