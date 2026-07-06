"use client";

import { useState } from "react";
import type { Department } from "@/types/database";
import { createDepartment, updateDepartment, deleteDepartment } from "@/lib/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";

interface Props {
  departments: Department[];
}

export function DepartmentsClient({ departments: initial }: Props) {
  const [departments, setDepartments] = useState(initial);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    const fd = new FormData();
    fd.set("name", newName);
    await createDepartment(fd);
    setShowAdd(false);
    setNewName("");
    const { getDepartments } = await import("@/lib/actions/departments");
    setDepartments(await getDepartments());
  };

  const handleEdit = async () => {
    if (!editing) return;
    const fd = new FormData();
    fd.set("id", editing.id);
    fd.set("name", editName);
    await updateDepartment(fd);
    setEditing(null);
    const { getDepartments } = await import("@/lib/actions/departments");
    setDepartments(await getDepartments());
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await deleteDepartment(deleting.id);
    setDeleting(null);
    const { getDepartments } = await import("@/lib/actions/departments");
    setDepartments(await getDepartments());
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">الإدارات</h1>
          <p className="text-muted-foreground font-bold text-sm mt-1">إدارة الأقسام والإدارات في المنظمة</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={18} />
          <span>إدارة جديدة</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 size={20} />
            <span>قائمة الإدارات ({departments.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {departments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-bold">
              لا توجد إدارات مضافة بعد
            </div>
          ) : (
            <div className="divide-y divide-border">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between px-6 py-4">
                  <span className="font-bold">{dept.name}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditing(dept); setEditName(dept.name); }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting(dept)}
                    >
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>إدارة جديدة</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
                className="space-y-4"
              >
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="اسم الإدارة"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAdd(false)}>إلغاء</Button>
                  <Button type="submit" disabled={!newName.trim()}>إضافة</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>تعديل الإدارة</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => { e.preventDefault(); handleEdit(); }}
                className="space-y-4"
              >
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
                  <Button type="submit" disabled={!editName.trim()}>حفظ</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف الإدارة"
        message={`هل أنت متأكد من حذف "${deleting?.name}"؟`}
        variant="danger"
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        onConfirm={handleDelete}
      />
    </>
  );
}
