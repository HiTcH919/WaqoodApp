"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Department, VehicleType, FuelType } from "@/types/database";
import type { VehicleWithRelations } from "@/lib/actions/vehicles";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/lib/actions/vehicles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Modal } from "@/components/ui/modal";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import {
  VehicleForm,
  emptyVehicleForm,
  type VehicleFormState,
} from "@/components/modules/vehicles/vehicle-form";

interface Props {
  initialVehicles: VehicleWithRelations[];
  departments: Department[];
  vehicleTypes: VehicleType[];
  fuelTypes: FuelType[];
}

export function VehiclesClient({ initialVehicles, departments, vehicleTypes, fuelTypes }: Props) {
  const queryClient = useQueryClient();
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: getVehicles,
    initialData: initialVehicles,
  });
  const [editing, setEditing] = useState<VehicleWithRelations | null>(null);
  const [deleting, setDeleting] = useState<VehicleWithRelations | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<VehicleFormState>(emptyVehicleForm);

  const refreshVehicles = () => {
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  };

  const handleAdd = async () => {
    await createVehicle({
      name: form.name,
      plate: form.plate,
      department_id: form.department_id,
      vehicle_type_id: form.vehicle_type_id || null,
      fuel_type_id: form.fuel_type_id || null,
    });
    setShowAdd(false);
    setForm(emptyVehicleForm);
    refreshVehicles();
  };

  const handleEdit = async () => {
    if (!editing) return;
    await updateVehicle({
      id: editing.id,
      name: form.name,
      plate: form.plate,
      department_id: form.department_id,
      vehicle_type_id: form.vehicle_type_id || null,
      fuel_type_id: form.fuel_type_id || null,
    });
    setEditing(null);
    setForm(emptyVehicleForm);
    refreshVehicles();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteVehicle(deleting.id);
    setDeleting(null);
    refreshVehicles();
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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">سجل المركبات</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">
            إدارة بيانات المركبات المسجلة في النظام
          </p>
        </div>
        <Button
          onClick={() => {
            setShowAdd(true);
            setForm(emptyVehicleForm);
          }}
        >
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
                    <TableCell>
                      {v.vehicle_types ? `${v.vehicle_types.category} - ${v.vehicle_types.name}` : "—"}
                    </TableCell>
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

      <Modal
        open={showAdd}
        onClose={() => {
          setShowAdd(false);
          setForm(emptyVehicleForm);
        }}
        title="مركبة جديدة"
        maxWidth="max-w-xl"
      >
        <VehicleForm
          form={form}
          setForm={setForm}
          onSubmit={handleAdd}
          onCancel={() => {
            setShowAdd(false);
            setForm(emptyVehicleForm);
          }}
          submitLabel="إضافة"
          departments={departments}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => {
          setEditing(null);
          setForm(emptyVehicleForm);
        }}
        title="تعديل المركبة"
        maxWidth="max-w-xl"
      >
        <VehicleForm
          form={form}
          setForm={setForm}
          onSubmit={handleEdit}
          onCancel={() => {
            setEditing(null);
            setForm(emptyVehicleForm);
          }}
          submitLabel="حفظ"
          departments={departments}
          vehicleTypes={vehicleTypes}
          fuelTypes={fuelTypes}
        />
      </Modal>

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
