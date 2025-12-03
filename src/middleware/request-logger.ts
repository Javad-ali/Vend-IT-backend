import { logger } from '../config/logger.js';
// Simple request logger using existing pino logger
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    // Skip logging for health checks and static assets
    const excludePaths = ['/api/health', '/assets'];
    const shouldSkip = excludePaths.some((path) => req.url?.startsWith(path));
    if (shouldSkip) {
        return next();
    }
    // Log request
    logger.info({
        request: {
            method: req.method,
            url: req.url,
            query: req.query,
            headers: {
                host: req.headers.host,
                'user-agent': req.headers['user-agent']
            },
            remoteAddress: req.socket?.remoteAddress
        }
    }, `${req.method} ${req.url}`);
    // Capture response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;
        logger.info({
            response: {
                statusCode: res.statusCode,
                duration
            }
        }, `${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
        return originalSend.call(this, data);
    };
    next();
};
