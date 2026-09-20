"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiError } from "@/lib/api";
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountry,
  getDistricts,
  getProvinces,
} from "@/lib/locations";

const MAX_KEYWORDS = 20;

export function SearchForm() {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [enrichEmails, setEnrichEmails] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorFocusToken, setErrorFocusToken] = useState(0);

  const selectedCountry = getCountry(country) ?? COUNTRIES[0];
  const provinces = useMemo(() => getProvinces(country), [country]);
  const districts = useMemo(
    () => getDistricts(country, city),
    [country, city],
  );

  useEffect(() => {
    if (errorFocusToken > 0) {
      errorSummaryRef.current?.focus();
    }
  }, [errorFocusToken]);

  function handleCountryChange(value: string) {
    setCountry(value);
    setCity("");
    setDistrict("");
    setErrors((prev) => ({ ...prev, city: "", district: "" }));
  }

  function handleCityChange(value: string) {
    setCity(value);
    setDistrict("");
    setErrors((prev) => ({ ...prev, city: "", district: "" }));
  }

  function addKeyword(raw: string) {
    const value = raw.trim().replace(/\s+/g, " ");

    if (!value) {
      return;
    }

    if (keywords.length >= MAX_KEYWORDS) {
      setErrors((prev) => ({
        ...prev,
        keywords: `En fazla ${MAX_KEYWORDS} anahtar kelime ekleyebilirsiniz.`,
      }));
      return;
    }

    const exists = keywords.some(
      (keyword) =>
        keyword.toLocaleLowerCase("tr-TR") === value.toLocaleLowerCase("tr-TR"),
    );

    if (exists) {
      setKeywordDraft("");
      return;
    }

    setKeywords((prev) => [...prev, value]);
    setKeywordDraft("");
    setErrors((prev) => ({ ...prev, keywords: "" }));
  }

  function removeKeyword(keyword: string) {
    setKeywords((prev) => prev.filter((item) => item !== keyword));
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!city) {
      nextErrors.city = `${selectedCountry.provinceLabel} seçin.`;
    }

    if (!district) {
      nextErrors.district = `${selectedCountry.districtLabel} seçin.`;
    }

    if (keywords.length === 0) {
      nextErrors.keywords = "En az bir anahtar kelime ekleyin.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setErrorFocusToken((token) => token + 1);
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const search = await api.createSearch({
        country,
        city,
        district,
        keywords,
        enrichEmails,
      });
      router.push(`/search/${search.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof ApiError ? error.message : "Arama başlatılamadı.",
      );
      setSubmitting(false);
    }
  }

  const errorList = Object.entries(errors).filter(([, message]) => message);

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-5"
    >
      {errorList.length > 0 ? (
        <div
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          aria-labelledby="arama-hatalari"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
        >
          <h2
            id="arama-hatalari"
            className="text-sm font-semibold text-foreground"
          >
            Formda eksik alanlar var
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            {errorList.map(([field, message]) => (
              <li key={field}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {submitError ? (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-muted-foreground"
        >
          {submitError}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="country">Ülke</Label>
          <Select
            value={country}
            onValueChange={handleCountryChange}
            disabled={submitting}
          >
            <SelectTrigger id="country">
              <SelectValue placeholder="Ülke seçin" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">{selectedCountry.provinceLabel}</Label>
          <Select
            key={`city-${country}`}
            value={city}
            onValueChange={handleCityChange}
            disabled={submitting}
          >
            <SelectTrigger
              id="city"
              aria-invalid={errors.city ? true : undefined}
              aria-describedby={errors.city ? "city-error" : undefined}
            >
              <SelectValue
                placeholder={`${selectedCountry.provinceLabel} seçin`}
              />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city ? (
            <p id="city-error" className="text-sm text-destructive">
              {errors.city}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">{selectedCountry.districtLabel}</Label>
          <Select
            key={`district-${country}-${city}`}
            value={district}
            onValueChange={(value) => {
              setDistrict(value);
              setErrors((prev) => ({ ...prev, district: "" }));
            }}
            disabled={submitting || !city}
          >
            <SelectTrigger
              id="district"
              aria-invalid={errors.district ? true : undefined}
              aria-describedby={
                errors.district ? "district-error" : "district-hint"
              }
            >
              <SelectValue
                placeholder={
                  city
                    ? `${selectedCountry.districtLabel} seçin`
                    : `Önce ${selectedCountry.provinceLabel.toLocaleLowerCase("tr")} seçin`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {districts.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p id="district-hint" className="text-xs text-muted-foreground">
            {city
              ? `${districts.length} ${selectedCountry.districtLabel.toLocaleLowerCase("tr")} listeleniyor.`
              : `${selectedCountry.districtLabel} listesi ${selectedCountry.provinceLabel.toLocaleLowerCase("tr")} seçildikten sonra açılır.`}
          </p>
          {errors.district ? (
            <p id="district-error" className="text-sm text-destructive">
              {errors.district}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <Label htmlFor="keyword-input">Anahtar kelimeler</Label>
        <div className="flex gap-2">
          <Input
            id="keyword-input"
            value={keywordDraft}
            onChange={(event) => setKeywordDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addKeyword(keywordDraft);
              }
            }}
            placeholder="Örn. bahçe mobilyası"
            autoComplete="off"
            disabled={submitting}
            aria-invalid={errors.keywords ? true : undefined}
            aria-describedby={
              errors.keywords ? "keywords-error" : "keywords-hint"
            }
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addKeyword(keywordDraft)}
            disabled={submitting || keywordDraft.trim().length === 0}
          >
            <Plus aria-hidden="true" className="size-4" />
            Ekle
          </Button>
        </div>
        <p id="keywords-hint" className="text-xs text-muted-foreground">
          Enter veya virgül ile ekleyin. En fazla {MAX_KEYWORDS} anahtar kelime.
        </p>
        {errors.keywords ? (
          <p id="keywords-error" className="text-sm text-destructive">
            {errors.keywords}
          </p>
        ) : null}

        {keywords.length > 0 ? (
          <ul className="flex flex-wrap gap-2 pt-1">
            {keywords.map((keyword) => (
              <li key={keyword}>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary py-1 pr-1 pl-2.5 text-sm font-medium">
                  <span className="whitespace-nowrap">{keyword}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    disabled={submitting}
                    className="flex size-6 cursor-pointer items-center justify-center rounded transition-colors duration-200 hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <X aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">{keyword} kelimesini kaldır</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-secondary/60 p-4">
        <Checkbox
          id="enrich-emails"
          checked={enrichEmails}
          onCheckedChange={(checked) => setEnrichEmails(checked === true)}
          disabled={submitting}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label htmlFor="enrich-emails" className="cursor-pointer">
            Web sitelerinden e-posta topla
          </Label>
          <p className="text-xs text-muted-foreground">
            Google Places e-posta sağlamaz. Bu seçenek açıkken web sitesi olan
            işletmelerin iletişim sayfaları taranır ve bulunan adresler kaydedilir;
            arama birkaç saniye uzayabilir.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Her anahtar kelime için Google Places üzerinde arama yapılır; aynı
          işletme tek kez kaydedilir.
        </p>
        <Button type="submit" disabled={submitting} className="shrink-0">
          {submitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Search aria-hidden="true" className="size-4" />
          )}
          {submitting ? "Araştırılıyor…" : "Araştırmayı başlat"}
        </Button>
      </div>
    </form>
  );
}
