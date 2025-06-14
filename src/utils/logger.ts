import winston from 'winston';
import { Request, Response, NextFunction } from 'express';

// Create custom format for better readability
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: `;
  
  if (typeof message === 'string') {
    msg += message;
  } else {
    msg += JSON.stringify(message);
  }
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata, null, 2)}`;
  }
  
  return msg;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    customFormat
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Mask sensitive data in logs
const maskSensitiveData = (obj: any): any => {
  const maskedFields = ['password', 'token', 'refreshToken', 'authorization', 'credit_card'];
  const masked = { ...obj };

  for (const key in masked) {
    if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    } else if (maskedFields.some(field => key.toLowerCase().includes(field))) {
      masked[key] = '********';
    }
  }

  return masked;
};

// Request logger middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  // Log request
  logger.info({
    message: 'Incoming request',
    requestId,
    method: req.method,
    url: req.originalUrl,
    query: maskSensitiveData(req.query),
    body: maskSensitiveData(req.body),
    headers: maskSensitiveData(req.headers),
    userId: (req as any).user?.userId,
    ip: req.ip
  });

  // Intercept and log response
  const originalSend = res.send;
  res.send = function(body: any): Response {
    const responseBody = body;
    res.send = originalSend;
    
    const duration = Date.now() - start;
    
    // Log response
    const logLevel = res.statusCode >= 400 ? 'error' : 'info';
    logger[logLevel]({
      message: 'Outgoing response',
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      responseBody: maskSensitiveData(
        typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody
      ),
      userId: (req as any).user?.userId
    });

    return originalSend.call(this, body);
  };

  next();
};

// Error logger middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorDetails = {
    message: 'Request error',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      query: maskSensitiveData(req.query),
      body: maskSensitiveData(req.body),
      headers: maskSensitiveData(req.headers),
      userId: (req as any).user?.userId,
      ip: req.ip
    }
  };

  logger.error(errorDetails);
  next(err);
};

// Custom logger methods
const customLogger = {
  ...logger,
  
  // Log database operations
  db: (operation: string, details: any) => {
    logger.info({
      message: 'Database operation',
      operation,
      ...maskSensitiveData(details)
    });
  },

  // Log authentication events
  auth: (event: string, details: any) => {
    logger.info({
      message: 'Authentication event',
      event,
      ...maskSensitiveData(details)
    });
  },

  // Log business operations
  business: (operation: string, details: any) => {
    logger.info({
      message: 'Business operation',
      operation,
      ...maskSensitiveData(details)
    });
  },

  // Log performance metrics
  performance: (metric: string, duration: number, details?: any) => {
    logger.info({
      message: 'Performance metric',
      metric,
      duration: `${duration}ms`,
      ...maskSensitiveData(details)
    });
  }
};

export default customLogger;
