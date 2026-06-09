import type {
  ActivityItem,
  PortalAccount,
  PortalCategory,
  PortalNotification,
  PortalProduct,
  StoreOption,
} from "@/types/portal";

const now = new Date();

const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

const brandAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;

export const demoCredentials = {
  admin: {
    email: "admin@amstani.com",
    password: "Admin@12345",
  },
  brand: {
    email: "mia@northstarwear.com",
    password: "Brand@12345",
  },
};

export const seedAccounts: PortalAccount[] = [
  {
    id: "admin-1",
    role: "admin",
    fullName: "Amstani Admin",
    email: demoCredentials.admin.email,
    password: demoCredentials.admin.password,
    avatar: brandAvatar("Amstani Admin"),
    status: "approved",
    joinedAt: daysAgo(42),
  },
  {
    id: "brand-1",
    role: "brand",
    fullName: "Mia Carter",
    email: demoCredentials.brand.email,
    password: demoCredentials.brand.password,
    brandName: "Northstar Wear",
    phoneNumber: "+1 415 555 0148",
    avatar: brandAvatar("Northstar Wear"),
    status: "approved",
    joinedAt: daysAgo(26),
  },
  {
    id: "brand-2",
    role: "brand",
    fullName: "Jordan Patel",
    email: "jordan@urbanloom.com",
    password: "Brand@12345",
    brandName: "Urban Loom",
    phoneNumber: "+1 212 555 0191",
    avatar: brandAvatar("Urban Loom"),
    status: "pending",
    joinedAt: daysAgo(4),
  },
  {
    id: "brand-3",
    role: "brand",
    fullName: "Ava Nguyen",
    email: "ava@meridianlabel.com",
    password: "Brand@12345",
    brandName: "Meridian Label",
    phoneNumber: "+1 646 555 0177",
    avatar: brandAvatar("Meridian Label"),
    status: "banned",
    joinedAt: daysAgo(17),
    bannedAt: daysAgo(5),
    notes: "Quality compliance review pending.",
  },
  {
    id: "brand-4",
    role: "brand",
    fullName: "Noah Rivers",
    email: "noah@silverstoneco.com",
    password: "Brand@12345",
    brandName: "Silverstone Co.",
    phoneNumber: "+1 305 555 0102",
    avatar: brandAvatar("Silverstone Co."),
    status: "declined",
    joinedAt: daysAgo(11),
  },
];

export const seedStores: StoreOption[] = [
  {
    id: "store-global",
    name: "Global Inventory",
    location: "All channels",
  },
  {
    id: "store-nyc",
    name: "Downtown Studio",
    location: "New York, USA",
  },
  {
    id: "store-la",
    name: "West Coast Hub",
    location: "Los Angeles, USA",
  },
];

export const seedCategories: PortalCategory[] = [
  {
    id: "cat-1",
    brandId: "brand-1",
    name: "Summer Staples",
    image:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
    status: "active",
    createdAt: daysAgo(14),
  },
  {
    id: "cat-2",
    brandId: "brand-1",
    name: "Studio Essentials",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80",
    status: "active",
    createdAt: daysAgo(10),
  },
  {
    id: "cat-3",
    brandId: "brand-2",
    name: "Minimal Layers",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
    status: "archived",
    createdAt: daysAgo(8),
  },
  {
    id: "cat-4",
    brandId: "brand-2",
    name: "Casual Wear",
    image: "",
    status: "active",
    createdAt: daysAgo(5),
  },
  {
    id: "cat-5",
    brandId: "brand-2",
    name: "Formal Collection",
    image: "",
    status: "active",
    createdAt: daysAgo(3),
  },
  {
    id: "cat-6",
    brandId: "brand-2",
    name: "Activewear",
    image: "",
    status: "active",
    createdAt: daysAgo(1),
  },
  {
    id: "cat-7",
    brandId: "brand-2",
    name: "Seasonal Trends",
    image: "",
    status: "active",
    createdAt: daysAgo(0),
  },
];

export const seedProducts: PortalProduct[] = [
  {
    id: "prod-1",
    brandId: "brand-1",
    brandName: "Northstar Wear",
    title: "Aster Relaxed Overshirt",
    description:
      "A modern overshirt with structured shoulders and a soft handfeel.",
    material: "Cotton blend",
    sku: "NSW-OVS-001",
    categoryIds: ["cat-1", "cat-2"],
    images: [
      "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
    ],
    price: 128,
    compareAtPrice: 168,
    costPrice: 68,
    totalStock: 84,
    stockStatus: "in-stock",
    featured: true,
    published: true,
    variants: [
      {
        sizeType: "Alpha",
        size: "M",
        color: "Midnight",
        stock: 20,
        skuVariant: "NSW-OVS-001-MID-M",
      },
      {
        sizeType: "Alpha",
        size: "L",
        color: "Midnight",
        stock: 18,
        skuVariant: "NSW-OVS-001-MID-L",
      },
    ],
    sizeCharts: [
      { waist: "40", height: "70", length: "74", width: "52", unit: "cm" },
      { waist: "42", height: "72", length: "76", width: "54", unit: "cm" },
    ],
    weight: 0.68,
    shippingClass: "Standard",
    length: 74,
    width: 52,
    height: 4,
    seoTitle: "Aster Relaxed Overshirt | Northstar Wear",
    seoDescription: "Premium overshirt for elevated everyday layering.",
    storeId: "store-global",
    createdAt: daysAgo(6),
  },
  {
    id: "prod-2",
    brandId: "brand-1",
    brandName: "Northstar Wear",
    title: "Vector Cargo Trouser",
    description: "Utility-inspired cargos with a polished drape.",
    material: "Twill cotton",
    sku: "NSW-TRS-007",
    categoryIds: ["cat-2"],
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80",
    ],
    price: 142,
    compareAtPrice: 182,
    costPrice: 74,
    totalStock: 44,
    stockStatus: "low-stock",
    featured: false,
    published: true,
    variants: [
      {
        sizeType: "Waist",
        size: "32",
        color: "Olive",
        stock: 8,
        skuVariant: "NSW-TRS-007-OLV-32",
      },
      {
        sizeType: "Waist",
        size: "34",
        color: "Olive",
        stock: 6,
        skuVariant: "NSW-TRS-007-OLV-34",
      },
    ],
    sizeCharts: [{ waist: "32", height: "100", length: "102", width: "36", unit: "cm" }],
    weight: 0.88,
    shippingClass: "Express",
    length: 102,
    width: 36,
    height: 6,
    seoTitle: "Vector Cargo Trouser | Northstar Wear",
    seoDescription: "Tapered cargo trousers for clean utility styling.",
    storeId: "store-nyc",
    createdAt: daysAgo(3),
  },
  {
    id: "prod-3",
    brandId: "brand-2",
    brandName: "Urban Loom",
    title: "Canvas Knit Hoodie",
    description: "Soft core hoodie with a tactile, premium knit finish.",
    material: "French terry",
    sku: "ULO-HDY-002",
    categoryIds: ["cat-3"],
    images: [
      "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80",
    ],
    price: 98,
    compareAtPrice: 118,
    costPrice: 52,
    totalStock: 22,
    stockStatus: "out-of-stock",
    featured: false,
    published: false,
    variants: [],
    sizeCharts: [],
    weight: 0.74,
    shippingClass: "Standard",
    length: 62,
    width: 50,
    height: 5,
    seoTitle: "Canvas Knit Hoodie | Urban Loom",
    seoDescription: "Comfort-first hoodie with premium construction.",
    storeId: "store-la",
    createdAt: daysAgo(9),
  },
];

export const seedNotifications: PortalNotification[] = [
  {
    id: "note-1",
    title: "Brand request pending",
    message: "Urban Loom submitted a new registration request.",
    time: daysAgo(1),
    read: false,
    tone: "warning",
  },
  {
    id: "note-2",
    title: "New product published",
    message: "Northstar Wear published Vector Cargo Trouser.",
    time: daysAgo(2),
    read: true,
    tone: "success",
  },
  {
    id: "note-3",
    title: "Brand status updated",
    message: "Meridian Label was moved to banned status.",
    time: daysAgo(5),
    read: true,
    tone: "danger",
  },
];

export const seedActivity: ActivityItem[] = [
  {
    id: "activity-1",
    title: "Approved brand",
    description: "Northstar Wear was approved and activated.",
    time: daysAgo(2),
    tone: "success",
  },
  {
    id: "activity-2",
    title: "Inventory updated",
    description: "Aster Relaxed Overshirt stock was adjusted.",
    time: daysAgo(3),
    tone: "info",
  },
  {
    id: "activity-3",
    title: "Brand request declined",
    description: "Silverstone Co. was declined after review.",
    time: daysAgo(5),
    tone: "warning",
  },
];
