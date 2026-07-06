"use client";

import { useState, useEffect } from "react";
import { updateCouponBatch } from "@/lib/actions/coupons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

interface Batch {
  id: string;
  count: number;
  litres: number;
  start_serial: number;
  end_serial: number;
  fuel_type_id: string;
}

interface EditCouponModalProps {
  batch: Batch | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCouponModal({ batch, onClose, onSuccess }: EditCouponModalProps) {
  const [editCount, setEditCount] = useState("");
  const [editLitres, setEditLitres] = useState("");
  const [editStartSerial, setEditStartSerial] = useState("");
  const [editEndSerial, setEditEndSerial] = useState("");
  const [editFuelTypeId, setEditFuelTypeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const open = !!batch;
  const batchId = batch?.id;

  useEffect(() => {
    if (batch) {
      setEditCount(String(batch.count));
      setEditLitres(String(batch.litres));
      setEditStartSerial(String(batch.start_serial));
      setEditEndSerial(String(batch.end_serial));
      setEditFuelTypeId(batch.fuel_type_id);
    }
  }, [batch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setError("");
    setLoading(true);

    try {
      await updateCouponBatch({
        id: batchId,
        count: parseInt(editCount, 10),
        litres: parseFloat(editLitres),
        start_serial: parseInt(editStartSerial, 10),
        end_serial: parseInt(editEndSerial, 10),
        fuel_type_id: editFuelTypeId,
      });
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في تحديث البونات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="تعديل البونات" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">عدد البونات</label>
          <Input
            type="number"
            value={editCount}
            onChange={(e) => setEditCount(e.target.value)}
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">لتر لكل بون</label>
          <Input
            type="number"
            value={editLitres}
            onChange={(e) => setEditLitres(e.target.value)}
            min="1"
            step="0.5"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">بداية الرقم المسلسل</label>
          <Input
            type="number"
            value={editStartSerial}
            onChange={(e) => setEditStartSerial(e.target.value)}
            min="1"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2">نهاية الرقم المسلسل</label>
          <Input
            type="number"
            value={editEndSerial}
            onChange={(e) => setEditEndSerial(e.target.value)}
            min="1"
            required
          />
        </div>
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-xl border border-destructive/20">
            {error}
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
