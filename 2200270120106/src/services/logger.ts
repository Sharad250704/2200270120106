// Logging Middleware Service
export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  data?: any;
  source: string;
}

class LoggingService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  log(level: LogEntry['level'], message: string, data?: any, source: string = 'APP'): void {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level,
      message,
      data,
      source
    };

    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console for development
    const logMethod = level === 'ERROR' ? console.error : 
                     level === 'WARN' ? console.warn : 
                     console.log;
    
    logMethod(`[${level}] ${source}: ${message}`, data || '');
  }

  info(message: string, data?: any, source?: string): void {
    this.log('INFO', message, data, source);
  }

  warn(message: string, data?: any, source?: string): void {
    this.log('WARN', message, data, source);
  }

  error(message: string, data?: any, source?: string): void {
    this.log('ERROR', message, data, source);
  }

  debug(message: string, data?: any, source?: string): void {
    this.log('DEBUG', message, data, source);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const logger = new LoggingService();
