import * as apartmentRepository from '../repositories/apartment.repository';
import * as authRepository from '../repositories/auth.repository';
import { GetAdminApartmentQueryDTO, GetPublicApartmentQueryDTO } from '../dtos/apartment.dto';
import { NotFoundError } from '../errors/NotFoundError';
import { Apartment } from '../types/apartment.type';

export async function getApartmentsForSignup(data: GetPublicApartmentQueryDTO) {
    const { apartmentsData, apartmentsCount } = await apartmentRepository.getApartmentsForSignup(data.keyword, data.address ?? '', data.name ?? '');
    return {
        apartments: Apartment.fromSummaryEntityList(apartmentsData),
        count: apartmentsCount,
    };
}
export async function getApartmentBasicInfo(apartmentId: string) {
    const apartment = await apartmentRepository.findByApartmentId(apartmentId);
    if (!apartment) throw new NotFoundError('아파트를 찾을 수 없습니다');

    return Apartment.fromPublicEntity(apartment);
}
export async function getApartmentList(data: GetAdminApartmentQueryDTO, userId: string) {
    const { apartmentsData, apartmentsCount } = await apartmentRepository.getApartmentList();
    return {
        apartments: Apartment.fromEntityList(apartmentsData),
        totalCount: apartmentsCount,
    };
}
export async function getApartmentDetails(apartmentId: string, userId: string) {
    const admin = await authRepository.findAdminByAdminId(userId);
    if (!admin) throw new NotFoundError('관리자를 찾을 수 없습니다');
    const apartment = await apartmentRepository.getApartmentDetails(apartmentId);
    if (!apartment) throw new NotFoundError('아파트를 찾을 수 없습니다');
    return Apartment.fromEntity(apartment);
}
