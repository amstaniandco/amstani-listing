"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface CategoryOption {
  id: string;
  name: string;
}

interface SizeVariable {
  name: string;
  label: string;
}
interface VariantRow {
  size: string;
  color: string;
  stockQuantity: string;
  skuVariant: string;
}
interface SizeChartRow {
  size: string;
  unit: "cm" | "in";
  measurements: Record<string, string>;
}

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL", "Custom"];

export interface EditProduct {
  id: string;
  name: string;
  sku: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  totalStock: number;
  isFeatured: boolean;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryIds: string[];
  images: string[];
  variants: { size: string; color: string; stockQuantity: number; skuVariant: string }[];
  sizeCharts: { size: string; unit: "cm" | "in"; measurements: Record<string, string> }[];
  shipping: {
    weight: number | null; dimensionL: number | null; dimensionW: number | null;
    dimensionH: number | null; shippingClass: string | null;
  };
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  categories: CategoryOption[];
  product?: EditProduct | null; // present => edit mode
  onSaved: () => void;
}

export function ProductForm({ open, onOpenChange, categories, product, onSaved }: ProductFormProps) {
  const isEdit = Boolean(product);
  // Basic
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(product?.categoryIds ?? []);
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [fullDescription, setFullDescription] = useState(product?.fullDescription ?? "");
  // Pricing & inventory (price is read-only in edit mode)
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice != null ? String(product.compareAtPrice) : "");
  const [costPrice, setCostPrice] = useState(product?.costPrice != null ? String(product.costPrice) : "");
  const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">(product?.stockStatus ?? "IN_STOCK");
  const [totalStock, setTotalStock] = useState(product ? String(product.totalStock) : "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? true);
  // Variants
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) => ({ size: v.size, color: v.color, stockQuantity: String(v.stockQuantity), skuVariant: v.skuVariant }))
      : [{ size: "M", color: "", stockQuantity: "0", skuVariant: "" }],
  );
  // Size chart
  const [showVariables, setShowVariables] = useState(false);
  const [sizeVariables, setSizeVariables] = useState<SizeVariable[]>(() => {
    if (!product?.sizeCharts.length) return [];
    const names = new Set<string>();
    product.sizeCharts.forEach((r) => Object.keys(r.measurements).forEach((k) => names.add(k)));
    return [...names].map((n) => ({ name: n, label: n.charAt(0).toUpperCase() + n.slice(1) }));
  });
  const [newVarName, setNewVarName] = useState("");
  const [newVarLabel, setNewVarLabel] = useState("");
  const [sizeChart, setSizeChart] = useState<SizeChartRow[]>(
    product?.sizeCharts.map((r) => ({ size: r.size, unit: r.unit, measurements: { ...r.measurements } })) ?? [],
  );
  // Images
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  // Shipping
  const [weight, setWeight] = useState(product?.shipping.weight != null ? String(product.shipping.weight) : "");
  const [shippingClass, setShippingClass] = useState(product?.shipping.shippingClass ?? "");
  const [dimL, setDimL] = useState(product?.shipping.dimensionL != null ? String(product.shipping.dimensionL) : "");
  const [dimW, setDimW] = useState(product?.shipping.dimensionW != null ? String(product.shipping.dimensionW) : "");
  const [dimH, setDimH] = useState(product?.shipping.dimensionH != null ? String(product.shipping.dimensionH) : "");
  // SEO
  const [seoTitle, setSeoTitle] = useState(product?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(product?.seoDescription ?? "");

  const [submitting, setSubmitting] = useState(false);
  // In edit mode we already seeded size variables from the product; skip the
  // first auto-load so we don't clobber them. Subsequent category changes still
  // refresh the variables.
  const skipInitialVarLoad = useRef(isEdit);

  // Load default size variables when the selected categories change. The fetch
  // is async, so the setState happens in a callback (not synchronously in the
  // effect body) — which satisfies the React Compiler.
  useEffect(() => {
    if (skipInitialVarLoad.current) {
      skipInitialVarLoad.current = false;
      return;
    }
    let active = true;
    (async () => {
      if (!categoryIds.length) {
        if (active) setSizeVariables([]);
        return;
      }
      const res = await fetch(`/api/categories/size-variables?ids=${categoryIds.join(",")}`);
      const data = await res.json();
      if (active && data.ok) {
        const vars: SizeVariable[] = data.variables.map((v: SizeVariable) => ({ name: v.name, label: v.label }));
        setSizeVariables(vars.length ? vars : [
          { name: "height", label: "Height" },
          { name: "width", label: "Width" },
          { name: "length", label: "Length" },
        ]);
      }
    })();
    return () => { active = false; };
  }, [categoryIds]);

  const variableNames = useMemo(() => sizeVariables.map((v) => v.name), [sizeVariables]);

  function toggleCategory(id: string, checked: boolean) {
    setCategoryIds((prev) => (checked ? [...prev, id] : prev.filter((c) => c !== id)));
  }

  // ---- variants
  function addVariant() {
    setVariants((v) => [...v, { size: "M", color: "", stockQuantity: "0", skuVariant: "" }]);
  }
  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeVariant(i: number) {
    setVariants((v) => v.filter((_, idx) => idx !== i));
  }

  // ---- size variables
  function addVariable() {
    const n = newVarName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!n) return;
    if (sizeVariables.some((v) => v.name === n)) { toast.error("Variable already exists."); return; }
    setSizeVariables((vs) => [...vs, { name: n, label: newVarLabel.trim() || newVarName.trim() }]);
    setNewVarName(""); setNewVarLabel("");
  }
  function removeVariable(name: string) {
    setSizeVariables((vs) => vs.filter((v) => v.name !== name));
    setSizeChart((rows) => rows.map((r) => {
      const m = { ...r.measurements }; delete m[name]; return { ...r, measurements: m };
    }));
  }

  // ---- size chart rows
  function addSizeRow() {
    setSizeChart((rows) => [...rows, { size: "M", unit: "cm", measurements: {} }]);
  }
  function updateSizeRow(i: number, patch: Partial<SizeChartRow>) {
    setSizeChart((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function updateMeasurement(i: number, varName: string, value: string) {
    setSizeChart((rows) => rows.map((r, idx) => (idx === i ? { ...r, measurements: { ...r.measurements, [varName]: value } } : r)));
  }
  function removeSizeRow(i: number) {
    setSizeChart((rows) => rows.filter((_, idx) => idx !== i));
  }

  // ---- images upload to bucket
  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/products/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.ok) { toast.error(data.message ?? "Upload failed."); continue; }
        setImages((prev) => [...prev, data.url]);
      }
    } finally {
      setUploading(false);
    }
  }
  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  function validate(): string | null {
    if (name.trim().length < 3) return "Product name is required.";
    if (sku.trim().length < 2) return "SKU is required.";
    if (!categoryIds.length) return "Select at least one category.";
    if (fullDescription.trim().length < 10) return "Full description is required.";
    if (!isEdit && (!price || Number(price) < 0)) return "Valid price is required.";
    if (totalStock === "" || Number(totalStock) < 0) return "Total stock is required.";
    if (!images.length) return "Upload at least one image.";
    if (!variants.length) return "Add at least one variant.";
    for (const v of variants) {
      if (!v.size || !v.color.trim() || !v.skuVariant.trim()) return "Each variant needs size, color, and SKU.";
    }
    if (!sizeChart.length) return "Add at least one size chart row.";
    if (!weight || Number(weight) < 0) return "Weight is required.";
    if (!shippingClass.trim()) return "Shipping class is required.";
    if (!dimL || !dimW || !dimH) return "Dimensions (L × W × H) are required.";
    if (!seoTitle.trim()) return "SEO title is required.";
    if (!seoDescription.trim()) return "SEO description is required.";
    return null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      const payload = {
        name, sku, shortDescription: shortDescription || fullDescription.slice(0, 160), fullDescription,
        categoryIds, price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
        costPrice: costPrice ? Number(costPrice) : null,
        stockStatus, totalStock: Number(totalStock), isFeatured, isPublished,
        seoTitle, seoDescription, images,
        variants: variants.map((v) => ({
          size: v.size, color: v.color, stockQuantity: Number(v.stockQuantity || 0), skuVariant: v.skuVariant,
          isCustomSize: v.size === "Custom",
        })),
        sizeCharts: sizeChart.map((r) => ({
          size: r.size, unit: r.unit,
          measurements: Object.fromEntries(variableNames.map((n) => [n, r.measurements[n] ?? ""])),
        })),
        shipping: {
          weight: Number(weight), dimensionL: Number(dimL), dimensionW: Number(dimW),
          dimensionH: Number(dimH), shippingClass,
        },
      };
      const res = await fetch(
        isEdit ? `/api/products/${product!.id}` : "/api/products",
        { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) { toast.error(data.message ?? "Failed to save product."); return; }
      toast.success(isEdit ? "Product updated." : "Product created.");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const sectionTitle = "border-b pb-2 text-lg font-semibold";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update product details. Price is locked." : "All fields are required."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* BASIC INFORMATION */}
          <section className="space-y-4">
            <h3 className={sectionTitle}>Basic Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product Name" required>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Premium Cotton T-Shirt" />
              </Field>
              <Field label="SKU" required>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g., TSH-001" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Brand" required>
                <Input value="Auto-assigned from your account" disabled />
              </Field>
              <Field label="Categories (select at least one)" required>
                <div className="grid max-h-44 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-3">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={categoryIds.includes(c.id)} onCheckedChange={(ch) => toggleCategory(c.id, Boolean(ch))} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
            <Field label="Short Description">
              <Input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Brief description for product listings" />
            </Field>
            <Field label="Full Description" required>
              <Textarea rows={4} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Detailed product description" />
            </Field>
          </section>

          {/* PRICING & INVENTORY */}
          <section className="space-y-4">
            <h3 className={sectionTitle}>Pricing &amp; Inventory</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={isEdit ? "Price (Rs) — locked" : "Price (Rs)"} required={!isEdit}>
                <Input
                  type="number" min="0" step="0.01" value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  disabled={isEdit}
                  title={isEdit ? "Price can't be changed when editing." : undefined}
                />
              </Field>
              <Field label="Compare at Price (Rs)">
                <Input type="number" min="0" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Cost Price (Rs)">
                <Input type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0.00" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Stock Status" required>
                <Select value={stockStatus} onValueChange={(v) => setStockStatus(v as typeof stockStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">In stock</SelectItem>
                    <SelectItem value="LOW_STOCK">Low stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Total Stock" required>
                <Input type="number" min="0" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Visibility">
                <Select value={isPublished ? "published" : "draft"} onValueChange={(v) => setIsPublished(v === "published")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isFeatured} onCheckedChange={(c) => setIsFeatured(Boolean(c))} /> Featured product
            </label>
          </section>

          {/* VARIANTS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Variants</h3>
              <Button type="button" size="sm" onClick={addVariant}><Plus className="mr-1 h-4 w-4" /> Add Variant</Button>
            </div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                  <Field label="Size">
                    <Select value={v.size} onValueChange={(val) => updateVariant(i, { size: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Color"><Input value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })} placeholder="Pink" /></Field>
                  <Field label="Stock"><Input type="number" min="0" value={v.stockQuantity} onChange={(e) => updateVariant(i, { stockQuantity: e.target.value })} /></Field>
                  <Field label="Variant SKU"><Input value={v.skuVariant} onChange={(e) => updateVariant(i, { skuVariant: e.target.value })} placeholder="SKU-S-PINK" /></Field>
                  <Button type="button" variant="ghost" className="text-rose-600" onClick={() => removeVariant(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </section>

          {/* SIZE CHART */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Size Chart</h3>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowVariables((s) => !s)}>
                  {showVariables ? "Hide Variables" : "Manage Variables"}
                </Button>
                <Button type="button" size="sm" onClick={addSizeRow}><Plus className="mr-1 h-4 w-4" /> Add Size Row</Button>
              </div>
            </div>

            {showVariables && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Manage Size Variables for This Product</p>
                <p className="text-xs text-slate-500">Changes here only affect this product, not others.</p>
                <div className="flex gap-2">
                  <Input value={newVarName} onChange={(e) => setNewVarName(e.target.value)} placeholder="Variable name (e.g., waist)" />
                  <Input value={newVarLabel} onChange={(e) => setNewVarLabel(e.target.value)} placeholder="Display label (e.g., Waist)" />
                  <Button type="button" onClick={addVariable}>Add</Button>
                </div>
                {sizeVariables.map((v) => (
                  <div key={v.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm font-medium">{v.label} <span className="text-slate-400">({v.name})</span></span>
                    <Button type="button" size="sm" variant="ghost" className="text-rose-600" onClick={() => removeVariable(v.name)}>Delete</Button>
                  </div>
                ))}
              </div>
            )}

            {sizeChart.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-500">
                      <th className="py-2 pr-2">Size</th>
                      {sizeVariables.map((v) => <th key={v.name} className="py-2 pr-2">{v.label}</th>)}
                      <th className="py-2 pr-2">Unit</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.map((r, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 pr-2">
                          <Select value={r.size} onValueChange={(val) => updateSizeRow(i, { size: val })}>
                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>{SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </td>
                        {sizeVariables.map((v) => (
                          <td key={v.name} className="py-2 pr-2">
                            <Input value={r.measurements[v.name] ?? ""} onChange={(e) => updateMeasurement(i, v.name, e.target.value)} placeholder="Value" className="w-24" />
                          </td>
                        ))}
                        <td className="py-2 pr-2">
                          <Select value={r.unit} onValueChange={(val) => updateSizeRow(i, { unit: val as "cm" | "in" })}>
                            <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="cm">cm</SelectItem><SelectItem value="in">in</SelectItem></SelectContent>
                          </Select>
                        </td>
                        <td><Button type="button" variant="ghost" className="text-rose-600" onClick={() => removeSizeRow(i)}>Remove</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* PRODUCT IMAGES */}
          <section className="space-y-4">
            <h3 className={sectionTitle}>Product Images</h3>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : <Upload className="h-6 w-6 text-slate-400" />}
              <span className="text-sm text-slate-600">{uploading ? "Uploading…" : "Click to upload images"}</span>
              <span className="text-xs text-slate-400">PNG, JPG, WEBP, GIF up to 10MB</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {images.map((url) => (
                  <div key={url} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeImage(url)} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SHIPPING */}
          <section className="space-y-4">
            <h3 className={sectionTitle}>Shipping Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Weight (kg)" required><Input type="number" min="0" step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="0.5" /></Field>
              <Field label="Shipping Class" required><Input value={shippingClass} onChange={(e) => setShippingClass(e.target.value)} placeholder="Standard" /></Field>
            </div>
            <Field label="Dimensions (L × W × H in cm)" required>
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" min="0" value={dimL} onChange={(e) => setDimL(e.target.value)} placeholder="Length" />
                <Input type="number" min="0" value={dimW} onChange={(e) => setDimW(e.target.value)} placeholder="Width" />
                <Input type="number" min="0" value={dimH} onChange={(e) => setDimH(e.target.value)} placeholder="Height" />
              </div>
            </Field>
          </section>

          {/* SEO */}
          <section className="space-y-4">
            <h3 className={sectionTitle}>SEO</h3>
            <Field label="SEO Title" required><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO optimized title" /></Field>
            <Field label="SEO Description" required><Textarea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO optimized description" /></Field>
          </section>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={onSubmit} disabled={submitting || uploading}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} {required ? <span className="text-rose-500">*</span> : null}</Label>
      {children}
    </div>
  );
}
