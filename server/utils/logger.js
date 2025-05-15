const winston = require('winston');
const pino = require('pino');
const pinoHttp = require('pino-http');

// Winston logger для общих логов
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  winstonLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Pino logger для HTTP запросов
const pinoLogger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// HTTP logger middleware
const httpLogger = pinoHttp({
  logger: pinoLogger,
  customLogLevel: (req, res, error) => {
    if (res.statusCode >= 400 && !error) return 'warn';
    if (error) return 'error';
    return 'info';
  }
});

/**
 * Утилита для логирования
 */
const logger = {
  info: (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  },
  
  error: (message, error = null, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error ? {
        message: error.message,
        stack: error.stack,
        ...error
      } : null,
      ...data
    };
    console.error(JSON.stringify(logEntry));
  },
  
  warning: (message, data = {}) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      message,
      ...data
    };
    console.warn(JSON.stringify(logEntry));
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'DEBUG',
        message,
        ...data
      };
      console.debug(JSON.stringify(logEntry));
    }
  }
};

module.exports = {
  winstonLogger,
  pinoLogger,
  httpLogger,
  logger
}; 