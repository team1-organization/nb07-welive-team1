import { prisma } from '../lib/prisma';

export async function findByApartmentName(apartmentName: string) {
    return prisma.apartment.findFirst({
        where: { apartmentName },
    });
}
export async function findByApartmentId(apartmentId: string) {
    return prisma.apartment.findUnique({
        where: { id: BigInt(apartmentId) },
    });
}
