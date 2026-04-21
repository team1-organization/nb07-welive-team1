import bcrypt from 'bcrypt';
import { ChangePasswordDTO, GetResidentAccountListQueryDTO, UpdateProfileDTO, UpdateResidentAccountDTO } from '../dtos/auth.dto';
import { BadRequestError } from '../errors/BadRequestError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { NotFoundError } from '../errors/NotFoundError';
import * as authRepository from '../repositories/auth.repository';
import * as userRepository from '../repositories/user.repository';
import { User } from '../types/auth.type';

type ResidentAccountItem = NonNullable<Awaited<ReturnType<typeof userRepository.findResidentAccountById>>>;
type PendingResidentAccountItem = Awaited<ReturnType<typeof userRepository.findPendingResidentAccounts>>['users'][number];

export async function getMyProfile(userId: string) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다.');
    return User.fromEntity(user);
}
export async function updateMyProfile(userId: string, data: UpdateProfileDTO) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다.');

    const updatedUser = await userRepository.updateMyProfile(userId, data);
    return {
        message: `${updatedUser.name}님의 정보가 성공적으로 업데이트되었습니다. 다시 로그인해주세요.`,
    };
}
export async function updatePassword(userId: string, data: ChangePasswordDTO) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다.');

    const isMatch = await bcrypt.compare(data.currentPassword!, user.password);
    if (!isMatch) throw new BadRequestError('비밀번호가 일치하지 않습니다.');

    const newPassword = await bcrypt.hash(data.newPassword!, 10);

    const updatedPassword = await userRepository.updatePassword(userId, newPassword);
    return {
        message: `${updatedPassword.name}님의 비밀번호가 변경되었습니다. 다시 로그인해주세요.`,
    };
}

// 관리자 계정 확인
async function getAdminUser(userId: string) {
    const user = await userRepository.findUserById(userId);

    if (!user) {
        throw new NotFoundError('사용자를 찾을 수 없습니다.');
    }

    if (user.role !== 'ADMIN') {
        throw new ForbiddenError('관리자만 접근 가능합니다.');
    }

    if (!user.apartmentId) {
        throw new BadRequestError('아파트 정보가 없는 관리자 계정입니다.');
    }

    return user;
}

// 입주민 계정 응답 변환
function toResidentAccountDto(user: ResidentAccountItem | PendingResidentAccountItem) {
    return {
        id: user.id.toString(),
        userId: user.userId,
        name: user.name,
        email: user.email,
        contact: user.contact,
        role: user.role,
        isActive: user.isActive,
        joinStatus: user.joinStatus,
        building: user.building,
        unitNumber: user.unitNumber,
        apartmentId: user.apartmentId?.toString() ?? null,
        residentId: user.residentId?.toString() ?? null,
        approvalStatus: user.resident?.approvalStatus ?? null,
        isRegistered: user.resident?.isRegistered ?? false,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

// 입주민 계정 신청 목록 조회
export async function getResidentAccountList(userId: string, query: GetResidentAccountListQueryDTO) {
    const admin = await getAdminUser(userId);

    const result = await userRepository.findPendingResidentAccounts(admin.apartmentId!, query);

    return {
        users: result.users.map((user) => toResidentAccountDto(user)),
        message: '입주민 계정 신청 목록 조회 성공',
        count: result.users.length,
        totalCount: result.totalCount,
    };
}

// 입주민 계정 수정
export async function updateResidentAccountById(userId: string, targetUserId: string, data: UpdateResidentAccountDTO) {
    const admin = await getAdminUser(userId);

    const targetUser = await userRepository.findResidentAccountById(targetUserId, admin.apartmentId!);
    if (!targetUser) throw new NotFoundError('입주민 계정을 찾을 수 없습니다.');

    if (data.email) {
        const existedUser = await authRepository.findByUserEmail(data.email);

        if (existedUser && existedUser.id.toString() !== targetUserId) {
            throw new BadRequestError('이미 가입된 이메일입니다.');
        }
    }

    const updatedUser = await userRepository.updateResidentAccount(targetUserId, data);

    return {
        message: '입주민 계정 수정이 완료되었습니다.',
        user: toResidentAccountDto(updatedUser),
    };
}

// 입주민 계정 삭제
export async function deleteResidentAccountById(userId: string, targetUserId: string) {
    const admin = await getAdminUser(userId);

    const targetUser = await userRepository.findResidentAccountById(targetUserId, admin.apartmentId!);
    if (!targetUser) throw new NotFoundError('입주민 계정을 찾을 수 없습니다.');

    await userRepository.deleteResidentAccount(targetUserId);

    return {
        message: '입주민 계정 삭제가 완료되었습니다.',
    };
}
