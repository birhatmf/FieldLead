import { EmailExtractorService } from './email-extractor.service.js';

function createService(): EmailExtractorService {
  const config = { get: vi.fn(() => undefined) };

  return new EmailExtractorService(config as unknown as never);
}

describe('EmailExtractorService', () => {
  describe('findEmails', () => {
    it('html icindeki e-posta adreslerini bulur ve tekilleştirir', () => {
      const service = createService();
      const html = `
        <a href="mailto:Info@ABC-Mobilya.com">Bize yazın</a>
        <p>info@abc-mobilya.com</p>
      `;

      expect(service.findEmails(html)).toEqual(['info@abc-mobilya.com']);
    });

    it('gizlenmis ([at] / [dot]) adresleri cozer', () => {
      const service = createService();
      const html = '<p>satis [at] ornek-firma [dot] com [dot] tr</p>';

      expect(service.findEmails(html)).toEqual(['satis@ornek-firma.com.tr']);
    });

    it('html varliklarini cozer', () => {
      const service = createService();
      const html = '<span>destek&#64;firma&#46;com</span>';

      expect(service.findEmails(html)).toEqual(['destek@firma.com']);
    });

    it('gorsel/varlik uzantili sahte adresleri eler', () => {
      const service = createService();
      const html = `
        <img src="logo@2x.png">
        <link href="main@bundle.css">
        <p>gercek@firma.com</p>
      `;

      expect(service.findEmails(html)).toEqual(['gercek@firma.com']);
    });

    it('bilinen gurultu alan adlarini eler', () => {
      const service = createService();
      const html = `
        <script>window.sentry = "x@o123.ingest.sentry.io";</script>
        <p>image-abc123@sentry-next.wixpress.com</p>
        <p>iletisim@firma.com</p>
      `;

      expect(service.findEmails(html)).toEqual(['iletisim@firma.com']);
    });

    it('e-posta yoksa bos dizi doner', () => {
      const service = createService();

      expect(service.findEmails('<p>Bize ulasin</p>')).toEqual([]);
    });
  });

  describe('pickBest', () => {
    it('site alan adiyla eslesen adresi tercih eder', () => {
      const service = createService();
      const html = '<p>destek@baskasite.com</p><p>info@firmam.com</p>';

      expect(service.pickBest(html, 'https://www.firmam.com/iletisim')).toBe(
        'info@firmam.com',
      );
    });

    it('ayni alan adinda oncelikli yerel kismi secer', () => {
      const service = createService();
      const html = '<p>ahmet@firma.com</p><p>info@firma.com</p>';

      expect(service.pickBest(html, 'https://firma.com')).toBe(
        'info@firma.com',
      );
    });

    it('eslesme yoksa ilk gecerli adresi doner', () => {
      const service = createService();

      expect(service.pickBest('<p>a@x.com</p>', 'https://firma.com')).toBe(
        'a@x.com',
      );
    });
  });

  describe('extractFromWebsite', () => {
    it('gecersiz url icin null doner', async () => {
      const service = createService();

      expect(await service.extractFromWebsite('not-a-url')).toBeNull();
    });

    it('http disi protokolleri reddeder', async () => {
      const service = createService();

      expect(await service.extractFromWebsite('file:///etc/passwd')).toBeNull();
    });

    it('ozel/yerel adresleri reddeder (SSRF korumasi)', async () => {
      const service = createService();

      expect(await service.extractFromWebsite('http://127.0.0.1/')).toBeNull();
      expect(
        await service.extractFromWebsite('http://192.168.1.10/iletisim'),
      ).toBeNull();
      expect(
        await service.extractFromWebsite('http://169.254.169.254/latest/meta-data'),
      ).toBeNull();
    });
  });
});
