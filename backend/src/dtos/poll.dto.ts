import { z } from 'zod';

// 관리자 검증
const adminUserSchema = z.object({
    id: z.string(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']),
    apartmentId: z.string(),
});

// 일반 입주민 검증
const residentUserSchema = z.object({
    id: z.string(),
    role: z.literal('USER'),
    apartmentId: z.string(),
});

// 투표 등록 요청 DTO
export const createPollReqSchema = z
    .object({
        user: adminUserSchema,
        body: z.object({
            title: z.string().min(1),
            content: z.string().min(1),
            startDate: z.string().datetime(),
            endDate: z.string().datetime(),
            apartmentId: z.string().uuid(),
            building: z.number().int().nullable().optional(),
            options: z.array(z.object({ title: z.string().min(1) })).min(2),
        }),
    })
    .refine((data) => new Date(data.body.endDate) > new Date(data.body.startDate), {
        message: '종료일은 시작일보다 이후여야 합니다.',
        path: ['body', 'endDate'],
    });

// 투표 목록 조회 요청 DTO
export const getPollListReqSchema = z.object({
    user: z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SUPER_ADMIN', 'USER']),
        apartmentId: z.string(),
    }),
    query: z.object({
        page: z.coerce.number().int().optional().default(1),
        limit: z.coerce.number().int().optional().default(20),
        searchKeyword: z.string().optional().default(''),
        status: z.enum(['PENDING', 'IN_PROGRESS', 'CLOSED']).optional(),
        building: z.coerce.number().int().optional(),
    }),
});

// 투표 상세 조회 요청 DTO
export const getPollDetailReqSchema = z.object({
    user: z.object({
        id: z.string(),
        role: z.enum(['ADMIN', 'SUPER_ADMIN', 'USER']),
        apartmentId: z.string(),
    }),
    params: z.object({
        pollId: z.string().uuid(),
    }),
});

// 투표 수정 요청 DTO
export const updatePollReqSchema = z
    .object({
        user: adminUserSchema,
        params: z.object({
            pollId: z.string().uuid(),
        }),
        body: z.object({
            title: z.string().min(1).optional(),
            content: z.string().min(1).optional(),
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional(),
            building: z.number().int().nullable().optional(),
            options: z
                .array(
                    z.object({
                        id: z.string().uuid(),
                        title: z.string().min(1),
                    }),
                )
                .optional(),
        }),
    })
    .refine(
        (data) => {
            if (data.body.startDate && data.body.endDate) {
                return new Date(data.body.endDate) > new Date(data.body.startDate);
            }
            return true;
        },
        {
            message: '투표 종료일은 시작일보다 이후여야 합니다.',
            path: ['body', 'endDate'],
        },
    );

// 투표 삭제 요청 DTO
export const deletePollReqSchema = z.object({
    user: adminUserSchema,
    params: z.object({
        pollId: z.string().uuid(),
    }),
});

// 투표 제출 요청 DTO
export const votePollReqSchema = z.object({
    user: residentUserSchema,
    params: z.object({
        pollId: z.string().uuid(),
        optionId: z.string().uuid(),
    }),
});

// 투표 취소 요청 DTO
export const cancelVotePollReqSchema = votePollReqSchema;

export type CreatePollReqDto = z.infer<typeof createPollReqSchema>;
export type GetPollListReqDto = z.infer<typeof getPollListReqSchema>;
export type GetPollDetailReqDto = z.infer<typeof getPollDetailReqSchema>;
export type UpdatePollReqDto = z.infer<typeof updatePollReqSchema>;
export type DeletePollReqDto = z.infer<typeof deletePollReqSchema>;
export type VotePollReqDto = z.infer<typeof votePollReqSchema>;
export type CancelVotePollReqDto = z.infer<typeof cancelVotePollReqSchema>;
