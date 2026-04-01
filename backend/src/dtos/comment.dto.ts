import { z } from 'zod';

const idRule = z.coerce.string().trim().min(1, '올바른 ID 값이어야 합니다');

export const boardTypeSchema = z.enum(['NOTICE', 'COMPLAINT'], {
    message: '올바른 게시판 타입이어야 합니다',
});

export const createCommentReqSchema = z.object({
    body: z.object({
        content: z.string().trim().min(1, '내용은 필수입니다').max(1000, '내용은 1000자 이하입니다'),
        boardType: boardTypeSchema,
        boardId: idRule,
    }),
});

export const updateCommentReqSchema = z.object({
    params: z.object({
        commentId: idRule,
    }),
    body: z
        .object({
            content: z.string().trim().min(1, '내용은 필수입니다').max(1000, '내용은 1000자 이하입니다').optional(),
        })
        .refine((data) => Object.keys(data).length > 0, {
            message: '최소 하나 이상의 수정 값이 필요합니다',
        }),
});

export const deleteCommentReqSchema = z.object({
    params: z.object({
        commentId: idRule,
    }),
});

export const getCommentsReqSchema = z.object({
    query: z.object({
        boardType: boardTypeSchema,
        boardId: idRule,
    }),
});
