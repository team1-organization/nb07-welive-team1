import { z } from 'zod';

const baseApartmentSchema = z.object({
    apartmentName: z.string().trim().min(1, '아파트 이름은 필수입니다'),
    apartmentAddress: z.string().trim().min(1, '아파트 주소는 필수입니다'),
    apartmentManagementNumber: z.string().trim().min(1, '관리소 번호는 필수입니다'),
    apartmentDong: z.string().trim().default('전체'),
    apartmentHo: z.string().trim().default('전체'),
    description: z.string().trim().max(500, '설명은 500자 이하로 작성해주세요').optional().nullable(),
    startComplexNumber: z.string(),
    endComplexNumber: z.string(),
    startDongNumber: z.string(),
    endDongNumber: z.string(),
    startFloorNumber: z.string(),
    endFloorNumber: z.string(),
    startHoNumber: z.string(),
    endHoNumber: z.string(),
});

export const createApartmentBody = baseApartmentSchema.transform((data) => {
    return {
        apartmentName: data.apartmentName,
        apartmentAddress: data.apartmentAddress,
        apartmentManagementNumber: data.apartmentManagementNumber,
        apartmentDong: data.apartmentDong,
        apartmentHo: data.apartmentHo,
        description: data.description,
        complexNumber: `${data.startComplexNumber}~${data.endComplexNumber}`,
        dongNumber: `${data.startDongNumber}~${data.endDongNumber}`,
        floorNumber: `${data.startFloorNumber}~${data.endFloorNumber}`,
        hoNumber: `${data.startHoNumber}~${data.endHoNumber}`,
    };
});
export const updateApartmentBody = baseApartmentSchema.partial();

export type CreateApartmentDTO = z.infer<typeof createApartmentBody>;
export type UpdateApartmentDTO = z.infer<typeof updateApartmentBody>;
