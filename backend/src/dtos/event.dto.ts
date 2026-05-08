import { z } from 'zod';

const bigIntSchema = z.coerce.bigint().positive('올바른 ID 형식이어야 합니다');
const isoDateSchema = z.string().datetime('ISO datetime 형식이어야 합니다');

export const getEventListQuerySchema = z.object({
    apartmentId: z.string().uuid('올바른 아파트 ID 형식이어야 합니다').or(z.string()),
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12),
});

export const upsertEventBodySchema = z
    .object({
        boardType: z.enum(['NOTICE', 'POLL']),
        boardId: bigIntSchema,
        startDate: isoDateSchema,
        endDate: isoDateSchema,
    })
    .refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
        path: ['endDate'],
        message: '종료일은 시작일 이후여야 합니다',
    });

export const eventIdParamSchema = z.object({
    eventId: bigIntSchema,
});

export type GetEventListQueryDto = z.infer<typeof getEventListQuerySchema>;
export type UpsertEventBodyDto = z.infer<typeof upsertEventBodySchema>;
export type EventIdParamDto = z.infer<typeof eventIdParamSchema>;
