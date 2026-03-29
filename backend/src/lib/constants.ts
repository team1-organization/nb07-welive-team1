import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const processEnv = z.object({
    // 포트번호
    PORT: z.coerce.number().default(3000),
    // JWT 토큰
    JWT_ACCESS_TOKEN_SECRET: z.string().min(10),
    JWT_REFRESH_TOKEN_SECRET: z.string().min(10),
    ACCESS_TOKEN_COOKIE_NAME: z.string().min(5),
    REFRESH_TOKEN_COOKIE_NAME: z.string().min(5),
    // Google OAuth 추가
    GOOGLE_CLIENT_ID: z.string().min(10),
    GOOGLE_CLIENT_SECRET: z.string().min(10),
    GOOGLE_CALLBACK_URL: z.string().min(6),
});

const env = processEnv.parse(process.env);

export const PORT: number = env.PORT;
export const ACCESS_TOKEN_COOKIE_NAME = env.ACCESS_TOKEN_COOKIE_NAME;
export const REFRESH_TOKEN_COOKIE_NAME = env.REFRESH_TOKEN_COOKIE_NAME;
export const JWT_ACCESS_TOKEN_SECRET = env.JWT_ACCESS_TOKEN_SECRET;
export const JWT_REFRESH_TOKEN_SECRET = env.JWT_REFRESH_TOKEN_SECRET;
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
export const GOOGLE_CALLBACK_URL = env.GOOGLE_CALLBACK_URL;
