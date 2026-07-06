"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Edit3, Trash2 } from "lucide-react";

interface Batch {
  id: string;
  count: number;
  cost: number;
  litres: number;
  start_serial: number;
  end_serial: number;
  fuel_type_id: string;
  vehicles: { name: string | null; plate: string } | null;
  departments: { name: string } | null;
  fuel_types: { name: string } | null;
}

interface CouponBatchListProps {
  batches: Batch[];
  onEdit: (batch: Batch) => void;
  onDelete: (batch: Batch) => void;
}

export function CouponBatchList({ batches, onEdit, onDelete }: CouponBatchListProps) {
  const totals = batches.reduce(
    (s, b) => ({
      total: s.total + Number(b.cost),
      totalCoupons: s.totalCoupons + b.count,
      totalLiters: s.totalLiters + b.count * Number(b.litres),
    }),
    { total: 0, totalCoupons: 0, totalLiters: 0 }
  );

  return (
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
            {batches.map((b) => (
              <BatchRow key={b.id} batch={b} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BatchRow({
  batch,
  onEdit,
  onDelete,
}: {
  batch: Batch;
  onEdit: (b: Batch) => void;
  onDelete: (b: Batch) => void;
}) {
  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold">
          {batch.vehicles?.name ? `${batch.vehicles.name} (${batch.vehicles.plate})` : batch.vehicles?.plate}
        </span>
        <div className="flex items-center gap-1">
          <Badge>{batch.count} بون</Badge>
          <Button variant="ghost" size="sm" onClick={() => onEdit(batch)}>
            <Edit3 size={15} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(batch)}>
            <Trash2 size={15} className="text-destructive" />
          </Button>
        </div>
      </div>
      <div className="text-sm text-muted-foreground flex gap-4">
        <span>{batch.departments?.name}</span>
        <span>{batch.fuel_types?.name}</span>
        <span>{batch.litres} لتر</span>
        <span>{Number(batch.cost).toLocaleString("en-US")} ج.م</span>
        <span>{batch.count * Number(batch.litres)} لتر</span>
        <span className="text-xs">#{batch.start_serial}-#{batch.end_serial}</span>
      </div>
    </div>
  );
}
