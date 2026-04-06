import { NoticeCategory } from '../../generated/prisma';
import { prisma } from '../lib/prisma';

interface CreateNoticeParams {
    boardId: bigint;
    userId: bigint;
    category: NoticeCategory;
    title: string;
    content: string;
    isPinned: boolean;
    startDate?: string | null;
    endDate?: string | null;
}

interface FindNoticeListParams {
    boardId: bigint;
    page: number;
    limit: number;
    category?: NoticeCategory;
    search?: string;
}

interface UpdateNoticeParams {
    noticeId: bigint;
    data: {
        boardId?: bigint;
        category?: NoticeCategory;
        title?: string;
        content?: string;
        isPinned?: boolean;
        startDate?: string | null;
        endDate?: string | null;
    };
}

export const findBoardById = async (boardId: bigint) => {
    return prisma.board.findUnique({
        where: { id: boardId },
    });
};

export const createNotice = async ({ boardId, userId, category, title, content, isPinned, startDate, endDate }: CreateNoticeParams) => {
    return prisma.notice.create({
        data: {
            boardId,
            userId,
            category,
            title,
            content,
            isPinned,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
        },
    });
};

export const findNoticeList = async ({ boardId, page, limit, category, search }: FindNoticeListParams) => {
    const where = {
        boardId,
        ...(category ? { category } : {}),
        ...(search
            ? {
                  OR: [
                      { title: { contains: search, mode: 'insensitive' as const } },
                      { content: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {}),
    };

    const [notices, totalCount] = await Promise.all([
        prisma.notice.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
            include: {
                _count: {
                    select: {
                        comments: true,
                    },
                },
            },
        }),
        prisma.notice.count({ where }),
    ]);

    return { notices, totalCount };
};

export const findNoticeById = async (noticeId: bigint) => {
    return prisma.notice.findUnique({
        where: { id: noticeId },
        include: {
            board: true,
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    comments: true,
                },
            },
            comments: {
                orderBy: { createdAt: 'asc' },
                include: {
                    User: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
        },
    });
};

export const increaseViewCount = async (noticeId: bigint) => {
    return prisma.notice.update({
        where: { id: noticeId },
        data: {
            viewCount: {
                increment: 1,
            },
        },
    });
};

export const updateNotice = async ({ noticeId, data }: UpdateNoticeParams) => {
    return prisma.notice.update({
        where: { id: noticeId },
        data: {
            ...(data.boardId !== undefined ? { boardId: data.boardId } : {}),
            ...(data.category !== undefined ? { category: data.category } : {}),
            ...(data.title !== undefined ? { title: data.title } : {}),
            ...(data.content !== undefined ? { content: data.content } : {}),
            ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
            ...(data.startDate !== undefined ? { startDate: data.startDate ? new Date(data.startDate) : null } : {}),
            ...(data.endDate !== undefined ? { endDate: data.endDate ? new Date(data.endDate) : null } : {}),
        },
        include: {
            _count: {
                select: {
                    comments: true,
                },
            },
        },
    });
};

export const deleteNotice = async (noticeId: bigint) => {
    return prisma.notice.delete({
        where: { id: noticeId },
    });
};
