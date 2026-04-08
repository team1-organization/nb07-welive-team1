import { BoardType } from '../../generated/prisma';
import { CreateNoticeBodyDto, GetNoticeListQueryDto, UpdateNoticeBodyDto } from '../dtos/notice.dto';
import { BadRequestError } from '../errors/BadRequestError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { NotFoundError } from '../errors/NotFoundError';
import * as noticeRepository from '../repositories/notice.repository';
import { User } from '../types/auth.type';

const validateAdmin = (user: User) => {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenError('공지사항 처리 권한이 없습니다.');
    }
};

const validateNoticeBoard = async (boardId: bigint) => {
    const board = await noticeRepository.findBoardById(boardId);

    if (!board) {
        throw new NotFoundError('게시판을 찾을 수 없습니다.');
    }

    if (board.type !== BoardType.NOTICE) {
        throw new BadRequestError('공지사항 게시판이 아닙니다.');
    }

    return board;
};

export const createNotice = async ({ user, body }: { user: User; body: CreateNoticeBodyDto }) => {
    validateAdmin(user);

    await validateNoticeBoard(body.boardId);
    const notice = await noticeRepository.createNotice({
        ...body,
        userId: BigInt(user.id),
    });

    // TODO: 알림 기능 구현 후 공지 등록 알림 추가
    // await notificationService.createNoticeNotifications(...);

    return notice;
};

export const getNoticeList = async (query: GetNoticeListQueryDto & { boardId: bigint }) => {
    await validateNoticeBoard(query.boardId);

    const { notices, totalCount } = await noticeRepository.findNoticeList({
        boardId: query.boardId,
        page: query.page,
        limit: query.limit,
        category: query.category,
        search: query.search,
    });

    return {
        notices: notices.map((notice) => ({
            noticeId: notice.id.toString(),
            userId: notice.userId.toString(),
            category: notice.category,
            title: notice.title,
            writerName: notice.user.name,
            createdAt: notice.createdAt,
            updatedAt: notice.updatedAt,
            viewsCount: notice.viewCount,
            commentsCount: notice._count.comments,
            isPinned: notice.isPinned,
        })),
        totalCount,
    };
};
//상세조회
export const getNoticeDetail = async ({ noticeId }: { noticeId: bigint }) => {
    const notice = await noticeRepository.findNoticeById(noticeId);

    if (!notice) {
        throw new NotFoundError('공지사항을 찾을 수 없습니다.');
    }

    await noticeRepository.increaseViewCount(noticeId);

    return {
        noticeId: notice.id.toString(),
        userId: notice.userId.toString(),
        category: notice.category,
        title: notice.title,
        writerName: notice.user.name,
        createdAt: notice.createdAt,
        updatedAt: notice.updatedAt,
        viewsCount: notice.viewCount + 1, // ← +1만 해주면 됨
        commentsCount: notice._count.comments,
        isPinned: notice.isPinned,
        content: notice.content,
        boardName: notice.board.type,
        comments: notice.comments.map((comment) => ({
            id: comment.id.toString(),
            userId: comment.userId.toString(),
            content: comment.content,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            writerName: comment.User.name,
        })),
    };
};

export const updateNotice = async ({ user, noticeId, body }: { user: User; noticeId: bigint; body: UpdateNoticeBodyDto }) => {
    validateAdmin(user);

    const existingNotice = await noticeRepository.findNoticeById(noticeId);
    if (!existingNotice) {
        throw new NotFoundError('공지사항을 찾을 수 없습니다.');
    }

    if (body.boardId !== undefined) {
        await validateNoticeBoard(body.boardId);
    }
    const updated = await noticeRepository.updateNotice({
        noticeId,
        data: body,
    });
    return {
        noticeId: updated.id.toString(),
        userId: updated.userId.toString(),
        category: updated.category,
        title: updated.title,
        writerName: updated.user.name,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        viewsCount: updated.viewCount,
        commentsCount: updated._count.comments,
        isPinned: updated.isPinned,
    };
};

export const deleteNotice = async ({ user, noticeId }: { user: User; noticeId: bigint }) => {
    validateAdmin(user);

    const existingNotice = await noticeRepository.findNoticeById(noticeId);
    if (!existingNotice) {
        throw new NotFoundError('공지사항을 찾을 수 없습니다.');
    }

    await noticeRepository.deleteNotice(noticeId);
};
