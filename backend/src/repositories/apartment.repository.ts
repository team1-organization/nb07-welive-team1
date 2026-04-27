import { prisma } from '../lib/prisma';

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
                // apartmentManagementNumber: true,
                // description: true,
                // startComplexNumber: true,
                // endComplexNumber: true,
                // startFloorNumber: true,
                // endFloorNumber: true,
                // startDongNumber: true,
                // endDongNumber: true,
                // startHoNumber: true,
                // endHoNumber: true,
                // createdAt: true,
                // updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.apartment.count({
            where: apartmentWhere,
        }),
    ]);
    return { apartmentsData, apartmentsCount };
}
export async function getApartmentList() {
    const [apartmentsData, apartmentsCount] = await Promise.all([
        prisma.apartment.findMany({
            include: {
                users: { where: { role: 'ADMIN' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.apartment.count(),
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
