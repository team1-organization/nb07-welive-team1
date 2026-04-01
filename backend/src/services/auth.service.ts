import { generateTokens } from '../lib/token';
import { CreateUserDTO, UpdateUserDTO } from '../dtos/auth.dto';
import bcrypt from 'bcrypt';
import { BadRequestError } from '../errors/BadRequestError';
import { User } from '../types/auth.type';
import * as authRepository from '../repositories/auth.repository';
import { UnauthorizedError } from '../errors/UnauthorizedError';

export function login(userId: string) {
    const { accessToken, refreshToken } = generateTokens(userId);
    return { accessToken, refreshToken };
}

export async function register(data: CreateUserDTO) {
    const existedUserId = await authRepository.findByUserId(data.username);
    if (existedUserId) throw new BadRequestError('이미 사용중인 아이디입니다.');
    const existedUserEmail = await authRepository.findByUserEmail(data.email);
    if (existedUserEmail) throw new BadRequestError('이미 가입된 이메일입니다.');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    let newUser = null;
    if (data.role === 'SUPER_ADMIN') {
        newUser = await authRepository.createSuperAdmin({
            ...data,
            password: hashedPassword,
        });
    } else if (data.role === 'ADMIN') {
        newUser = await authRepository.createAdmin({
            ...data,
            password: hashedPassword,
        });
    } else {
        newUser = await authRepository.createUser({
            ...data,
            password: hashedPassword,
        });
    }
    return User.fromEntity(newUser);
}
