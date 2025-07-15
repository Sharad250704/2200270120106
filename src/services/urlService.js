import { logger } from '../utils/logger.js';

class UrlService {
  constructor() {
    this.urls = [];
    this.clicks = {};
    logger.info('URLService', 'URL Service initialized', {
      timestamp: new Date().toISOString()
    });
    this.loadFromStorage();
  }

  loadFromStorage() {
    const startTime = Date.now();
    
    try {
      this.urls = JSON.parse(localStorage.getItem('shortened_urls') || '[]');
      this.clicks = JSON.parse(localStorage.getItem('url_clicks') || '{}');
      
      const duration = Date.now() - startTime;
      logger.info('URLService', 'Successfully loaded data from localStorage', {
        urlCount: this.urls.length,
        clickDataKeys: Object.keys(this.clicks).length,
        duration
      });
    } catch (error) {
      logger.error('URLService', 'Failed to load data from localStorage', {
        error: error.message,
        stack: error.stack
      });
      
      this.urls = [];
      this.clicks = {};
    }
  }

  saveToStorage() {
    const startTime = Date.now();
    
    try {
      localStorage.setItem('shortened_urls', JSON.stringify(this.urls));
      localStorage.setItem('url_clicks', JSON.stringify(this.clicks));
      
      const duration = Date.now() - startTime;
      logger.debug('URLService', 'Data saved to localStorage', {
        urlCount: this.urls.length,
        clickDataKeys: Object.keys(this.clicks).length,
        duration
      });
    } catch (error) {
      logger.error('URLService', 'Failed to save data to localStorage', {
        error: error.message,
        stack: error.stack,
        dataSize: JSON.stringify(this.urls).length + JSON.stringify(this.clicks).length
      });
      throw error;
    }
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
    } catch {
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

  createShortUrl(originalUrl, customShortcode, validityMinutes = 30) {
    const startTime = Date.now();
    
    logger.info('URLService', 'Creating short URL', {
      originalUrl: originalUrl.substring(0, 100),
      hasCustomShortcode: !!customShortcode,
      validityMinutes
    });

    if (!this.isValidUrl(originalUrl)) {
      logger.warn('URLService', 'Invalid URL provided', {
        originalUrl: originalUrl.substring(0, 100),
        reason: 'URL validation failed'
      });
      throw new Error('Please provide a valid URL');
    }

    let shortcode = customShortcode;
    if (customShortcode) {
      if (!this.isValidShortcode(customShortcode)) {
        logger.warn('URLService', 'Invalid custom shortcode provided', {
          shortcode: customShortcode,
          reason: 'Shortcode validation failed'
        });
        throw new Error('Shortcode must be 3-10 alphanumeric characters');
      }
      if (!this.isShortcodeUnique(customShortcode)) {
        logger.warn('URLService', 'Duplicate shortcode attempted', {
          shortcode: customShortcode,
          reason: 'Shortcode already exists'
        });
        throw new Error('This shortcode is already taken');
      }
    } else {
      logger.debug('URLService', 'Generating random shortcode');
      do {
        shortcode = this.generateShortcode();
      } while (!this.isShortcodeUnique(shortcode));
      
      logger.debug('URLService', 'Generated shortcode', {
        shortcode,
        attemptsNeeded: 'unknown'
      });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + validityMinutes * 60 * 1000);

    const urlData = {
      id: Date.now() + Math.random().toString(),
      originalUrl,
      shortcode: shortcode,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      validityMinutes
    };

    this.urls.push(urlData);
    this.clicks[shortcode] = [];
    
    try {
      this.saveToStorage();
      
      const duration = Date.now() - startTime;
      logger.info('URLService', 'Short URL created successfully', {
        shortcode,
        urlId: urlData.id,
        validityMinutes,
        expiresAt: expiresAt.toISOString(),
        duration
      });
      
      return {
        ...urlData,
        shortUrl: `${window.location.origin}/${shortcode}`,
        clickCount: 0,
        clicks: []
      };
    } catch (error) {
      this.urls.pop();
      delete this.clicks[shortcode];
      
      logger.error('URLService', 'Failed to save new URL', {
        shortcode,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  getUrlByShortcode(shortcode) {
    logger.debug('URLService', 'Looking up URL by shortcode', {
      shortcode,
      totalUrls: this.urls.length
    });

    const url = this.urls.find(u => u.shortcode === shortcode);
    if (!url) {
      logger.warn('URLService', 'Shortcode not found', {
        shortcode,
        reason: 'URL not found in database'
      });
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(url.expiresAt);
    
    if (now > expiresAt) {
      logger.warn('URLService', 'URL access attempt for expired shortcode', {
        shortcode,
        expiresAt: url.expiresAt,
        currentTime: now.toISOString(),
        expiredSince: now - expiresAt
      });
      return null;
    }

    logger.info('URLService', 'Valid URL found for shortcode', {
      shortcode,
      urlId: url.id,
      originalUrl: url.originalUrl.substring(0, 100),
      expiresAt: url.expiresAt
    });

    return url;
  }

  recordClick(shortcode, source = 'direct', location = 'Unknown') {
    logger.info('URLService', 'Recording click for shortcode', {
      shortcode,
      source,
      location,
      timestamp: new Date().toISOString()
    });

    if (!this.clicks[shortcode]) {
      logger.warn('URLService', 'Click recorded for unknown shortcode', {
        shortcode,
        source,
        location
      });
      this.clicks[shortcode] = [];
    }

    const clickData = {
      timestamp: new Date().toISOString(),
      source,
      location,
      userAgent: navigator.userAgent
    };

    this.clicks[shortcode].push(clickData);

    try {
      this.saveToStorage();
      
      logger.debug('URLService', 'Click recorded successfully', {
        shortcode,
        totalClicks: this.clicks[shortcode].length,
        source,
        location
      });
    } catch (error) {
      this.clicks[shortcode].pop();
      
      logger.error('URLService', 'Failed to save click data', {
        shortcode,
        source,
        location,
        error: error.message,
        stack: error.stack
      });
      
      throw error;
    }
  }

  getAllUrls() {
    logger.debug('URLService', 'Retrieving all URLs with statistics', {
      totalUrls: this.urls.length,
      totalClickEntries: Object.keys(this.clicks).length
    });

    const urlsWithStats = this.urls.map(url => ({
      ...url,
      shortUrl: `${window.location.origin}/${url.shortcode}`,
      clickCount: this.clicks[url.shortcode]?.length || 0,
      clicks: this.clicks[url.shortcode] || []
    }));

    logger.info('URLService', 'Retrieved URLs with statistics', {
      urlCount: urlsWithStats.length,
      totalClicks: urlsWithStats.reduce((sum, url) => sum + url.clickCount, 0),
      activeUrls: urlsWithStats.filter(url => new Date() <= new Date(url.expiresAt)).length,
      expiredUrls: urlsWithStats.filter(url => new Date() > new Date(url.expiresAt)).length
    });

    return urlsWithStats;
  }
}

export const urlService = new UrlService();
