// Logging Middleware - Pre-Test Setup Component
class LoggingService {
  constructor() {
    this.logs = [];
    this.isEnabled = true;
  }

  log(level, message, data = null) {
    if (!this.isEnabled) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data,
      id: Date.now() + Math.random()
    };
    
    this.logs.push(logEntry);
    
    // Also log to console for development
    console[level] ? console[level](message, data) : console.log(message, data);
    
    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Create singleton instance
const logger = new LoggingService();

export default logger;
