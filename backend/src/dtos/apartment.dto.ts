import { z } from 'zod';

// 아파트 검증 스키마
export const apartmentSchema = z.object({
    apartmentName: z.string().min(1, '아파트명은 필수입니다.'),
    apartmentDong: z.string().min(1, '동 정보는 필수입니다.'),
    apartmentHo: z.string().min(1, '호수 정보는 필수입니다.'),
    apartmentManagementNumber: z.string().min(1, '관리소 번호는 필수입니다.'),
    apartmentAddress: z.string().min(1, '주소는 필수입니다.'),
});
