import { prisma } from '../lib/prisma';
import { ChangePasswordDTO, UpdateProfileDTO } from '../dtos/auth.dto';

export async function findUserById(userId: string) {
    return prisma.user.findUnique({
        where: {
            id: BigInt(userId),
        },
        select: {
            id: true,
            password: true,
            userId: true,
            name: true,
            email: true,
            contact: true,
            profileImage: true,
            role: true,
            isActive: true,
            joinStatus: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}

export async function updateMyProfile(userId: string, data: UpdateProfileDTO) {
    return prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
            name: data.name,
            contact: data.contact,
            profileImage: data.profileImage,
        },
    });
}
export async function updatePassword(userId: string, newPassword: string) {
    return prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
            password: newPassword,
        },
    });
}
