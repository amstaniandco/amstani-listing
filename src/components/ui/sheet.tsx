import * as React from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const Sheet = Dialog;
const SheetTrigger = DialogTrigger;
const SheetClose = DialogClose;
const SheetPortal = DialogPortal;

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof DialogContent> & { side?: "top" | "right" | "bottom" | "left" }) {
  const sideClasses = {
    top: "top-0 left-0 right-0 translate-y-0 rounded-b-3xl w-full",
    right: "right-0 top-0 bottom-0 translate-x-0 rounded-l-3xl h-full w-[min(92vw,24rem)]",
    bottom: "bottom-0 left-0 right-0 translate-y-0 rounded-t-3xl w-full",
    left: "left-0 top-0 bottom-0 translate-x-0 rounded-r-3xl h-full w-[min(92vw,24rem)]",
  } as const;

  return (
    <DialogContent
      className={cn(
        "fixed z-50 gap-4 border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950",
        sideClasses[side],
        className,
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <DialogHeader className={cn("text-left", className)} {...props} />;
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription className={cn("text-sm text-slate-500 dark:text-slate-400", className)} {...props} />;
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
