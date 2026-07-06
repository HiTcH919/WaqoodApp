"use client";

import { useState, useMemo, useCallback } from "react";
import { upsertOdometerReading } from "@/lib/actions/odometer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Save, FileText, FileDown } from "lucide-react";

interface RowData {
  vehicle_id: string;
  name: string;
  plate: string;
  department_id: string;
  department_name: string;
  fuel_type: string;
  serial_ranges: string;
  total_liters: number;
  current_start: number | null;
  current_end: number | null;
  distance: number | null;
  prev_start: number | null;
  prev_end: number | null;
}

interface Props {
  departments: { id: string; name: string }[];
  rows: RowData[];
  selectedMonth: string;
  selectedDepartmentId: string;
  settings: Record<string, string>;
}

export function SettlementClient({ departments, rows: initialRows, selectedMonth, selectedDepartmentId, settings }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState(selectedMonth);
  const [deptFilter, setDeptFilter] = useState(selectedDepartmentId);
  const [fuelFilter, setFuelFilter] = useState("");

  const fuelTypes = useMemo(() => {
    const types = new Set(rows.map((r) => r.fuel_type));
    return Array.from(types).sort();
  }, [rows]);

  const displayedRows = useMemo(
    () => (fuelFilter ? rows.filter((r) => r.fuel_type === fuelFilter) : rows),
    [rows, fuelFilter]
  );

  const deptName = deptFilter
    ? departments.find((d) => d.id === deptFilter)?.name ?? ""
    : "";

  const navigateToMonth = useCallback((newMonth: string) => {
    const params = new URLSearchParams();
    params.set("month", newMonth);
    if (deptFilter) params.set("department_id", deptFilter);
    window.location.href = `/settlement?${params.toString()}`;
  }, [deptFilter]);

  const deptChanged = useCallback((id: string) => {
    setDeptFilter(id);
    const params = new URLSearchParams();
    params.set("month", month);
    if (id) params.set("department_id", id);
    window.location.href = `/settlement?${params.toString()}`;
  }, [month]);

  const updateRow = useCallback((vehicle_id: string, field: keyof RowData, value: any) => {
    setRows((prev) => prev.map((r) => (r.vehicle_id === vehicle_id ? { ...r, [field]: value } : r)));
    setDirty((prev) => new Set(prev).add(vehicle_id));
  }, []);

  const autoDistance = (start: number | null, end: number | null) =>
    (end ?? 0) - (start ?? 0);

  const saveRow = async (row: RowData) => {
    setSaving((prev) => new Set(prev).add(row.vehicle_id));
    try {
      const fd = new FormData();
      fd.set("vehicle_id", row.vehicle_id);
      fd.set("month", month);
      fd.set("start_reading", String(row.current_start ?? 0));
      fd.set("end_reading", String(row.current_end ?? 0));
      const autoDist = autoDistance(row.current_start, row.current_end);
      if (row.distance !== null && row.distance !== autoDist) {
        fd.set("distance", String(row.distance));
      }
      await upsertOdometerReading(fd);
      setDirty((prev) => { const next = new Set(prev); next.delete(row.vehicle_id); return next; });
    } catch {
      // silent
    } finally {
      setSaving((prev) => { const next = new Set(prev); next.delete(row.vehicle_id); return next; });
    }
  };

  const saveAll = async () => {
    for (const vehicle_id of dirty) {
      const row = rows.find((r) => r.vehicle_id === vehicle_id);
      if (row) await saveRow(row);
    }
  };

  const totals = useMemo(() => {
    let totalDist = 0;
    for (const r of displayedRows) {
      totalDist += r.distance !== null ? r.distance : autoDistance(r.current_start, r.current_end);
    }
    return { count: displayedRows.length, totalDist };
  }, [displayedRows]);

  const groupedRows = useMemo(() => {
    const groups: { fuelType: string; rows: RowData[] }[] = [];
    const map = new Map<string, RowData[]>();
    for (const r of displayedRows) {
      const arr = map.get(r.fuel_type) ?? [];
      arr.push(r);
      map.set(r.fuel_type, arr);
    }
    for (const [fuelType, rows] of map) {
      groups.push({ fuelType, rows });
    }
    return groups;
  }, [displayedRows]);

  const fuelTypeSummary = useMemo(() => {
    return groupedRows.map((g) => {
      let totalDist = 0;
      let totalLiters = 0;
      for (const r of g.rows) {
        totalDist += r.distance !== null ? r.distance : autoDistance(r.current_start, r.current_end);
        totalLiters += r.total_liters;
      }
      return { fuelType: g.fuelType, count: g.rows.length, totalDist, totalLiters };
    });
  }, [groupedRows]);

  const printDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="print-area">
      {/* ── Screen toolbar ── */}
      <div className="no-print mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black">التسوية الشهرية</h1>
            <p className="text-muted-foreground font-bold text-sm mt-1">
              تسوية الليترات المصروفة لكل مركبة
            </p>
          </div>
          <div className="flex items-center gap-2">
            {dirty.size > 0 && (
              <Button onClick={saveAll} disabled={saving.size > 0}>
                <Save size={16} />
                <span>حفظ الكل ({dirty.size})</span>
              </Button>
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <FileDown size={18} />
              <span>PDF</span>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer size={18} />
              <span>طباعة</span>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">الإدارة:</span>
            <select
              value={deptFilter}
              onChange={(e) => deptChanged(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-4 text-sm font-bold"
            >
              <option value="">كل الإدارات</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-muted-foreground">الشهر:</span>
            <input
              type="month"
              value={month}
              onChange={(e) => navigateToMonth(e.target.value)}
              className="h-10 rounded-xl border border-input bg-background px-4 text-sm font-bold"
            />
          </div>
          {fuelTypes.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground">نوع الوقود:</span>
              <select
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
                className="h-10 rounded-xl border border-input bg-background px-4 text-sm font-bold"
              >
                <option value="">الكل</option>
                {fuelTypes.map((ft) => (
                  <option key={ft} value={ft}>{ft}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Main card (screen only, hidden on print) ── */}
      <Card className="print:hidden">
        <CardContent className="p-0 overflow-auto">
                  {displayedRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-bold">
              لا توجد مركبات للتسوية هذا الشهر
            </div>
          ) : (
            <>
              <table className="w-full text-sm" dir="rtl">
                <thead>
                  <tr className="border-b-2 border-border bg-muted/60 print:bg-emerald-700 print:text-white">
                    <th className="px-3 py-3 text-center font-bold w-10">م</th>
                    <th className="px-3 py-3 text-right font-bold">اسم ونوع المركبة</th>
                    <th className="px-3 py-3 text-center font-bold">رقم اللوحة</th>
                    <th className="px-3 py-3 text-center font-bold">نوع الوقود</th>
                    <th className="px-3 py-3 text-center font-bold whitespace-nowrap">أرقام البونات (من/إلى)</th>
                    <th className="px-3 py-3 text-center font-bold whitespace-nowrap">قراءة العداد الحالي</th>
                    <th className="px-3 py-3 text-center font-bold">المسافة (كم)</th>
                    <th className="px-3 py-3 text-center font-bold whitespace-nowrap">قراءة العداد السابق</th>
                    <th className="px-3 py-3 text-center font-bold">الشهر</th>
                    <th className="px-3 py-3 text-center font-bold no-print w-14"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, idx) => {
                    const auto = autoDistance(row.current_start, row.current_end);
                    const dist = row.distance !== null ? row.distance : auto;
                    const isManual = row.distance !== null;
                    const isDirty = dirty.has(row.vehicle_id);
                    const isSaving = saving.has(row.vehicle_id);
                    const isEven = idx % 2 === 0;
                    return (
                      <tr
                        key={row.vehicle_id}
                        className={`border-b border-border transition-colors hover:bg-muted/30 print:hover:bg-transparent ${isEven ? "print:bg-gray-50" : ""}`}
                      >
                        <td className="px-3 py-2.5 text-center text-muted-foreground text-xs">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold">{row.name}</td>
                        <td className="px-3 py-2.5 text-center">{row.plate}</td>
                        <td className="px-3 py-2.5 text-center">{row.fuel_type}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">{row.serial_ranges}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={row.current_start ?? ""}
                              onChange={(e) => updateRow(row.vehicle_id, "current_start", e.target.value ? Number(e.target.value) : null)}
                              className="w-[72px] h-7 text-xs text-center rounded-md border border-input bg-blue-50/40 focus:bg-white focus:ring-2 focus:ring-ring focus:outline-none print:border-none print:bg-transparent print:focus:ring-0 print:w-auto"
                              placeholder="من"
                            />
                            <span className="text-muted-foreground text-xs">/</span>
                            <input
                              type="number"
                              value={row.current_end ?? ""}
                              onChange={(e) => updateRow(row.vehicle_id, "current_end", e.target.value ? Number(e.target.value) : null)}
                              className="w-[72px] h-7 text-xs text-center rounded-md border border-input bg-blue-50/40 focus:bg-white focus:ring-2 focus:ring-ring focus:outline-none print:border-none print:bg-transparent print:focus:ring-0 print:w-auto"
                              placeholder="إلى"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="number"
                            value={dist}
                            onChange={(e) => updateRow(row.vehicle_id, "distance", e.target.value ? Number(e.target.value) : null)}
                            className={`w-20 h-7 text-xs text-center rounded-md border border-input focus:ring-2 focus:ring-ring focus:outline-none print:border-none print:bg-transparent print:focus:ring-0 print:w-auto ${isManual ? "font-bold bg-amber-50/40" : "bg-transparent text-muted-foreground"}`}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-center text-sm text-muted-foreground">
                          {row.prev_start !== null || row.prev_end !== null
                            ? `${row.prev_start ?? "—"} / ${row.prev_end ?? "—"}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-center text-xs">{month}</td>
                        <td className="px-3 py-2.5 text-center no-print">
                          <div className="flex items-center justify-center gap-1">
                            {isDirty && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="تعديل غير محفوظ" />}
                            <Button
                              size="sm"
                              variant={isDirty ? "default" : "ghost"}
                              onClick={() => saveRow(row)}
                              disabled={isSaving}
                              className={`h-7 w-7 p-0 ${!isDirty ? "opacity-0 group-hover:opacity-100" : ""}`}
                            >
                              {isSaving ? (
                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Save size={13} />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── Totals footer row ── */}
                  <tr className="bg-muted/40 font-bold border-t-2 border-border print:bg-gray-100">
                    <td colSpan={5} className="px-3 py-3 text-left text-sm">الإجمالي</td>
                    <td className="px-3 py-3 text-center text-sm" />
                    <td className="px-3 py-3 text-center text-sm font-black">
                      {totals.totalDist.toLocaleString("en-US")}
                    </td>
                    <td colSpan={3} className="px-3 py-3 text-center text-xs text-muted-foreground">
                      إجمالي عدد المركبات: {totals.count}
                    </td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════
           PRINT LAYOUT (professional report)
           ════════════════════════════════════════════ */}
      <div className="hidden print:block print-report">

        {/* ── Report Header ── */}
        <div className="print-header">
          <div className="print-header-top">
            <div className="print-logo-area">
              <p className="print-company-name">{settings.company_name || "شركة ........................"}</p>
            </div>
            <div className="print-date-area">
              <p className="print-meta">التاريخ: {printDate}</p>
              <p className="print-meta">الشهر: {month}</p>
              {deptName && <p className="print-meta">الإدارة: {deptName}</p>}
            </div>
          </div>
          <div className="print-title-block">
            <div className="print-title-line" />
            <h1 className="print-title">كشف تسوية الوقود الشهري</h1>
            <p className="print-subtitle">Monthly Fuel Settlement Statement</p>
            <div className="print-title-line" />
          </div>
        </div>

        {/* ── Data grouped by fuel type ── */}
        {groupedRows.length === 0 ? (
          <div className="print-empty">لا توجد مركبات للتسوية هذا الشهر</div>
        ) : (
          groupedRows.map((group, gi) => {
            const summary = fuelTypeSummary[gi];
            return (
              <div key={gi} className="print-section">
                <h2 className="print-section-title">● {group.fuelType}</h2>
                <table className="print-data-table">
                  <thead>
                    <tr>
                      <th className="print-th" style={{ width: "5%" }}>م</th>
                      <th className="print-th" style={{ width: "18%" }}>اسم المركبة</th>
                      <th className="print-th" style={{ width: "10%" }}>اللوحة</th>
                      <th className="print-th" style={{ width: "18%" }}>العداد (من - إلى)</th>
                      <th className="print-th" style={{ width: "10%" }}>المسافة (كم)</th>
                      <th className="print-th" style={{ width: "14%" }}>العداد السابق</th>
                      <th className="print-th" style={{ width: "25%" }}>أرقام البونات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row, idx) => {
                      const dist = row.distance !== null ? row.distance : autoDistance(row.current_start, row.current_end);
                      const startEnd = `${row.current_start ?? "—"} - ${row.current_end ?? "—"}`;
                      const prevReading = row.prev_start !== null || row.prev_end !== null
                        ? `${row.prev_start ?? "—"} / ${row.prev_end ?? "—"}`
                        : "—";
                      return (
                        <tr key={row.vehicle_id} className={idx % 2 === 1 ? "print-row-alt" : ""}>
                          <td className="print-td text-center">{idx + 1}</td>
                          <td className="print-td font-bold">{row.name}</td>
                          <td className="print-td text-center">{row.plate}</td>
                          <td className="print-td text-center font-mono">{startEnd}</td>
                          <td className="print-td text-center">{dist.toLocaleString("en-US")}</td>
                          <td className="print-td text-center">{prevReading}</td>
                          <td className="print-td text-center print-serial">{row.serial_ranges}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="print-total-bar">
                  <span className="print-total-label">المجموع</span>
                  <span className="print-total-item" style={{ width: "18%" }} />
                  <span className="print-total-item" style={{ width: "10%" }} />
                  <span className="print-total-item print-total-text" style={{ width: "18%" }}>
                    {group.rows.length} {group.rows.length === 1 ? "مركبة" : "مركبات"}
                  </span>
                  <span className="print-total-item text-center" style={{ width: "10%" }}>
                    {summary.totalDist.toLocaleString("en-US")}
                  </span>
                  <span className="print-total-item" style={{ width: "14%" }} />
                  <span className="print-total-item text-center" style={{ width: "25%" }}>
                    {summary.totalLiters.toLocaleString("en-US")} لتر
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* ── Summary Box ── */}
        <div className="print-section">
          <h2 className="print-section-title">● ملخص التسوية</h2>
          <table className="print-data-table">
            <thead>
              <tr>
                <th className="print-th" style={{ width: "28%" }}>نوع الوقود</th>
                <th className="print-th" style={{ width: "24%" }}>عدد المركبات</th>
                <th className="print-th" style={{ width: "24%" }}>المسافة (كم)</th>
                <th className="print-th" style={{ width: "24%" }}>الليترات</th>
              </tr>
            </thead>
            <tbody>
              {fuelTypeSummary.map((s, i) => (
                <tr key={i} className={i % 2 === 1 ? "print-row-alt" : ""}>
                  <td className="print-td font-bold">{s.fuelType}</td>
                  <td className="print-td text-center">{s.count}</td>
                  <td className="print-td text-center">{s.totalDist.toLocaleString("en-US")}</td>
                  <td className="print-td text-center">{s.totalLiters.toLocaleString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="print-total-bar">
            <span className="print-total-label">الإجمالي</span>
            <span className="print-total-item text-center" style={{ width: "24%" }}>
              {totals.count}
            </span>
            <span className="print-total-item text-center" style={{ width: "24%" }}>
              {totals.totalDist.toLocaleString("en-US")}
            </span>
            <span className="print-total-item text-center" style={{ width: "24%" }}>
              {fuelTypeSummary.reduce((acc, s) => acc + s.totalLiters, 0).toLocaleString("en-US")}
            </span>
          </div>
        </div>

        {/* ── Bottom Summary ── */}
        <div className="print-bottom-summary">
          <div className="print-bottom-line" />
          <div className="print-bottom-grid">
            <div className="print-bottom-item">
              <span className="print-bottom-label">إجمالي الليترات المصروفة</span>
              <span className="print-bottom-value">
                {fuelTypeSummary.reduce((acc, s) => acc + s.totalLiters, 0).toLocaleString("en-US")}
              </span>
            </div>
            <div className="print-bottom-item">
              <span className="print-bottom-label">إجمالي المسافة المقطوعة</span>
              <span className="print-bottom-value">{totals.totalDist.toLocaleString("en-US")} كم</span>
            </div>
            <div className="print-bottom-item">
              <span className="print-bottom-label">إجمالي عدد المركبات</span>
              <span className="print-bottom-value">{totals.count}</span>
            </div>
          </div>
          <div className="print-bottom-line" />
        </div>

        <div className="print-footer">
          <p>{(settings.report_footer || "تقرير مصدّر من نظام واقود") + " — "}{printDate}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print, .print\\:hidden { display: none !important; }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm 1.2cm;
          }
          .print-area { margin: 0; padding: 0; }
          .print-report {
            font-family: "Segoe UI", "Arial", sans-serif;
            direction: rtl;
            color: #1e293b;
            font-size: 9pt;
          }
          /* ── Header ── */
          .print-header { margin-bottom: 10px; }
          .print-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
          }
          .print-company-name { font-size: 11pt; font-weight: 900; color: #065f46; margin: 0; }
          .print-date-area { text-align: left; }
          .print-meta { font-size: 8pt; color: #64748b; margin: 0; line-height: 1.5; }
          .print-title-block { text-align: center; }
          .print-title-line {
            height: 2px;
            background: linear-gradient(to right, transparent, #059669, transparent);
            margin: 3px 0;
          }
          .print-title { font-size: 14pt; font-weight: 900; color: #065f46; margin: 3px 0; }
          .print-subtitle { font-size: 7.5pt; color: #94a3b8; margin: 2px 0; }
          /* ── Sections ── */
          .print-section { margin-bottom: 8px; }
          .print-section-title {
            font-size: 9pt;
            font-weight: 900;
            color: #065f46;
            margin: 0 0 3px 0;
            padding: 3px 6px;
            background: #ecfdf5;
            border-right: 3px solid #059669;
          }
          .print-empty {
            text-align: center; padding: 20px; color: #94a3b8; font-size: 9pt;
          }
          /* ── Data Tables ── */
          .print-data-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          .print-th {
            background: #059669 !important;
            color: white !important;
            font-weight: 700;
            font-size: 7.5pt;
            padding: 4px 5px;
            text-align: center;
            border: 1px solid #047857;
          }
          .print-td {
            padding: 3px 5px;
            border: 1px solid #e2e8f0;
            font-size: 8pt;
            vertical-align: middle;
          }
          .print-row-alt { background: #f0fdf4; }
          .print-serial { font-size: 7pt; color: #64748b; }
          .print-total-bar {
            display: flex;
            align-items: center;
            background: #d1fae5;
            border: 1px solid #a7f3d0;
            border-top: none;
            font-weight: 900;
            font-size: 8pt;
            padding: 0;
            color: #065f46;
          }
          .print-total-label {
            padding: 3px 8px;
            width: 22%;
            text-align: right;
          }
          .print-total-item {
            padding: 3px 5px;
            border-right: 1px solid #a7f3d0;
          }
          .print-total-text { font-size: 7.5pt; color: #475569; }
          /* ── Bottom Summary ── */
          .print-bottom-summary { margin: 12px 0 6px; }
          .print-bottom-line {
            height: 2px;
            background: linear-gradient(to right, transparent, #059669, transparent);
            margin: 3px 0;
          }
          .print-bottom-grid {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 4px 0;
          }
          .print-bottom-item { text-align: center; flex: 1; }
          .print-bottom-label {
            display: block;
            font-size: 7.5pt;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 2px;
          }
          .print-bottom-value {
            display: block;
            font-size: 10pt;
            font-weight: 900;
            color: #065f46;
          }
          /* ── Footer ── */
          .print-footer {
            text-align: center;
            font-size: 7pt;
            color: #94a3b8;
            margin-top: 8px;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
