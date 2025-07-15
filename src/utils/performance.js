import { logger } from './logger.js';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.initializeObservers();
  }

  initializeObservers() {
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.logNavigationTiming(entry);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);
      } catch (error) {
        logger.warn('PerformanceMonitor', 'Failed to initialize navigation observer', {
          error: error.message
        });
      }

      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 1000) {
              this.logSlowResource(entry);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);
      } catch (error) {
        logger.warn('PerformanceMonitor', 'Failed to initialize resource observer', {
          error: error.message
        });
      }
    }
  }

  logNavigationTiming(entry) {
    logger.performance('PerformanceMonitor', 'Page Load', entry.loadEventEnd - entry.loadEventStart, {
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      domInteractive: entry.domInteractive - entry.navigationStart,
      firstPaint: entry.loadEventEnd - entry.navigationStart,
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnection: entry.connectEnd - entry.connectStart,
      serverResponse: entry.responseEnd - entry.requestStart,
      pageLoad: entry.loadEventEnd - entry.navigationStart,
      url: entry.name
    });
  }

  logSlowResource(entry) {
    logger.warn('PerformanceMonitor', 'Slow resource detected', {
      url: entry.name,
      duration: entry.duration,
      size: entry.transferSize,
      type: entry.initiatorType,
      startTime: entry.startTime
    });
  }

  startTimer(name) {
    const startTime = performance.now();
    this.metrics.set(name, { startTime });
    
    logger.debug('PerformanceMonitor', `Timer started: ${name}`, {
      startTime,
      timestamp: new Date().toISOString()
    });
  }

  endTimer(name, metadata = {}) {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn('PerformanceMonitor', `Timer '${name}' not found`, {
        availableTimers: Array.from(this.metrics.keys())
      });
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    logger.performance('PerformanceMonitor', name, duration, {
      startTime: metric.startTime,
      endTime,
      ...metadata
    });

    this.metrics.delete(name);
    return duration;
  }

  measureFunction(fn, name, context = {}) {
    return async (...args) => {
      const startTime = performance.now();
      
      try {
        const result = await fn(...args);
        const duration = performance.now() - startTime;
        
        logger.performance('PerformanceMonitor', `Function: ${name}`, duration, {
          success: true,
          argsCount: args.length,
          ...context
        });
        
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        logger.error('PerformanceMonitor', `Function failed: ${name}`, {
          error: error.message,
          duration,
          argsCount: args.length,
          ...context
        });
        
        throw error;
      }
    };
  }

  logMemoryUsage(context = {}) {
    if ('memory' in performance) {
      const memory = performance.memory;
      logger.info('PerformanceMonitor', 'Memory usage snapshot', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString(),
        ...context
      });
    }
  }

  logNetworkInfo() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      logger.info('PerformanceMonitor', 'Network information', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
        timestamp: new Date().toISOString()
      });
    }
  }

  cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const startTimer = (name) => performanceMonitor.startTimer(name);
export const endTimer = (name, metadata) => performanceMonitor.endTimer(name, metadata);
export const measureFunction = (fn, name, context) => performanceMonitor.measureFunction(fn, name, context);
export const logMemoryUsage = (context) => performanceMonitor.logMemoryUsage(context);
export const logNetworkInfo = () => performanceMonitor.logNetworkInfo();

window.addEventListener('beforeunload', () => {
  performanceMonitor.cleanup();
});

window.addEventListener('load', () => {
  setTimeout(() => {
    performanceMonitor.logMemoryUsage({ context: 'initial_load' });
    performanceMonitor.logNetworkInfo();
  }, 1000);
});
