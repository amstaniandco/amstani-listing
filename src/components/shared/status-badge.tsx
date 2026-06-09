import { Badge } from "@/components/ui/badge";
import type { BrandStatus, ProductStatus, StockStatus } from "@/types/portal";

interface StatusBadgeProps {
  status: BrandStatus | ProductStatus | StockStatus | string;
}

const map = {
  pending: "warning",
  approved: "success",
  declined: "danger",
  banned: "danger",
  draft: "secondary",
  published: "success",
  "out-of-stock": "danger",
  "low-stock": "warning",
  "in-stock": "success",
} as const;

function StatusBadge({ status }: StatusBadgeProps) {
  const key = status in map ? (status as keyof typeof map) : "approved";

  return <Badge variant={map[key]} className="capitalize">{status.replaceAll("-", " ")}</Badge>;
}

export { StatusBadge };
