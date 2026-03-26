import { z } from 'zod';

export const baseUserBody = z.object({
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
  password: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().min(4, '비밀번호는 4자 이상이어야 합니다.').optional(),
  ),
  profileImage: z.string().optional().nullable(),
  provider: z.enum(['LOCAL', 'GOOGLE', 'KAKAO', 'FACEBOOK', 'NAVER']).default('LOCAL'),
  providerId: z.string().optional(),
});

export const createUserBody = baseUserBody.transform((data) => {
  return {
    ...data,
  };
});

export const updateUserBody = baseUserBody
  .partial()
  .extend({
    currentPassword: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().min(4, '현재 비밀번호는 4자 이상이어야 합니다.').optional(),
    ),
    newPassword: z.preprocess(
      (val) => (val === '' ? undefined : val),
      z.string().min(4, '새 비밀번호는 4자 이상이어야 합니다.').optional(),
    ),
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
  email: z.email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(4, '비밀번호는 4자 이상이어야 합니다.'),
});

export type createUserDTO = z.infer<typeof createUserBody>;
export type updateUserDTO = z.infer<typeof updateUserBody>;
export type loginUserDTO = z.infer<typeof loginUserBody>;
