"use client";

import { useState } from "react";
import type { Department } from "@/types/database";
import type { VehicleWithRelations } from "@/lib/actions/vehicles";
import type { DeductionWithRelations } from "@/lib/actions/deductions";
import { createDeduction, deleteDeduction } from "@/lib/actions/deductions";
import { currentMonthStr } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CircleMinus } from "lucide-react";

interface Props {
  deductions: DeductionWithRelations[];
  vehicles: VehicleWithRelations[];
  departments: Department[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-EG");
}

function formatAmount(n: number) {
  return n.toLocaleString("ar-EG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function DeductionsClient({ deductions: initial, vehicles, departments }: Props) {
  const [deductions, setDeductions] = useState(initial);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr());
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<DeductionWithRelations | null>(null);
  const [formVehicle, setFormVehicle] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formMonth, setFormMonth] = useState(currentMonthStr());

  const handleFilter = async () => {
    const { getDeductions } = await import("@/lib/actions/deductions");
    setDeductions(await getDeductions(filterMonth));
  };

  const handleAdd = async () => {
    const fd = new FormData();
    fd.set("vehicle_id", formVehicle);
    fd.set("department_id", formDepartment);
    fd.set("amount", formAmount);
    fd.set("reason", formReason);
    fd.set("month", formMonth);
    await createDeduction(fd);
    setShowAdd(false);
    setFormVehicle("");
    setFormDepartment("");
    setFormAmount("");
    setFormReason("");
    setFormMonth(currentMonthStr());
    const { getDeductions } = await import("@/lib/actions/deductions");
    setDeductions(await getDeductions(filterMonth));
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteDeduction(deleting.id);
    setDeleting(null);
    const { getDeductions } = await import("@/lib/actions/deductions");
    setDeductions(await getDeductions(filterMonth));
  };

  const total = deductions.reduce((sum, d) => sum + Number(d.amount), 0);

  const vehicleOptions = vehicles.map((v) => ({ value: v.id, label: v.plate }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الاستقطاعات المالية</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">إدارة الاستقطاعات المالية المتعلقة باستهلاك الوقود</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={18} />
          <span>إضافة استقطاع</span>
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="font-bold text-sm">الشهر:</label>
          <Input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-44"
          />
        </div>
        <Button onClick={handleFilter} variant="outline">تصفية</Button>
        {filterMonth && (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setFilterMonth("");
              const { getDeductions } = await import("@/lib/actions/deductions");
              setDeductions(await getDeductions());
            }}
          >
            إلغاء التصفية
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CircleMinus size={20} />
              <span>قائمة الاستقطاعات ({deductions.length})</span>
            </span>
            {deductions.length > 0 && (
              <Badge variant="destructive" className="text-base px-4 py-1.5">
                الإجمالي: {formatAmount(total)} ر.س
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {deductions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-bold">
              لا توجد استقطاعات مضافة بعد
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المركبة</TableHead>
                  <TableHead>الإدارة</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>الشهر</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductions.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{formatDate(d.created_at)}</TableCell>
                    <TableCell>{d.vehicles?.plate ?? "—"}</TableCell>
                    <TableCell>{d.departments?.name ?? "—"}</TableCell>
                    <TableCell className="font-bold">{formatAmount(d.amount)} ر.س</TableCell>
                    <TableCell>{d.reason}</TableCell>
                    <TableCell>{d.month}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(d)}
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
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
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>إضافة استقطاع</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
                className="space-y-4"
              >
                <Select
                  options={vehicleOptions}
                  placeholder="المركبة (اختياري)"
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value)}
                />
                <Select
                  options={departmentOptions}
                  placeholder="الإدارة (اختياري)"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="المبلغ"
                  autoFocus
                />
                <Input
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="السبب"
                />
                <Input
                  type="month"
                  value={formMonth}
                  onChange={(e) => setFormMonth(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
                  <Button type="submit" disabled={!formAmount || !formReason.trim()}>إضافة</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف الاستقطاع"
        message={`هل أنت متأكد من حذف هذا الاستقطاع بقيمة ${deleting ? formatAmount(deleting.amount) : ""} ر.س؟`}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleDelete}
      />
    </>
  );
}
