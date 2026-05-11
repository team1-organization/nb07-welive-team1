import { prisma } from '../lib/prisma';
import { GetAdminApartmentQueryDTO } from '../dtos/apartment.dto';
import { Prisma } from 'generated/prisma';

export async function findByApartmentName(apartmentName: string) {
    return prisma.apartment.findFirst({
        where: { apartmentName },
    });
}
export async function findByApartmentId(apartmentId: string) {
    return prisma.apartment.findUnique({
        where: { id: BigInt(apartmentId) },
        include: {
            users: {
                where: { role: 'ADMIN' },
                take: 1,
            },
        },
    });
}

export async function getApartmentsForSignup(keyword: string, address: string, name: string) {
    const apartmentWhere = {
        ...(keyword === 'name' && name
            ? { apartmentName: { contains: name, mode: 'insensitive' as const } } // as const 추가
            : {}),
        ...(keyword === 'address' && address
            ? { apartmentAddress: { contains: address, mode: 'insensitive' as const } } // as const 추가
            : {}),
    };

    const [apartmentsData, apartmentsCount] = await Promise.all([
        prisma.apartment.findMany({
            where: apartmentWhere,
            select: {
                id: true,
                apartmentName: true,
                apartmentAddress: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.apartment.count({
            where: apartmentWhere,
        }),
    ]);
    return { apartmentsData, apartmentsCount };
}
export async function getApartmentList(data: GetAdminApartmentQueryDTO) {
    const { searchKeyword, apartmentStatus, page, limit } = data;
    const where: Prisma.ApartmentWhereInput = {
        ...(searchKeyword?.trim() && {
            OR: [
                { apartmentName: { contains: searchKeyword, mode: 'insensitive' as const } },
                { apartmentAddress: { contains: searchKeyword, mode: 'insensitive' as const } },
            ],
        }),
        ...(apartmentStatus && {
            users: {
                some: {
                    role: {
                        in: ['ADMIN', 'SUPER_ADMIN'],
                    },
                    joinStatus: apartmentStatus,
                },
            },
        }),
    };

    const [apartmentsData, apartmentsCount] = await Promise.all([
        prisma.apartment.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                users: {
                    where: {
                        role: {
                            in: ['ADMIN', 'SUPER_ADMIN'],
                        },
                    },
                    take: 1,
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.apartment.count({ where }),
    ]);
    return { apartmentsData, apartmentsCount };
}
export async function getApartmentDetails(apartmentId: string) {
    return prisma.apartment.findUnique({
        where: { id: BigInt(apartmentId) },
        include: {
            users: {
                where: { role: 'ADMIN' },
                take: 1,
            },
        },
    });
}
