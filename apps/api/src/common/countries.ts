export interface CountryDefinition {
  code: string;
  name: string;
  /** Google Places `regionCode` degeri (CLDR bolge kodu). */
  regionCode: string;
}

export const COUNTRIES: Record<string, CountryDefinition> = {
  TR: { code: 'TR', name: 'Türkiye', regionCode: 'TR' },
  SY: { code: 'SY', name: 'Suriye', regionCode: 'SY' },
};

export const COUNTRY_CODES = Object.keys(COUNTRIES);

export const DEFAULT_COUNTRY = 'TR';

export function getCountry(code?: string | null): CountryDefinition {
  return COUNTRIES[code ?? DEFAULT_COUNTRY] ?? COUNTRIES[DEFAULT_COUNTRY];
}

export function getCountryName(code?: string | null): string {
  const country = code ? COUNTRIES[code] : undefined;

  return country?.name ?? code ?? '';
}
