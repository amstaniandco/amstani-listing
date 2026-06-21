"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Lock, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatPkr } from "@/lib/format";

// Soft PIN gate for the admin Shipping & Taxes section of this form. Client-side
// only — it hides the pricing/override UI from casual access; the data is still
// admin-auth-protected server-side. The unlock state lives in component memory
// only, so the section RE-LOCKS every time the form is (re)opened: closing and
// reopening the product remounts TaxSection and resets `unlocked` to false.
const TAX_SECTION_PIN = "9644";

export interface CategoryOption {
  id: string;
  name: string;
}

interface SizeVariable {
  name: string;
  label: string;
}
// How a variant's size is entered:
//   none   -> color-only product, no size at all
//   preset -> pick from the standard S/M/L… list
//   custom -> free-text size (e.g. "35cm", "One Size")
type SizeType = "none" | "preset" | "custom";
interface VariantRow {
  sizeType: SizeType;
  size: string;
  color: string;
  stockQuantity: string;
  skuVariant: string;
  priceOverride: string; // "" => use the product's base price
  attributes: Record<string, string>;
  // false => the SKU is auto-derived from the product SKU + size/color and kept
  // in sync as those change. Flips to true the moment a user types in the SKU
  // field (or for variants loaded from an existing product), so we never clobber
  // a manually-entered SKU.
  skuTouched: boolean;
}
interface SizeChartRow {
  size: string;
  unit: "cm" | "in";
  measurements: Record<string, string>;
}

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
const PRESET_SET = new Set(SIZE_OPTIONS);

// Derive the size-type of an existing variant when loading a product for edit.
function inferSizeType(size: string, isCustomSize?: boolean): SizeType {
  if (!size) return "none";
  if (isCustomSize) return "custom";
  return PRESET_SET.has(size) ? "preset" : "custom";
}

// Normalise a size/color value into an uppercase SKU-safe token:
//   "Large 35cm" -> "LARGE-35CM", "red" -> "RED".
function skuToken(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Auto-derive a variant SKU from the product SKU plus the variant's distinguishing
// attribute: size for sized variants, color for color-only variants (both when set).
// Falls back to a 1-based index so color-only rows without a color still get a
// unique, non-empty SKU. Returns "" until the product SKU is entered.
function deriveVariantSku(productSku: string, v: Pick<VariantRow, "sizeType" | "size" | "color">, index: number): string {
  const base = skuToken(productSku);
  if (!base) return "";
  const parts: string[] = [];
  if (v.sizeType !== "none" && v.size.trim()) parts.push(skuToken(v.size));
  if (v.color.trim()) parts.push(skuToken(v.color));
  if (parts.length === 0) parts.push(String(index + 1));
  return [base, ...parts].join("-");
}

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
  variants: {
    size: string; color: string; stockQuantity: number; skuVariant: string;
    priceOverride?: number | null; isCustomSize?: boolean; attributes?: Record<string, string>;
  }[];
  sizeCharts: { size: string; unit: "cm" | "in"; measurements: Record<string, string> }[];
  shipping: {
    weight: number | null; dimensionL: number | null; dimensionW: number | null;
    dimensionH: number | null; shippingClass: string | null;
  };
  // Per-product overrides (admin mode). null => use the global default / weight lookup.
  profitPct?: number | null;
  tariffPct?: number | null;
  shipmentPct?: number | null; // legacy, unused
  shippingCostOverride?: number | null;
  wholesalePrice?: number | null;
  // The rep's original PKR price, preserved across admin approval.
  vendorPricePkr?: number | null;
}

// Special per-kg bracket: weight in [minKg, maxKg] charged at ratePerKg $/kg.
export interface ShippingBracketDefault {
  minKg: number;
  maxKg: number | null;
  ratePerKg: number;
}

// Global tax/shipping defaults passed into the form so the admin can see/override.
export interface TaxDefaults {
  profitPct: number;
  tariffPct: number;
  shippingPerKg: number; // general $/kg rate
  shippingBrackets: ShippingBracketDefault[];
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  categories: CategoryOption[];
  product?: EditProduct | null; // present => edit mode
  onSaved: () => void;
  // Admin mode: override where edits are saved and allow editing the price.
  // When set, the form PATCHes this URL instead of the brand-rep endpoints.
  adminEndpoint?: string;
  // Global tax defaults (admin mode) — shown as placeholders for the per-product
  // override fields and used to preview the final price.
  taxDefaults?: TaxDefaults;
  // Live PKR -> USD rate (admin mode). The rep enters the wholesale price in PKR;
  // the tax preview and the approved store price are in USD. Defaults to 1 so
  // non-admin/edit paths (which never show the tax preview) are unaffected.
  usdPerPkr?: number;
}

export function ProductForm({ open, onOpenChange, categories, product, onSaved, adminEndpoint, taxDefaults, usdPerPkr = 1 }: ProductFormProps) {
  const isEdit = Boolean(product);
  const isAdmin = Boolean(adminEndpoint);
  // Basic
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(product?.categoryIds ?? []);
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? "");
  const [fullDescription, setFullDescription] = useState(product?.fullDescription ?? "");
  // Pricing & inventory — reps set the wholesale price (editable on edit too).
  // Compare-at and cost price are not collected from brand reps.
  // Vendor view: show the rep's ORIGINAL PKR price (vendorPricePkr), which admin
  // approval never overwrites — so the rep always sees what they entered, not the
  // USD numbers approval wrote into wholesalePrice/price. Legacy rows without
  // vendorPricePkr fall back to wholesalePrice.
  // In admin mode `price` is treated as the WHOLESALE (pre-tax) USD base.
  const [price, setPrice] = useState(
    product
      ? isAdmin
        ? String(product.wholesalePrice ?? product.price)
        : // Vendor PKR is whole rupees — drop any decimal (e.g. reconstructed
          // 277.78 -> 278) so the field never shows point values.
          String(Math.round(product.vendorPricePkr ?? product.wholesalePrice ?? product.price))
      : "",
  );
  // Per-product overrides (admin). "" => use the global default / weight lookup.
  const [profitPct, setProfitPct] = useState(product?.profitPct != null ? String(product.profitPct) : "");
  const [tariffPct, setTariffPct] = useState(product?.tariffPct != null ? String(product.tariffPct) : "");
  const [shippingCostOverride, setShippingCostOverride] = useState(
    product?.shippingCostOverride != null ? String(product.shippingCostOverride) : "",
  );
  const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">(product?.stockStatus ?? "IN_STOCK");
  const [totalStock, setTotalStock] = useState(product ? String(product.totalStock) : "");
  const isFeatured = product?.isFeatured ?? false;
  // Brand reps can't set visibility — new rep products stay unpublished until the
  // admin approves them. Admins keep the published-by-default behaviour.
  const [isPublished, setIsPublished] = useState(product?.isPublished ?? isAdmin);
  // Variants
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length
      ? product.variants.map((v) => ({
          sizeType: inferSizeType(v.size, v.isCustomSize),
          size: v.size, color: v.color, stockQuantity: String(v.stockQuantity), skuVariant: v.skuVariant,
          priceOverride: v.priceOverride != null ? String(v.priceOverride) : "",
          attributes: { ...(v.attributes ?? {}) },
          // Saved variants already have a SKU — keep it, don't auto-overwrite.
          skuTouched: true,
        }))
      : [{ sizeType: "none" as SizeType, size: "", color: "", stockQuantity: "0", skuVariant: "", priceOverride: "", attributes: {}, skuTouched: false }],
  );
  // Extra per-variant attribute columns (beyond size/color/stock/SKU), e.g. for
  // shoes: width, material. Managed like the size-chart variables. Seeded from
  // the existing variants' attribute keys in edit mode.
  const [showVariantVariables, setShowVariantVariables] = useState(false);
  const [variantVariables, setVariantVariables] = useState<SizeVariable[]>(() => {
    if (!product?.variants.length) return [];
    const names = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => names.add(k)));
    return [...names].map((n) => ({ name: n, label: n.charAt(0).toUpperCase() + n.slice(1) }));
  });
  const [newVariantVarName, setNewVariantVarName] = useState("");
  const [newVariantVarLabel, setNewVariantVarLabel] = useState("");
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
  // Re-derive the auto SKU for every row that the user hasn't manually edited.
  // Run after any change to the product SKU or a variant's size/color/size-type.
  function withAutoSkus(rows: VariantRow[]): VariantRow[] {
    return rows.map((row, idx) =>
      row.skuTouched ? row : { ...row, skuVariant: deriveVariantSku(sku, row, idx) },
    );
  }
  // Changing the product SKU re-derives every auto variant SKU against the new
  // value (using nextSku directly to avoid the stale `sku` closure).
  function onProductSkuChange(nextSku: string) {
    setSku(nextSku);
    setVariants((rows) =>
      rows.map((row, idx) =>
        row.skuTouched ? row : { ...row, skuVariant: deriveVariantSku(nextSku, row, idx) },
      ),
    );
  }
  function addVariant() {
    setVariants((v) => withAutoSkus([
      ...v,
      { sizeType: "none", size: "", color: "", stockQuantity: "0", skuVariant: "", priceOverride: "", attributes: {}, skuTouched: false },
    ]));
  }
  function updateVariant(i: number, patch: Partial<VariantRow>) {
    setVariants((v) => withAutoSkus(v.map((row, idx) => (idx === i ? { ...row, ...patch } : row))));
  }
  // Switching size type clears the size value (preset uses the list, custom is
  // free text, none has no size). Default a preset to "M" so the select isn't empty.
  function updateVariantSizeType(i: number, sizeType: SizeType) {
    setVariants((v) => withAutoSkus(v.map((row, idx) =>
      idx === i ? { ...row, sizeType, size: sizeType === "preset" ? "M" : "" } : row,
    )));
  }
  // User typed in a variant SKU field: store it verbatim and stop auto-deriving.
  // Clearing the field re-enables auto-derivation.
  function editVariantSku(i: number, value: string) {
    setVariants((v) => withAutoSkus(v.map((row, idx) =>
      idx === i ? { ...row, skuVariant: value, skuTouched: value.trim() !== "" } : row,
    )));
  }
  function removeVariant(i: number) {
    setVariants((v) => withAutoSkus(v.filter((_, idx) => idx !== i)));
  }
  function updateVariantAttr(i: number, varName: string, value: string) {
    setVariants((v) => v.map((row, idx) =>
      idx === i ? { ...row, attributes: { ...row.attributes, [varName]: value } } : row,
    ));
  }

  // ---- variant variables (extra per-variant attribute columns)
  const variantVarNames = useMemo(() => variantVariables.map((v) => v.name), [variantVariables]);
  function addVariantVariable() {
    const n = newVariantVarName.trim().toLowerCase().replace(/\s+/g, "_");
    if (!n) return;
    if (variantVariables.some((v) => v.name === n)) { toast.error("Variable already exists."); return; }
    setVariantVariables((vs) => [...vs, { name: n, label: newVariantVarLabel.trim() || newVariantVarName.trim() }]);
    setNewVariantVarName(""); setNewVariantVarLabel("");
  }
  function removeVariantVariable(name: string) {
    setVariantVariables((vs) => vs.filter((v) => v.name !== name));
    setVariants((rows) => rows.map((r) => {
      const a = { ...r.attributes }; delete a[name]; return { ...r, attributes: a };
    }));
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
    if (!price || Number(price) < 0) return "Valid price is required.";
    if (totalStock === "" || Number(totalStock) < 0) return "Total stock is required.";
    if (!images.length) return "Upload at least one image.";
    if (!variants.length) return "Add at least one variant.";
    const seenSkus = new Set<string>();
    for (const v of variants) {
      if (!v.skuVariant.trim()) return "Each variant needs a Variant SKU.";
      if (v.sizeType !== "none" && !v.size.trim()) return "Enter a size, or set Size Type to “No Size”.";
      const key = v.skuVariant.trim().toUpperCase();
      if (seenSkus.has(key)) return `Duplicate variant SKU "${v.skuVariant.trim()}" — give these variants different sizes/colors.`;
      seenSkus.add(key);
    }
    // Size chart is optional — a product can be saved without any size rows.
    if (!weight || Number(weight) < 0) return "Weight is required.";
    // Dimensions are optional — a product can be saved without L × W × H.
    if (!seoTitle.trim()) return "SEO title is required.";
    // SEO description is admin-only; brand reps don't provide it.
    if (isAdmin && !seoDescription.trim()) return "SEO description is required.";
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
        compareAtPrice: null,
        costPrice: null,
        stockStatus, totalStock: Number(totalStock), isFeatured, isPublished,
        seoTitle, seoDescription, images,
        variants: variants.map((v) => ({
          size: v.sizeType === "none" ? "" : v.size.trim(),
          color: v.color.trim(),
          stockQuantity: Number(v.stockQuantity || 0),
          skuVariant: v.skuVariant.trim(),
          priceOverride: v.priceOverride === "" ? null : Number(v.priceOverride),
          isCustomSize: v.sizeType === "custom",
          // Only send the managed variable keys (drop any stale ones).
          attributes: Object.fromEntries(variantVarNames.map((n) => [n, v.attributes[n] ?? ""])),
        })),
        sizeCharts: sizeChart.map((r) => ({
          size: r.size, unit: r.unit,
          measurements: Object.fromEntries(variableNames.map((n) => [n, r.measurements[n] ?? ""])),
        })),
        shipping: {
          weight: Number(weight),
          // Dimensions are optional — send null when left blank.
          dimensionL: dimL === "" ? null : Number(dimL),
          dimensionW: dimW === "" ? null : Number(dimW),
          dimensionH: dimH === "" ? null : Number(dimH),
          shippingClass: null,
        },
        // Per-product overrides ("" => null => use global / weight lookup). Admin-only.
        profitPct: profitPct === "" ? null : Number(profitPct),
        tariffPct: tariffPct === "" ? null : Number(tariffPct),
        shippingCostOverride: shippingCostOverride === "" ? null : Number(shippingCostOverride),
      };
      const url = isAdmin ? adminEndpoint! : isEdit ? `/api/products/${product!.id}` : "/api/products";
      const method = isAdmin || isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { toast.error(data.message ?? "Failed to save product."); return; }
      toast.success(
        isAdmin
          ? "Product updated."
          : isEdit
            ? "Product updated — resubmitted for admin approval."
            : "Product submitted for admin approval.",
      );
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
            {isAdmin
              ? "Edit any field before approving. Changes are saved to the product."
              : isEdit
                ? "Update product details. Editing resubmits the product for approval."
                : "All fields are required."}
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
                <Input value={sku} onChange={(e) => onProductSkuChange(e.target.value)} placeholder="e.g., TSH-001" />
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
              <Field label="Wholesale Price (Rs)" required>
                {/* Vendors enter whole rupees (no decimals); admin's USD base keeps cents. */}
                <Input
                  type="number" min="0" step={isAdmin ? "0.01" : "1"} value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={isAdmin ? "0.00" : "0"}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Stock Status" required>
                <Select value={stockStatus} onValueChange={(v) => setStockStatus(v as typeof stockStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_STOCK">In stock</SelectItem>
                    <SelectItem value="OUT_OF_STOCK">Out of stock</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Total Stock" required>
                <Input type="number" min="0" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} placeholder="0" />
              </Field>
              {/* Visibility is admin-only. Brand-rep products stay unpublished until
                  the admin approves them (see approval flow). */}
              {isAdmin && (
                <Field label="Visibility">
                  <Select value={isPublished ? "published" : "draft"} onValueChange={(v) => setIsPublished(v === "published")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
          </section>

          {/* SHIPPING & TAXES (admin only) */}
          {isAdmin && taxDefaults && (
            <TaxSection
              wholesalePkr={Number(price) || 0}
              usdPerPkr={usdPerPkr}
              weight={Number(weight) || 0}
              defaults={taxDefaults}
              profitPct={profitPct} setProfitPct={setProfitPct}
              tariffPct={tariffPct} setTariffPct={setTariffPct}
              shippingCostOverride={shippingCostOverride} setShippingCostOverride={setShippingCostOverride}
            />
          )}

          {/* VARIANTS */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">Variants</h3>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowVariantVariables((s) => !s)}>
                  {showVariantVariables ? "Hide Variables" : "Manage Variables"}
                </Button>
                <Button type="button" size="sm" onClick={addVariant}><Plus className="mr-1 h-4 w-4" /> Add Variant</Button>
              </div>
            </div>

            {showVariantVariables && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium">Manage Variant Attributes for This Product</p>
                <p className="text-xs text-slate-500">
                  Add extra columns each variant can fill in (e.g. <em>width</em>, <em>material</em>, <em>heel height</em>).
                  Changes here only affect this product.
                </p>
                <div className="flex gap-2">
                  <Input value={newVariantVarName} onChange={(e) => setNewVariantVarName(e.target.value)} placeholder="Attribute name (e.g., width)" />
                  <Input value={newVariantVarLabel} onChange={(e) => setNewVariantVarLabel(e.target.value)} placeholder="Display label (e.g., Width)" />
                  <Button type="button" onClick={addVariantVariable}>Add</Button>
                </div>
                {variantVariables.map((v) => (
                  <div key={v.name} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm font-medium">{v.label} <span className="text-slate-400">({v.name})</span></span>
                    <Button type="button" size="sm" variant="ghost" className="text-rose-600" onClick={() => removeVariantVariable(v.name)}>Delete</Button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <Field label="Size Type">
                      <Select value={v.sizeType} onValueChange={(val) => updateVariantSizeType(i, val as SizeType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Size (Color Only)</SelectItem>
                          <SelectItem value="preset">Preset (S, M, L…)</SelectItem>
                          <SelectItem value="custom">Custom Size</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Size">
                      {v.sizeType === "preset" ? (
                        <Select value={v.size} onValueChange={(val) => updateVariant(i, { size: val })}>
                          <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                          <SelectContent>{SIZE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={v.size}
                          onChange={(e) => updateVariant(i, { size: e.target.value })}
                          placeholder={v.sizeType === "none" ? "Not needed for this product" : "e.g. 35cm, One Size"}
                          disabled={v.sizeType === "none"}
                        />
                      )}
                    </Field>
                    <Field label="Color (optional)"><Input value={v.color} onChange={(e) => updateVariant(i, { color: e.target.value })} placeholder="Red" /></Field>
                    <Field label="Stock"><Input type="number" min="0" value={v.stockQuantity} onChange={(e) => updateVariant(i, { stockQuantity: e.target.value })} placeholder="0" /></Field>
                    <Field label="Variant SKU" required>
                      <Input
                        value={v.skuVariant}
                        onChange={(e) => editVariantSku(i, e.target.value)}
                        placeholder={sku ? deriveVariantSku(sku, v, i) || "Auto" : "Enter product SKU first"}
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        {v.skuTouched ? "Custom — clear to auto-generate." : "Auto-generated from the product SKU."}
                      </p>
                    </Field>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Price Override (Rs)">
                      <Input
                        type="number" min="0" step="0.01" value={v.priceOverride}
                        onChange={(e) => updateVariant(i, { priceOverride: e.target.value })}
                        placeholder={`Leave empty to use base price${price ? ` (${price})` : ""}`}
                      />
                    </Field>
                    {variantVariables.map((vv) => (
                      <Field key={vv.name} label={vv.label}>
                        <Input
                          value={v.attributes[vv.name] ?? ""}
                          onChange={(e) => updateVariantAttr(i, vv.name, e.target.value)}
                          placeholder={vv.label}
                        />
                      </Field>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" className="text-rose-600" onClick={() => removeVariant(i)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Remove Variant
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SIZE CHART */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold">
                Size Chart <span className="text-sm font-normal text-slate-400">— optional</span>
              </h3>
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
            </div>
            {/* Dimensions are admin-only — brand reps just provide the weight. */}
            {isAdmin && (
              <Field label="Dimensions (L × W × H in cm) — optional">
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" min="0" value={dimL} onChange={(e) => setDimL(e.target.value)} placeholder="Length" />
                  <Input type="number" min="0" value={dimW} onChange={(e) => setDimW(e.target.value)} placeholder="Width" />
                  <Input type="number" min="0" value={dimH} onChange={(e) => setDimH(e.target.value)} placeholder="Height" />
                </div>
              </Field>
            )}
          </section>

          {/* SEO */}
          <section className="space-y-4">
            <h3 className={sectionTitle}>SEO</h3>
            <Field label="SEO Title" required><Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="SEO optimized title" /></Field>
            {/* SEO description is admin-only — brand reps just provide the title. */}
            {isAdmin && (
              <Field label="SEO Description" required><Textarea rows={3} value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="SEO optimized description" /></Field>
            )}
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

// Admin-only: per-product overrides + live final-price preview.
// Blank input => use the global default / weight-based lookup (shown as placeholder).
// The rep enters the wholesale in PKR; we convert to USD with the live rate, then:
//   final = wholesaleUsd × (1 + (profit% + tariff%)/100) + shippingCost
function TaxSection({
  wholesalePkr,
  usdPerPkr,
  weight,
  defaults,
  profitPct, setProfitPct,
  tariffPct, setTariffPct,
  shippingCostOverride, setShippingCostOverride,
}: {
  wholesalePkr: number;
  usdPerPkr: number;
  weight: number;
  defaults: TaxDefaults;
  profitPct: string; setProfitPct: (v: string) => void;
  tariffPct: string; setTariffPct: (v: string) => void;
  shippingCostOverride: string; setShippingCostOverride: (v: string) => void;
}) {
  // PIN gate. In-memory only — starts locked on every mount, so reopening the
  // form (or switching products) always requires the PIN again.
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");

  function submitPin() {
    if (pin === TAX_SECTION_PIN) {
      setUnlocked(true);
      setPin("");
    } else {
      toast.error("Incorrect PIN.");
      setPin("");
    }
  }

  if (!unlocked) {
    return (
      <section className="space-y-4">
        <h3 className="border-b pb-2 text-lg font-semibold">Shipping &amp; Taxes</h3>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="h-4 w-4" /> Locked
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pricing &amp; taxes are protected. Enter the PIN to view and edit this section.
          </p>
          <div className="mt-3 flex max-w-xs items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="product-taxes-pin">PIN</Label>
              <Input
                id="product-taxes-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitPin(); } }}
                placeholder="••••"
              />
            </div>
            <Button type="button" onClick={submitPin} disabled={!pin}>Unlock</Button>
          </div>
        </div>
      </section>
    );
  }

  const eff = (val: string, def: number) => (val === "" ? def : Number(val) || 0);
  const p = eff(profitPct, defaults.profitPct);
  const t = eff(tariffPct, defaults.tariffPct);
  const totalPct = p + t;

  // The rep enters wholesale in PKR; everything below this is USD.
  const wholesaleUsd = Math.round(wholesalePkr * usdPerPkr * 100) / 100;

  // Per-kg shipping: weight × (special bracket rate if matched, else general).
  const bracket = defaults.shippingBrackets.find(
    (b) => weight >= b.minKg && (b.maxKg == null || weight <= b.maxKg),
  );
  const rate = bracket ? bracket.ratePerKg : defaults.shippingPerKg;
  const weightCost = Math.round(weight * rate * 100) / 100;
  const shippingCost = shippingCostOverride === "" ? weightCost : Number(shippingCostOverride) || 0;

  const finalPrice = Math.round((wholesaleUsd * (1 + totalPct / 100) + shippingCost) * 100) / 100;

  return (
    <section className="space-y-4">
      <h3 className="border-b pb-2 text-lg font-semibold">Shipping &amp; Taxes</h3>
      <p className="text-sm text-slate-500">
        Leave a field blank to use the global default (shown as the placeholder). Shipping is based
        on this product&apos;s weight ({weight} kg); set a custom cost to override the weight rate.
        Prices are converted from PKR at the live rate (1 PKR = ${usdPerPkr.toFixed(5)}).
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Profit %">
          <Input type="number" min="0" step="0.01" value={profitPct}
            onChange={(e) => setProfitPct(e.target.value)} placeholder={`Default ${defaults.profitPct}%`} />
        </Field>
        <Field label="Tariffs %">
          <Input type="number" min="0" step="0.01" value={tariffPct}
            onChange={(e) => setTariffPct(e.target.value)} placeholder={`Default ${defaults.tariffPct}%`} />
        </Field>
        <Field label="Shipping cost (USD)">
          <Input type="number" min="0" step="0.01" value={shippingCostOverride}
            onChange={(e) => setShippingCostOverride(e.target.value)}
            placeholder={`Weight cost ${weightCost}`} />
        </Field>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Wholesale price ({formatPkr(wholesalePkr)})</span>
          <span className="font-medium">{formatCurrency(wholesaleUsd)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-slate-500">Taxes ({p}% + {t}% = {totalPct}%)</span>
          <span className="font-medium">+ {formatCurrency((wholesaleUsd * totalPct) / 100)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-slate-500">
            Shipping{shippingCostOverride === "" ? ` (${weight}kg × ${formatCurrency(rate)}/kg)` : " (override)"}
          </span>
          <span className="font-medium">+ {formatCurrency(shippingCost)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
          <span className="font-semibold">Final price (applied on approve)</span>
          <span className="text-base font-semibold">{formatCurrency(finalPrice)}</span>
        </div>
      </div>
    </section>
  );
}
