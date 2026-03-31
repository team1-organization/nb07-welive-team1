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

export const loginUserBody = z.object({
    username: z.string().min(4),
    password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.'),
});

export type CreateUserDTO = z.infer<typeof createUserBody>;
export type UpdateUserDTO = z.infer<typeof updateUserBody>;
export type LoginUserDTO = z.infer<typeof loginUserBody>;
