import Link from "next/link";

import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav className={cn("flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400", className)}>
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-2">
          {item.href ? (
            <Link href={item.href} className="transition hover:text-slate-950 dark:hover:text-white">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-950 dark:text-white">{item.label}</span>
          )}
          {index < items.length - 1 ? <span className="text-slate-300 dark:text-slate-700">/</span> : null}
        </span>
      ))}
    </nav>
  );
}

export { Breadcrumbs };
