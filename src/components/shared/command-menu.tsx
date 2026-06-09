"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";

type CommandAction = {
  label: string;
  description: string;
  href: string;
  shortcut?: string;
};

function CommandMenu({ open, onOpenChange, actions }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: CommandAction[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search actions or jump to a page..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {actions.map((action) => (
            <CommandItem
              key={action.href}
              value={`${action.label} ${action.description} ${action.href}`}
              onSelect={() => {
                router.push(action.href);
                onOpenChange(false);
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span>{action.label}</span>
                <span className="text-xs text-slate-500">{action.description}</span>
              </div>
              <CommandShortcut>{action.shortcut ?? ""}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Current page">
          <CommandItem value={pathname} onSelect={() => onOpenChange(false)}>
            {pathname}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export { CommandMenu };
