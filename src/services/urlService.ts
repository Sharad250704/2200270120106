
export interface UrlData {
  id: string;
  originalUrl: string;
  shortcode: string;
  createdAt: string;
  expiresAt: string;
  validityMinutes: number;
}

export interface ClickData {
  timestamp: string;
  source: string;
  location: string;
  userAgent: string;
}

export interface UrlWithStats extends UrlData {
  shortUrl: string;
  clickCount: number;
  clicks: ClickData[];
}

class UrlService {
  private urls: UrlData[] = [];
  private clicks: Record<string, ClickData[]> = {};

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    this.urls = JSON.parse(localStorage.getItem('shortened_urls') || '[]');
    this.clicks = JSON.parse(localStorage.getItem('url_clicks') || '{}');
  }

  private saveToStorage() {
    localStorage.setItem('shortened_urls', JSON.stringify(this.urls));
    localStorage.setItem('url_clicks', JSON.stringify(this.clicks));
  }

  private generateShortcode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  isValidShortcode(shortcode: string): boolean {
    const regex = /^[a-zA-Z0-9]{3,10}$/;
    return regex.test(shortcode);
  }

  private isShortcodeUnique(shortcode: string): boolean {
    return !this.urls.some(url => url.shortcode === shortcode);
  }

  createShortUrl(originalUrl: string, customShortcode?: string, validityMinutes: number = 30): UrlWithStats {
    if (!this.isValidUrl(originalUrl)) {
      throw new Error('Please provide a valid URL');
    }

    let shortcode = customShortcode;
    if (customShortcode) {
      if (!this.isValidShortcode(customShortcode)) {
        throw new Error('Shortcode must be 3-10 alphanumeric characters');
      }
      if (!this.isShortcodeUnique(customShortcode)) {
        throw new Error('This shortcode is already taken');
      }
    } else {
      do {
        shortcode = this.generateShortcode();
      } while (!this.isShortcodeUnique(shortcode));
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validityMinutes * 60 * 1000);

    const urlData: UrlData = {
      id: Date.now() + Math.random().toString(),
      originalUrl,
      shortcode: shortcode!,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      validityMinutes
    };

    this.urls.push(urlData);
    this.clicks[shortcode!] = [];
    this.saveToStorage();

    return {
      ...urlData,
      shortUrl: `${window.location.origin}/${shortcode}`,
      clickCount: 0,
      clicks: []
    };
  }

  getUrlByShortcode(shortcode: string): UrlData | null {
    const url = this.urls.find(u => u.shortcode === shortcode);
    if (!url) return null;

    if (new Date() > new Date(url.expiresAt)) {
      return null;
    }

    return url;
  }

  recordClick(shortcode: string, source: string = 'direct', location: string = 'Unknown') {
    if (!this.clicks[shortcode]) {
      this.clicks[shortcode] = [];
    }

    this.clicks[shortcode].push({
      timestamp: new Date().toISOString(),
      source,
      location,
      userAgent: navigator.userAgent
    });

    this.saveToStorage();
  }

  getAllUrls(): UrlWithStats[] {
    return this.urls.map(url => ({
      ...url,
      shortUrl: `${window.location.origin}/${url.shortcode}`,
      clickCount: this.clicks[url.shortcode]?.length || 0,
      clicks: this.clicks[url.shortcode] || []
    }));
  }
}

export const urlService = new UrlService();
