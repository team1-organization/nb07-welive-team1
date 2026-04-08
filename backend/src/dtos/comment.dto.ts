import { z } from 'zod';

export const bigIntSchema = z.coerce.bigint().positive('올바른 ID 형식이어야 합니다');
export const isoDateSchema = z.string().datetime('ISO datetime 형식이어야 합니다');

//댓글 생성 (POST)
export const CreateCommentDto = z.object({
    content: z.string().min(1, '댓글 내용을 입력해주세요.').max(1000),

    boardType: z.enum(['COMPLAINT', 'NOTICE'], '댓글은 민원(COMPLAINT) 또는 공지사항(NOTICE)에만 작성할 수 있습니다.'),
    boardId: bigIntSchema,
});

//댓글 수정 (PATCH)
export const UpdateCommentDto = z.object({
    content: z.string().min(1, '수정할 내용을 입력해주세요.').max(1000),
});

//댓글 삭제 (DELETE)
export const DeleteCommentParamSchema = z.object({
    commentId: bigIntSchema,
});

export type CreateCommentInput = z.infer<typeof CreateCommentDto>;
export type UpdateCommentInput = z.infer<typeof UpdateCommentDto>;
