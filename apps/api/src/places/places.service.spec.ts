import { PlacesService } from './places.service.js';
import type { GooglePlace } from './places.types.js';

function createService(overrides: { maxPages?: number } = {}) {
  const client = {
    searchText: vi.fn(),
    getPlaceDetails: vi.fn(),
  };
  const apiUsage = { record: vi.fn().mockResolvedValue(undefined) };
  const config = {
    get: vi.fn((key: string) =>
      key === 'PLACES_MAX_PAGES_PER_KEYWORD' && overrides.maxPages !== undefined
        ? String(overrides.maxPages)
        : undefined,
    ),
  };

  const service = new PlacesService(
    client as unknown as never,
    apiUsage as unknown as never,
    config as unknown as never,
  );

  return { service, client, apiUsage };
}

const rawPlace: GooglePlace = {
  id: 'ChIJ_test_1',
  displayName: { text: 'ABC Mobilya' },
  primaryType: 'furniture_store',
  primaryTypeDisplayName: { text: 'Mobilya Mağazası' },
  formattedAddress: 'Kazımdirik, Bornova/İzmir',
  nationalPhoneNumber: '0232 000 00 00',
  websiteUri: 'https://abc-mobilya.example',
  googleMapsUri: 'https://maps.google.com/?cid=1',
  rating: 4.5,
  userRatingCount: 120,
  location: { latitude: 38.46, longitude: 27.21 },
  types: ['furniture_store', 'store'],
  addressComponents: [
    { longText: 'İzmir', types: ['administrative_area_level_1'] },
    { longText: 'Bornova', types: ['administrative_area_level_2'] },
    { shortText: 'TR', longText: 'Türkiye', types: ['country'] },
  ],
};

describe('PlacesService', () => {
  describe('buildQuery', () => {
    it('keyword, ilce ve ili virgulle birlestirir', () => {
      const { service } = createService();
      expect(service.buildQuery('mobilya', 'Bornova', 'İzmir')).toBe(
        'mobilya, Bornova, İzmir',
      );
    });

    it('ulke adi verildiginde sorguya ekler', () => {
      const { service } = createService();
      expect(
        service.buildQuery('mobilya', 'Halep', 'Halep', 'Suriye'),
      ).toBe('mobilya, Halep, Halep, Suriye');
    });
  });

  describe('normalizePlace', () => {
    it('Google yanitini Place alanlarina esler', () => {
      const { service } = createService();
      const place = service.normalizePlace(rawPlace);

      expect(place).toEqual({
        googlePlaceId: 'ChIJ_test_1',
        name: 'ABC Mobilya',
        category: 'Mobilya Mağazası',
        formattedAddress: 'Kazımdirik, Bornova/İzmir',
        phone: '0232 000 00 00',
        email: null,
        website: 'https://abc-mobilya.example',
        googleMapsUrl: 'https://maps.google.com/?cid=1',
        rating: 4.5,
        userRatingCount: 120,
        latitude: 38.46,
        longitude: 27.21,
        city: 'İzmir',
        district: 'Bornova',
        country: 'TR',
        types: ['furniture_store', 'store'],
      });
    });

    it('ulke kodunu ISO alpha-2 olarak cikarir', () => {
      const { service } = createService();
      const place = service.normalizePlace({
        id: 'ChIJ_sy',
        addressComponents: [
          { longText: 'Halep', types: ['administrative_area_level_1'] },
          { shortText: 'SY', longText: 'Suriye', types: ['country'] },
        ],
      });

      expect(place.city).toBe('Halep');
      expect(place.country).toBe('SY');
    });

    it('eksik alanlarda null doner ve types varsayilan olarak bos dizidir', () => {
      const { service } = createService();
      const place = service.normalizePlace({ id: 'ChIJ_minimal' });

      expect(place.googlePlaceId).toBe('ChIJ_minimal');
      expect(place.name).toBe('Isimsiz isletme');
      expect(place.category).toBeNull();
      expect(place.rating).toBeNull();
      expect(place.district).toBeNull();
      expect(place.types).toEqual([]);
    });
  });

  describe('searchPlaces', () => {
    it('sayfalari gezer, ayni googlePlaceId tekrarini eler ve kullanimi kaydeder', async () => {
      const { service, client, apiUsage } = createService();
      client.searchText
        .mockResolvedValueOnce({
          places: [rawPlace],
          nextPageToken: 'page-2',
        })
        .mockResolvedValueOnce({
          places: [rawPlace, { id: 'ChIJ_test_2' }],
        });

      const places = await service.searchPlaces('mobilya, Bornova, İzmir');

      expect(client.searchText).toHaveBeenCalledTimes(2);
      expect(places.map((place) => place.googlePlaceId)).toEqual([
        'ChIJ_test_1',
        'ChIJ_test_2',
      ]);
      expect(apiUsage.record).toHaveBeenCalledTimes(2);
    });

    it('pageToken yoksa ilk sayfada durur', async () => {
      const { service, client } = createService();
      client.searchText.mockResolvedValueOnce({ places: [rawPlace] });

      await service.searchPlaces('mobilya, Bornova, İzmir');

      expect(client.searchText).toHaveBeenCalledTimes(1);
    });

    it('sayfa sayisini yapilandirilmis ust sinirla sinirlar', async () => {
      const { service, client } = createService({ maxPages: 1 });
      client.searchText.mockResolvedValue({
        places: [rawPlace],
        nextPageToken: 'always-more',
      });

      await service.searchPlaces('mobilya, Bornova, İzmir', { maxPages: 3 });

      expect(client.searchText).toHaveBeenCalledTimes(1);
    });
  });
});
