import { z } from 'zod';

export const noticeCategorySchema = z.enum(['MAINTENANCE', 'EMERGENCY', 'COMMUNITY', 'RESIDENT_VOTE', 'RESIDENT_COUNCIL', 'ETC']);

const bigIntSchema = z.coerce.bigint().positive('올바른 ID 형식이어야 합니다');
const isoDateSchema = z.string().datetime('ISO datetime 형식이어야 합니다');

// POST /api/notices
const validateNoticeSchedule = (data: { startDate?: string | null; endDate?: string | null }) => {
    const { startDate, endDate } = data;

    const hasStart = startDate !== undefined;
    const hasEnd = endDate !== undefined;

    if (!hasStart && !hasEnd) return true;
    if (hasStart !== hasEnd) return false;

    if (startDate === null && endDate === null) return true;
    if (startDate === null || endDate === null) return false;
    if (typeof startDate === 'string' && typeof endDate === 'string') {
        return new Date(endDate) >= new Date(startDate);
    }
    return false;
};

export const createNoticeBodySchema = z
    .object({
        category: noticeCategorySchema,
        title: z.string().trim().min(1, '제목은 필수입니다').max(100, '제목은 100자 이하입니다'),
        content: z.string().trim().min(1, '내용은 필수입니다').max(5000, '내용은 5000자 이하입니다'),
        boardId: bigIntSchema,
        isPinned: z.boolean().default(false),
        startDate: isoDateSchema.optional().nullable(),
        endDate: isoDateSchema.optional().nullable(),
    })
    .refine(validateNoticeSchedule, {
        path: ['endDate'],
        message: 'startDate와 endDate는 함께 입력해야 하며 종료일은 시작일 이후여야 합니다',
    });

// GET /api/notices 전체조회
export const getNoticeListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    boardId: z.coerce.bigint().positive('올바른 게시판 ID 형식이어야 합니다'),
    category: noticeCategorySchema.optional(),
    search: z.string().trim().max(100).optional(),
});

// GET /api/notices/:noticeId 상세조회
export const noticeIdParamSchema = z.object({
    noticeId: bigIntSchema,
});

// PATCH /api/notices/:noticeId
const validateUpdateNoticeSchedule = (data: { startDate?: string | null; endDate?: string | null }) => {
    const { startDate, endDate } = data;

    if ((startDate === null) !== (endDate === null)) return false;
    if (typeof startDate === 'string' && typeof endDate === 'string' && new Date(endDate) < new Date(startDate)) {
        return false;
    }
    return true;
};

export const updateNoticeBodySchema = z
    .object({
        category: noticeCategorySchema.optional(),
        title: z.string().trim().min(1, '제목은 비어 있을 수 없습니다').max(100, '제목은 100자 이하입니다').optional(),
        content: z.string().trim().min(1, '내용은 비어 있을 수 없습니다').max(5000, '내용은 5000자 이하입니다').optional(),
        boardId: bigIntSchema.optional(),
        isPinned: z.boolean().optional(),
        startDate: isoDateSchema.optional().nullable(),
        endDate: isoDateSchema.optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: '수정할 필드를 하나 이상 입력해야 합니다',
    })
    .refine(validateUpdateNoticeSchedule, {
        path: ['endDate'],
        message: 'startDate와 endDate는 함께 입력해야 하며 종료일은 시작일 이후여야 합니다',
    });

export type NoticeCategory = z.infer<typeof noticeCategorySchema>;
export type CreateNoticeBodyDto = z.infer<typeof createNoticeBodySchema>;
export type GetNoticeListQueryDto = z.infer<typeof getNoticeListQuerySchema>;
export type NoticeIdParamDto = z.infer<typeof noticeIdParamSchema>;
export type UpdateNoticeBodyDto = z.infer<typeof updateNoticeBodySchema>;
