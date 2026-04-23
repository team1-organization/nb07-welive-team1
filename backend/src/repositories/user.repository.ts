import { GetResidentAccountListQueryDTO, UpdateProfileDTO, UpdateResidentAccountDTO } from '../dtos/auth.dto';
import { prisma } from '../lib/prisma';

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
            building: true,
            unitNumber: true,
            apartmentId: true,
            residentId: true,
        },
    });
}

// 입주민 계정 신청 목록 조회
export async function findPendingResidentAccounts(apartmentId: bigint, query: GetResidentAccountListQueryDTO) {
    const where = {
        apartmentId,
        role: 'USER' as const,
        joinStatus: 'PENDING' as const,
        ...(query.building ? { building: query.building } : {}),
        ...(query.unitNumber ? { unitNumber: query.unitNumber } : {}),
        ...(query.keyword
            ? {
                  OR: [
                      {
                          name: {
                              contains: query.keyword,
                              mode: 'insensitive' as const,
                          },
                      },
                      {
                          userId: {
                              contains: query.keyword,
                              mode: 'insensitive' as const,
                          },
                      },
                      {
                          email: {
                              contains: query.keyword,
                              mode: 'insensitive' as const,
                          },
                      },
                      {
                          contact: {
                              contains: query.keyword,
                              mode: 'insensitive' as const,
                          },
                      },
                  ],
              }
            : {}),
    };

    const skip = (query.page - 1) * query.limit;

    const [totalCount, users] = await prisma.$transaction([
        prisma.user.count({ where }),
        prisma.user.findMany({
            where,
            skip,
            take: query.limit,
            orderBy: [{ createdAt: 'desc' }],
            select: {
                id: true,
                userId: true,
                name: true,
                email: true,
                contact: true,
                role: true,
                isActive: true,
                joinStatus: true,
                createdAt: true,
                updatedAt: true,
                building: true,
                unitNumber: true,
                apartmentId: true,
                residentId: true,
                resident: {
                    select: {
                        id: true,
                        approvalStatus: true,
                        isRegistered: true,
                    },
                },
            },
        }),
    ]);

    return {
        users,
        totalCount,
    };
}

// 아파트 기준 입주민 계정 단건 조회
export async function findResidentAccountById(userId: string, apartmentId: bigint) {
    return prisma.user.findFirst({
        where: {
            id: BigInt(userId),
            apartmentId,
            role: 'USER',
        },
        select: {
            id: true,
            userId: true,
            name: true,
            email: true,
            contact: true,
            role: true,
            isActive: true,
            joinStatus: true,
            createdAt: true,
            updatedAt: true,
            building: true,
            unitNumber: true,
            apartmentId: true,
            residentId: true,
            resident: {
                select: {
                    id: true,
                    approvalStatus: true,
                    isRegistered: true,
                    building: true,
                    unitNumber: true,
                    contact: true,
                    name: true,
                },
            },
        },
    });
}

export async function updateMyProfile(userId: string, data: UpdateProfileDTO) {
    return prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
            name: data.name,
            contact: data.contact,
            email: data.email,
            email: data.email,
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

export async function updateProfileImage(userId: string, imageUrl: string | null) {
    return prisma.user.update({
        where: { id: BigInt(userId) },
        data: {
            profileImage: imageUrl,
        },
    });
}

// 입주민 계정 수정
export async function updateResidentAccount(userId: string, data: UpdateResidentAccountDTO) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: BigInt(userId) },
            select: {
                id: true,
                residentId: true,
            },
        });

        const updatedUser = await tx.user.update({
            where: { id: BigInt(userId) },
            data: {
                name: data.name,
                email: data.email,
                contact: data.contact,
                building: data.building,
                unitNumber: data.unitNumber,
            },
            select: {
                id: true,
                userId: true,
                name: true,
                email: true,
                contact: true,
                role: true,
                isActive: true,
                joinStatus: true,
                createdAt: true,
                updatedAt: true,
                building: true,
                unitNumber: true,
                apartmentId: true,
                residentId: true,
                resident: {
                    select: {
                        id: true,
                        approvalStatus: true,
                        isRegistered: true,
                        building: true,
                        unitNumber: true,
                        contact: true,
                        name: true,
                    },
                },
            },
        });

        if (user?.residentId) {
            await tx.resident.update({
                where: { id: user.residentId },
                data: {
                    name: data.name,
                    contact: data.contact,
                    building: data.building,
                    unitNumber: data.unitNumber,
                },
            });
        }

        return updatedUser;
    });
}

// 입주민 계정 삭제
export async function deleteResidentAccount(userId: string) {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: BigInt(userId) },
            select: {
                id: true,
                residentId: true,
            },
        });

        const deletedUser = await tx.user.delete({
            where: { id: BigInt(userId) },
        });

        if (user?.residentId) {
            await tx.resident.update({
                where: { id: user.residentId },
                data: {
                    isRegistered: false,
                },
            });
        }

        return deletedUser;
    });
}
