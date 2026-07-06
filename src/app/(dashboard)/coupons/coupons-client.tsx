"use client";

import { useState } from "react";
import { issueCoupons, updateCouponBatch, deleteCouponBatch } from "@/lib/actions/coupons";
import { getDefaultLitresPerCoupon } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Ticket, Plus, Edit3, Trash2 } from "lucide-react";

interface Props {
  vehicles: any[];
  fuelTypes: any[];
  batches: any[];
  month: string;
}

export function CouponsClient({ vehicles, fuelTypes, batches: initialBatches, month }: Props) {
  const [selVehicle, setSelVehicle] = useState("");
  const [selFuelType, setSelFuelType] = useState("");
  const [count, setCount] = useState("5");
  const [litres, setLitres] = useState("20");
  const [startSerial, setStartSerial] = useState("");
  const [endSerial, setEndSerial] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState(initialBatches);
  const [editing, setEditing] = useState<any | null>(null);
  const [deleting, setDeleting] = useState<any | null>(null);

  const handleVehicleChange = (id: string) => {
    setSelVehicle(id);
    const v = vehicles.find((x) => x.id === id);
    if (v?.fuel_types) {
      const ft = fuelTypes.find((f) => f.name === v.fuel_types.name);
      if (ft) { setSelFuelType(ft.id); setLitres(String(getDefaultLitresPerCoupon(ft.id, fuelTypes))); }
    }
  };

  const handleFuelTypeChange = (id: string) => {
    setSelFuelType(id);
    setLitres(String(getDefaultLitresPerCoupon(id, fuelTypes)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.set("vehicle_id", selVehicle);
    fd.set("month", month);
    fd.set("fuel_type_id", selFuelType);
    fd.set("count", count);
    fd.set("litres", litres);
    fd.set("start_serial", startSerial);
    fd.set("end_serial", endSerial);
    try {
      await issueCoupons(fd);
      resetForm();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "فشل في إصدار البونات");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError("");
    setLoading(true);
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("count", editing.editCount);
    fd.set("litres", editing.editLitres);
    fd.set("start_serial", editing.editStartSerial);
    fd.set("end_serial", editing.editEndSerial);
    fd.set("fuel_type_id", editing.editFuelTypeId);
    try {
      await updateCouponBatch(fd);
      setEditing(null);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "فشل في تحديث البونات");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCouponBatch(deleting.id);
    setDeleting(null);
    window.location.reload();
  };

  const resetForm = () => {
    setSelVehicle("");
    setSelFuelType("");
    setCount("5");
    setLitres("20");
    setStartSerial("");
    setEndSerial("");
    setError("");
  };

  const openEdit = (b: any) => {
    setEditing({
      id: b.id,
      editCount: String(b.count),
      editLitres: String(b.litres),
      editStartSerial: String(b.start_serial),
      editEndSerial: String(b.end_serial),
      editFuelTypeId: b.fuel_type_id,
    });
  };

  const totals = batches.reduce(
    (s, b) => ({ total: s.total + Number(b.cost), totalCoupons: s.totalCoupons + b.count, totalLiters: s.totalLiters + b.count * Number(b.litres) }),
    { total: 0, totalCoupons: 0, totalLiters: 0 }
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">إصدار البونات</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">{month}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              <span>إصدار جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
              <div>
                <label className="block text-sm font-bold mb-2">المركبة</label>
                <select
                  value={selVehicle}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  required
                  suppressHydrationWarning
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground font-bold text-sm"
                >
                  <option value="">اختر المركبة</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name ? `${v.name} - ${v.plate}` : v.plate} - {v.departments?.name || ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">نوع الوقود</label>
                <select
                  value={selFuelType}
                  onChange={(e) => handleFuelTypeChange(e.target.value)}
                  required
                  suppressHydrationWarning
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground font-bold text-sm"
                >
                  <option value="">اختر نوع الوقود</option>
                  {fuelTypes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">لتر لكل بون</label>
                <Input
                  type="number"
                  value={litres}
                  onChange={(e) => setLitres(e.target.value)}
                  min="1"
                  step="0.5"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">عدد البونات</label>
                <Input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  min="1"
                  max="100"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">إجمالي الليترات</label>
                <Input
                  type="text"
                  value={String(Number(count) * Number(litres))}
                  readOnly
                  className="bg-muted text-muted-foreground cursor-default"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">بداية الرقم المسلسل</label>
                <Input
                  type="number"
                  value={startSerial}
                  onChange={(e) => setStartSerial(e.target.value)}
                  min="1"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">نهاية الرقم المسلسل</label>
                <Input
                  type="number"
                  value={endSerial}
                  onChange={(e) => setEndSerial(e.target.value)}
                  min="1"
                  required
                  suppressHydrationWarning
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-xl border border-destructive/20">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "جاري الإصدار..." : "إصدار البونات"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket size={20} />
              <span>بونات الشهر الحالي</span>
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {totals.totalCoupons} بون | {totals.totalLiters} لتر | {totals.total.toLocaleString("en-US")} ج.م
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {batches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-bold">
                لا توجد بونات مصدرة هذا الشهر
              </div>
            ) : (
              <div className="divide-y divide-border">
                {batches.map((b: any) => (
                  <div key={b.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{b.vehicles?.name ? `${b.vehicles.name} (${b.vehicles.plate})` : b.vehicles?.plate}</span>
                      <div className="flex items-center gap-1">
                        <Badge>{b.count} بون</Badge>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                          <Edit3 size={15} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(b)}>
                          <Trash2 size={15} className="text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground flex gap-4">
                      <span>{b.departments?.name}</span>
                      <span>{b.fuel_types?.name}</span>
                      <span>{b.litres} لتر</span>
                      <span>{b.cost.toLocaleString("en-US")} ج.م</span>
                      <span>{b.count * Number(b.litres)} لتر</span>
                      <span className="text-xs">#{b.start_serial}-#{b.end_serial}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>تعديل البونات</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2">عدد البونات</label>
                  <Input
                    type="number"
                    value={editing.editCount}
                    onChange={(e) => setEditing({ ...editing, editCount: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">لتر لكل بون</label>
                  <Input
                    type="number"
                    value={editing.editLitres}
                    onChange={(e) => setEditing({ ...editing, editLitres: e.target.value })}
                    min="1"
                    step="0.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">بداية الرقم المسلسل</label>
                  <Input
                    type="number"
                    value={editing.editStartSerial}
                    onChange={(e) => setEditing({ ...editing, editStartSerial: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">نهاية الرقم المسلسل</label>
                  <Input
                    type="number"
                    value={editing.editEndSerial}
                    onChange={(e) => setEditing({ ...editing, editEndSerial: e.target.value })}
                    min="1"
                    required
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف البونات"
        message={`هل أنت متأكد من حذف بونات المركبة ${deleting?.vehicles?.plate || ""}؟`}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleDelete}
      />
    </>
  );
}
