"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Building2, Fuel, Scissors, Droplets } from "lucide-react";

interface BatchData {
  id: string;
  count: number;
  cost: number;
  litres: number;
  month: string;
  department_id: string;
  vehicle_name: string;
  plate: string;
  department: string;
}

interface DeductionData {
  amount: number;
  department_id: string;
}

interface Props {
  departments: { id: string; name: string }[];
  allVehicles: { id: string; name: string; department_id: string }[];
  allBatches: BatchData[];
  allDeductions: DeductionData[];
}

export function DashboardClient({ departments, allVehicles, allBatches, allDeductions }: Props) {
  const [selectedDept, setSelectedDept] = useState<string>("");

  const filteredBatches = useMemo(
    () => (selectedDept ? allBatches.filter((b) => b.department_id === selectedDept) : allBatches),
    [allBatches, selectedDept]
  );

  const filteredDeductions = useMemo(
    () => (selectedDept ? allDeductions.filter((d) => d.department_id === selectedDept) : allDeductions),
    [allDeductions, selectedDept]
  );

  const stats = useMemo(() => {
    const filteredVehicles = selectedDept
      ? allVehicles.filter((v) => v.department_id === selectedDept)
      : allVehicles;
    const totalCost = filteredBatches.reduce((sum, b) => sum + b.cost, 0);
    const totalCoupons = filteredBatches.reduce((sum, b) => sum + b.count, 0);
    const totalLiters = filteredBatches.reduce((sum, b) => sum + b.count * b.litres, 0);
    const totalDeductions = filteredDeductions.reduce((sum, d) => sum + d.amount, 0);
    const deptIds = new Set(filteredBatches.map((b) => b.department_id));
    return { vehiclesCount: filteredVehicles.length, totalCost, totalCoupons, totalLiters, totalDeductions, deptCount: deptIds.size };
  }, [selectedDept, allVehicles, filteredBatches, filteredDeductions]);

  const recentBatches = filteredBatches.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">لوحة التحكم</h1>
        <p className="text-muted-foreground font-bold text-sm mt-1">نظرة عامة على نظام إدارة الوقود</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-sm font-bold text-muted-foreground">تصفية بالإدارة:</span>
        <Button
          variant={selectedDept === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDept("")}
        >
          الكل
        </Button>
        {departments.map((d) => (
          <Button
            key={d.id}
            variant={selectedDept === d.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDept(d.id)}
          >
            {d.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 text-blue-600 bg-blue-100">
                <Car size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">عدد المركبات</p>
                <p className="text-2xl font-black mt-1">{stats.vehiclesCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 text-emerald-600 bg-emerald-100">
                <Building2 size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">عدد الإدارات</p>
                <p className="text-2xl font-black mt-1">{stats.deptCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 text-amber-600 bg-amber-100">
                <Fuel size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">تكلفة الوقود</p>
                <p className="text-2xl font-black mt-1">{stats.totalCost.toLocaleString("en-US")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 text-rose-600 bg-rose-100">
                <Scissors size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">قيمة الاستقطاعات</p>
                <p className="text-2xl font-black mt-1">{stats.totalDeductions.toLocaleString("en-US")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 text-indigo-600 bg-indigo-100">
                <Droplets size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground">إجمالي الليترات المصروفة</p>
                <p className="text-2xl font-black mt-1">{stats.totalLiters.toLocaleString("en-US")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel size={20} />
            <span>آخر الدفعات ({stats.totalCoupons})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentBatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-bold">
              لا توجد دفعات لهذا الشهر
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{batch.vehicle_name}</span>
                    <span className="text-muted-foreground">{batch.plate}</span>
                    <Badge variant="secondary">{batch.department}</Badge>
                    <span className="text-xs text-muted-foreground">{batch.month}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground font-bold">{batch.count} كوبون</span>
                    <span className="font-bold">{(batch.count * batch.litres).toLocaleString("en-US")} لتر</span>
                    <span className="font-black">{batch.cost.toLocaleString("en-US")} ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
