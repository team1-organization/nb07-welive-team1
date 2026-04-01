import { ComplaintStatus, Prisma } from '../../generated/prisma';
import { prisma } from '../lib/prisma';

export class ComplaintRepository {
    async create(data: Prisma.ComplaintUncheckedCreateInput) {
        return await prisma.complaint.create({ data });
    }

    async findById(id: bigint) {
        return await prisma.complaint.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, role: true } },
            },
        });
    }

    async findMany(apartmentId: bigint, skip: number, take: number, status?: ComplaintStatus, keyword?: string) {
        const where: Prisma.ComplaintWhereInput = {
            apartmentId,
            ...(status && { status }),
            ...(keyword && {
                OR: [{ title: { contains: keyword } }, { content: { contains: keyword } }],
            }),
        };

        const [total, list] = await Promise.all([
            prisma.complaint.count({ where }),
            prisma.complaint.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true } } },
            }),
        ]);

        return { total, list };
    }

    async update(id: bigint, data: Prisma.ComplaintUpdateInput) {
        return await prisma.complaint.update({
            where: { id },
            data,
        });
    }

    async delete(id: bigint) {
        return await prisma.complaint.delete({
            where: { id },
        });
    }
}
