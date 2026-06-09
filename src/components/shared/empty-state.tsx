import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Card className="border-dashed border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-950/70">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          <span className="text-2xl font-semibold">⋯</span>
        </div>
        <div className="max-w-md space-y-2">
          <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        {actionLabel && onAction ? (
          <Button onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { EmptyState };
