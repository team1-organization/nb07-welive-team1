import { generateTokens } from '../lib/token';
import { CreateUserDTO, UpdateAdminDTO, UpdateUserDTO } from '../dtos/auth.dto';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../errors/BadRequestError';
import { User } from '../types/auth.type';
import * as authRepository from '../repositories/auth.repository';
import * as residentRepository from '../repositories/resident.repository';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { safeString } from '../utils/string.util';
import { findByApartmentName } from '../repositories/apartment.repository';

// [모든 사용자] 로그인
export function login(userId: string) {
    const { accessToken, refreshToken } = generateTokens(userId);
    return { accessToken, refreshToken };
}

// 회원가입
export async function register(data: CreateUserDTO) {
    const existedUserId = await authRepository.findUserByUserId(data.username);
    if (existedUserId) throw new BadRequestError('이미 사용중인 아이디입니다.');
    const existedUserEmail = await authRepository.findUserByEmail(data.email);
    if (existedUserEmail) throw new BadRequestError('이미 가입된 이메일입니다.');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let newUser = null;
    if (data.role === 'SUPER_ADMIN') {
        // [슈퍼관리자] 회원가입
        newUser = await authRepository.createSuperAdmin({
            ...data,
            password: hashedPassword,
        });
    } else if (data.role === 'ADMIN') {
        // [관리자] 회원가입
        const apartmentCheck = await findByApartmentName(data.apartmentName);
        if (apartmentCheck) throw new BadRequestError('이미 등록되어 있는 아파트명 입니다');
        newUser = await authRepository.createAdmin({
            ...data,
            password: hashedPassword,
        });
    } else {
        // [유저] 회원가입
        const apartmentCheck = await findByApartmentName(data.apartmentName);
        if (!apartmentCheck) throw new BadRequestError('아파트를 찾을 수 없습니다.');
        newUser = await authRepository.createUser(
            {
                ...data,
                password: hashedPassword,
            },
            apartmentCheck.id,
        );
    }
    return User.fromEntity(newUser);
}
// [슈퍼관리자] 관리자 가입 상태 변경(단건)
export async function updateAdminStatus({
    adminId,
    userId,
    status,
}: {
    adminId: string;
    userId: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}) {
    const superAdmin = await authRepository.findSuperAdminByUserId(userId);
    if (!superAdmin) throw new ForbiddenError('슈퍼 관리자만 변경 가능합니다');
    const admin = await authRepository.findUserByAdminId(adminId);
    if (!admin) throw new BadRequestError('해당 관리자를 찾을 수 없습니다');
    const updatedData = await authRepository.updateAdminStatus({ adminId, status });
    return User.fromEntity(updatedData);
}
// [슈퍼관리자] 관리자 가입 상태 일괄 변경
export async function updateManyAdminStatus(userId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const superAdmin = await authRepository.findSuperAdminByUserId(userId);
    if (!superAdmin) throw new ForbiddenError('슈퍼 관리자만 변경 가능합니다');
    await authRepository.updateManyAdminStatus(status);
    return { message: '관리자 가입 상태 일괄 변경이 완료되었습니다' };
}
// [관리자] 주민 가입 상태 변경(단건)
export async function updateResidentStatus(residentId: string, userId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const admin = await authRepository.findUserById(userId);
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError('관리자만 변경 가능합니다');

    const resident = await residentRepository.findResidentById(residentId);
    if (!resident) throw new BadRequestError('입주민 정보를 찾을 수 없습니다');

    if (safeString(resident.apartmentId) !== safeString(admin.apartmentId)) {
        throw new ForbiddenError('자신의 아파트 소속 입주민만 관리할 수 있습니다');
    }
    await authRepository.updateResidentStatus(residentId, status);
    return { message: '입주민 가입 상태 변경이 완료되었습니다' };
}
// [관리자] 주민 가입 상태 일괄 변경
export async function updateManyResidentStatus(userId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const admin = await authRepository.findUserById(userId);
    if (!admin || admin.role !== 'ADMIN') throw new ForbiddenError('관리자만 변경 가능합니다');
    if (!admin.apartmentId) throw new BadRequestError('아파트 정보가 없습니다');
    await authRepository.updateManyResidentStatus(safeString(admin.apartmentId), status);
    return { message: '입주민 가입 상태 변경이 완료되었습니다' };
}
// [슈퍼관리자] 관리자 정보(아파트 정보 포함) 수정
export async function updateAdminInfo(adminId: string, userId: string, updateData: UpdateAdminDTO) {
    const superAdmin = await authRepository.findSuperAdminByUserId(userId);
    if (!superAdmin) throw new ForbiddenError('권한이 없습니다');
    const updatedAdmin = await authRepository.updateAdminInfo(adminId, updateData);
    return User.fromEntity(updatedAdmin);
}
// [슈퍼관리자] 관리자 정보(아파트 정보 포함) 삭제
export async function deleteAdmin(adminId: string, userId: string) {
    const superAdmin = await authRepository.findSuperAdminByUserId(userId);
    if (!superAdmin) throw new ForbiddenError('권한이 없습니다');
    const admin = await authRepository.findUserByAdminId(adminId);
    if (!admin) throw new BadRequestError('해당 관리자를 찾을 수 없습니다');

    await authRepository.deleteAdmin(adminId);
    return {
        message: '관리자 정보(아파트 정보 포함) 삭제가 완료되었습니다',
    };
}
// [슈퍼관리자/관리자] 거절 계정 관리(최고 관리자는 관리자 계정을, 관리자는 사용자 계정을 일괄 정리)
export async function cleanupRejectedUsers(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError('거절한 관리자/사용자 정보 일괄 삭제 중 오류가 발생했습니다');

    if (user.role === 'SUPER_ADMIN') {
        await authRepository.deleteRejectedAdmins();
    } else if (user.role === 'ADMIN') {
        if (!user.apartmentId) throw new BadRequestError('아파트 정보가 없습니다');
        await authRepository.deleteRejectedUsers(user.apartmentId);
    } else {
        throw new ForbiddenError('해당 작업을 수행할 권한이 없습니다');
    }
    return {
        message: '거절한 관리자/사용자 정보 일괄 정리가 완료되었습니다.',
    };
}
