import './utils/async-wrapper.js';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import nunjucks from 'nunjucks';
import path from 'node:path';
import { createRequire } from 'node:module';
import session from 'express-session';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limit.js';
import { requestLogger } from './middleware/request-logger.js';
import routes from './routes/index.js';
import { getConfig } from './config/env.js';
import { flash } from './middleware/flash.js';
import adminRoutes from './routes/admin.routes.js';
import adminAuthRoutes from './routes/admin.auth.routes.js';
const app = express();
const config = getConfig();
const require = createRequire(import.meta.url);
// Allow Express to honor X-Forwarded-* headers when traffic comes through
// local proxies (ngrok/localhost); still restrict trust to loopback ranges
// so rate limiting cannot be bypassed from arbitrary IPs.
app.set('trust proxy', 'loopback');
let watchTemplates = false;
if (config.nodeEnv === 'development' && process.env.NUNJUCKS_WATCH !== 'false') {
    try {
        require.resolve('chokidar');
        watchTemplates = true;
    }
    catch {
        watchTemplates = false;
    }
}
const nunjucksEnv = nunjucks.configure(path.join(process.cwd(), 'src/views'), {
    autoescape: true,
    express: app,
    watch: watchTemplates
});
nunjucksEnv.addFilter('number', (value, format = 'en-US') => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric))
        return value;
    if (format.includes(',')) {
        const fractionDigits = format.split('.')[1]?.length ?? 0;
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(numeric);
    }
    return new Intl.NumberFormat(format).format(numeric);
});
nunjucksEnv.addFilter('date', (value, format = 'yyyy-MM-dd HH:mm') => {
    if (!value)
        return '';
    const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
    if (!(date instanceof Date) || Number.isNaN(date.getTime()))
        return value;
    const iso = date.toISOString().replace('T', ' ').slice(0, 16);
    if (format === 'YYYY-MM-DD HH:mm' || format === 'yyyy-MM-dd HH:mm') {
        return iso;
    }
    return date.toLocaleString();
});
app.set('view engine', 'njk');
app.set('views', path.join(process.cwd(), 'src/views'));
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));
app.use(rateLimiter);
app.use(compression());
const captureRawBody = (req, _res, buf) => {
    req.rawBody = Buffer.from(buf);
};
app.use(express.json({ limit: '2mb', verify: captureRawBody }));
app.use(express.urlencoded({ extended: true, verify: captureRawBody }));
// Add structured request/response logging
app.use(requestLogger);
app.use(morgan('combined'));
app.use('/assets', express.static(path.join(process.cwd(), 'src/public/Assets')));
app.use(session({
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
        secure: config.nodeEnv === 'production'
    }
}));
app.use(flash);
app.use('/api', routes);
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminRoutes);
app.use(errorHandler);
export default app;
