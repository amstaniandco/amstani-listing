import { Skeleton } from "@/components/ui/skeleton";

/**
 * Full-page loading placeholder shown while the client store rehydrates from
 * localStorage. Replaces returning `null`, which made guarded pages look frozen
 * on cold loads. Roughly mirrors the dashboard layout (sidebar + header + body).
 */
function PageSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-72 flex-col gap-4 border-r border-slate-200 p-6 dark:border-slate-800 lg:flex">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 px-6 dark:border-slate-800">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-10 rounded-2xl" />
        </header>
        <main className="flex-1 space-y-6 p-6">
          <Skeleton className="h-24 w-full rounded-[2rem]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </main>
      </div>
    </div>
  );
}

export { PageSkeleton };
