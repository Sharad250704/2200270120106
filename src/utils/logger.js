
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal'
};

const LOG_SERVER_CONFIG = {
  baseUrl: 'https://api.testserver.com/logs',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000
};

export async function Log(stack, level, module, message, metadata = {}) {
  const timestamp = new Date().toISOString();
  const sessionId = getSessionId();
  
  const logEntry = {
    timestamp,
    sessionId,
    stack,
    level: level.toLowerCase(),
    module,
    message,
    metadata: {
      ...metadata,
      userAgent: navigator?.userAgent || 'unknown',
      url: window?.location?.href || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    }
  };

  if (process.env.NODE_ENV === 'development') {
    logToConsole(logEntry);
  }

  try {
    await sendToTestServer(logEntry);
  } catch (error) {
    console.error('Failed to send log to test server:', error);
    storeLogLocally(logEntry);
  }
}

async function sendToTestServer(logEntry, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOG_SERVER_CONFIG.timeout);

  try {
    const response = await fetch(LOG_SERVER_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getApiKey()}`,
        'X-Client-Version': '1.0.0'
      },
      body: JSON.stringify(logEntry),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (attempt < LOG_SERVER_CONFIG.retryAttempts) {
      await new Promise(resolve => setTimeout(resolve, LOG_SERVER_CONFIG.retryDelay * attempt));
      return sendToTestServer(logEntry, attempt + 1);
    }
    
    throw error;
  }
}

function logToConsole(logEntry) {
  const colors = {
    debug: 'color: #6b7280;',
    info: 'color: #3b82f6;',
    warn: 'color: #f59e0b;',
    error: 'color: #ef4444;',
    fatal: 'color: #dc2626; font-weight: bold;'
  };

  const style = colors[logEntry.level] || '';
  
  console.log(
    `%c[${logEntry.timestamp}] ${logEntry.level.toUpperCase()} [${logEntry.module}] ${logEntry.message}`,
    style,
    logEntry.metadata
  );
}

function storeLogLocally(logEntry) {
  try {
    const storedLogs = JSON.parse(localStorage.getItem('failedLogs') || '[]');
    storedLogs.push(logEntry);
    
    if (storedLogs.length > 100) {
      storedLogs.splice(0, storedLogs.length - 100);
    }
    
    localStorage.setItem('failedLogs', JSON.stringify(storedLogs));
  } catch (error) {
    console.error('Failed to store log locally:', error);
  }
}

function getSessionId() {
  let sessionId = sessionStorage.getItem('logSessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('logSessionId', sessionId);
  }
  return sessionId;
}

function getApiKey() {
  return process.env.REACT_APP_LOG_API_KEY || 'dev-key-123';
}

export const logger = {
  debug: (module, message, metadata) => Log(getStack(), LOG_LEVELS.DEBUG, module, message, metadata),
  info: (module, message, metadata) => Log(getStack(), LOG_LEVELS.INFO, module, message, metadata),
  warn: (module, message, metadata) => Log(getStack(), LOG_LEVELS.WARN, module, message, metadata),
  error: (module, message, metadata) => Log(getStack(), LOG_LEVELS.ERROR, module, message, metadata),
  fatal: (module, message, metadata) => Log(getStack(), LOG_LEVELS.FATAL, module, message, metadata),
  
  performance: (module, operation, duration, metadata) => 
    Log(getStack(), LOG_LEVELS.INFO, module, `Performance: ${operation} completed in ${duration}ms`, {
      operation,
      duration,
      ...metadata
    }),
  
  userAction: (module, action, metadata) => 
    Log(getStack(), LOG_LEVELS.INFO, module, `User Action: ${action}`, {
      action,
      ...metadata
    }),
  
  apiCall: (module, method, url, status, duration, metadata) => 
    Log(getStack(), LOG_LEVELS.INFO, module, `API Call: ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url,
      status,
      duration,
      ...metadata
    })
};

function getStack() {
  const error = new Error();
  const stack = error.stack || '';
  const lines = stack.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('logger.js') || line.includes('Log(')) {
      continue;
    }
    return line.trim();
  }
  
  return 'unknown';
}

class LogBatch {
  constructor() {
    this.logs = [];
    this.flushInterval = 5000;
    this.maxBatchSize = 50;
    this.startBatchTimer();
  }

  add(stack, level, module, message, metadata = {}) {
    this.logs.push({
      timestamp: new Date().toISOString(),
      sessionId: getSessionId(),
      stack,
      level,
      module,
      message,
      metadata
    });

    if (this.logs.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.logs.length === 0) return;

    const batch = [...this.logs];
    this.logs = [];

    try {
      await sendToTestServer({
        type: 'batch',
        logs: batch,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to send batch logs:', error);
      this.logs.unshift(...batch);
    }
  }

  startBatchTimer() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
}

export const batchLogger = new LogBatch();

export function loggedFunction(moduleName, functionName) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const startTime = Date.now();
      
      logger.debug(moduleName, `Function ${functionName} called`, {
        args: args.length,
        function: functionName
      });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.performance(moduleName, functionName, duration, {
          success: true,
          function: functionName
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(moduleName, `Function ${functionName} failed: ${error.message}`, {
          error: error.message,
          stack: error.stack,
          duration,
          function: functionName
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

export function logError(error, context = {}) {
  logger.error('ErrorBoundary', `Uncaught error: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    context
  });
}

export function logPageView(page, metadata = {}) {
  logger.info('Navigation', `Page view: ${page}`, {
    page,
    ...metadata
  });
}

export const LoggerConfig = {
  setServerUrl: (url) => { LOG_SERVER_CONFIG.baseUrl = url; },
  setTimeout: (timeout) => { LOG_SERVER_CONFIG.timeout = timeout; },
  setRetryAttempts: (attempts) => { LOG_SERVER_CONFIG.retryAttempts = attempts; }
};
