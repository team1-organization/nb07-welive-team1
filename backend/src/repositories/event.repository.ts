import { Prisma } from '../../generated/prisma';
import { prisma } from '../lib/prisma';

export const findEventsByMonth = async (apartmentId: bigint, startDate: Date, endDate: Date) => {
    return await prisma.event.findMany({
        where: {
            apartmentId,
            OR: [
                { startDate: { lte: endDate, gte: startDate } },
                { endDate: { lte: endDate, gte: startDate } },
                { startDate: { lte: startDate }, endDate: { gte: endDate } },
            ],
        },
        orderBy: { startDate: 'asc' },
    });
};

export const findEventById = async (eventId: bigint) => {
    return await prisma.event.findUnique({
        where: { id: eventId },
    });
};

export const upsertEvent = async (data: Prisma.EventCreateInput, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;

    if (data.notice?.connect?.id) {
        const existing = await db.event.findUnique({ where: { noticeId: data.notice.connect.id } });
        if (existing) {
            return await db.event.update({ where: { id: existing.id }, data });
        }
    } else if (data.poll?.connect?.id) {
        const existing = await db.event.findUnique({ where: { pollId: data.poll.connect.id } });
        if (existing) {
            return await db.event.update({ where: { id: existing.id }, data });
        }
    }

    return await db.event.create({ data });
};

export const deleteEvent = async (eventId: bigint, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    return await db.event.delete({
        where: { id: eventId },
    });
};

export const deleteEventByBoardId = async (boardType: 'NOTICE' | 'POLL', boardId: bigint, tx?: Prisma.TransactionClient) => {
    const db = tx || prisma;
    const event = await db.event.findFirst({
        where: boardType === 'NOTICE' ? { noticeId: boardId } : { pollId: boardId },
    });

    if (event) {
        return await db.event.delete({ where: { id: event.id } });
    }
    return null;
};
