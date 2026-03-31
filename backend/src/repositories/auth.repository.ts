import { prisma } from '../lib/prisma';
import { CreateUserDTO } from '../dtos/auth.dto';
import { findByApartmentName } from './apartment.repository';

export function createUser(data: Extract<CreateUserDTO, { role: 'USER' }>) {
    return prisma.$transaction(async (tx) => {
        const apartment = await findByApartmentName(data.apartmentName);
        if (!apartment) throw new Error('아파트를 찾을 수 없습니다.');

        await tx.resident.create({
            data: {
                name: data.name,
                contact: data.contact,
                building: data.apartmentDong,
                unitNumber: data.apartmentHo,
                apartment: { connect: { id: apartment.id } },
                residenceStatus: 'RESIDENCE',
                isHouseholder: 'HOUSEMEMBER',
                isRegistered: false,
                approvalStatus: 'PENDING',
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
                joinStatus: 'PENDING',
                isActive: true,
                apartment: { connect: { id: apartment.id } },
            },
            include: {
                resident: true,
                apartment: true,
            },
        });
    });
}

export async function createAdmin(data: Extract<CreateUserDTO, { role: 'ADMIN' }>) {
    return prisma.$transaction(async (tx) => {
        const apartment = await tx.apartment.create({
            data: {
                apartmentName: data.apartmentName,
                apartmentAddress: data.apartmentAddress,
                apartmentManagementNumber: data.apartmentManagementNumber,
                description: data.description,
                complexNumber: data.complexNumber,
                floorNumber: data.floorNumber,
            },
        });

        await tx.resident.create({
            data: {
                name: data.name,
                contact: data.contact,
                building: data.dongNumber,
                unitNumber: data.hoNumber,
                apartment: { connect: { id: apartment.id } },
                residenceStatus: 'RESIDENCE',
                isHouseholder: 'HOUSEHOLDER',
                isRegistered: true,
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
                joinStatus: 'PENDING',
                isActive: true,
                apartment: { connect: { id: apartment.id } },
            },
            include: {
                resident: true,
                apartment: true,
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
        data: { joinStatus: status },
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

export async function findByUserId(userId: string) {
    return prisma.user.findUnique({
        where: { userId },
    });
}

export async function findByUserEmail(userEmail: string) {
    return prisma.user.findFirst({
        where: { email: userEmail },
    });
}

export async function findSuperAdminByUserId(userId: string) {
    return prisma.user.findFirst({
        where: {
            id: BigInt(userId),
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });
}
