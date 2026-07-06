"use client";

import { useState } from "react";
import { issueCoupons } from "@/lib/actions/coupons";
import { getDefaultLitresPerCoupon } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

interface Vehicle {
  id: string;
  name: string | null;
  plate: string;
  fuel_types: { name: string } | null;
  departments: { name: string } | null;
}

interface FuelType {
  id: string;
  name: string;
  category: string;
  default_litres: number;
}

interface IssueCouponFormProps {
  vehicles: Vehicle[];
  fuelTypes: FuelType[];
  month: string;
  onSuccess: () => void;
}

export function IssueCouponForm({ vehicles, fuelTypes, month, onSuccess }: IssueCouponFormProps) {
  const [selVehicle, setSelVehicle] = useState("");
  const [selFuelType, setSelFuelType] = useState("");
  const [count, setCount] = useState("5");
  const [litres, setLitres] = useState("20");
  const [startSerial, setStartSerial] = useState("");
  const [endSerial, setEndSerial] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVehicleChange = (id: string) => {
    setSelVehicle(id);
    const v = vehicles.find((x) => x.id === id);
    if (v?.fuel_types) {
      const ft = fuelTypes.find((f) => f.name === v.fuel_types!.name);
      if (ft) {
        setSelFuelType(ft.id);
        setLitres(String(getDefaultLitresPerCoupon(ft.id, fuelTypes)));
      }
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

    try {
      await issueCoupons({
        vehicle_id: selVehicle,
        month,
        fuel_type_id: selFuelType,
        count: parseInt(count, 10),
        litres: parseFloat(litres),
        start_serial: parseInt(startSerial, 10),
        end_serial: parseInt(endSerial, 10),
      });

      resetForm();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في إصدار البونات");
    } finally {
      setLoading(false);
    }
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

  return (
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

          <TextFormField label="لتر لكل بون" value={litres} onChange={setLitres} type="number" min="1" step="0.5" />
          <TextFormField label="عدد البونات" value={count} onChange={setCount} type="number" min="1" max="100" />

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

          <TextFormField label="بداية الرقم المسلسل" value={startSerial} onChange={setStartSerial} type="number" min="1" />
          <TextFormField label="نهاية الرقم المسلسل" value={endSerial} onChange={setEndSerial} type="number" min="1" />

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
  );
}

function TextFormField({
  label,
  value,
  onChange,
  type = "text",
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-bold mb-2">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        required
        suppressHydrationWarning
      />
    </div>
  );
}
