import { Prisma } from '../../generated/prisma';
import { GetEventListQueryDto, UpsertEventBodyDto } from '../dtos/event.dto';
import { NotFoundError } from '../errors/NotFoundError';
import { prisma } from '../lib/prisma';
import * as eventRepository from '../repositories/event.repository';
import * as noticeRepository from '../repositories/notice.repository';
import { safeString } from '../utils/string.util';

export const getEventList = async (query: GetEventListQueryDto) => {
    const { apartmentId, year, month } = query;
    const targetApartmentId = typeof apartmentId === 'string' ? BigInt(apartmentId.replace(/\D/g, '')) : BigInt(apartmentId);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const events = await eventRepository.findEventsByMonth(targetApartmentId, startDate, endDate);

    return events.map((event) => ({
        id: safeString(event.id),
        start: event.startDate.toISOString(),
        end: event.endDate.toISOString(),
        title: event.title,
        category: event.category ?? 'GENERAL',
        type: event.boardType,
    }));
};

export const upsertEvent = async (dto: UpsertEventBodyDto, tx?: Prisma.TransactionClient) => {
    const { boardType, boardId, startDate, endDate } = dto;
    const db = tx || prisma;

    let title = '';
    let category: string | null = null;
    let apartmentId: bigint;

    if (boardType === 'NOTICE') {
        const notice = await noticeRepository.findNoticeById(boardId);
        if (!notice) throw new NotFoundError('공지사항을 찾을 수 없습니다.');
        title = notice.title;
        category = notice.category;
        apartmentId = notice.board.apartmentId;
    } else {
        const poll = await db.poll.findUnique({ where: { id: boardId }, include: { board: true } });
        if (!poll) throw new NotFoundError('투표를 찾을 수 없습니다.');
        title = poll.title;
        apartmentId = poll.board.apartmentId;
    }

    const eventData: Prisma.EventCreateInput = {
        title,
        category,
        boardType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        apartment: { connect: { id: apartmentId } },
        ...(boardType === 'NOTICE' ? { notice: { connect: { id: boardId } } } : { poll: { connect: { id: boardId } } }),
    };

    return eventRepository.upsertEvent(eventData, tx);
};

export const deleteEvent = async (eventId: bigint) => {
    const event = await eventRepository.findEventById(eventId);
    if (!event) throw new NotFoundError('이벤트를 찾을 수 없습니다.');

    await eventRepository.deleteEvent(eventId);

    if (event.boardType === 'NOTICE' && event.noticeId) {
        await prisma.notice.update({
            where: { id: event.noticeId },
            data: { startDate: null, endDate: null },
        });
    }

    return event;
};

export const deleteEventByBoardId = async (boardType: 'NOTICE' | 'POLL', boardId: bigint, tx?: Prisma.TransactionClient) => {
    return eventRepository.deleteEventByBoardId(boardType, boardId, tx);
};
