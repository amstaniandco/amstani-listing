"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Eye, EyeOff, Plus, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { usePortalStore } from "@/store/portal-store";
import type { PortalCategory, PortalProduct, ProductVariant, SizeChartRow, StoreOption } from "@/types/portal";

const productSchema = z.object({
  title: z.string().min(3, "Product title is required."),
  shortDescription: z.string().optional(),
  description: z.string().min(10, "Add a meaningful description."),
  material: z.string().optional(),
  sku: z.string().min(2, "SKU is required."),
  brandId: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "Choose at least one category."),
  images: z.array(z.string()).default([]),
  price: z.coerce.number().min(0),
  compareAtPrice: z.coerce.number().optional(),
  costPrice: z.coerce.number().optional(),
  totalStock: z.coerce.number().min(0),
  stockStatus: z.enum(["in-stock", "low-stock", "out-of-stock"]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  variants: z.array(z.object({
    sizeType: z.string(),
    size: z.string(),
    color: z.string().optional(),
    stock: z.coerce.number().min(0),
    skuVariant: z.string(),
  })).default([]),
  sizeCharts: z.array(z.object({
    size: z.string(),
    height: z.string().optional(),
    width: z.string().optional(),
    length: z.string().optional(),
    unit: z.string().default("cm"),
  })).default([]),
  weight: z.coerce.number().optional(),
  shippingClass: z.string().optional(),
  length: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  height: z.coerce.number().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  storeId: z.string().optional(),
});

type ProductValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  brandName: string;
  categories: PortalCategory[];
  stores: StoreOption[];
  product?: PortalProduct | null;
}

const emptyVariant: ProductVariant = {
  sizeType: "Preset (S, M, L...)",
  size: "",
  color: "",
  stock: 0,
  skuVariant: "",
};

const emptySizeChart: SizeChartRow = {
  size: "",
  height: "",
  width: "",
  length: "",
  unit: "cm",
};

const sizeVariables = [
  { id: "height", label: "Height (height)" },
  { id: "width", label: "Width (width)" },
  { id: "length", label: "Length (length)" },
];

function ProductForm({ open, onOpenChange, brandId, brandName, categories, stores, product }: ProductFormProps) {
  const createProduct = usePortalStore((state) => state.createProduct);
  const updateProduct = usePortalStore((state) => state.updateProduct);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [showSizeVariables, setShowSizeVariables] = useState(false);
  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title ?? "",
      shortDescription: product?.description?.substring(0, 50) ?? "",
      description: product?.description ?? "",
      material: product?.material ?? "",
      sku: product?.sku ?? "",
      brandId: brandId,
      categoryIds: product?.categoryIds ?? [],
      images: product?.images ?? [],
      price: product?.price ?? 0,
      compareAtPrice: product?.compareAtPrice,
      costPrice: product?.costPrice,
      totalStock: product?.totalStock ?? 0,
      stockStatus: product?.stockStatus ?? "in-stock",
      featured: product?.featured ?? false,
      published: product?.published ?? true,
      variants: product?.variants?.length ? product.variants : [emptyVariant],
      sizeCharts: product?.sizeCharts?.length ? product.sizeCharts : [],
      weight: product?.weight,
      shippingClass: product?.shippingClass ?? "Standard",
      length: product?.length,
      width: product?.width,
      height: product?.height,
      seoTitle: product?.seoTitle ?? "",
      seoDescription: product?.seoDescription ?? "",
      storeId: product?.storeId,
    },
  });

  const variants = useFieldArray({ control: form.control, name: "variants" });
  const sizeCharts = useFieldArray({ control: form.control, name: "sizeCharts" });

  useEffect(() => {
    form.reset({
      title: product?.title ?? "",
      shortDescription: product?.description?.substring(0, 50) ?? "",
      description: product?.description ?? "",
      material: product?.material ?? "",
      sku: product?.sku ?? "",
      brandId: brandId,
      categoryIds: product?.categoryIds ?? [],
      images: product?.images ?? [],
      price: product?.price ?? 0,
      compareAtPrice: product?.compareAtPrice,
      costPrice: product?.costPrice,
      totalStock: product?.totalStock ?? 0,
      stockStatus: product?.stockStatus ?? "in-stock",
      featured: product?.featured ?? false,
      published: product?.published ?? true,
      variants: product?.variants?.length ? product.variants : [emptyVariant],
      sizeCharts: product?.sizeCharts?.length ? product.sizeCharts : [],
      weight: product?.weight,
      shippingClass: product?.shippingClass ?? "Standard",
      length: product?.length,
      width: product?.width,
      height: product?.height,
      seoTitle: product?.seoTitle ?? "",
      seoDescription: product?.seoDescription ?? "",
      storeId: product?.storeId,
    });
    setImages(product?.images ?? []);
  }, [form, product]);

  const selectedCategories = useMemo(
    () => categories.filter((cat) => form.watch("categoryIds").includes(cat.id)),
    [categories, form],
  );

  const onUploadImages = (files: FileList | null) => {
    if (!files?.length) return;
    const nextImages = [...images, ...Array.from(files).map((file) => URL.createObjectURL(file))];
    setImages(nextImages);
    form.setValue("images", nextImages);
  };

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      id: product?.id ?? "",
      brandId,
      brandName,
      ...values,
      images,
      createdAt: product?.createdAt ?? new Date().toISOString(),
    } as PortalProduct;

    if (product) {
      updateProduct(product.id, payload);
    } else {
      createProduct(payload);
    }

    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>Create a new product for {brandName}</DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={onSubmit}>
          {/* BASIC INFORMATION */}
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-semibold">Basic Information</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input id="title" placeholder="e.g., Premium Cotton T-Shirt" {...form.register("title")} />
                {form.formState.errors.title && <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sku">
                  SKU <span className="text-red-500">*</span>
                </Label>
                <Input id="sku" placeholder="e.g., TSH-001" {...form.register("sku")} />
                {form.formState.errors.sku && <p className="text-xs text-red-500">{form.formState.errors.sku.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">
                  Brand <span className="text-red-500">*</span>
                </Label>
                <Input id="brand" value={brandName} disabled className="bg-slate-100 dark:bg-slate-900" />
              </div>

              <div className="space-y-2">
                <Label>
                  Categories <span className="text-red-500">*</span> (select at least one)
                </Label>
                <div className="h-40 overflow-y-auto rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                  <div className="space-y-2">
                    {categories.length === 0 ? (
                      <p className="text-sm text-slate-500">No categories available</p>
                    ) : (
                      categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={form.watch("categoryIds").includes(category.id)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues("categoryIds");
                              form.setValue(
                                "categoryIds",
                                checked ? [...current, category.id] : current.filter((id) => id !== category.id),
                              );
                            }}
                          />
                          <span className="text-sm">{category.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
                {form.formState.errors.categoryIds && <p className="text-xs text-red-500">{form.formState.errors.categoryIds.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input id="shortDescription" placeholder="Brief description for product listings" {...form.register("shortDescription")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Full Description <span className="text-red-500">*</span>
              </Label>
              <Textarea id="description" placeholder="Detailed product description" rows={4} {...form.register("description")} />
              {form.formState.errors.description && <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>}
            </div>
          </div>

          {/* PRICING & INVENTORY */}
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-semibold">Pricing & Inventory</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (Rs) <span className="text-red-500">*</span>
                </Label>
                <Input id="price" type="number" step="0.01" placeholder="0.00" {...form.register("price")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compareAtPrice">Compare at Price (Rs)</Label>
                <Input id="compareAtPrice" type="number" step="0.01" placeholder="0.00 (optional)" {...form.register("compareAtPrice")} />
                <p className="text-xs text-slate-500">Leave empty to remove. Enter 0 to clear.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (Rs)</Label>
                <Input id="costPrice" type="number" step="0.01" placeholder="0.00 (optional)" {...form.register("costPrice")} />
                <p className="text-xs text-slate-500">Leave empty to remove. Enter 0 to clear.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalStock">Total Stock</Label>
                <Input id="totalStock" type="number" placeholder="0" {...form.register("totalStock")} />
              </div>

              <div className="space-y-2">
                <Label>Stock Status</Label>
                <Select value={form.watch("stockStatus")} onValueChange={(value) => form.setValue("stockStatus", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="In Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <Checkbox checked={form.watch("featured")} onCheckedChange={(checked) => form.setValue("featured", Boolean(checked))} />
                <span className="text-sm font-medium">Featured Product</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={form.watch("published")} onCheckedChange={(checked) => form.setValue("published", Boolean(checked))} />
                <span className="text-sm font-medium">Publish Product</span>
              </label>
            </div>
          </div>

          {/* PRODUCT VARIANTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">Product Variants</h3>
              <Button type="button" size="sm" onClick={() => variants.append(emptyVariant)}>
                <Plus className="h-4 w-4" /> Add Variant
              </Button>
            </div>

            {variants.fields.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium">Size Type</th>
                      <th className="px-3 py-2 text-left font-medium">Size</th>
                      <th className="px-3 py-2 text-left font-medium">Color (optional)</th>
                      <th className="px-3 py-2 text-left font-medium">Stock</th>
                      <th className="px-3 py-2 text-left font-medium">SKU Variant</th>
                      <th className="px-3 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.fields.map((field, index) => (
                      <tr key={field.id} className="border-b">
                        <td className="px-3 py-2">
                          <Input placeholder="Preset (S, M, L...)" {...form.register(`variants.${index}.sizeType` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="M" {...form.register(`variants.${index}.size` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="Red" {...form.register(`variants.${index}.color` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Input type="number" placeholder="0" {...form.register(`variants.${index}.stock` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="SKU-M-1" {...form.register(`variants.${index}.skuVariant` as const)} />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => variants.remove(index)}
                          >
                            Remove Variant
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SIZE CHART */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold">Size Chart</h3>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowSizeVariables(!showSizeVariables)}>
                  {showSizeVariables ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {showSizeVariables ? "Hide" : "Show"} Variables
                </Button>
                <Button type="button" size="sm" onClick={() => sizeCharts.append(emptySizeChart)}>
                  <Plus className="h-4 w-4" /> Add Size Row
                </Button>
              </div>
            </div>

            {showSizeVariables && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <h4 className="mb-3 font-semibold">Manage Size Variables for This Product</h4>
                <p className="mb-4 text-xs text-slate-600 dark:text-slate-400">Changes here only affect this product, not others.</p>

                <div className="space-y-3">
                  {sizeVariables.map((variable) => (
                    <div key={variable.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
                      <span className="font-medium">{variable.label}</span>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm">
                          Rename
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="text-red-600">
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <Input placeholder="Variable name (e.g., waist)" />
                  <Input placeholder="Display label (e.g., Waist)" />
                  <Button type="button" variant="default" className="bg-green-600 hover:bg-green-700">
                    Add
                  </Button>
                </div>
              </div>
            )}

            {sizeCharts.fields.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 dark:bg-slate-900/40">
                      <th className="px-3 py-2 text-left font-medium">Size</th>
                      <th className="px-3 py-2 text-left font-medium">Height</th>
                      <th className="px-3 py-2 text-left font-medium">Width</th>
                      <th className="px-3 py-2 text-left font-medium">Length</th>
                      <th className="px-3 py-2 text-left font-medium">Unit</th>
                      <th className="px-3 py-2 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeCharts.fields.map((field, index) => (
                      <tr key={field.id} className="border-b">
                        <td className="px-3 py-2">
                          <Select value={form.watch(`sizeCharts.${index}.size` as const)} onValueChange={(value) => form.setValue(`sizeCharts.${index}.size` as const, value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="M">M</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="XL">XL</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="Value" {...form.register(`sizeCharts.${index}.height` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="Value" {...form.register(`sizeCharts.${index}.width` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Input placeholder="Value" {...form.register(`sizeCharts.${index}.length` as const)} />
                        </td>
                        <td className="px-3 py-2">
                          <Select value={form.watch(`sizeCharts.${index}.unit` as const) || "cm"} onValueChange={(value) => form.setValue(`sizeCharts.${index}.unit` as const, value)}>
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cm">cm</SelectItem>
                              <SelectItem value="in">in</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => sizeCharts.remove(index)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PRODUCT IMAGES */}
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-semibold">Product Images</h3>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500 transition hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/60">
              <Upload className="h-8 w-8" />
              <span className="text-sm font-medium">Click to upload or drag images</span>
              <span className="text-xs">PNG, JPG, GIF up to 10MB</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onUploadImages(e.target.files)} />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    type="button"
                    onClick={() => {
                      const next = images.filter((_, i) => i !== index);
                      setImages(next);
                      form.setValue("images", next);
                    }}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <img src={image} alt={`Product ${index + 1}`} className="h-24 w-full object-cover transition group-hover:scale-110" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <Trash2 className="h-4 w-4 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SHIPPING INFORMATION */}
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-semibold">Shipping Information</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" step="0.01" placeholder="0.5" {...form.register("weight")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingClass">Shipping Class</Label>
                <Input id="shippingClass" placeholder="Standard" {...form.register("shippingClass")} />
              </div>
            </div>

            <div>
              <Label>Dimensions (L × W × H in cm)</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                <Input placeholder="Length" type="number" {...form.register("length")} />
                <Input placeholder="Width" type="number" {...form.register("width")} />
                <Input placeholder="Height" type="number" {...form.register("height")} />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-lg font-semibold">SEO</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input id="seoTitle" placeholder="SEO optimized title" {...form.register("seoTitle")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Textarea id="seoDescription" placeholder="SEO optimized description" rows={3} {...form.register("seoDescription")} />
            </div>
          </div>

          {/* ACTIONS */}
          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProductForm };
