import { ChangePasswordDTO, UpdateProfileDTO } from '../dtos/auth.dto';
import * as userRepository from '../repositories/user.repository';
import { User } from '../types/auth.type';
import { NotFoundError } from '../errors/NotFoundError';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../errors/BadRequestError';

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
