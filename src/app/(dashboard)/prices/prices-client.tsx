"use client";

import { useState } from "react";
import type { FuelType, FuelPrice } from "@/types/database";
import { setPrice } from "@/lib/actions/prices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, TrendingUp, Calendar } from "lucide-react";

interface PriceItem {
  fuel_type: FuelType;
  current_price: FuelPrice | null;
}

interface Props {
  prices: PriceItem[];
}

export function PricesClient({ prices: initial }: Props) {
  const [prices, setPrices] = useState(initial);
  const [selected, setSelected] = useState<PriceItem | null>(null);
  const [newPrice, setNewPrice] = useState("");

  const handleUpdate = async () => {
    if (!selected || !newPrice) return;
    const fd = new FormData();
    fd.set("fuel_type_id", selected.fuel_type.id);
    fd.set("price", newPrice);
    await setPrice(fd);
    setSelected(null);
    setNewPrice("");
    const { getPrices } = await import("@/lib/actions/prices");
    setPrices(await getPrices());
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">أسعار الوقود</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">تحديث ومتابعة أسعار الوقود والمشتقات النفطية</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {prices.map((item) => (
          <Card key={item.fuel_type.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel size={20} />
                <span>{item.fuel_type.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.current_price ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-3xl font-black text-primary">
                    <TrendingUp size={28} />
                    <span>{Number(item.current_price.price).toFixed(2)}</span>
                    <span className="text-base text-muted-foreground font-bold">جنيه / لتر</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
                    <Calendar size={14} />
                    <span>آخر تحديث: {formatDate(item.current_price.effective_from)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground font-bold py-2">لا يوجد سعر مسجل</p>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelected(item);
                    setNewPrice(item.current_price ? String(item.current_price.price) : "");
                  }}
                >
                  تحديث السعر
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>تحديث سعر {selected.fuel_type.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
                className="space-y-4"
              >
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="السعر الجديد"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelected(null)}>إلغاء</Button>
                  <Button type="submit" disabled={!newPrice || parseFloat(newPrice) <= 0}>حفظ</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
