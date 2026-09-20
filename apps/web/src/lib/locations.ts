import syLocations from "@/data/sy-locations.json";
import trLocations from "@/data/tr-locations.json";

export interface Country {
  code: string;
  name: string;
  provinceLabel: string;
  districtLabel: string;
  subdivisions: Record<string, string[]>;
}

export const COUNTRIES: Country[] = [
  {
    code: "TR",
    name: "Türkiye",
    provinceLabel: "İl",
    districtLabel: "İlçe",
    subdivisions: trLocations,
  },
  {
    code: "SY",
    name: "Suriye",
    provinceLabel: "İl",
    districtLabel: "İlçe",
    subdivisions: syLocations,
  },
];

export const DEFAULT_COUNTRY_CODE = "TR";

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

export function getCountryName(code: string): string {
  return getCountry(code)?.name ?? code;
}

export function getProvinces(code: string): string[] {
  return Object.keys(getCountry(code)?.subdivisions ?? {});
}

export function getDistricts(code: string, province: string): string[] {
  return getCountry(code)?.subdivisions[province] ?? [];
}
