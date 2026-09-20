import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

interface PaginationProps {
  basePath: string;
  params: Record<string, string>;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}

export function Pagination({
  basePath,
  params,
  page,
  totalPages,
  total,
  pageSize,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function href(target: number): string {
    const query = new URLSearchParams(params);

    if (target > 1) {
      query.set("page", String(target));
    } else {
      query.delete("page");
    }

    const serialized = query.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
  }

  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  const pages = Array.from(
    { length: Math.max(0, windowEnd - windowStart + 1) },
    (_, index) => windowStart + index,
  );

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)} kayıt
      </p>

      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <Button
            asChild={page > 1}
            variant="outline"
            size="icon"
            disabled={page <= 1}
          >
            {page > 1 ? (
              <Link href={href(page - 1)} aria-label="Önceki sayfa">
                <ChevronLeft aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span>
                <ChevronLeft aria-hidden="true" className="size-4" />
              </span>
            )}
          </Button>

          {pages.map((target) => (
            <Button
              key={target}
              asChild
              variant={target === page ? "default" : "outline"}
              size="icon"
            >
              <Link
                href={href(target)}
                aria-label={`Sayfa ${target}`}
                aria-current={target === page ? "page" : undefined}
              >
                {target}
              </Link>
            </Button>
          ))}

          <Button
            asChild={page < totalPages}
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
          >
            {page < totalPages ? (
              <Link href={href(page + 1)} aria-label="Sonraki sayfa">
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            ) : (
              <span>
                <ChevronRight aria-hidden="true" className="size-4" />
              </span>
            )}
          </Button>
        </div>
      ) : null}
    </nav>
  );
}
