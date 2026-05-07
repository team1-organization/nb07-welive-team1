import { z } from 'zod';

const baseUserSchema = z.object({
    username: z.string().min(4),
    password: z.string().min(4),
    name: z.string().min(2),
    email: z.string().min(4),
    contact: z.string(),
    profileImage: z.string().optional(),
});

export const createUserBody = z.discriminatedUnion('role', [
    baseUserSchema.extend({
        role: z.literal('USER'),
        apartmentName: z.string(),
        apartmentDong: z.string(),
        apartmentHo: z.string(),
        joinStatus: z.literal('PENDING').default('PENDING'),
    }),
    baseUserSchema
        .extend({
            role: z.literal('ADMIN'),
            description: z.string().optional(),
            apartmentName: z.string(),
            apartmentAddress: z.string(),
            apartmentManagementNumber: z.string(),
            startComplexNumber: z.string(),
            endComplexNumber: z.string(),
            startDongNumber: z.string(),
            endDongNumber: z.string(),
            startFloorNumber: z.string(),
            endFloorNumber: z.string(),
            startHoNumber: z.string(),
            endHoNumber: z.string(),
            joinStatus: z.literal('PENDING').default('PENDING'),
        })
        .transform((data) => ({
            ...data,
            complexNumber: `${data.startComplexNumber}~${data.endComplexNumber}`,
            floorNumber: `${data.startFloorNumber}~${data.endFloorNumber}`,
            dongNumber: `${data.startDongNumber}~${data.endDongNumber}`,
            hoNumber: `${data.startHoNumber}~${data.endHoNumber}`,
        })),
    baseUserSchema.extend({
        role: z.literal('SUPER_ADMIN'),
        joinStatus: z.literal('APPROVED').default('APPROVED'),
    }),
]);

export const updateUserBody = baseUserSchema
    .partial()
    .extend({
        currentPassword: z.preprocess(
            (val) => (val === '' ? undefined : val),
            z.string().min(4, '현재 비밀번호는 4자 이상이어야 합니다.').optional(),
        ),
        newPassword: z.preprocess((val) => (val === '' ? undefined : val), z.string().min(4, '새 비밀번호는 4자 이상이어야 합니다.').optional()),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: '수정하려는 데이터가 없습니다.',
    })
    .refine(
        (data) => {
            return !(data.newPassword && !data.currentPassword);
        },
        {
            message: '비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다.',
            path: ['currentPassword'], // 에러 메시지를 표시할 필드 위치
        },
    )
    .transform((data) => {
        return {
            ...data,
        };
    });

export const updateProfileBody = baseUserSchema
    .pick({
        name: true,
        contact: true,
        profileImage: true,
        email: true,
    })
    .extend({
        // 비밀번호 변경 필드 추가
        currentPassword: z.string().optional(),
        newPassword: z.string().optional(),
    })
    .partial()
    .refine((value) => Object.keys(value).length > 0, {
        message: '수정할 정보가 없습니다.',
    });

export const changePasswordBody = z.object({
    currentPassword: z.string().min(4, '현재 비밀번호를 입력해주세요'),
    newPassword: z.string().min(4, '새 비밀번호는 4자 이상이어야 합니다.'),
});

export const loginUserBody = z.object({
    username: z.string().min(4),
    password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.'),
});

export const statusSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

export const updateAdminBody = baseUserSchema.partial().extend({
    description: z.string().optional(),
    apartmentName: z.string().optional(),
    apartmentAddress: z.string().optional(),
    apartmentManagementNumber: z.string().optional(),
});

// 입주민 계정 신청 목록 조회 query
export const getResidentAccountListQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    keyword: z.string().trim().min(1).optional(),
    building: z.string().trim().min(1).optional(),
    unitNumber: z.string().trim().min(1).optional(),
});

// 입주민 계정 수정 body
export const updateResidentAccountBody = z
    .object({
        name: z.string().min(2).optional(),
        email: z.string().min(4).optional(),
        contact: z.string().optional(),
        building: z.string().trim().min(1).nullable().optional(),
        unitNumber: z.string().trim().min(1).nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
        message: '수정할 정보가 없습니다.',
    });

// 입주민 계정 path param
export const residentAccountUserIdParam = z.object({
    userId: z.string().min(1),
});

export type CreateUserDTO = z.infer<typeof createUserBody>;
export type UpdateUserDTO = z.infer<typeof updateUserBody>;
export type LoginUserDTO = z.infer<typeof loginUserBody>;
export type UpdateAdminDTO = z.infer<typeof updateAdminBody>;
export type UpdateProfileDTO = z.infer<typeof updateProfileBody>;
export type ChangePasswordDTO = z.infer<typeof changePasswordBody>;
export type GetResidentAccountListQueryDTO = z.infer<typeof getResidentAccountListQuery>;
export type UpdateResidentAccountDTO = z.infer<typeof updateResidentAccountBody>;
export type ResidentAccountUserIdParamDTO = z.infer<typeof residentAccountUserIdParam>;
