import { z } from 'zod';

export const bigIntSchema = z.coerce.bigint().positive('올바른 ID 형식이어야 합니다');

const authUserSchema = z.object({
    id: z.coerce.bigint().positive('올바른 사용자 ID 형식이어야 합니다'),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
});

export const createCommentReqSchema = z.object({
    user: authUserSchema,
    body: z.object({
        content: z.string().trim().min(1, '댓글 내용을 입력해주세요.').max(1000),
        boardType: z.enum(['COMPLAINT', 'NOTICE'], {
            message: '댓글은 민원(COMPLAINT) 또는 공지사항(NOTICE)에만 작성할 수 있습니다.',
        }),
        boardId: bigIntSchema,
    }),
});

export const updateCommentReqSchema = z.object({
    user: authUserSchema,
    params: z.object({
        commentId: bigIntSchema,
    }),
    body: z.object({
        content: z.string().trim().min(1, '수정할 내용을 입력해주세요.').max(1000),
    }),
});

export const deleteCommentReqSchema = z.object({
    user: authUserSchema,
    params: z.object({
        commentId: bigIntSchema,
    }),
});

export type CreateCommentReqDto = z.infer<typeof createCommentReqSchema>;
export type UpdateCommentReqDto = z.infer<typeof updateCommentReqSchema>;
export type DeleteCommentReqDto = z.infer<typeof deleteCommentReqSchema>;
