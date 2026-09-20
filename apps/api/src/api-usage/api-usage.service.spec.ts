import { ApiUsageService } from './api-usage.service.js';

function createService(prices: Record<string, string> = {}) {
  const prisma = { apiUsage: { create: vi.fn(), groupBy: vi.fn() } };
  const config = {
    get: vi.fn((key: string) => prices[key]),
  };

  const service = new ApiUsageService(
    prisma as unknown as never,
    config as unknown as never,
  );

  return { service, prisma };
}

describe('ApiUsageService', () => {
  describe('pricePerThousand', () => {
    it('.env tanimli degilse varsayilan fiyati kullanir', () => {
      const { service } = createService();

      expect(service.pricePerThousand('TEXT_SEARCH')).toBe(40);
      expect(service.pricePerThousand('PLACE_DETAILS')).toBe(20);
    });

    it('fiyat .env uzerinden gecersiz kilinabilir', () => {
      const { service } = createService({
        GOOGLE_PLACES_PRICE_TEXT_SEARCH: '55.5',
      });

      expect(service.pricePerThousand('TEXT_SEARCH')).toBe(55.5);
    });
  });

  describe('estimateCost', () => {
    it('1000 istek basina fiyati oranlar', () => {
      const { service } = createService();

      expect(service.estimateCost('TEXT_SEARCH', 25)).toBe(1);
      expect(service.estimateCost('PLACE_DETAILS', 1000)).toBe(20);
    });
  });

  describe('record', () => {
    it('saglayici, islem ve tahmini maliyeti kaydeder', async () => {
      const { service, prisma } = createService();

      await service.record({
        provider: 'GOOGLE_PLACES',
        operation: 'TEXT_SEARCH',
        searchId: 'search-1',
      });

      expect(prisma.apiUsage.create).toHaveBeenCalledWith({
        data: {
          provider: 'GOOGLE_PLACES',
          operation: 'TEXT_SEARCH',
          searchId: 'search-1',
          requestCount: 1,
          estimatedCost: 0.04,
        },
      });
    });

    it('kayit hatasi aramayi bozmaz', async () => {
      const { service, prisma } = createService();
      prisma.apiUsage.create.mockRejectedValue(new Error('db down'));

      await expect(
        service.record({ provider: 'GOOGLE_PLACES', operation: 'TEXT_SEARCH' }),
      ).resolves.toBeUndefined();
    });
  });
});
