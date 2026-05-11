import 'dotenv/config';
import { Prisma, PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pkg from 'pg';

const connectionString: string = process.env.DATABASE_URL || '';
const pool = new pkg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const getLogOptions = (): (Prisma.LogLevel | Prisma.LogDefinition)[] => {
    if (process.env.NODE_ENV === 'production') {
        // 운영 환경
        return ['error'] as const;
    } else if (process.env.NODE_ENV === 'test') {
        // 테스트 환경
        return ['error'] as const;
    } else {
        // 개발 환경
        return ['query', 'info', 'warn', 'error'] as const;
    }
};
export const prisma = new PrismaClient({
    adapter,
    log: getLogOptions(),
});
