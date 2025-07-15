import { logger } from './logger';

export interface ShortenedUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  customShortCode?: string;
  createdAt: Date;
  expiresAt: Date;
  validityMinutes: number;
  clicks: ClickData[];
  isExpired: boolean;
}

export interface ClickData {
  id: string;
  timestamp: Date;
  source: string;
  location: string;
  userAgent: string;
}

export interface ShortenUrlRequest {
  originalUrl: string;
  validityMinutes?: number;
  customShortCode?: string;
}

class UrlShortenerService {
  private urls: Map<string, ShortenedUrl> = new Map();
  private shortCodes: Set<string> = new Set();

  constructor() {
    this.loadFromStorage();
    logger.info('UrlShortenerService initialized', null, 'URL_SERVICE');
  }

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateUniqueShortCode(): string {
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = this.generateShortCode();
      attempts++;
      if (attempts > 100) {
        throw new Error('Unable to generate unique short code');
      }
    } while (this.shortCodes.has(shortCode));
    
    return shortCode;
  }

  private validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private validateShortCode(shortCode: string): boolean {
    return /^[a-zA-Z0-9]{3,12}$/.test(shortCode);
  }

  private saveToStorage(): void {
    try {
      const data = Array.from(this.urls.values()).map(url => ({
        ...url,
        createdAt: url.createdAt.toISOString(),
        expiresAt: url.expiresAt.toISOString(),
        clicks: url.clicks.map(click => ({
          ...click,
          timestamp: click.timestamp.toISOString()
        }))
      }));
      localStorage.setItem('shortened_urls', JSON.stringify(data));
      logger.debug('Data saved to localStorage', { count: data.length }, 'URL_SERVICE');
    } catch (error) {
      logger.error('Failed to save data to localStorage', error, 'URL_SERVICE');
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('shortened_urls');
      if (data) {
        const urls = JSON.parse(data);
        urls.forEach((urlData: any) => {
          const url: ShortenedUrl = {
            ...urlData,
            createdAt: new Date(urlData.createdAt),
            expiresAt: new Date(urlData.expiresAt),
            clicks: urlData.clicks.map((click: any) => ({
              ...click,
              timestamp: new Date(click.timestamp)
            }))
          };
          url.isExpired = new Date() > url.expiresAt;
          this.urls.set(url.shortCode, url);
          this.shortCodes.add(url.shortCode);
        });
        logger.info('Data loaded from localStorage', { count: urls.length }, 'URL_SERVICE');
      }
    } catch (error) {
      logger.error('Failed to load data from localStorage', error, 'URL_SERVICE');
    }
  }

  shortenUrl(request: ShortenUrlRequest): ShortenedUrl {
    logger.info('Shortening URL request', request, 'URL_SERVICE');

    // Validate original URL
    if (!this.validateUrl(request.originalUrl)) {
      const error = 'Invalid URL format';
      logger.error(error, request, 'URL_SERVICE');
      throw new Error(error);
    }

    // Set default validity
    const validityMinutes = request.validityMinutes || 30;
    if (validityMinutes <= 0 || !Number.isInteger(validityMinutes)) {
      const error = 'Validity must be a positive integer';
      logger.error(error, request, 'URL_SERVICE');
      throw new Error(error);
    }

    // Handle custom short code
    let shortCode: string;
    if (request.customShortCode) {
      if (!this.validateShortCode(request.customShortCode)) {
        const error = 'Custom short code must be 3-12 alphanumeric characters';
        logger.error(error, request, 'URL_SERVICE');
        throw new Error(error);
      }
      if (this.shortCodes.has(request.customShortCode)) {
        const error = 'Custom short code already exists';
        logger.error(error, request, 'URL_SERVICE');
        throw new Error(error);
      }
      shortCode = request.customShortCode;
    } else {
      shortCode = this.generateUniqueShortCode();
    }

    // Create shortened URL
    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);
    
    const shortenedUrl: ShortenedUrl = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      originalUrl: request.originalUrl,
      shortCode,
      customShortCode: request.customShortCode,
      createdAt: now,
      expiresAt,
      validityMinutes,
      clicks: [],
      isExpired: false
    };

    this.urls.set(shortCode, shortenedUrl);
    this.shortCodes.add(shortCode);
    this.saveToStorage();

    logger.info('URL shortened successfully', { shortCode, originalUrl: request.originalUrl }, 'URL_SERVICE');
    return shortenedUrl;
  }

  getUrl(shortCode: string): ShortenedUrl | null {
    const url = this.urls.get(shortCode);
    if (!url) {
      logger.warn('Short code not found', { shortCode }, 'URL_SERVICE');
      return null;
    }

    // Check if expired
    if (new Date() > url.expiresAt) {
      url.isExpired = true;
      this.saveToStorage();
      logger.warn('URL has expired', { shortCode }, 'URL_SERVICE');
      return url;
    }

    return url;
  }

  recordClick(shortCode: string, source: string = 'direct'): boolean {
    const url = this.getUrl(shortCode);
    if (!url || url.isExpired) {
      logger.warn('Cannot record click for expired or missing URL', { shortCode }, 'URL_SERVICE');
      return false;
    }

    const click: ClickData = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      timestamp: new Date(),
      source,
      location: this.getLocationFromIP(),
      userAgent: navigator.userAgent || 'Unknown'
    };

    url.clicks.push(click);
    this.saveToStorage();

    logger.info('Click recorded', { shortCode, source }, 'URL_SERVICE');
    return true;
  }

  private getLocationFromIP(): string {
    // Simulate location detection (in real app, would use IP geolocation service)
    const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Sydney, AU', 'Berlin, DE'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getAllUrls(): ShortenedUrl[] {
    const urls = Array.from(this.urls.values());
    
    // Update expired status
    urls.forEach(url => {
      if (new Date() > url.expiresAt && !url.isExpired) {
        url.isExpired = true;
      }
    });

    // Sort by creation date (newest first)
    return urls.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteUrl(shortCode: string): boolean {
    if (this.urls.has(shortCode)) {
      this.urls.delete(shortCode);
      this.shortCodes.delete(shortCode);
      this.saveToStorage();
      logger.info('URL deleted', { shortCode }, 'URL_SERVICE');
      return true;
    }
    logger.warn('URL not found for deletion', { shortCode }, 'URL_SERVICE');
    return false;
  }

  getStats(): { total: number; active: number; expired: number; totalClicks: number } {
    const urls = Array.from(this.urls.values());
    const total = urls.length;
    const expired = urls.filter(url => url.isExpired || new Date() > url.expiresAt).length;
    const active = total - expired;
    const totalClicks = urls.reduce((sum, url) => sum + url.clicks.length, 0);

    return { total, active, expired, totalClicks };
  }
}

export const urlShortenerService = new UrlShortenerService();