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
                ...body,
            } as any);

            const result = await noticeService.createNotice({
                user: adminUser,
                body,
            });

            expect(mockedNoticeRepository.findBoardById).toHaveBeenCalledWith(1n);
            expect(mockedNoticeRepository.createNotice).toHaveBeenCalledWith({
                boardId: 1n,
                category: 'COMMUNITY',
                title: '테스트 공지',
                content: '공지 내용입니다',
                isPinned: true,
                startDate: null,
                endDate: null,
            });
            expect(result).toBeDefined();
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
    });
});