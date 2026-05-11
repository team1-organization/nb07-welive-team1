import { GetAdminApartmentQueryDTO, GetPublicApartmentQueryDTO } from '../dtos/apartment.dto';
import { NotFoundError } from '../errors/NotFoundError';
import * as apartmentRepository from '../repositories/apartment.repository';
import * as authRepository from '../repositories/auth.repository';
import { Apartment } from '../types/apartment.type';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { findAnyAdminById } from '../repositories/auth.repository';

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
    const admin = await authRepository.findAnyAdminById(userId);
    if (!admin) throw new UnauthorizedError('관리자 권한이 없습니다.');

    const { apartmentsData, apartmentsCount } = await apartmentRepository.getApartmentList(data);
    return {
        apartments: Apartment.fromEntityList(apartmentsData),
        totalCount: apartmentsCount,
    };
}
export async function getApartmentDetails(apartmentId: string, userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다');
    const apartment = await apartmentRepository.getApartmentDetails(apartmentId);
    if (!apartment) throw new NotFoundError('아파트를 찾을 수 없습니다');
    return Apartment.fromEntity(apartment);
}
