"use client";

import { useState } from "react";
import type { Department, VehicleType, FuelType } from "@/types/database";
import type { VehicleWithRelations } from "@/lib/actions/vehicles";
import { createVehicle, updateVehicle, deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";

interface Props {
  vehicles: VehicleWithRelations[];
  departments: Department[];
  vehicleTypes: VehicleType[];
  fuelTypes: FuelType[];
}

interface FormState {
  name: string;
  plate: string;
  department_id: string;
  vehicle_type_id: string;
  fuel_type_id: string;
}

const emptyForm: FormState = { name: "", plate: "", department_id: "", vehicle_type_id: "", fuel_type_id: "" };

export function VehiclesClient({ vehicles: initial, departments, vehicleTypes, fuelTypes }: Props) {
  const [vehicles, setVehicles] = useState(initial);
  const [editing, setEditing] = useState<VehicleWithRelations | null>(null);
  const [deleting, setDeleting] = useState<VehicleWithRelations | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const resetForm = () => setForm(emptyForm);

  const handleAdd = async () => {
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("plate", form.plate);
    fd.set("department_id", form.department_id);
    fd.set("vehicle_type_id", form.vehicle_type_id);
    fd.set("fuel_type_id", form.fuel_type_id);
    await createVehicle(fd);
    setShowAdd(false);
    resetForm();
    const { getVehicles } = await import("@/lib/actions/vehicles");
    setVehicles(await getVehicles());
  };

  const handleEdit = async () => {
    if (!editing) return;
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("name", form.name);
    fd.set("plate", form.plate);
    fd.set("department_id", form.department_id);
    fd.set("vehicle_type_id", form.vehicle_type_id);
    fd.set("fuel_type_id", form.fuel_type_id);
    await updateVehicle(fd);
    setEditing(null);
    resetForm();
    const { getVehicles } = await import("@/lib/actions/vehicles");
    setVehicles(await getVehicles());
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteVehicle(deleting.id);
    setDeleting(null);
    const { getVehicles } = await import("@/lib/actions/vehicles");
    setVehicles(await getVehicles());
  };

  const openEdit = (v: VehicleWithRelations) => {
    setEditing(v);
    setForm({
      name: v.name,
      plate: v.plate,
      department_id: v.department_id,
      vehicle_type_id: v.vehicle_type_id || "",
      fuel_type_id: v.fuel_type_id || "",
    });
  };

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const vtOptions = vehicleTypes.map((vt) => ({ value: vt.id, label: `${vt.category} - ${vt.name}` }));
  const ftOptions = fuelTypes.map((ft) => ({ value: ft.id, label: ft.name }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">سجل المركبات</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">إدارة بيانات المركبات المسجلة في النظام</p>
        </div>
        <Button onClick={() => { setShowAdd(true); resetForm(); }}>
          <Plus size={18} />
          <span>مركبة جديدة</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={20} />
            <span>قائمة المركبات ({vehicles.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-bold">
              لا توجد مركبات مضافة بعد
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم ونوع المركبة</TableHead>
                  <TableHead>رقم اللوحة</TableHead>
                  <TableHead>القسم</TableHead>
                  <TableHead>نوع المركبة</TableHead>
                  <TableHead>نوع الوقود</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-bold">{v.name || "—"}</TableCell>
                    <TableCell className="font-bold">{v.plate}</TableCell>
                    <TableCell>{v.departments?.name}</TableCell>
                    <TableCell>{v.vehicle_types ? `${v.vehicle_types.category} - ${v.vehicle_types.name}` : "—"}</TableCell>
                    <TableCell>{v.fuel_types?.name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(v)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-xl mx-4">
            <CardHeader>
              <CardTitle>مركبة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
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
                  <Button variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>إلغاء</Button>
                  <Button type="submit" disabled={!form.plate.trim() || !form.department_id}>إضافة</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-xl mx-4">
            <CardHeader>
              <CardTitle>تعديل المركبة</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); handleEdit(); }}
                className="space-y-4"
              >
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="اسم ونوع المركبة"
                  autoFocus
                />
                <Input
                  value={form.plate}
                  onChange={(e) => setForm({ ...form, plate: e.target.value })}
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
                  <Button variant="outline" onClick={() => { setEditing(null); resetForm(); }}>إلغاء</Button>
                  <Button type="submit" disabled={!form.plate.trim() || !form.department_id}>حفظ</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف المركبة"
        message={`هل أنت متأكد من حذف المركبة "${deleting?.plate}"؟`}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleDelete}
      />
    </>
  );
}
