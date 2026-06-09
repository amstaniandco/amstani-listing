"use client";

import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { usePortalStore } from "@/store/portal-store";
import type { PortalCategory } from "@/types/portal";

const categorySchema = z.object({
  name: z.string().min(2, "Category name is required."),
  status: z.enum(["active", "archived"]),
});

type CategoryValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  category?: PortalCategory | null;
}

function CategoryForm({ open, onOpenChange, brandId, category }: CategoryFormProps) {
  const createCategory = usePortalStore((state) => state.createCategory);
  const updateCategory = usePortalStore((state) => state.updateCategory);
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      status: category?.status ?? "active",
    },
  });

  useEffect(() => {
    form.reset({
      name: category?.name ?? "",
      status: category?.status ?? "active",
    });
  }, [category, form]);

  const submit = form.handleSubmit((values) => {
    if (category) {
      updateCategory(category.id, { ...category, ...values });
    } else {
      createCategory({ ...values, brandId });
    }
    onOpenChange(false);
    form.reset();
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription>Manage your own catalog categories from this workspace.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="name">Category name</Label>
            <Input id="name" placeholder="Summer Staples" {...form.register("name")} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as CategoryValues["status"])}>
              <SelectTrigger>
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{category ? "Save changes" : "Create category"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CategoryForm };
