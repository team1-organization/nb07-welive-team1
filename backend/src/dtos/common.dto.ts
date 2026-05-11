import { z } from 'zod';

// 기본 ID 규칙
// 최소 1자 이상 빈 문자열 허용하지 않음
// 아이디 값 전달시 BigInt -> String으로 변환하는 기능
const idRule = z.coerce.string().min(1);
export const commonIdParam = z
    .object({
        userId: idRule,
        apartmentId: idRule,
        residentId: idRule,
        noticeId: idRule,
        pollId: idRule,
        pollOptionId: idRule,
        voteId: idRule,
        complaintId: idRule,
        commentId: idRule,
        notificationId: idRule,
        adminId: idRule,
    })
    .partial();

export const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export type PagedResponse<T> = {
    data: T[];
    total: number;
};
