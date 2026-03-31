import { z } from 'zod';
import { ApprovalStatus, HouseholdType, ResidenceStatus } from '../../generated/prisma';

// 공통 user 검증
const adminUserSchema = z.object({
    id: z.coerce.bigint(),
    apartmentId: z.coerce.bigint(),
    role: z.enum(['ADMIN', 'SUPER_ADMIN']),
});

// 공통 path params
export const residentIdParamSchema = z.object({
    id: z.coerce.bigint(),
});

export const userIdParamSchema = z.object({
    userId: z.coerce.bigint(),
});

/**
 * 목록 조회 query schema
 * API 명세 기준:
 * - page 기본 1
 * - limit 기본 20, 최대 100
 * - building, unitNumber, keyword optional
 * - residenceStatus: RESIDENCE | NO_RESIDENCE
 * - isRegistered: boolean
 */
export const getResidentsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    building: z.string().trim().min(1).optional(),
    unitNumber: z.string().trim().min(1).optional(),
    residenceStatus: z.enum([ResidenceStatus.RESIDENCE, ResidenceStatus.NO_RESIDENCE]).optional(),
    isRegistered: z.preprocess((value) => {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (value === 'true' || value === true) {
            return true;
        }
        if (value === 'false' || value === false) {
            return false;
        }
        return value;
    }, z.boolean().optional()),
    keyword: z.string().trim().min(1).optional(),
});

/**
 * 개별 등록 body schema
 * 기능 요구사항 기준:
 * - 이름, 세대구분, 연락처, 동, 호수 필요
 */
export const createOneResidentBodySchema = z.object({
    building: z.string().trim().min(1, '동을 입력해주세요.'),
    unitNumber: z.string().trim().min(1, '호수를 입력해주세요.'),
    contact: z.string().trim().min(1, '연락처를 입력해주세요.'),
    name: z.string().trim().min(1, '이름을 입력해주세요.'),
    isHouseholder: z.enum([HouseholdType.HOUSEHOLDER, HouseholdType.HOUSEMEMBER]),
});

/**
 * 수정 body schema
 * - 전부 optional
 * - 단, 빈 객체는 허용하지 않음
 */
export const updateResidentBodySchema = z
    .object({
        building: z.string().trim().min(1, '동을 입력해주세요.').optional(),
        unitNumber: z.string().trim().min(1, '호수를 입력해주세요.').optional(),
        contact: z.string().trim().min(1, '연락처를 입력해주세요.').optional(),
        name: z.string().trim().min(1, '이름을 입력해주세요.').optional(),
        isHouseholder: z.enum([HouseholdType.HOUSEHOLDER, HouseholdType.HOUSEMEMBER]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: '수정할 데이터가 없습니다.',
    });

// 요청 단위 schema
export const getResidentsReqSchema = z.object({
    user: adminUserSchema,
    query: getResidentsQuerySchema,
});

export const getResidentDetailReqSchema = z.object({
    user: adminUserSchema,
    params: residentIdParamSchema,
});

export const createOneResidentReqSchema = z.object({
    user: adminUserSchema,
    body: createOneResidentBodySchema,
});

export const updateResidentReqSchema = z.object({
    user: adminUserSchema,
    params: residentIdParamSchema,
    body: updateResidentBodySchema,
});

export const deleteResidentReqSchema = z.object({
    user: adminUserSchema,
    params: residentIdParamSchema,
});

// 응답 DTO
export type ResidentResponseDto = {
    id: string;
    userId?: string;
    building: string;
    unitNumber: string;
    contact: string;
    name: string;
    email?: string;
    residenceStatus: ResidenceStatus;
    isHouseholder: HouseholdType;
    isRegistered: boolean;
    approvalStatus: ApprovalStatus;
};

export type ResidentListResponseDto = {
    residents: ResidentResponseDto[];
    message: string;
    count: number;
    totalCount: number;
};

// infer 타입
export type GetResidentsQueryDto = z.infer<typeof getResidentsQuerySchema>;
export type CreateOneResidentDto = z.infer<typeof createOneResidentBodySchema>;
export type UpdateResidentDto = z.infer<typeof updateResidentBodySchema>;

export type GetResidentsReqDto = z.infer<typeof getResidentsReqSchema>;
export type GetResidentDetailReqDto = z.infer<typeof getResidentDetailReqSchema>;
export type CreateOneResidentReqDto = z.infer<typeof createOneResidentReqSchema>;
export type UpdateResidentReqDto = z.infer<typeof updateResidentReqSchema>;
export type DeleteResidentReqDto = z.infer<typeof deleteResidentReqSchema>;
