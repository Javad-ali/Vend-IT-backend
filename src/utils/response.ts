// import { Response } from 'express';
// type Payload<T> = {
//   status: number;
//   message?: string;
//   data?: T;
//   meta?: Record<string, unknown>;
// };
// export const sendJson = <T>(res: Response, payload: Payload<T>) =>
//   res.status(payload.status).json({
//     status: payload.status,
//     message: payload.message,
//     data: payload.data,
//     meta: payload.meta
//   });
export class apiError extends Error {
    statusCode: number;
    details: any;
    constructor(statusCode: number, message: string, details: any = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
    toJSON() {
        return {
            status: this.statusCode,
            message: this.message,
            details: this.details
        };
    }
}
export const ok = (data, message = 'OK') => ({
    status: 200,
    message,
    data
});
export const created = (data, message = 'Created') => ({
    status: 201,
    message,
    data
});
