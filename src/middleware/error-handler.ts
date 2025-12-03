// import type { NextFunction, Request, Response } from 'express';
// import createError from 'http-errors';
// import { logger } from '@config/logger.js';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { apiError } from '../utils/response.js';
export const errorHandler = (err, _req, res, _next) => {
    logger.error({ err }, 'Unhandled error');
    if (err instanceof apiError) {
        return res.status(err.statusCode).json(err.toJSON());
    }
    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 400,
            message: 'Validation failed',
            errors: err.issues
        });
    }
    return res.status(500).json({ status: 500, message: 'Internal server error' });
};
