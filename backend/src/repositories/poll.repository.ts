import { Prisma } from '../../generated/prisma';
import { prisma } from '../lib/prisma';
import { CreatePollData, PollFilterQuery, UpdatePollData } from '../types/poll.type';

export class PollRepository {
    async create(userId: bigint, data: CreatePollData, tx?: Prisma.TransactionClient) {
        const client = tx || prisma;
        return await client.poll.create({
            data: {
                title: data.title,
                content: data.content,
                buildingPermission: data.buildingPermission,
                startDate: data.startDate,
                endDate: data.endDate,
                boardId: data.boardId,
                userId: userId,
                pollOptions: {
                    create: data.options.map((title, index) => ({
                        title,
                        order: index,
                    })),
                },
            },
            include: { pollOptions: true },
        });
    }

    async findAll(filter: PollFilterQuery, apartmentId: bigint, userBuildingNumber?: number) {
        const andConditions: Prisma.PollWhereInput[] = [];

        if (userBuildingNumber !== undefined) {
            andConditions.push({
                OR: [{ buildingPermission: 0 }, { buildingPermission: userBuildingNumber }],
            });
        }

        if (filter.searchKeyword) {
            andConditions.push({
                OR: [{ title: { contains: filter.searchKeyword } }, { content: { contains: filter.searchKeyword } }],
            });
        }

        const where: Prisma.PollWhereInput = {
            board: { apartmentId: apartmentId },
        };

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        if (filter.status) where.status = filter.status;
        if (filter.buildingPermission !== undefined) where.buildingPermission = filter.buildingPermission;

        return await prisma.poll.findMany({
            where,
            include: {
                user: { select: { name: true } },
                pollOptions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(pollId: bigint) {
        return await prisma.poll.findUnique({
            where: { id: pollId },
            include: {
                pollOptions: {
                    include: {
                        _count: { select: { votes: true } },
                    },
                },
                board: true,
            },
        });
    }

    async update(pollId: bigint, data: UpdatePollData) {
        return await prisma.poll.update({
            where: { id: pollId },
            data,
        });
    }

    async delete(pollId: bigint) {
        return await prisma.poll.delete({
            where: { id: pollId },
        });
    }

    async createVote(userId: bigint, optionId: bigint) {
        return await prisma.vote.create({
            data: { userId, optionId },
        });
    }

    async deleteVote(userId: bigint, optionId: bigint) {
        return await prisma.vote.delete({
            where: {
                userId_optionId: {
                    userId,
                    optionId,
                },
            },
        });
    }
}
