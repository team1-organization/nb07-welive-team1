import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma';
import { CustomError } from './CustomError';

interface HttpError extends Error {
    statusCode: number;
    message: string;
}

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
    P2002: { status: 409, message: '이미 존재하는 데이터입니다.' },
    P2025: { status: 404, message: '해당 데이터를 찾을 수 없습니다.' },
    P2003: { status: 400, message: '외래 키 제약 조건 위반입니다.' },
};

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
    console.error(`[Error] ${req.method} ${req.url}`, err);
    let statusCode = 500;
    let message = '서버 내부 오류가 발생했습니다.';
    const stack = process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined;

    if (err instanceof ZodError) {
        res.status(400).json({
            message: '입력값이 유효하지 않습니다.',
            errors: err.issues,
            stack,
        });
        return;
    }

    if (err instanceof CustomError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const errorData = PRISMA_ERROR_MAP[err.code];
        statusCode = errorData?.status || 500;
        message = errorData?.message || `[${err.code}] 데이터베이스 오류가 발생했습니다`;
    } else if (err instanceof Error) {
        const error = err as HttpError;
        statusCode = error.statusCode || 500;
        message = error.message;

        if (err.name === 'AuthenticationError') statusCode = 401;
        if (err.message.includes('JSON')) {
            statusCode = 400;
            message = '잘못된 JSON 형식입니다.';
        }
        if (statusCode === 400 && message === 'Bad Request') {
            message = '잘못된 요청입니다';
        }
    }

    // 위에서 감지되지 않은 오류
    res.status(statusCode).json({
        message,
        stack,
    });
}
