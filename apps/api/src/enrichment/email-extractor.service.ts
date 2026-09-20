import { promises as dns } from 'node:dns';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const EMAIL_PATTERN =
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+/g;

const CONTACT_PATHS = [
  '/iletisim',
  '/iletisim.html',
  '/contact',
  '/contact-us',
  '/hakkimizda',
  '/about',
];

const ASSET_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'svg',
  'css',
  'js',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'pdf',
]);

const BLOCKED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'domain.com',
  'email.com',
  'yourdomain.com',
  'sentry.io',
  'sentry-next.wixpress.com',
  'wixpress.com',
  'godaddy.com',
  'cloudflare.com',
  'wordpress.com',
  'w3.org',
  'schema.org',
  'google.com',
  'gstatic.com',
  'facebook.com',
  'instagram.com',
  'placeholder.com',
]);

const PREFERRED_LOCAL_PARTS = [
  'info',
  'iletisim',
  'contact',
  'satis',
  'sales',
  'destek',
  'support',
  'merhaba',
  'hello',
  'admin',
  'office',
];

const MAX_REDIRECTS = 3;

export interface ExtractedEmail {
  email: string;
  source: string;
}

@Injectable()
export class EmailExtractorService {
  private readonly logger = new Logger(EmailExtractorService.name);
  private readonly timeoutMs: number;
  private readonly maxBytes: number;

  constructor(private readonly config: ConfigService) {
    this.timeoutMs = Number(
      this.config.get<string>('EMAIL_FETCH_TIMEOUT_MS') ?? 8000,
    );
    this.maxBytes = Number(
      this.config.get<string>('EMAIL_MAX_BYTES') ?? 300_000,
    );
  }

  async extractFromWebsite(websiteUrl: string): Promise<ExtractedEmail | null> {
    const homepage = await this.fetchPage(websiteUrl);

    if (!homepage) {
      return null;
    }

    const homepageMatch = this.pickBest(homepage.body, homepage.url);

    if (homepageMatch) {
      return { email: homepageMatch, source: homepage.url };
    }

    const origin = new URL(homepage.url).origin;

    for (const path of CONTACT_PATHS) {
      const page = await this.fetchPage(`${origin}${path}`);

      if (!page) {
        continue;
      }

      const match = this.pickBest(page.body, page.url);

      if (match) {
        return { email: match, source: page.url };
      }
    }

    return null;
  }

  findEmails(html: string): string[] {
    const normalized = html
      .replace(/&#64;|&commat;/gi, '@')
      .replace(/&#46;|&period;/gi, '.')
      .replace(/\s*\[at\]\s*|\s*\(at\)\s*|\s*\{at\}\s*/gi, '@')
      .replace(/\s*\[dot\]\s*|\s*\(dot\)\s*|\s*\{dot\}\s*/gi, '.')
      .replace(/\s*\[nokta\]\s*|\s*\(nokta\)\s*/gi, '.');

    const found = normalized.match(EMAIL_PATTERN) ?? [];
    const unique = new Set<string>();

    for (const candidate of found) {
      const email = candidate.replace(/^[.]+|[.]+$/g, '').toLowerCase();

      if (this.isUsable(email)) {
        unique.add(email);
      }
    }

    return [...unique];
  }

  pickBest(html: string, pageUrl: string): string | null {
    const emails = this.findEmails(html);

    if (emails.length === 0) {
      return null;
    }

    const siteDomain = this.registrableDomain(new URL(pageUrl).hostname);

    return emails
      .map((email) => ({
        email,
        sameDomain:
          this.registrableDomain(email.split('@')[1] ?? '') === siteDomain,
        priority: PREFERRED_LOCAL_PARTS.indexOf(email.split('@')[0] ?? ''),
      }))
      .sort((left, right) => {
        if (left.sameDomain !== right.sameDomain) {
          return left.sameDomain ? -1 : 1;
        }

        const leftPriority =
          left.priority === -1 ? Number.MAX_SAFE_INTEGER : left.priority;
        const rightPriority =
          right.priority === -1 ? Number.MAX_SAFE_INTEGER : right.priority;

        if (leftPriority !== rightPriority) {
          return leftPriority - rightPriority;
        }

        return left.email.length - right.email.length;
      })[0].email;
  }

  private isUsable(email: string): boolean {
    const [localPart, domain] = email.split('@');

    if (!localPart || !domain || !domain.includes('.')) {
      return false;
    }

    const extension = domain.split('.').pop() ?? '';

    if (ASSET_EXTENSIONS.has(extension)) {
      return false;
    }

    if (this.isBlockedDomain(domain)) {
      return false;
    }

    // 2x/3x retina asset referanslari (orn. logo@2x.png)
    if (/^\d+x$/.test(localPart) || localPart.length > 64) {
      return false;
    }

    if (localPart.includes('..') || domain.includes('..')) {
      return false;
    }

    // Uzun hash benzeri yerel kisimlar (versiyonlu asset adlari)
    if (/^[0-9a-f]{16,}$/.test(localPart)) {
      return false;
    }

    if (!/^[a-z0-9]/.test(localPart) || localPart.endsWith('.')) {
      return false;
    }

    return true;
  }

  private registrableDomain(hostname: string): string {
    const labels = hostname.toLowerCase().replace(/\.$/, '').split('.');

    return labels.length <= 2 ? labels.join('.') : labels.slice(-2).join('.');
  }

  private isBlockedDomain(domain: string): boolean {
    for (const blocked of BLOCKED_EMAIL_DOMAINS) {
      if (domain === blocked || domain.endsWith(`.${blocked}`)) {
        return true;
      }
    }

    return false;
  }

  private async fetchPage(
    url: string,
    redirectCount = 0,
  ): Promise<{ body: string; url: string } | null> {
    if (redirectCount > MAX_REDIRECTS) {
      return null;
    }

    let parsed: URL;

    try {
      parsed = new URL(url);
    } catch {
      return null;
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    if (!(await this.isPublicHostname(parsed.hostname))) {
      this.logger.warn(`Ozel/gecersiz adres atlandi: ${parsed.hostname}`);
      return null;
    }

    try {
      const response = await fetch(parsed, {
        redirect: 'manual',
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; FieldLeadBot/0.1; +https://fieldlead.local)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');

        if (!location) {
          return null;
        }

        return this.fetchPage(
          new URL(location, parsed).toString(),
          redirectCount + 1,
        );
      }

      if (!response.ok) {
        return null;
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (!contentType.includes('html') && !contentType.includes('text')) {
        return null;
      }

      const body = await this.readCapped(response);

      return { body, url: parsed.toString() };
    } catch {
      return null;
    }
  }

  private async readCapped(response: Response): Promise<string> {
    const reader = response.body?.getReader();

    if (!reader) {
      return '';
    }

    const chunks: Buffer[] = [];
    let total = 0;

    try {
      while (total < this.maxBytes) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          chunks.push(Buffer.from(value));
          total += value.byteLength;
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }

    return Buffer.concat(chunks).toString('utf8');
  }

  private async isPublicHostname(hostname: string): Promise<boolean> {
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return !this.isPrivateIpv4(hostname);
    }

    if (hostname.includes(':')) {
      return false;
    }

    try {
      const addresses = await dns.lookup(hostname, { all: true });

      if (addresses.length === 0) {
        return false;
      }

      return addresses.every((entry) => !this.isPrivateAddress(entry.address));
    } catch {
      return false;
    }
  }

  private isPrivateAddress(address: string): boolean {
    if (address.includes(':')) {
      const normalized = address.toLowerCase();

      return (
        normalized === '::1' ||
        normalized === '::' ||
        normalized.startsWith('fc') ||
        normalized.startsWith('fd') ||
        normalized.startsWith('fe80') ||
        normalized.startsWith('::ffff:127.') ||
        normalized.startsWith('::ffff:10.') ||
        normalized.startsWith('::ffff:192.168.')
      );
    }

    return this.isPrivateIpv4(address);
  }

  private isPrivateIpv4(address: string): boolean {
    const parts = address.split('.').map(Number);

    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      return true;
    }

    const [first, second] = parts;

    if (first === 0 || first === 10 || first === 127) return true;
    if (first === 100 && second >= 64 && second <= 127) return true;
    if (first === 169 && second === 254) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 192 && second === 0) return true;
    if (first === 198 && (second === 18 || second === 19)) return true;
    if (first >= 224) return true;

    return false;
  }
}
