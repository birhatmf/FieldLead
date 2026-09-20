"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

interface ResultsFiltersProps {
  categories: string[];
}

const SORT_OPTIONS = [
  { value: "userRatingCount:desc", label: "Yorum sayısı (çok → az)" },
  { value: "rating:desc", label: "Puan (yüksek → düşük)" },
  { value: "rating:asc", label: "Puan (düşük → yüksek)" },
  { value: "name:asc", label: "İşletme adı (A → Z)" },
  { value: "name:desc", label: "İşletme adı (Z → A)" },
];

const RATING_OPTIONS = ["4.5", "4", "3.5", "3"];

export function ResultsFilters({ categories }: ResultsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("search") ?? "");

  function apply(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === ALL) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const hasFilters =
    searchParams.has("search") ||
    searchParams.has("category") ||
    searchParams.has("minRating") ||
    searchParams.has("hasPhone") ||
    searchParams.has("hasWebsite") ||
    searchParams.has("hasEmail");

  const sortValue = `${searchParams.get("sortBy") ?? "userRatingCount"}:${
    searchParams.get("sortOrder") ?? "desc"
  }`;

  return (
    <section
      aria-label="Sonuç filtreleri"
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-full space-y-2 sm:w-[230px]">
          <Label htmlFor="filter-search">İşletme adı</Label>
          <div className="flex gap-2">
            <Input
              id="filter-search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  apply({ search: text.trim() || null });
                }
              }}
              placeholder="Ara…"
              autoComplete="off"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="İşletme adına göre ara"
              onClick={() => apply({ search: text.trim() || null })}
            >
              <Search aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="w-full space-y-2 sm:w-[200px]">
          <Label htmlFor="filter-category">Kategori</Label>
          <Select
            value={searchParams.get("category") ?? ALL}
            onValueChange={(value) => apply({ category: value })}
          >
            <SelectTrigger id="filter-category">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 sm:w-[140px]">
          <Label htmlFor="filter-rating">Min. puan</Label>
          <Select
            value={searchParams.get("minRating") ?? ALL}
            onValueChange={(value) => apply({ minRating: value })}
          >
            <SelectTrigger id="filter-rating">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              {RATING_OPTIONS.map((rating) => (
                <SelectItem key={rating} value={rating}>
                  {rating} ve üzeri
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 sm:w-[140px]">
          <Label htmlFor="filter-phone">Telefon</Label>
          <Select
            value={searchParams.get("hasPhone") ?? ALL}
            onValueChange={(value) => apply({ hasPhone: value })}
          >
            <SelectTrigger id="filter-phone">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              <SelectItem value="true">Var</SelectItem>
              <SelectItem value="false">Yok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 sm:w-[140px]">
          <Label htmlFor="filter-website">Web sitesi</Label>
          <Select
            value={searchParams.get("hasWebsite") ?? ALL}
            onValueChange={(value) => apply({ hasWebsite: value })}
          >
            <SelectTrigger id="filter-website">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              <SelectItem value="true">Var</SelectItem>
              <SelectItem value="false">Yok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 sm:w-[140px]">
          <Label htmlFor="filter-email">E-posta</Label>
          <Select
            value={searchParams.get("hasEmail") ?? ALL}
            onValueChange={(value) => apply({ hasEmail: value })}
          >
            <SelectTrigger id="filter-email">
              <SelectValue placeholder="Tümü" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tümü</SelectItem>
              <SelectItem value="true">Var</SelectItem>
              <SelectItem value="false">Yok</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full space-y-2 sm:w-[230px]">
          <Label htmlFor="filter-sort">Sıralama</Label>
          <Select
            value={sortValue}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split(":");
              apply({ sortBy, sortOrder });
            }}
          >
            <SelectTrigger id="filter-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            className={cn(!hasFilters && "invisible")}
            onClick={() => {
              setText("");
              router.push(pathname);
            }}
          >
            <X aria-hidden="true" className="size-4" />
            Temizle
          </Button>
        </div>
      </div>
    </section>
  );
}
