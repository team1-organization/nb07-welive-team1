import { z } from 'zod';
import { ComplaintStatus } from '../../generated/prisma';

// 관리자 전용 유저 검증
const adminUserSchema = z.object({
    id: z.string(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']),
    apartmentId: z.string().nullable().optional(),
});

// 일반 입주민 전용 유저 검증
const residentUserSchema = z.object({
    id: z.string(),
    role: z.literal('USER'),
    apartmentId: z.string(),
});

const statusMap: Record<string, ComplaintStatus> = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'PROCESSING',
    RESOLVED: 'COMPLETED',
    REJECTED: 'REJECTED',
};

// 민원 등록 요청 DTO
export const createComplaintReqSchema = z.object({
    user: residentUserSchema,
    body: z.object({
        title: z.string().min(1, '제목을 입력해주세요.').max(100),
        content: z.string().min(1, '내용을 입력해주세요.'),
        isPrivate: z.boolean().default(false),
        apartmentId: z.string(),
    }),
});

// 민원 목록 조회 요청 DTO
export const getComplaintListReqSchema = z.object({
    user: z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SUPER_ADMIN', 'USER']),
        apartmentId: z.string(),
    }),
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().default(10),
        status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED']).optional(),
        keyword: z.string().optional(),
        dong: z.string().optional(),
        ho: z.string().optional(),
        isPublic: z.preprocess((val) => {
            if (val === 'true') return true;
            if (val === 'false') return false;
            return undefined;
        }, z.boolean().optional()),
    }),
});

// 민원 상세 조회 요청 DTO
export const getComplaintDetailReqSchema = z.object({
    user: z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SUPER_ADMIN', 'USER']),
        apartmentId: z.string(),
    }),
    params: z.object({
        complaintId: z.string(),
    }),
});

// 민원 내용 수정 요청 DTO
export const updateComplaintReqSchema = z.object({
    user: residentUserSchema,
    params: z.object({
        complaintId: z.string(),
    }),
    body: z.object({
        title: z.string().min(1).max(100).optional(),
        content: z.string().min(1).optional(),
        isPrivate: z.boolean().optional(),
    }),
});

// 민원 상태 수정 요청 DTO
export const updateComplaintStatusReqSchema = z.object({
    user: adminUserSchema,
    params: z.object({
        complaintId: z.string(),
    }),
    body: z.object({
        status: z.preprocess((val) => {
            if (typeof val !== 'string') return val;
            const upperVal = val.toUpperCase();
            return statusMap[upperVal] || upperVal;
        }, z.nativeEnum(ComplaintStatus)),
    }),
});

// 민원 삭제 요청 DTO
export const deleteComplaintReqSchema = z.object({
    user: z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SUPER_ADMIN', 'USER']),
        apartmentId: z.string(),
    }),
    params: z.object({
        complaintId: z.string(),
    }),
});

export type CreateComplaintReqDto = z.infer<typeof createComplaintReqSchema>;
export type GetComplaintListReqDto = z.infer<typeof getComplaintListReqSchema>;
export type GetComplaintDetailReqDto = z.infer<typeof getComplaintDetailReqSchema>;
export type UpdateComplaintReqDto = z.infer<typeof updateComplaintReqSchema>;
export type UpdateComplaintStatusReqDto = z.infer<typeof updateComplaintStatusReqSchema>;
export type DeleteComplaintReqDto = z.infer<typeof deleteComplaintReqSchema>;
