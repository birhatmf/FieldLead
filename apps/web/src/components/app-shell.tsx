import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { MainNav } from "@/components/main-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <BrandMark />
        <MainNav />
        <div className="mt-auto border-t border-sidebar-border p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Google Places verisi kullanılır. API maliyeti Ayarlar ekranından
            izlenebilir.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <span className="md:hidden">
            <MapPin aria-hidden="true" className="size-5 text-primary" />
          </span>
          <span className="text-sm font-semibold md:hidden">FieldLead</span>
          <p className="ml-auto hidden text-xs text-muted-foreground md:block">
            Saha araştırma ve lead toplama platformu
          </p>
        </header>

        <div className="border-b border-border bg-sidebar md:hidden">
          <MainNav orientation="horizontal" />
        </div>

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <MapPin aria-hidden="true" className="size-4" />
      </span>
      <span className="text-base font-semibold tracking-tight">FieldLead</span>
    </div>
  );
}
