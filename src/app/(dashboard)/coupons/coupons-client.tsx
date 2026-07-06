"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteCouponBatch, getAllBatches } from "@/lib/actions/coupons";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { IssueCouponForm } from "@/components/modules/coupons/issue-coupon-form";
import { CouponBatchList } from "@/components/modules/coupons/coupon-batch-list";
import { EditCouponModal } from "@/components/modules/coupons/edit-coupon-modal";

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

interface Props {
  vehicles: Vehicle[];
  fuelTypes: FuelType[];
  initialBatches: Batch[];
  month: string;
}

export function CouponsClient({ vehicles, fuelTypes, initialBatches, month }: Props) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Batch | null>(null);
  const [deleting, setDeleting] = useState<Batch | null>(null);

  const { data: batches } = useQuery({
    queryKey: ["coupons", month],
    queryFn: () => getAllBatches(month),
    initialData: initialBatches,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["coupons", month] });
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteCouponBatch(deleting.id);
    setDeleting(null);
    handleRefresh();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">إصدار البونات</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">{month}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <IssueCouponForm
          vehicles={vehicles}
          fuelTypes={fuelTypes}
          month={month}
          onSuccess={handleRefresh}
        />
        <CouponBatchList
          batches={batches}
          onEdit={setEditing}
          onDelete={setDeleting}
        />
      </div>

      <EditCouponModal
        batch={editing}
        onClose={() => setEditing(null)}
        onSuccess={handleRefresh}
      />

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
