export interface GooglePlaceDisplayName {
  text: string;
  languageCode?: string;
}

export interface GoogleAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
  languageCode?: string;
}

export interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

export interface GooglePlace {
  id: string;
  displayName?: GooglePlaceDisplayName;
  primaryType?: string;
  primaryTypeDisplayName?: GooglePlaceDisplayName;
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  location?: GooglePlaceLocation;
  types?: string[];
  addressComponents?: GoogleAddressComponent[];
}

export interface GoogleTextSearchResponse {
  places?: GooglePlace[];
  nextPageToken?: string;
}

export interface NormalizedPlace {
  googlePlaceId: string;
  name: string;
  category: string | null;
  formattedAddress: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  googleMapsUrl: string | null;
  rating: number | null;
  userRatingCount: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  district: string | null;
  country: string | null;
  types: string[];
}
