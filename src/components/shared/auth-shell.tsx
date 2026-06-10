import Image from "next/image";

import { cn } from "@/lib/utils";

function AuthShell({
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className={cn("w-full max-w-md", className)}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/Amstani.png"
            alt="Amstani"
            width={160}
            height={160}
            priority
            className="mb-2 h-32 w-auto"
          />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export { AuthShell };
