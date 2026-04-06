import { BadRequestError } from '../src/errors/BadRequestError';
import { ForbiddenError } from '../src/errors/ForbiddenError';
import { NotFoundError } from '../src/errors/NotFoundError';
import * as noticeRepository from '../src/repositories/notice.repository';
import * as noticeService from '../src/services/notice.service';

jest.mock('../src/repositories/notice.repository');

const mockedNoticeRepository = noticeRepository as jest.Mocked<typeof noticeRepository>;

describe('notice.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createNotice', () => {
        const adminUser = {
            id: '16',
            role: 'ADMIN',
            name: '관리자',
        } as any;

        const superAdminUser = {
            id: '17',
            role: 'SUPER_ADMIN',
            name: '슈퍼관리자',
        } as any;

        const normalUser = {
            id: '4',
            role: 'USER',
            name: '일반유저',
        } as any;

        const body = {
            boardId: 1n,
            category: 'COMMUNITY',
            title: '테스트 공지',
            content: '공지 내용입니다',
            isPinned: true,
            startDate: null,
            endDate: null,
        } as any;

        it('관리자는 공지를 등록할 수 있다', async () => {
            mockedNoticeRepository.findBoardById.mockResolvedValue({
                id: 1n,
                type: 'NOTICE',
                apartmentId: 1n,
            } as any);

            mockedNoticeRepository.createNotice.mockResolvedValue({
                id: 1n,
                userId: 16n,
                ...body,
            } as any);

            const result = await noticeService.createNotice({
                user: adminUser,
                body,
            });

            expect(mockedNoticeRepository.findBoardById).toHaveBeenCalledWith(1n);
            expect(mockedNoticeRepository.createNotice).toHaveBeenCalledWith({
                boardId: 1n,
                userId: 16n,
                category: 'COMMUNITY',
                title: '테스트 공지',
                content: '공지 내용입니다',
                isPinned: true,
                startDate: null,
                endDate: null,
            });
            expect(result).toBeDefined();
        });

        it('슈퍼관리자는 공지를 등록할 수 있다', async () => {
            mockedNoticeRepository.findBoardById.mockResolvedValue({
                id: 1n,
                type: 'NOTICE',
                apartmentId: 1n,
            } as any);

            mockedNoticeRepository.createNotice.mockResolvedValue({
                id: 2n,
                userId: 17n,
                ...body,
            } as any);

            await noticeService.createNotice({
                user: superAdminUser,
                body,
            });

            expect(mockedNoticeRepository.createNotice).toHaveBeenCalledWith({
                boardId: 1n,
                userId: 17n,
                category: 'COMMUNITY',
                title: '테스트 공지',
                content: '공지 내용입니다',
                isPinned: true,
                startDate: null,
                endDate: null,
            });
        });

        it('일반 유저는 공지를 등록할 수 없다', async () => {
            await expect(
                noticeService.createNotice({
                    user: normalUser,
                    body,
                }),
            ).rejects.toThrow(ForbiddenError);

            expect(mockedNoticeRepository.findBoardById).not.toHaveBeenCalled();
            expect(mockedNoticeRepository.createNotice).not.toHaveBeenCalled();
        });

        it('존재하지 않는 게시판이면 실패한다', async () => {
            mockedNoticeRepository.findBoardById.mockResolvedValue(null);

            await expect(
                noticeService.createNotice({
                    user: adminUser,
                    body,
                }),
            ).rejects.toThrow(NotFoundError);

            expect(mockedNoticeRepository.createNotice).not.toHaveBeenCalled();
        });

        it('NOTICE 게시판이 아니면 실패한다', async () => {
            mockedNoticeRepository.findBoardById.mockResolvedValue({
                id: 1n,
                type: 'COMPLAINT',
                apartmentId: 1n,
            } as any);

            await expect(
                noticeService.createNotice({
                    user: adminUser,
                    body,
                }),
            ).rejects.toThrow(BadRequestError);

            expect(mockedNoticeRepository.createNotice).not.toHaveBeenCalled();
        });
    });

    describe('getNoticeList', () => {
        it('공지 목록을 조회할 수 있다', async () => {
            mockedNoticeRepository.findBoardById.mockResolvedValue({
                id: 1n,
                type: 'NOTICE',
                apartmentId: 1n,
            } as any);

            mockedNoticeRepository.findNoticeList.mockResolvedValue({
                notices: [
                    {
                        id: 10n,
                        boardId: 1n,
                        category: 'COMMUNITY',
                        title: '목록 테스트',
                        createdAt: new Date('2026-04-03T00:00:00.000Z'),
                        updatedAt: new Date('2026-04-03T00:00:00.000Z'),
                        viewCount: 3,
                        isPinned: true,
                        _count: { comments: 2 },
                    },
                ],
                totalCount: 1,
            } as any);

            const result = await noticeService.getNoticeList({
                boardId: 1n,
                page: 1,
                limit: 10,
                category: undefined,
                search: undefined,
            } as any);

            expect(mockedNoticeRepository.findBoardById).toHaveBeenCalledWith(1n);
            expect(mockedNoticeRepository.findNoticeList).toHaveBeenCalledWith({
                boardId: 1n,
                page: 1,
                limit: 10,
                category: undefined,
                search: undefined,
            });

            expect(result.totalCount).toBe(1);
            expect(result.notices[0]).toMatchObject({
                noticeId: '10',
                boardId: '1',
                category: 'COMMUNITY',
                title: '목록 테스트',
                viewsCount: 3,
                commentsCount: 2,
                isPinned: true,
            });
        });

        it('공지 게시판이 아니면 목록 조회에 실패한다', async () => {
            mockedNoticeRepository.findBoardById.mockResolvedValue({
                id: 1n,
                type: 'COMPLAINT',
                apartmentId: 1n,
            } as any);

            await expect(
                noticeService.getNoticeList({
                    boardId: 1n,
                    page: 1,
                    limit: 10,
                } as any),
            ).rejects.toThrow(BadRequestError);

            expect(mockedNoticeRepository.findNoticeList).not.toHaveBeenCalled();
        });
    });

    describe('getNoticeDetail', () => {
        it('공지 상세를 조회할 수 있다', async () => {
            mockedNoticeRepository.findNoticeById
                .mockResolvedValueOnce({
                    id: 1n,
                    userId: 16n,
                    boardId: 1n,
                    category: 'COMMUNITY',
                    title: '상세 테스트',
                    content: '공지 상세 내용',
                    createdAt: new Date('2026-04-03T00:00:00.000Z'),
                    updatedAt: new Date('2026-04-03T00:00:00.000Z'),
                    viewCount: 3,
                    isPinned: true,
                    user: {
                        id: 16n,
                        name: '관리자',
                    },
                    board: {
                        id: 1n,
                        type: 'NOTICE',
                    },
                    _count: {
                        comments: 1,
                    },
                    comments: [
                        {
                            id: 100n,
                            userId: 4n,
                            content: '댓글입니다',
                            createdAt: new Date('2026-04-03T01:00:00.000Z'),
                            updatedAt: new Date('2026-04-03T01:00:00.000Z'),
                            User: {
                                id: 4n,
                                name: '일반유저',
                            },
                        },
                    ],
                } as any)
                .mockResolvedValueOnce({
                    id: 1n,
                    userId: 16n,
                    boardId: 1n,
                    category: 'COMMUNITY',
                    title: '상세 테스트',
                    content: '공지 상세 내용',
                    createdAt: new Date('2026-04-03T00:00:00.000Z'),
                    updatedAt: new Date('2026-04-03T00:00:00.000Z'),
                    viewCount: 4,
                    isPinned: true,
                    user: {
                        id: 16n,
                        name: '관리자',
                    },
                    board: {
                        id: 1n,
                        type: 'NOTICE',
                    },
                    _count: {
                        comments: 1,
                    },
                    comments: [
                        {
                            id: 100n,
                            userId: 4n,
                            content: '댓글입니다',
                            createdAt: new Date('2026-04-03T01:00:00.000Z'),
                            updatedAt: new Date('2026-04-03T01:00:00.000Z'),
                            User: {
                                id: 4n,
                                name: '일반유저',
                            },
                        },
                    ],
                } as any);

            mockedNoticeRepository.increaseViewCount.mockResolvedValue({} as any);

            const result = await noticeService.getNoticeDetail({ noticeId: 1n });

            expect(mockedNoticeRepository.findNoticeById).toHaveBeenNthCalledWith(1, 1n);
            expect(mockedNoticeRepository.increaseViewCount).toHaveBeenCalledWith(1n);
            expect(mockedNoticeRepository.findNoticeById).toHaveBeenNthCalledWith(2, 1n);

            expect(result).toMatchObject({
                noticeId: '1',
                userId: '16',
                category: 'COMMUNITY',
                title: '상세 테스트',
                writerName: '관리자',
                viewsCount: 4,
                commentsCount: 1,
                isPinned: true,
                content: '공지 상세 내용',
                boardName: 'NOTICE',
            });

            expect(result.comments[0]).toMatchObject({
                id: '100',
                userId: '4',
                content: '댓글입니다',
                writerName: '일반유저',
            });
        });

        it('존재하지 않는 공지면 실패한다', async () => {
            mockedNoticeRepository.findNoticeById.mockResolvedValue(null);

            await expect(noticeService.getNoticeDetail({ noticeId: 1n })).rejects.toThrow(NotFoundError);

            expect(mockedNoticeRepository.increaseViewCount).not.toHaveBeenCalled();
        });
    });

    describe('updateNotice', () => {
        const adminUser = {
            id: '16',
            role: 'ADMIN',
            name: '관리자',
        } as any;

        const normalUser = {
            id: '4',
            role: 'USER',
            name: '일반유저',
        } as any;

        it('관리자는 공지를 수정할 수 있다', async () => {
            mockedNoticeRepository.findNoticeById.mockResolvedValue({
                id: 1n,
                boardId: 1n,
            } as any);

            mockedNoticeRepository.updateNotice.mockResolvedValue({
                id: 1n,
                boardId: 1n,
                category: 'COMMUNITY',
                title: '수정된 제목',
                createdAt: new Date('2026-04-03T00:00:00.000Z'),
                updatedAt: new Date('2026-04-04T00:00:00.000Z'),
                viewCount: 10,
                isPinned: false,
                _count: {
                    comments: 2,
                },
            } as any);

            const result = await noticeService.updateNotice({
                user: adminUser,
                noticeId: 1n,
                body: {
                    title: '수정된 제목',
                },
            } as any);

            expect(mockedNoticeRepository.updateNotice).toHaveBeenCalledWith({
                noticeId: 1n,
                data: {
                    boardId: undefined,
                    category: undefined,
                    title: '수정된 제목',
                    content: undefined,
                    isPinned: undefined,
                    startDate: undefined,
                    endDate: undefined,
                },
            });

            expect(result).toMatchObject({
                noticeId: '1',
                boardId: '1',
                category: 'COMMUNITY',
                title: '수정된 제목',
                viewsCount: 10,
                commentsCount: 2,
                isPinned: false,
            });
        });

        it('일반 유저는 공지를 수정할 수 없다', async () => {
            await expect(
                noticeService.updateNotice({
                    user: normalUser,
                    noticeId: 1n,
                    body: {
                        title: '수정된 제목',
                    },
                } as any),
            ).rejects.toThrow(ForbiddenError);

            expect(mockedNoticeRepository.findNoticeById).not.toHaveBeenCalled();
            expect(mockedNoticeRepository.updateNotice).not.toHaveBeenCalled();
        });

        it('존재하지 않는 공지는 수정할 수 없다', async () => {
            mockedNoticeRepository.findNoticeById.mockResolvedValue(null);

            await expect(
                noticeService.updateNotice({
                    user: adminUser,
                    noticeId: 1n,
                    body: {
                        title: '수정된 제목',
                    },
                } as any),
            ).rejects.toThrow(NotFoundError);

            expect(mockedNoticeRepository.updateNotice).not.toHaveBeenCalled();
        });
    });

    describe('deleteNotice', () => {
        const adminUser = {
            id: '16',
            role: 'ADMIN',
            name: '관리자',
        } as any;

        const normalUser = {
            id: '4',
            role: 'USER',
            name: '일반유저',
        } as any;

        it('관리자는 공지를 삭제할 수 있다', async () => {
            mockedNoticeRepository.findNoticeById.mockResolvedValue({
                id: 1n,
            } as any);

            mockedNoticeRepository.deleteNotice.mockResolvedValue({} as any);

            await noticeService.deleteNotice({
                user: adminUser,
                noticeId: 1n,
            });

            expect(mockedNoticeRepository.findNoticeById).toHaveBeenCalledWith(1n);
            expect(mockedNoticeRepository.deleteNotice).toHaveBeenCalledWith(1n);
        });

        it('일반 유저는 공지를 삭제할 수 없다', async () => {
            await expect(
                noticeService.deleteNotice({
                    user: normalUser,
                    noticeId: 1n,
                }),
            ).rejects.toThrow(ForbiddenError);

            expect(mockedNoticeRepository.findNoticeById).not.toHaveBeenCalled();
            expect(mockedNoticeRepository.deleteNotice).not.toHaveBeenCalled();
        });

        it('존재하지 않는 공지는 삭제할 수 없다', async () => {
            mockedNoticeRepository.findNoticeById.mockResolvedValue(null);

            await expect(
                noticeService.deleteNotice({
                    user: adminUser,
                    noticeId: 1n,
                }),
            ).rejects.toThrow(NotFoundError);

            expect(mockedNoticeRepository.deleteNotice).not.toHaveBeenCalled();
        });
    });
});