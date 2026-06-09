// Supabase Database types — MAIN eCommerce project (single-project model).
//
// Hand-written to match the REAL introspected schema (Prisma-managed):
//   tables use text (uuid-as-text) ids and camelCase columns.
// Regenerate the authoritative version once you have a Supabase access token:
//   supabase gen types typescript --project-id psdkgevtfjnskupvifer --schema public > src/types/db.ts
//
// Only the tables the portal touches are typed here.

export type Role = "USER" | "ADMIN" | "BRAND_REP";
export type UserStatus = "PENDING" | "APPROVED" | "BLOCKED";
export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"; // adjust if MAIN's enum differs
export type CategoryRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  role: Role;
  status: UserStatus;
  brandId: string | null; // added by main_0002
  createdAt: string;
  updatedAt: string;
}

export interface BrandRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  stockStatus: StockStatus;
  totalStock: number;
  isFeatured: boolean;
  isPublished: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  mainImage: string | null;
  brandId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCategoryRow {
  id: string;
  productId: string;
  categoryId: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductImageRow {
  id: string;
  productId: string;
  imageUrl: string;
  alt: string | null;
  isMain: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryRequestRow {
  id: string;
  requestedBy: string;
  brandId: string;
  name: string;
  slug: string;
  status: CategoryRequestStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantRow {
  id: string;
  productId: string;
  size: string;
  color: string | null;
  stockQuantity: number;
  skuVariant: string;
  priceOverride: number | null;
  isCustomSize: boolean;
}

export interface SizeChartRow {
  id: string;
  productId: string;
  size: string;
  unit: "cm" | "in";
  measurements: Record<string, string>;
}

export interface ShippingInfoRow {
  productId: string;
  weight: number | null;
  dimensionL: number | null;
  dimensionW: number | null;
  dimensionH: number | null;
  shippingClass: string | null;
}

export interface CategorySizeVariableRow {
  id: string;
  categoryId: string;
  name: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row> };

export interface Database {
  public: {
    Tables: {
      users: Table<UserRow>;
      brand: Table<BrandRow>;
      category: Table<CategoryRow>;
      product: Table<ProductRow>;
      product_category: Table<ProductCategoryRow>;
      product_images: Table<ProductImageRow>;
      product_variant: Table<ProductVariantRow>;
      size_chart: Table<SizeChartRow>;
      shipping_info: Table<ShippingInfoRow>;
      category_size_variable: Table<CategorySizeVariableRow>;
      category_request: Table<CategoryRequestRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      Role: Role;
      UserStatus: UserStatus;
      StockStatus: StockStatus;
    };
  };
}
