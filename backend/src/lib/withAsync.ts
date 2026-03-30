import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncHandler = (req: Request, res: Response) => Promise<unknown> | unknown;

export function withAsync(handler: AsyncHandler): RequestHandler {
    return async function (req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await handler(req, res);
        } catch (e) {
            next(e);
        }
    };
}
