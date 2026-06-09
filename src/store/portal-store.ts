import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

import {
  seedAccounts,
  seedActivity,
  seedCategories,
  seedNotifications,
  seedProducts,
  seedStores,
} from "@/mock/data";
import type {
  ActivityItem,
  LoginInput,
  PortalAccount,
  PortalCategory,
  PortalNotification,
  PortalProduct,
  SignupInput,
  StoreOption,
} from "@/types/portal";

type AuthResult =
  | { ok: true; account: PortalAccount }
  | { ok: false; message: string };

type BrandStatus = NonNullable<PortalAccount["status"]>;

interface PortalState {
  accounts: PortalAccount[];
  categories: PortalCategory[];
  products: PortalProduct[];
  stores: StoreOption[];
  notifications: PortalNotification[];
  activity: ActivityItem[];
  sessionUserId: string | null;
  rememberMe: boolean;
  hydrated: boolean;
  login: (payload: LoginInput) => AuthResult;
  signupBrand: (payload: SignupInput) => AuthResult;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
  updateProfile: (accountId: string, updates: Partial<PortalAccount>) => void;
  approveBrand: (brandId: string) => void;
  declineBrand: (brandId: string) => void;
  banBrand: (brandId: string) => void;
  unbanBrand: (brandId: string) => void;
  createCategory: (category: Omit<PortalCategory, "id" | "createdAt">) => void;
  updateCategory: (categoryId: string, updates: Partial<PortalCategory>) => void;
  deleteCategory: (categoryId: string) => void;
  createProduct: (product: Omit<PortalProduct, "id" | "createdAt">) => void;
  updateProduct: (productId: string, updates: Partial<PortalProduct>) => void;
  deleteProduct: (productId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  addActivity: (activity: Omit<ActivityItem, "id">) => void;
}

const nextId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`;

const withBrandName = (account: PortalAccount) =>
  account.brandName ?? account.fullName;

const addActivity = (
  list: ActivityItem[],
  activity: Omit<ActivityItem, "id">,
) => [
  { id: nextId("activity"), ...activity },
  ...list,
];

export const usePortalStore = create<PortalState>()(
  persist(
    (set, get) => ({
      accounts: seedAccounts,
      categories: seedCategories,
      products: seedProducts,
      stores: seedStores,
      notifications: seedNotifications,
      activity: seedActivity,
      sessionUserId: null,
      rememberMe: true,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      login: ({ email, password, role, rememberMe }) => {
        const account = get().accounts.find(
          (item) =>
            item.email.toLowerCase() === email.toLowerCase() &&
            item.password === password &&
            item.role === role,
        );

        if (!account) {
          return { ok: false, message: "Invalid credentials for the selected role." };
        }

        if (account.role === "brand") {
          const brandStatus = account.status ?? "pending";

          if (brandStatus === "pending") {
            return {
              ok: false,
              message: "Your brand request is still pending admin approval.",
            };
          }

          if (brandStatus === "declined") {
            return {
              ok: false,
              message: "Your brand request was declined. Please contact support.",
            };
          }

          if (brandStatus === "banned") {
            return {
              ok: false,
              message: "This brand account is banned and cannot sign in.",
            };
          }
        }

        set({ sessionUserId: account.id, rememberMe });
        return { ok: true, account };
      },
      signupBrand: (payload) => {
        const existing = get().accounts.find(
          (item) => item.email.toLowerCase() === payload.email.toLowerCase(),
        );

        if (existing) {
          return { ok: false, message: "An account with that email already exists." };
        }

        const account: PortalAccount = {
          id: nextId("brand"),
          role: "brand",
          fullName: payload.fullName,
          email: payload.email,
          password: payload.password,
          brandName: payload.brandName,
          phoneNumber: payload.phoneNumber,
          avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(payload.brandName)}`,
          status: "pending",
          joinedAt: new Date().toISOString(),
        };

        set((state) => ({
          accounts: [account, ...state.accounts],
          notifications: [
            {
              id: nextId("note"),
              title: "New brand request",
              message: `${payload.brandName} has requested brand access.`,
              time: new Date().toISOString(),
              read: false,
              tone: "warning",
            },
            ...state.notifications,
          ],
          activity: addActivity(state.activity, {
            title: "Brand request created",
            description: `${payload.brandName} submitted a registration request.`,
            time: new Date().toISOString(),
            tone: "warning",
          }),
        }));

        return { ok: true, account };
      },
      logout: () => set({ sessionUserId: null, rememberMe: true }),
      setHydrated: (hydrated) => set({ hydrated }),
      updateProfile: (accountId, updates) =>
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === accountId ? { ...account, ...updates } : account,
          ),
        })),
      approveBrand: (brandId) =>
        set((state) => {
          const account = state.accounts.find((item) => item.id === brandId);
          if (!account) {
            return {};
          }

          const updatedBrand = { ...account, status: "approved" as BrandStatus };

          return {
            accounts: state.accounts.map((item) =>
              item.id === brandId ? updatedBrand : item,
            ),
            notifications: [
              {
                id: nextId("note"),
                title: "Brand approved",
                message: `${withBrandName(updatedBrand)} is now active.`,
                time: new Date().toISOString(),
                read: false,
                tone: "success",
              },
              ...state.notifications,
            ],
            activity: addActivity(state.activity, {
              title: "Brand approved",
              description: `${withBrandName(updatedBrand)} was approved by admin.`,
              time: new Date().toISOString(),
              tone: "success",
            }),
          };
        }),
      declineBrand: (brandId) =>
        set((state) => {
          const account = state.accounts.find((item) => item.id === brandId);
          if (!account) {
            return {};
          }

          const updatedBrand = { ...account, status: "declined" as BrandStatus };

          return {
            accounts: state.accounts.map((item) =>
              item.id === brandId ? updatedBrand : item,
            ),
            notifications: [
              {
                id: nextId("note"),
                title: "Brand declined",
                message: `${withBrandName(updatedBrand)} was declined after review.`,
                time: new Date().toISOString(),
                read: false,
                tone: "warning",
              },
              ...state.notifications,
            ],
            activity: addActivity(state.activity, {
              title: "Brand declined",
              description: `${withBrandName(updatedBrand)} was declined by admin.`,
              time: new Date().toISOString(),
              tone: "warning",
            }),
          };
        }),
      banBrand: (brandId) =>
        set((state) => {
          const account = state.accounts.find((item) => item.id === brandId);
          if (!account) {
            return {};
          }

          const updatedBrand = {
            ...account,
            status: "banned" as BrandStatus,
            bannedAt: new Date().toISOString(),
          };

          return {
            accounts: state.accounts.map((item) =>
              item.id === brandId ? updatedBrand : item,
            ),
            notifications: [
              {
                id: nextId("note"),
                title: "Brand banned",
                message: `${withBrandName(updatedBrand)} has been banned.`,
                time: new Date().toISOString(),
                read: false,
                tone: "danger",
              },
              ...state.notifications,
            ],
            activity: addActivity(state.activity, {
              title: "Brand banned",
              description: `${withBrandName(updatedBrand)} was banned by admin.`,
              time: new Date().toISOString(),
              tone: "danger",
            }),
          };
        }),
      unbanBrand: (brandId) =>
        set((state) => {
          const account = state.accounts.find((item) => item.id === brandId);
          if (!account) {
            return {};
          }

          const updatedBrand = {
            ...account,
            status: "approved" as BrandStatus,
            bannedAt: undefined,
          };

          return {
            accounts: state.accounts.map((item) =>
              item.id === brandId ? updatedBrand : item,
            ),
            notifications: [
              {
                id: nextId("note"),
                title: "Brand unbanned",
                message: `${withBrandName(updatedBrand)} is active again.`,
                time: new Date().toISOString(),
                read: false,
                tone: "success",
              },
              ...state.notifications,
            ],
            activity: addActivity(state.activity, {
              title: "Brand unbanned",
              description: `${withBrandName(updatedBrand)} was restored by admin.`,
              time: new Date().toISOString(),
              tone: "success",
            }),
          };
        }),
      createCategory: (category) =>
        set((state) => ({
          categories: [
            {
              ...category,
              id: nextId("cat"),
              createdAt: new Date().toISOString(),
            },
            ...state.categories,
          ],
          activity: addActivity(state.activity, {
            title: "Category created",
            description: `${category.name} was created.`,
            time: new Date().toISOString(),
            tone: "success",
          }),
        })),
      updateCategory: (categoryId, updates) =>
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === categoryId ? { ...category, ...updates } : category,
          ),
        })),
      deleteCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== categoryId),
          products: state.products.map((product) => ({
            ...product,
            categoryIds: product.categoryIds.filter((id) => id !== categoryId),
          })),
        })),
      createProduct: (product) =>
        set((state) => ({
          products: [
            {
              ...product,
              id: nextId("prod"),
              createdAt: new Date().toISOString(),
            },
            ...state.products,
          ],
          activity: addActivity(state.activity, {
            title: "Product created",
            description: `${product.title} was added to the catalog.`,
            time: new Date().toISOString(),
            tone: "success",
          }),
        })),
      updateProduct: (productId, updates) =>
        set((state) => ({
          products: state.products.map((product) =>
            product.id === productId ? { ...product, ...updates } : product,
          ),
        })),
      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== productId),
          activity: addActivity(state.activity, {
            title: "Product deleted",
            description: `Product ${productId} was removed.`,
            time: new Date().toISOString(),
            tone: "warning",
          }),
        })),
      markNotificationRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
      addActivity: (activity) =>
        set((state) => ({ activity: addActivity(state.activity, activity) })),
    }),
    {
      name: "amstani-portal-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        categories: state.categories,
        products: state.products,
        stores: state.stores,
        notifications: state.notifications,
        activity: state.activity,
        sessionUserId: state.sessionUserId,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export const portalSelectors = {
  currentAccount: (state: PortalState) =>
    state.accounts.find((account) => account.id === state.sessionUserId) ?? null,
  currentBrand: (state: PortalState) => {
    const account = state.accounts.find((item) => item.id === state.sessionUserId);
    return account?.role === "brand" ? account : null;
  },
  adminAccount: (state: PortalState) =>
    state.accounts.find((account) => account.role === "admin") ?? null,
};
