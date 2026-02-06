import winston from 'winston';
import config from '../config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    msg += `\n${stack}`;
  }
  return msg;
});

// Create the logger
const logger = winston.createLogger({
  level: config.logLevel,
  defaultMeta: { 
    service: 'megabrain-backend',
    env: config.nodeEnv,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp(),
        errors({ stack: true }),
        consoleFormat
      ),
    }),
  ],
});

// Add file transports in production
if (config.nodeEnv === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: combine(
      timestamp(),
      errors({ stack: true }),
      winston.format.json()
    ),
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: combine(
      timestamp(),
      winston.format.json()
    ),
  }));
}

// Stream for Morgan HTTP logging
export const httpLogStream = {
  write: (message: string): void => {
    logger.info(message.trim(), { source: 'http' });
  },
};

export default logger;
