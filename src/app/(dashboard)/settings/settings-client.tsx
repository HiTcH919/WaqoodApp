"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FuelType, VehicleType } from "@/types/database";
import {
  getFuelTypes,
  getVehicleTypes,
  getSettings as getSettingsAction,
  createFuelType,
  updateFuelType,
  deleteFuelType,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
  updateSetting,
} from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Fuel, Car, Settings, Save, X } from "lucide-react";

interface Props {
  fuelTypes: FuelType[];
  vehicleTypes: VehicleType[];
  settings: Record<string, string>;
}

// ── Fuel Type Form ──
interface FuelForm {
  name: string;
  category: string;
  default_litres: string;
}

const emptyFuelForm: FuelForm = { name: "", category: "", default_litres: "20" };

// ── Vehicle Type Form ──
interface VtForm {
  category: string;
  name: string;
}

const emptyVtForm: VtForm = { category: "", name: "" };

export function SettingsClient({ fuelTypes: initialFt, vehicleTypes: initialVt, settings: initialSettings }: Props) {
  const queryClient = useQueryClient();

  const { data: fuelTypes } = useQuery({
    queryKey: ["fuelTypes"],
    queryFn: getFuelTypes,
    initialData: initialFt,
  });

  const { data: vehicleTypes } = useQuery({
    queryKey: ["vehicleTypes"],
    queryFn: getVehicleTypes,
    initialData: initialVt,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettingsAction,
    initialData: initialSettings,
  });

  // Fuel type state
  const [showFuelAdd, setShowFuelAdd] = useState(false);
  const [editingFuel, setEditingFuel] = useState<FuelType | null>(null);
  const [deletingFuel, setDeletingFuel] = useState<FuelType | null>(null);
  const [fuelForm, setFuelForm] = useState<FuelForm>(emptyFuelForm);
  const [fuelError, setFuelError] = useState("");

  // Vehicle type state
  const [showVtAdd, setShowVtAdd] = useState(false);
  const [editingVt, setEditingVt] = useState<VehicleType | null>(null);
  const [deletingVt, setDeletingVt] = useState<VehicleType | null>(null);
  const [vtForm, setVtForm] = useState<VtForm>(emptyVtForm);
  const [vtError, setVtError] = useState("");

  // General settings state
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState(initialSettings.company_name ?? "");
  const [reportFooter, setReportFooter] = useState(initialSettings.report_footer ?? "");

  // ── Helpers ──
  const reloadFuel = () => {
    queryClient.invalidateQueries({ queryKey: ["fuelTypes"] });
  };
  const reloadVt = () => {
    queryClient.invalidateQueries({ queryKey: ["vehicleTypes"] });
  };

  // ── Fuel Type Handlers ──
  const handleFuelAdd = async () => {
    setFuelError("");
    if (!fuelForm.name.trim() || !fuelForm.category) { setFuelError("يرجى تعبئة جميع الحقول المطلوبة"); return; }
    try {
      await createFuelType({ name: fuelForm.name, category: fuelForm.category as "بنزين" | "سولار", default_litres: Number(fuelForm.default_litres) });
      setShowFuelAdd(false);
      setFuelForm(emptyFuelForm);
      reloadFuel();
    } catch (e: any) { setFuelError(e.message); }
  };

  const handleFuelEdit = async () => {
    if (!editingFuel) return;
    setFuelError("");
    if (!fuelForm.name.trim() || !fuelForm.category) { setFuelError("يرجى تعبئة جميع الحقول المطلوبة"); return; }
    try {
      await updateFuelType({ id: editingFuel.id, name: fuelForm.name, category: fuelForm.category as "بنزين" | "سولار", default_litres: Number(fuelForm.default_litres) });
      setEditingFuel(null);
      setFuelForm(emptyFuelForm);
      reloadFuel();
    } catch (e: any) { setFuelError(e.message); }
  };

  const handleFuelDelete = async () => {
    if (!deletingFuel) return;
    try {
      await deleteFuelType(deletingFuel.id);
      setDeletingFuel(null);
      reloadFuel();
    } catch (e: any) { setFuelError(e.message); }
  };

  const openFuelEdit = (ft: FuelType) => {
    setEditingFuel(ft);
    setFuelForm({ name: ft.name, category: ft.category, default_litres: String(ft.default_litres) });
    setFuelError("");
  };

  // ── Vehicle Type Handlers ──
  const handleVtAdd = async () => {
    setVtError("");
    if (!vtForm.category.trim() || !vtForm.name.trim()) { setVtError("يرجى تعبئة جميع الحقول المطلوبة"); return; }
    try {
      await createVehicleType({ category: vtForm.category, name: vtForm.name });
      setShowVtAdd(false);
      setVtForm(emptyVtForm);
      reloadVt();
    } catch (e: any) { setVtError(e.message); }
  };

  const handleVtEdit = async () => {
    if (!editingVt) return;
    setVtError("");
    if (!vtForm.category.trim() || !vtForm.name.trim()) { setVtError("يرجى تعبئة جميع الحقول المطلوبة"); return; }
    try {
      await updateVehicleType({ id: editingVt.id, category: vtForm.category, name: vtForm.name });
      setEditingVt(null);
      setVtForm(emptyVtForm);
      reloadVt();
    } catch (e: any) { setVtError(e.message); }
  };

  const handleVtDelete = async () => {
    if (!deletingVt) return;
    try {
      await deleteVehicleType(deletingVt.id);
      setDeletingVt(null);
      reloadVt();
    } catch (e: any) { setVtError(e.message); }
  };

  const openVtEdit = (vt: VehicleType) => {
    setEditingVt(vt);
    setVtForm({ category: vt.category, name: vt.name });
    setVtError("");
  };

  // ── General Settings Handlers ──
  const handleSaveSetting = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await updateSetting(key, value);
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (e: any) {
      console.error(e);
    } finally {
      setSavingKey(null);
    }
  };

  const categoryOptions = [
    { value: "بنزين", label: "بنزين" },
    { value: "سولار", label: "سولار" },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الإعدادات</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">إدارة أنواع الوقود وفئات المركبات والإعدادات العامة</p>
        </div>
      </div>

      {/* ════════════════════════════════════
          القسم 1: أنواع الوقود
          ════════════════════════════════════ */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fuel size={20} className="text-emerald-600" />
            <h2 className="text-lg font-black">أنواع الوقود</h2>
            <span className="text-sm text-muted-foreground font-bold">({fuelTypes.length})</span>
          </div>
          <Button size="sm" onClick={() => { setShowFuelAdd(true); setFuelForm(emptyFuelForm); setFuelError(""); }}>
            <Plus size={16} />
            <span>إضافة</span>
          </Button>
        </div>
        <CardContent className="p-4">
          {fuelTypes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground font-bold">لا توجد أنواع وقود مضافة</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {fuelTypes.map((ft) => (
                <div
                  key={ft.id}
                  className="border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 bg-emerald-50/50 dark:bg-emerald-950/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-black text-foreground">{ft.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">
                          {ft.category}
                        </span>
                        <span className="text-xs text-muted-foreground font-bold">
                          افتراضي: {ft.default_litres} لتر
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openFuelEdit(ft)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeletingFuel(ft); setFuelError(""); }}>
                        <Trash2 size={15} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════
          القسم 2: فئات المركبات
          ════════════════════════════════════ */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car size={20} className="text-blue-600" />
            <h2 className="text-lg font-black">فئات المركبات</h2>
            <span className="text-sm text-muted-foreground font-bold">({vehicleTypes.length})</span>
          </div>
          <Button size="sm" onClick={() => { setShowVtAdd(true); setVtForm(emptyVtForm); setVtError(""); }}>
            <Plus size={16} />
            <span>إضافة</span>
          </Button>
        </div>
        <CardContent className="p-4">
          {vehicleTypes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground font-bold">لا توجد فئات مركبات مضافة</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {vehicleTypes.map((vt) => (
                <div
                  key={vt.id}
                  className="border border-blue-200 dark:border-blue-900 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-950/20"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-black text-foreground">{vt.name}</p>
                      <p className="text-xs text-muted-foreground font-bold mt-0.5">التصنيف: {vt.category}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openVtEdit(vt)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeletingVt(vt); setVtError(""); }}>
                        <Trash2 size={15} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════
          القسم 3: إعدادات عامة
          ════════════════════════════════════ */}
      <Card className="mb-6">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Settings size={20} className="text-slate-600" />
          <h2 className="text-lg font-black">إعدادات عامة</h2>
        </div>
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">اسم الشركة (للتقارير المطبوعة)</label>
            <div className="flex gap-2">
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="شركة ........................"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => handleSaveSetting("company_name", companyName)}
                disabled={savingKey === "company_name"}
              >
                {savingKey === "company_name" ? "..." : <Save size={16} />}
                <span>حفظ</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-bold">يظهر هذا الاسم في رأس التقارير المطبوعة</p>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">نص التذييل (أسفل التقارير)</label>
            <div className="flex gap-2">
              <Input
                value={reportFooter}
                onChange={(e) => setReportFooter(e.target.value)}
                placeholder="تقرير مصدّر من نظام واقود"
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => handleSaveSetting("report_footer", reportFooter)}
                disabled={savingKey === "report_footer"}
              >
                {savingKey === "report_footer" ? "..." : <Save size={16} />}
                <span>حفظ</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ════════════════════════════════════
          مودال: إضافة / تعديل نوع الوقود
          ════════════════════════════════════ */}
      {(showFuelAdd || editingFuel) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-black">{editingFuel ? "تعديل نوع الوقود" : "إضافة نوع وقود"}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowFuelAdd(false); setEditingFuel(null); setFuelForm(emptyFuelForm); setFuelError(""); }}>
                <X size={18} />
              </Button>
            </div>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => { e.preventDefault(); editingFuel ? handleFuelEdit() : handleFuelAdd(); }}
                className="space-y-4"
              >
                <Input
                  value={fuelForm.name}
                  onChange={(e) => setFuelForm({ ...fuelForm, name: e.target.value })}
                  placeholder="اسم نوع الوقود (مثال: بنزين 95)"
                  autoFocus
                />
                <Select
                  options={categoryOptions}
                  placeholder="اختر التصنيف"
                  value={fuelForm.category}
                  onChange={(e) => setFuelForm({ ...fuelForm, category: e.target.value })}
                />
                <div>
                  <label className="block text-sm font-bold mb-1.5">الليترات الافتراضية لكل بون</label>
                  <Input
                    type="number"
                    value={fuelForm.default_litres}
                    onChange={(e) => setFuelForm({ ...fuelForm, default_litres: e.target.value })}
                    min="1"
                    step="0.5"
                  />
                </div>
                {fuelError && (
                  <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-xl border border-destructive/20">
                    {fuelError}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowFuelAdd(false); setEditingFuel(null); setFuelForm(emptyFuelForm); setFuelError(""); }}>
                    إلغاء
                  </Button>
                  <Button type="submit">{editingFuel ? "حفظ التغييرات" : "إضافة"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════
          مودال: إضافة / تعديل فئة مركبة
          ════════════════════════════════════ */}
      {(showVtAdd || editingVt) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-black">{editingVt ? "تعديل فئة المركبة" : "إضافة فئة مركبة"}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowVtAdd(false); setEditingVt(null); setVtForm(emptyVtForm); setVtError(""); }}>
                <X size={18} />
              </Button>
            </div>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => { e.preventDefault(); editingVt ? handleVtEdit() : handleVtAdd(); }}
                className="space-y-4"
              >
                <Input
                  value={vtForm.category}
                  onChange={(e) => setVtForm({ ...vtForm, category: e.target.value })}
                  placeholder="التصنيف (مثال: سيارة, دراجة بخارية)"
                  autoFocus
                />
                <Input
                  value={vtForm.name}
                  onChange={(e) => setVtForm({ ...vtForm, name: e.target.value })}
                  placeholder="الاسم (مثال: بيك أب دوبل, ملاكي)"
                />
                {vtError && (
                  <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-xl border border-destructive/20">
                    {vtError}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setShowVtAdd(false); setEditingVt(null); setVtForm(emptyVtForm); setVtError(""); }}>
                    إلغاء
                  </Button>
                  <Button type="submit">{editingVt ? "حفظ التغييرات" : "إضافة"}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════
          حوارات الحذف
          ════════════════════════════════════ */}
      <AlertDialog
        open={!!deletingFuel}
        onOpenChange={(o) => !o && setDeletingFuel(null)}
        title="حذف نوع الوقود"
        message={`هل أنت متأكد من حذف "${deletingFuel?.name}"؟`}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleFuelDelete}
      />
      <AlertDialog
        open={!!deletingVt}
        onOpenChange={(o) => !o && setDeletingVt(null)}
        title="حذف فئة المركبة"
        message={`هل أنت متأكد من حذف "${deletingVt?.name}"؟`}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleVtDelete}
      />
    </>
  );
}
