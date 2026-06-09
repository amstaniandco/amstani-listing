export type Role = "admin" | "brand";

export type BrandStatus = "pending" | "approved" | "declined" | "banned";

export type ProductStatus = "draft" | "published" | "out-of-stock";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type NotificationTone = "info" | "success" | "warning" | "danger";

export interface PortalAccount {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  password: string;
  brandName?: string;
  phoneNumber?: string;
  avatar?: string;
  status?: BrandStatus;
  joinedAt?: string;
  bannedAt?: string;
  notes?: string;
}

export interface PortalCategory {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  image?: string;
  status: "active" | "archived";
  createdAt: string;
}

export interface ProductVariant {
  sizeType: string;
  size: string;
  color: string;
  stock: number;
  skuVariant: string;
}

export interface SizeChartRow {
  waist: string;
  height: string;
  length: string;
  width: string;
  unit: string;
}

export interface PortalProduct {
  id: string;
  brandId: string;
  brandName: string;
  title: string;
  description: string;
  material: string;
  sku: string;
  categoryIds: string[];
  images: string[];
  price: number;
  compareAtPrice: number;
  costPrice: number;
  totalStock: number;
  stockStatus: StockStatus;
  featured: boolean;
  published: boolean;
  variants: ProductVariant[];
  sizeCharts: SizeChartRow[];
  weight: number;
  shippingClass: string;
  length: number;
  width: number;
  height: number;
  seoTitle: string;
  seoDescription: string;
  storeId: string;
  createdAt: string;
}

export interface StoreOption {
  id: string;
  name: string;
  location: string;
}

export interface PortalNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  tone: NotificationTone;
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: NotificationTone;
}

export interface LoginInput {
  email: string;
  password: string;
  role: Role;
  rememberMe: boolean;
}

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  brandName: string;
  phoneNumber: string;
}
