"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Fuel, Droplets, Coins, Truck, BarChart3 } from "lucide-react";

interface Props {
  batches: any[];
  deductions: any[];
  month: string;
  settings: Record<string, string>;
}

export function ReportsClient({ batches, deductions, month, settings }: Props) {
  const [selMonth, setSelMonth] = useState(month);
  const [fuelFilter, setFuelFilter] = useState("");

  const fuelTypes = useMemo(() => {
    const types = new Set(batches.map((b: any) => b.fuel_types?.name).filter(Boolean));
    return Array.from(types).sort();
  }, [batches]);

  const filteredBatches = useMemo(
    () => (fuelFilter ? batches.filter((b: any) => b.fuel_types?.name === fuelFilter) : batches),
    [batches, fuelFilter]
  );

  const filteredTotals = useMemo(() => {
    const fuelTotal = filteredBatches.reduce((s: number, b: any) => s + Number(b.cost), 0);
    const couponCount = filteredBatches.reduce((s: number, b: any) => s + b.count, 0);
    const litreTotal = filteredBatches.reduce((s: number, b: any) => s + Number(b.litres) * b.count, 0);
    const vehicleCount = new Set(filteredBatches.map((b: any) => b.vehicle_id)).size;
    const deptCount = new Set(filteredBatches.map((b: any) => b.department_id)).size;
    const avgPrice = litreTotal > 0 ? fuelTotal / litreTotal : 0;
    const dedTotal = deductions.reduce((s: number, d: any) => s + Number(d.amount), 0);
    return { fuelTotal, couponCount, litreTotal, vehicleCount, deptCount, avgPrice, dedTotal };
  }, [filteredBatches, deductions]);

  const fuelTypeBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; litres: number; cost: number }>();
    for (const b of filteredBatches) {
      const name = b.fuel_types?.name || "أخرى";
      const prev = map.get(name) ?? { count: 0, litres: 0, cost: 0 };
      prev.count += b.count;
      prev.litres += Number(b.litres) * b.count;
      prev.cost += Number(b.cost);
      map.set(name, prev);
    }
    return Array.from(map.entries());
  }, [filteredBatches]);

  const printDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric", month: "long", day: "numeric",
  });

  const netTotal = filteredTotals.fuelTotal - filteredTotals.dedTotal;

  return (
    <>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black">التقارير الشهرية</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">تقرير استهلاك الوقود والاستقطاعات</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selMonth}
            onChange={(e) => {
              setSelMonth(e.target.value);
              window.location.href = `/reports?month=${e.target.value}`;
            }}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground font-bold text-sm"
          />
          {fuelTypes.length > 1 && (
            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="h-10 rounded-xl border border-border bg-background px-4 text-sm font-bold"
            >
              <option value="">كل أنواع الوقود</option>
              {fuelTypes.map((ft) => (
                <option key={ft} value={ft}>{ft}</option>
              ))}
            </select>
          )}
          <Button onClick={() => window.print()} variant="outline">
            <Printer size={18} />
            <span>طباعة</span>
          </Button>
        </div>
      </div>

      {/* ════════════════════════════════════════════
           SCREEN CONTENT (hidden on print)
           ════════════════════════════════════════════ */}
      <div className="print:hidden">
        <div id="report-content">
          {/* ── KPI Cards ── */}
          {filteredBatches.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Droplets size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold">إجمالي الليترات المصروفة</div>
                    <div className="text-lg font-black">{filteredTotals.litreTotal.toLocaleString("en-US")}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                    <Coins size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold">عدد البونات المصروفة</div>
                    <div className="text-lg font-black">{filteredTotals.couponCount.toLocaleString("en-US")}</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 text-green-700">
                    <Fuel size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold">متوسط سعر اللتر</div>
                    <div className="text-lg font-black">{filteredTotals.avgPrice.toFixed(2)} ج.م</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <Truck size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground font-bold">المركبات المستلمة</div>
                    <div className="text-lg font-black">{filteredTotals.vehicleCount}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Fuel Type Breakdown ── */}
          {fuelTypeBreakdown.length > 1 && !fuelFilter && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 size={18} />
                  تفاصيل حسب نوع الوقود
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-right font-bold">نوع الوقود</th>
                        <th className="px-4 py-3 text-right font-bold">عدد البونات</th>
                        <th className="px-4 py-3 text-right font-bold">إجمالي الليترات</th>
                        <th className="px-4 py-3 text-right font-bold">إجمالي التكلفة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelTypeBreakdown.map(([fuel, data]) => (
                        <tr key={fuel} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-3 font-bold">{fuel}</td>
                          <td className="px-4 py-3">{data.count.toLocaleString("en-US")}</td>
                          <td className="px-4 py-3">{data.litres.toLocaleString("en-US")}</td>
                          <td className="px-4 py-3">{data.cost.toLocaleString("en-US")} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Fuel Report Table ── */}
          <Card className="mb-6">
            <CardHeader className="text-center border-b border-border print:pt-4">
              <CardTitle className="text-2xl">تقرير الوقود الشهري</CardTitle>
              <p className="text-muted-foreground font-bold">
                {selMonth}{fuelFilter ? `  |  ${fuelFilter}` : ""}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {filteredBatches.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-bold">
                  لا توجد بيانات لهذا الشهر
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-right font-bold">م</th>
                        <th className="px-4 py-3 text-right font-bold">المركبة</th>
                        <th className="px-4 py-3 text-right font-bold">الإدارة</th>
                        <th className="px-4 py-3 text-right font-bold">الوقود</th>
                        <th className="px-4 py-3 text-right font-bold">عدد البونات</th>
                        <th className="px-4 py-3 text-right font-bold">اللترات</th>
                        <th className="px-4 py-3 text-right font-bold">التكلفة</th>
                        <th className="px-4 py-3 text-right font-bold">الأرقام المسلسلة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBatches.map((b: any, i: number) => (
                        <tr key={b.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-3">{i + 1}</td>
                          <td className="px-4 py-3 font-bold">{b.vehicles?.plate}</td>
                          <td className="px-4 py-3">{b.departments?.name}</td>
                          <td className="px-4 py-3">{b.fuel_types?.name}</td>
                          <td className="px-4 py-3">{b.count}</td>
                          <td className="px-4 py-3">{Number(b.litres) * b.count}</td>
                          <td className="px-4 py-3">{Number(b.cost).toLocaleString("en-US")} ج.م</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            #{b.start_serial} - #{b.end_serial}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-bold">
                        <td colSpan={4} className="px-4 py-3 text-left">الإجمالي</td>
                        <td className="px-4 py-3">{filteredTotals.couponCount.toLocaleString("en-US")}</td>
                        <td className="px-4 py-3">{filteredTotals.litreTotal.toLocaleString("en-US")}</td>
                        <td className="px-4 py-3">{filteredTotals.fuelTotal.toLocaleString("en-US")} ج.م</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Deductions Table ── */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>الاستقطاعات</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {deductions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground font-bold">
                  لا توجد استقطاعات لهذا الشهر
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-right font-bold">م</th>
                        <th className="px-4 py-3 text-right font-bold">المركبة</th>
                        <th className="px-4 py-3 text-right font-bold">الإدارة</th>
                        <th className="px-4 py-3 text-right font-bold">المبلغ</th>
                        <th className="px-4 py-3 text-right font-bold">السبب</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.map((d: any, i: number) => (
                        <tr key={d.id} className="border-b border-border hover:bg-muted/30">
                          <td className="px-4 py-3">{i + 1}</td>
                          <td className="px-4 py-3 font-bold">{d.vehicles?.plate || "-"}</td>
                          <td className="px-4 py-3">{d.departments?.name || "-"}</td>
                          <td className="px-4 py-3">{Number(d.amount).toLocaleString("en-US")} ج.م</td>
                          <td className="px-4 py-3">{d.reason}</td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-bold">
                        <td colSpan={3} className="px-4 py-3 text-left">الإجمالي</td>
                        <td className="px-4 py-3">{filteredTotals.dedTotal.toLocaleString("en-US")} ج.م</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Bottom Summary Card ── */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground font-bold">إجمالي الليترات المصروفة</div>
                  <div className="text-2xl font-black text-sky-600">{filteredTotals.litreTotal.toLocaleString("en-US")}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-bold">إجمالي تكلفة الوقود</div>
                  <div className="text-2xl font-black">{filteredTotals.fuelTotal.toLocaleString("en-US")} ج.م</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-bold">إجمالي الاستقطاعات</div>
                  <div className="text-2xl font-black text-destructive">{filteredTotals.dedTotal.toLocaleString("en-US")} ج.م</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-bold">الصافي</div>
                  <div className="text-2xl font-black text-primary">
                    {netTotal.toLocaleString("en-US")} ج.م
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              <p className="print-meta">الشهر: {selMonth}</p>
            </div>
          </div>
          <div className="print-title-block">
            <div className="print-title-line" />
            <h1 className="print-title">تقرير استهلاك الوقود الشهري</h1>
            <p className="print-subtitle">
              {fuelFilter || (fuelTypes.length > 1 ? "جميع أنواع الوقود" : fuelTypes[0] || "")}
            </p>
            <div className="print-title-line" />
          </div>
        </div>

        {/* ── Summary Table ── */}
        <div className="print-section">
          <h2 className="print-section-title">● خلاصة الشهر</h2>
          <table className="print-summary-table">
            <tbody>
              <tr>
                <td className="print-summary-label">إجمالي الليترات المصروفة</td>
                <td className="print-summary-value">{filteredTotals.litreTotal.toLocaleString("en-US")}</td>
                <td className="print-summary-label">عدد البونات المصروفة</td>
                <td className="print-summary-value">{filteredTotals.couponCount.toLocaleString("en-US")}</td>
              </tr>
              <tr>
                <td className="print-summary-label">متوسط سعر اللتر</td>
                <td className="print-summary-value">{filteredTotals.avgPrice.toFixed(2)} ج.م</td>
                <td className="print-summary-label">عدد المركبات المستلمة</td>
                <td className="print-summary-value">{filteredTotals.vehicleCount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Fuel Type Breakdown ── */}
        {fuelTypeBreakdown.length > 1 && !fuelFilter && (
          <div className="print-section">
            <h2 className="print-section-title">● تفاصيل حسب نوع الوقود</h2>
            <table className="print-data-table print-full-width">
              <thead>
                <tr>
                  <th className="print-th" style={{ width: "30%" }}>نوع الوقود</th>
                  <th className="print-th" style={{ width: "23%" }}>عدد البونات</th>
                  <th className="print-th" style={{ width: "23%" }}>إجمالي الليترات</th>
                  <th className="print-th" style={{ width: "24%" }}>إجمالي التكلفة</th>
                </tr>
              </thead>
              <tbody>
                {fuelTypeBreakdown.map(([fuel, data]) => (
                  <tr key={fuel} className="print-row-alt">
                    <td className="print-td font-bold">{fuel}</td>
                    <td className="print-td text-center">{data.count.toLocaleString("en-US")}</td>
                    <td className="print-td text-center">{data.litres.toLocaleString("en-US")}</td>
                    <td className="print-td text-center">{data.cost.toLocaleString("en-US")} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Fuel Consumption Detail ── */}
        <div className="print-section">
          <h2 className="print-section-title">● كشف صرف الوقود التفصيلي</h2>
          <table className="print-data-table">
            <thead>
              <tr>
                <th className="print-th" style={{ width: "5%" }}>م</th>
                <th className="print-th" style={{ width: "17%" }}>المركبة</th>
                <th className="print-th" style={{ width: "17%" }}>الإدارة</th>
                <th className="print-th" style={{ width: "15%" }}>الوقود</th>
                <th className="print-th" style={{ width: "12%" }}>البونات</th>
                <th className="print-th" style={{ width: "14%" }}>الليترات</th>
                <th className="print-th" style={{ width: "20%" }}>التكلفة</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="print-td text-center">لا توجد بيانات</td>
                </tr>
              ) : (
                filteredBatches.map((b: any, i: number) => (
                  <tr key={b.id} className={i % 2 === 1 ? "print-row-alt" : ""}>
                    <td className="print-td text-center">{i + 1}</td>
                    <td className="print-td font-bold">{b.vehicles?.plate}</td>
                    <td className="print-td">{b.departments?.name}</td>
                    <td className="print-td">{b.fuel_types?.name}</td>
                    <td className="print-td text-center">{b.count}</td>
                    <td className="print-td text-center">{(Number(b.litres) * b.count).toLocaleString("en-US")}</td>
                    <td className="print-td text-center">{Number(b.cost).toLocaleString("en-US")} ج.م</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="print-total-bar">
            <span className="print-total-label">الإجمالي</span>
            <span className="print-total-item" style={{ width: "12%" }} />
            <span className="print-total-item" style={{ width: "17%" }} />
            <span className="print-total-item" style={{ width: "15%" }} />
            <span className="print-total-item text-center" style={{ width: "12%" }}>
              {filteredTotals.couponCount.toLocaleString("en-US")}
            </span>
            <span className="print-total-item text-center" style={{ width: "14%" }}>
              {filteredTotals.litreTotal.toLocaleString("en-US")}
            </span>
            <span className="print-total-item text-center" style={{ width: "20%" }}>
              {filteredTotals.fuelTotal.toLocaleString("en-US")} ج.م
            </span>
          </div>
        </div>

        {/* ── Deductions ── */}
        <div className="print-section">
          <h2 className="print-section-title">● الاستقطاعات</h2>
          <table className="print-data-table">
            <thead>
              <tr>
                <th className="print-th" style={{ width: "6%" }}>م</th>
                <th className="print-th" style={{ width: "20%" }}>المركبة</th>
                <th className="print-th" style={{ width: "20%" }}>الإدارة</th>
                <th className="print-th" style={{ width: "20%" }}>المبلغ</th>
                <th className="print-th" style={{ width: "34%" }}>السبب</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="print-td text-center">لا توجد استقطاعات</td>
                </tr>
              ) : (
                deductions.map((d: any, i: number) => (
                  <tr key={d.id} className={i % 2 === 1 ? "print-row-alt" : ""}>
                    <td className="print-td text-center">{i + 1}</td>
                    <td className="print-td font-bold">{d.vehicles?.plate || "-"}</td>
                    <td className="print-td">{d.departments?.name || "-"}</td>
                    <td className="print-td text-center">{Number(d.amount).toLocaleString("en-US")} ج.م</td>
                    <td className="print-td">{d.reason}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="print-total-bar">
            <span className="print-total-label">الإجمالي</span>
            <span className="print-total-item" style={{ width: "20%" }} />
            <span className="print-total-item" style={{ width: "20%" }} />
            <span className="print-total-item text-center" style={{ width: "20%" }}>
              {filteredTotals.dedTotal.toLocaleString("en-US")} ج.م
            </span>
            <span className="print-total-item" style={{ width: "34%" }} />
          </div>
        </div>

        {/* ── Bottom Summary ── */}
        <div className="print-bottom-summary">
          <div className="print-bottom-line" />
          <div className="print-bottom-grid">
            <div className="print-bottom-item">
              <span className="print-bottom-label">إجمالي الليترات المصروفة</span>
              <span className="print-bottom-value">{filteredTotals.litreTotal.toLocaleString("en-US")}</span>
            </div>
            <div className="print-bottom-item">
              <span className="print-bottom-label">إجمالي تكلفة الوقود</span>
              <span className="print-bottom-value">{filteredTotals.fuelTotal.toLocaleString("en-US")} ج.م</span>
            </div>
            <div className="print-bottom-item">
              <span className="print-bottom-label">إجمالي الاستقطاعات</span>
              <span className="print-bottom-value print-bottom-deduct">{filteredTotals.dedTotal.toLocaleString("en-US")} ج.م</span>
            </div>
            <div className="print-bottom-item">
              <span className="print-bottom-label">الصافي</span>
              <span className="print-bottom-value print-bottom-net">{netTotal.toLocaleString("en-US")} ج.م</span>
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
          .print\\:hidden { display: none !important; }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4 portrait;
            margin: 1.5cm 1.2cm;
          }
          .print-report {
            font-family: "Segoe UI", "Arial", sans-serif;
            direction: rtl;
            color: #1e293b;
            font-size: 9pt;
          }
          /* ── Header ── */
          .print-header { margin-bottom: 12px; }
          .print-header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .print-company-name { font-size: 11pt; font-weight: 900; color: #1e3a5f; margin: 0; }
          .print-date-area { text-align: left; }
          .print-meta { font-size: 8pt; color: #64748b; margin: 0; line-height: 1.5; }
          .print-title-block { text-align: center; }
          .print-title-line {
            height: 2px;
            background: linear-gradient(to right, transparent, #1e40af, transparent);
            margin: 4px 0;
          }
          .print-title { font-size: 14pt; font-weight: 900; color: #1e3a5f; margin: 4px 0; }
          .print-subtitle { font-size: 8pt; color: #64748b; margin: 2px 0; }
          /* ── Sections ── */
          .print-section { margin-bottom: 10px; }
          .print-section-title {
            font-size: 9pt;
            font-weight: 900;
            color: #1e40af;
            margin: 0 0 4px 0;
            padding: 3px 6px;
            background: #eff6ff;
            border-right: 3px solid #1e40af;
          }
          /* ── Summary Table ── */
          .print-summary-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          .print-summary-table td { padding: 3px 8px; border: 1px solid #cbd5e1; }
          .print-summary-label {
            font-weight: 700; font-size: 8pt; color: #475569;
            background: #f8fafc; width: 30%;
          }
          .print-summary-value {
            font-weight: 900; font-size: 9pt; color: #1e40af; width: 20%;
            text-align: center;
          }
          /* ── Data Tables ── */
          .print-data-table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          .print-th {
            background: #1e40af !important;
            color: white !important;
            font-weight: 700;
            font-size: 7.5pt;
            padding: 4px 5px;
            text-align: center;
            border: 1px solid #1e3a5f;
          }
          .print-td {
            padding: 3px 5px;
            border: 1px solid #e2e8f0;
            font-size: 8pt;
            vertical-align: middle;
          }
          .print-row-alt { background: #f1f5f9; }
          .print-total-bar {
            display: flex;
            align-items: center;
            background: #dbeafe;
            border: 1px solid #bfdbfe;
            border-top: none;
            font-weight: 900;
            font-size: 8.5pt;
            padding: 0;
            color: #1e40af;
          }
          .print-total-label {
            padding: 3px 8px;
            width: 22%;
            text-align: right;
          }
          .print-total-item {
            padding: 3px 5px;
            border-right: 1px solid #bfdbfe;
          }
          /* ── Bottom Summary ── */
          .print-bottom-summary { margin: 14px 0 8px; }
          .print-bottom-line {
            height: 2px;
            background: linear-gradient(to right, transparent, #1e40af, transparent);
            margin: 4px 0;
          }
          .print-bottom-grid {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 6px 0;
          }
          .print-bottom-item {
            text-align: center;
            flex: 1;
          }
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
            color: #1e40af;
          }
          .print-bottom-deduct { color: #dc2626; }
          .print-bottom-net { color: #059669; }
          /* ── Footer ── */
          .print-footer {
            text-align: center;
            font-size: 7pt;
            color: #94a3b8;
            margin-top: 10px;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
          }
        }
      `}</style>
    </>
  );
}
