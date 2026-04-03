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
        boardId: body.boardId,
        category: body.category,
        title: body.title,
        content: body.content,
        isPinned: body.isPinned,
        startDate: body.startDate,
        endDate: body.endDate,
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
            category: notice.category,
            title: notice.title,
            createdAt: notice.createdAt,
            updatedAt: notice.updatedAt,
            viewsCount: notice.viewCount,
            commentsCount: notice._count.comments,
            isPinned: notice.isPinned,
            boardId: notice.boardId.toString(),
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

    const updatedNotice = await noticeRepository.findNoticeById(noticeId);
    if (!updatedNotice) {
        throw new NotFoundError('공지사항을 찾을 수 없습니다.');
    }

    return {
        noticeId: updatedNotice.id.toString(),
        category: updatedNotice.category,
        title: updatedNotice.title,
        content: updatedNotice.content,
        createdAt: updatedNotice.createdAt,
        updatedAt: updatedNotice.updatedAt,
        viewsCount: updatedNotice.viewCount,
        commentsCount: updatedNotice._count.comments,
        isPinned: updatedNotice.isPinned,
        boardId: updatedNotice.boardId.toString(),
        comments: updatedNotice.comments.map((comment) => ({
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
        data: {
            boardId: body.boardId,
            category: body.category,
            title: body.title,
            content: body.content,
            isPinned: body.isPinned,
            startDate: body.startDate,
            endDate: body.endDate,
        },
    });

    return {
        noticeId: updated.id.toString(),
        category: updated.category,
        title: updated.title,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        viewsCount: updated.viewCount,
        commentsCount: updated._count.comments,
        isPinned: updated.isPinned,
        boardId: updated.boardId.toString(),
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
