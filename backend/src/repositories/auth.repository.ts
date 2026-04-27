import { CreateUserDTO, UpdateAdminDTO } from '../dtos/auth.dto';
import { prisma } from '../lib/prisma';

export async function findUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: BigInt(userId), isActive: true },
    });
}

export async function findUserByUserId(username: string) {
    return prisma.user.findUnique({
        where: { userId: username, isActive: true },
    });
}

export async function findUserByEmail(userEmail: string) {
    return prisma.user.findFirst({
        where: { email: userEmail, isActive: true },
    });
}

export async function findUserByAdminId(adminId: string) {
    return prisma.user.findFirst({
        where: {
            id: BigInt(adminId),
            role: 'ADMIN',
        },
    });
}

export async function findSuperAdminByUserId(userId: string) {
    return prisma.user.findFirst({
        where: {
            id: BigInt(userId),
            role: 'SUPER_ADMIN',
        },
    });
}

export async function findSuperAdminList() {
    return prisma.user.findMany({
        where: {
            role: 'SUPER_ADMIN',
            isActive: true,
        },
        select: {
            id: true,
            name: true,
        },
    });
}

export async function findAdminListByApartment(apartmentId: string) {
    return prisma.user.findMany({
        where: {
            role: 'ADMIN',
            isActive: true,
            apartmentId: BigInt(apartmentId),
        },
        select: {
            id: true,
            name: true,
        },
    });
}

export async function findUsersByRole(role: 'SUPER_ADMIN' | 'ADMIN' | 'USER', apartmentId?: string) {
    return prisma.user.findMany({
        where: {
            role,
            ...(apartmentId ? { apartmentId: BigInt(apartmentId) } : {}),
        },
    });
}

export async function findByUserId(userId: string) {
    return prisma.user.findUnique({
        where: { userId },
    });
}

export async function findByUserEmail(userEmail: string) {
    return prisma.user.findUnique({
        where: { email: userEmail },
    });
}

export async function findAdminByAdminId(adminId: string) {
    return prisma.user.findFirst({
        where: {
            id: BigInt(adminId),
            role: {
                in: ['ADMIN', 'SUPER_ADMIN'],
            },
            isActive: true,
        },
    });
}

export function createUser(data: Extract<CreateUserDTO, { role: 'USER' }>, apartmentId: bigint) {
    return prisma.$transaction(async (tx) => {
        let resident = await tx.resident.findFirst({
            where: {
                apartmentId: apartmentId,
                name: data.name,
                // building: data.apartmentDong,
                // unitNumber: data.apartmentHo,
                contact: data.contact,
            },
        });

        if (resident) {
            // 입주민 명부에 있는지 확인
            resident = await tx.resident.update({
                where: { id: resident.id },
                data: {
                    isRegistered: true,
                    // 입주민 명부에 있는 사용자로 자동 승인
                    approvalStatus: 'APPROVED',
                    building: data.apartmentDong,
                    unitNumber: data.apartmentHo,
                },
            });
        } else {
            resident = await tx.resident.create({
                data: {
                    name: data.name,
                    contact: data.contact,
                    building: data.apartmentDong,
                    unitNumber: data.apartmentHo,
                    apartmentId: apartmentId,
                    residenceStatus: 'RESIDENCE',
                    isHouseholder: 'HOUSEMEMBER',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });
        }

        return tx.user.create({
            data: {
                userId: data.username,
                password: data.password,
                contact: data.contact,
                email: data.email,
                name: data.name,
                role: data.role,
                joinStatus: resident.approvalStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
                isActive: true,
                building: data.apartmentDong,
                unitNumber: data.apartmentHo,
                apartmentId: apartmentId,
                residentId: resident.id,
            },
            include: {
                resident: true,
                apartment: {
                    include: { board: true },
                },
            },
        });
    });
}
// [관리자] 회원가입
export async function createAdmin(data: Extract<CreateUserDTO, { role: 'ADMIN' }>) {
    return prisma.$transaction(async (tx) => {
        const apartment = await tx.apartment.create({
            data: {
                apartmentName: data.apartmentName,
                apartmentAddress: data.apartmentAddress,
                apartmentManagementNumber: data.apartmentManagementNumber,
                description: data.description,
                startComplexNumber: data.startComplexNumber,
                endComplexNumber: data.endComplexNumber,
                startFloorNumber: data.startFloorNumber,
                endFloorNumber: data.endFloorNumber,
                startDongNumber: data.startDongNumber,
                endDongNumber: data.endDongNumber,
                startHoNumber: data.startHoNumber,
                endHoNumber: data.endHoNumber,
            },
        });

        // 각 게시판 마다 고유 아이디 생성을 위해 board 추가
        await tx.board.createMany({
            data: [
                { apartmentId: apartment.id, type: 'NOTICE' },
                { apartmentId: apartment.id, type: 'COMPLAINT' },
                { apartmentId: apartment.id, type: 'POLL' },
            ],
        });

        const resident = await tx.resident.create({
            data: {
                name: data.name,
                contact: data.contact,
                // building: data.dongNumber,
                // unitNumber: data.hoNumber,
                apartmentId: apartment.id,
                residenceStatus: 'NO_RESIDENCE',
                isHouseholder: 'HOUSEHOLDER',
                isRegistered: true,
                // 관리자는 입주민 자동등록
                approvalStatus: 'APPROVED',
            },
        });

        return tx.user.create({
            data: {
                userId: data.username,
                password: data.password,
                contact: data.contact,
                email: data.email,
                name: data.name,
                role: data.role,
                // 슈퍼 관리자에게 승인처리가 필요하여 가입상태는 대기
                joinStatus: 'PENDING',
                isActive: false,
                apartmentId: apartment.id,
                residentId: resident.id,
                building: null,
                unitNumber: null,
            },
            include: {
                resident: true,
                apartment: {
                    include: { board: true },
                },
            },
        });
    });
}

export async function createSuperAdmin(data: Extract<CreateUserDTO, { role: 'SUPER_ADMIN' }>) {
    return prisma.user.create({
        data: {
            userId: data.username,
            password: data.password,
            contact: data.contact,
            name: data.name,
            email: data.email,
            role: data.role,
            joinStatus: 'APPROVED',
            isActive: true,
        },
    });
}

export async function updateAdminStatus({ adminId, status }: { adminId: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) {
    return prisma.user.update({
        where: { id: BigInt(adminId) },
        data: {
            joinStatus: status,
            isActive: status === 'APPROVED',
        },
        include: {
            resident: true,
            apartment: {
                include: { board: true },
            },
        },
    });
}

export async function updateManyAdminStatus(status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.user.updateMany({
        where: {
            role: 'ADMIN',
        },
        data: {
            joinStatus: status,
            isActive: status === 'APPROVED',
        },
    });
}
export async function updateResidentStatus(residentId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.resident.update({
        where: {
            id: BigInt(residentId),
        },
        data: {
            approvalStatus: status,
            user: {
                update: {
                    joinStatus: status,
                    isActive: status === 'APPROVED',
                },
            },
        },
    });
}
export async function updateManyResidentStatus(apartmentId: string, status: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return prisma.$transaction(async (tx) => {
        // 해당 아파트의 "가입된 사용자 계정"만 조회 (residentId 있는 경우만)
        const users = await tx.user.findMany({
            where: {
                apartmentId: BigInt(apartmentId),
                role: 'USER',
                residentId: { not: null },
            },
            select: {
                residentId: true,
            },
        });

        // user에 연결된 residentId만 추출
        const residentIds = users.map((user) => user.residentId).filter((residentId): residentId is bigint => residentId !== null);

        // 실제 가입 신청 계정과 연결된 resident만 상태 변경
        const updatedResidents =
            residentIds.length > 0
                ? await tx.resident.updateMany({
                      where: {
                          apartmentId: BigInt(apartmentId),
                          id: { in: residentIds },
                      },
                      data: { approvalStatus: status },
                  })
                : { count: 0 };

        await tx.user.updateMany({
            where: {
                apartmentId: BigInt(apartmentId),
                role: 'USER',
                residentId: { not: null },
            },
            data: {
                joinStatus: status,
                isActive: status === 'APPROVED',
            },
        });

        return updatedResidents;
    });
}

export async function updateAdminInfo(adminId: string, data: UpdateAdminDTO) {
    return prisma.user.update({
        where: { id: BigInt(adminId) },
        data: {
            name: data.name,
            email: data.email,
            contact: data.contact,
            apartment: {
                update: {
                    apartmentName: data.apartmentName,
                    apartmentAddress: data.apartmentAddress,
                    apartmentManagementNumber: data.apartmentManagementNumber,
                    description: data.description,
                },
            },
        },
        include: {
            resident: true,
            apartment: {
                include: { board: true },
            },
        },
    });
}

export async function deleteAdmin(adminId: string) {
    return prisma.user.update({
        where: { id: BigInt(adminId) },
        data: {
            isActive: false,
        },
    });
}

export async function deleteRejectedUsers(apartmentId: bigint) {
    return prisma.user.deleteMany({
        where: {
            role: 'USER',
            joinStatus: 'REJECTED',
            apartmentId: apartmentId,
        },
    });
}

export async function deleteRejectedAdmins() {
    return prisma.user.deleteMany({
        where: {
            role: 'ADMIN',
            joinStatus: 'REJECTED',
        },
    });
}
//
// export async function updateProfileImage(userId: string, imageUrl: string) {
//     return prisma.user.update({
//         where: { id: BigInt(userId) },
//         data: { profileImage: imageUrl },
//     });
// }
//
// export async function updateUserPassword(userId: string, password: string) {
//     return prisma.user.update({
//         where: { id: BigInt(userId) },
//         data: { password },
//     });
// }
//
// export async function updateUserInfo(userId: string, data: UpdateUserDTO) {
//     return prisma.user.update({
//         where: { id: BigInt(userId) },
//         data: {
//             name: data.name,
//             email: data.email,
//             contact: data.contact,
//         },
//     });
// }
