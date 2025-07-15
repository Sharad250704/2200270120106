
import logger from './loggingMiddleware';

class UrlService {
  constructor() {
    this.urls = JSON.parse(localStorage.getItem('shortened_urls') || '[]');
    this.clicks = JSON.parse(localStorage.getItem('url_clicks') || '{}');
    logger.info('UrlService initialized', { urlCount: this.urls.length });
  }

  generateShortcode() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  isValidShortcode(shortcode) {
    const regex = /^[a-zA-Z0-9]{3,10}$/;
    return regex.test(shortcode);
  }

  isShortcodeUnique(shortcode) {
    return !this.urls.some(url => url.shortcode === shortcode);
  }

  createShortUrl(originalUrl, customShortcode = null, validityMinutes = 30) {
    logger.info('Creating short URL', { originalUrl, customShortcode, validityMinutes });

    // Validate original URL
    if (!this.isValidUrl(originalUrl)) {
      logger.error('Invalid URL provided', { originalUrl });
      throw new Error('Please provide a valid URL');
    }

    // Handle shortcode
    let shortcode = customShortcode;
    if (customShortcode) {
      if (!this.isValidShortcode(customShortcode)) {
        logger.error('Invalid shortcode format', { customShortcode });
        throw new Error('Shortcode must be 3-10 alphanumeric characters');
      }
      if (!this.isShortcodeUnique(customShortcode)) {
        logger.error('Shortcode already exists', { customShortcode });
        throw new Error('This shortcode is already taken');
      }
    } else {
      // Generate unique shortcode
      do {
        shortcode = this.generateShortcode();
      } while (!this.isShortcodeUnique(shortcode));
    }

    // Calculate expiry
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validityMinutes * 60 * 1000);

    const urlData = {
      id: Date.now() + Math.random(),
      originalUrl,
      shortcode,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      validityMinutes
    };

    this.urls.push(urlData);
    this.clicks[shortcode] = [];
    this.saveToStorage();

    logger.info('Short URL created successfully', { shortcode, originalUrl });
    return {
      ...urlData,
      shortUrl: `http://localhost:3000/${shortcode}`
    };
  }

  getUrlByShortcode(shortcode) {
    const url = this.urls.find(u => u.shortcode === shortcode);
    if (!url) {
      logger.warn('Short URL not found', { shortcode });
      return null;
    }

    // Check if expired
    if (new Date() > new Date(url.expiresAt)) {
      logger.warn('Short URL has expired', { shortcode, expiresAt: url.expiresAt });
      return null;
    }

    return url;
  }

  recordClick(shortcode, source = 'direct', location = 'Unknown') {
    logger.info('Recording click', { shortcode, source, location });
    
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

  getAllUrls() {
    return this.urls.map(url => ({
      ...url,
      shortUrl: `http://localhost:3000/${url.shortcode}`,
      clickCount: this.clicks[url.shortcode]?.length || 0,
      clicks: this.clicks[url.shortcode] || []
    }));
  }

  saveToStorage() {
    localStorage.setItem('shortened_urls', JSON.stringify(this.urls));
    localStorage.setItem('url_clicks', JSON.stringify(this.clicks));
  }
}

export default new UrlService();
