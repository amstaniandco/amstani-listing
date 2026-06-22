"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatPkr } from "@/lib/format";
import type { EditProduct } from "./product-form";

// One labelled money row in the Pricing section (already-formatted string value,
// e.g. "PKR 4,999"). Lets the caller pass an explicit, correctly-converted price
// breakdown instead of relying on the default wholesale row.
export interface PricingRow {
  label: string;
  value: string;
  hint?: string; // optional small note shown under the label (e.g. "before tax")
}

interface ProductViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: (EditProduct & { brandName?: string | null; categoryNames?: string[] }) | null;
  // Wholesale price is admin-only context (used during pre-approval review).
  // Hidden from the brand rep's own product view by default.
  showWholesalePrice?: boolean;
  // When provided, the Pricing section renders THESE rows (already converted /
  // formatted by the caller) instead of the default wholesale row. Used by the
  // admin catalog View, where an approved product's stored price is USD and must
  // be shown back in PKR with the before/after-tax breakdown.
  pricingRows?: PricingRow[];
}

export function ProductView({
  open,
  onOpenChange,
  product,
  showWholesalePrice = false,
  pricingRows,
}: ProductViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-full max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product?.name ?? "Product"}</DialogTitle>
        </DialogHeader>

        {product ? (
          <div className="space-y-6 text-sm">
            {/* images */}
            {product.images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {product.images.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt="" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" />
                ))}
              </div>
            )}

            {/* basic */}
            <Section title="Basic Information">
              <Row label="SKU" value={product.sku} />
              <Row label="Brand" value={product.brandName ?? "—"} />
              <Row label="Categories" value={(product.categoryNames ?? []).join(", ") || "—"} />
              <Row label="Status">
                <Badge variant={product.isPublished ? "success" : "secondary"}>
                  {product.isPublished ? "Published" : "Disabled"}
                </Badge>
              </Row>
              <Row label="Featured" value={product.isFeatured ? "Yes" : "No"} />
              <div className="pt-2">
                <p className="text-slate-500">Short description</p>
                <p>{product.shortDescription || "—"}</p>
              </div>
              <div className="pt-2">
                <p className="text-slate-500">Full description</p>
                <p className="whitespace-pre-wrap">{product.fullDescription || "—"}</p>
              </div>
            </Section>

            {/* pricing */}
            <Section title="Pricing & Inventory">
              {/* Caller-supplied breakdown wins (admin catalog View: converts an
                  approved product's USD price back to PKR with before/after-tax
                  rows). Otherwise fall back to the simple pre-approval wholesale
                  rows, where the stored price is still the rep's PKR amount. */}
              {pricingRows && pricingRows.length > 0 ? (
                pricingRows.map((r) =>
                  r.hint ? (
                    <Row key={r.label} label={r.label}>
                      <span className="block text-right">
                        <span className="font-medium">{r.value}</span>
                        <span className="block text-xs font-normal text-slate-400">{r.hint}</span>
                      </span>
                    </Row>
                  ) : (
                    <Row key={r.label} label={r.label} value={r.value} />
                  ),
                )
              ) : (
                showWholesalePrice && (
                  <>
                    <Row label="Wholesale Price" value={formatPkr(product.price)} />
                    {/* The ORIGINAL price the brand rep uploaded, in PKR. Preserved by
                        vendorPricePkr (main_0012) and never altered by approval — purely
                        informational, no effect on the final price. Legacy rows without
                        vendorPricePkr fall back to the wholesale price. */}
                    <Row
                      label="Uploaded Price (Vendor)"
                      value={formatPkr(product.vendorPricePkr ?? product.wholesalePrice ?? product.price)}
                    />
                  </>
                )
              )}
              <Row label="Stock status" value={product.stockStatus.replace("_", " ")} />
              <Row label="Total stock" value={String(product.totalStock)} />
            </Section>

            {/* variants */}
            <Section title={`Variants (${product.variants.length})`}>
              {product.variants.length === 0 ? <p className="text-slate-500">None</p> : (() => {
                // Union of all extra attribute keys across the variants -> dynamic columns.
                const attrKeys = Array.from(
                  new Set(product.variants.flatMap((v) => Object.keys(v.attributes ?? {}))),
                );
                return (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="py-1 pr-3">Size</th>
                        <th className="py-1 pr-3">Color</th>
                        <th className="py-1 pr-3">Stock</th>
                        <th className="py-1 pr-3">SKU</th>
                        <th className="py-1 pr-3">Price</th>
                        {attrKeys.map((k) => (
                          <th key={k} className="py-1 pr-3 capitalize">{k.replace(/_/g, " ")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="py-1 pr-3">{v.size || "—"}</td><td className="py-1 pr-3">{v.color || "—"}</td>
                          <td className="py-1 pr-3">{v.stockQuantity}</td><td className="py-1 pr-3">{v.skuVariant}</td>
                          <td className="py-1 pr-3">{v.priceOverride != null ? formatPkr(v.priceOverride) : "Base"}</td>
                          {attrKeys.map((k) => (
                            <td key={k} className="py-1 pr-3">{v.attributes?.[k] || "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </Section>

            {/* size chart */}
            <Section title={`Size Chart (${product.sizeCharts.length})`}>
              {product.sizeCharts.length === 0 ? <p className="text-slate-500">None</p> : (
                <div className="space-y-2">
                  {product.sizeCharts.map((r, i) => (
                    <div key={i} className="rounded-lg border border-slate-200 p-2">
                      <p className="font-medium">Size {r.size} <span className="text-slate-400">({r.unit})</span></p>
                      <p className="text-slate-600">
                        {Object.entries(r.measurements).map(([k, val]) => `${k}: ${val}`).join("  •  ") || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* shipping */}
            <Section title="Shipping">
              <Row label="Weight" value={product.shipping.weight != null ? `${product.shipping.weight} kg` : "—"} />
              <Row label="Dimensions (L×W×H)" value={
                [product.shipping.dimensionL, product.shipping.dimensionW, product.shipping.dimensionH]
                  .every((d) => d != null) ? `${product.shipping.dimensionL} × ${product.shipping.dimensionW} × ${product.shipping.dimensionH} cm` : "—"
              } />
              <Row label="Shipping class" value={product.shipping.shippingClass ?? "—"} />
            </Section>

            {/* SEO */}
            <Section title="SEO">
              <Row label="Title" value={product.seoTitle ?? "—"} />
              <Row label="Description" value={product.seoDescription ?? "—"} />
            </Section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="border-b pb-1 font-semibold">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium">{children ?? value}</span>
    </div>
  );
}
