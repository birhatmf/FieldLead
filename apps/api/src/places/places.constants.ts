/*
 * Field mask, Google Places API (New) fiyatlandırma katmanını (SKU) belirler.
 * rating / userRatingCount / websiteUri / telefon alanları "Enterprise"
 * katmanına denk gelir; bu yüzden aşağıdaki liste bilinçli olarak sabittir.
 * Alan eklenirse maliyet de artar.
 */
const SEARCHABLE_PLACE_FIELDS = [
  'id',
  'displayName',
  'primaryType',
  'primaryTypeDisplayName',
  'formattedAddress',
  'nationalPhoneNumber',
  'internationalPhoneNumber',
  'websiteUri',
  'googleMapsUri',
  'rating',
  'userRatingCount',
  'location',
  'types',
  'addressComponents',
] as const;

export const TEXT_SEARCH_FIELD_MASK = SEARCHABLE_PLACE_FIELDS.map(
  (field) => `places.${field}`,
).join(',');

export const PLACE_DETAILS_FIELD_MASK = SEARCHABLE_PLACE_FIELDS.join(',');

export const GOOGLE_PLACES_BASE_URL = 'https://places.googleapis.com/v1';

export const ADDRESS_COMPONENT_CITY = 'administrative_area_level_1';
export const ADDRESS_COMPONENT_DISTRICT = 'administrative_area_level_2';
export const ADDRESS_COMPONENT_COUNTRY = 'country';
