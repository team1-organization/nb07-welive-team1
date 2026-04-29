// import { User } from 'src/types/auth.type';
// import { BadRequestError } from '../src/errors/BadRequestError';
// import { ForbiddenError } from '../src/errors/ForbiddenError';
// import { NotFoundError } from '../src/errors/NotFoundError';
// import * as noticeRepository from '../src/repositories/notice.repository';
// import * as noticeService from '../src/services/notice.service';
//
//
// jest.mock('../src/repositories/notice.repository');
//
// const mockedNoticeRepository = noticeRepository as jest.Mocked<typeof noticeRepository>;
//
// describe('notice.service', () => {
//     const adminUser = {
//         id: '16',
//         role: 'ADMIN',
//         name: '관리자',
//     } as unknown as User;
//
//     const superAdminUser  = {
//         id: '17',
//         role: 'SUPER_ADMIN',
//         name: '슈퍼관리자',
//     } as unknown as User;
//
//     const normalUser  = {
//         id: '4',
//         role: 'USER',
//         name: '일반유저',
//     } as unknown as User;
//
//     const body = {
//         boardId: 1n,
//         category: 'COMMUNITY' as const,
//         title: '테스트 공지',
//         content: '공지 내용입니다',
//         isPinned: true,
//         startDate: null,
//         endDate: null,
//     };
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });
//
//     describe('createNotice', () => {
//
//
//         it('관리자는 공지를 등록할 수 있다', async () => {
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 1n,
//                 type: 'NOTICE',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//             });
//
//             mockedNoticeRepository.createNotice.mockResolvedValue({
//                 id: 1n,
//                 ...body,
//                 userId: 16n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//                 viewCount : 0,
//                 category: 'COMMUNITY',
//             });
//
//             const result = await noticeService.createNotice({
//                 user: adminUser,
//                 body,
//             });
//
//             expect(mockedNoticeRepository.findBoardById).toHaveBeenCalledWith(1n);
//             expect(mockedNoticeRepository.createNotice).toHaveBeenCalledWith({
//                 ...body,
//                 userId: 16n,
//             });
//             expect(result).toBeDefined();
//         });
//
//         it('슈퍼관리자는 공지를 등록할 수 있다', async () => {
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 1n,
//                 type: 'NOTICE',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//             });
//
//             mockedNoticeRepository.createNotice.mockResolvedValue({
//                 id: 2n,
//                 ...body,
//                 userId: 17n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//                 viewCount : 0,
//                 category: 'COMMUNITY',
//             });
//
//             await noticeService.createNotice({
//                 user: superAdminUser,
//                 body,
//             });
//
//             expect(mockedNoticeRepository.createNotice).toHaveBeenCalledWith({
//                 ...body,
//                 userId: 17n,
//             });
//         });
//
//         it('일반 유저는 공지를 등록할 수 없다', async () => {
//             await expect(
//                 noticeService.createNotice({
//                     user: normalUser,
//                     body,
//                 }),
//             ).rejects.toThrow(ForbiddenError);
//
//             expect(mockedNoticeRepository.findBoardById).not.toHaveBeenCalled();
//             expect(mockedNoticeRepository.createNotice).not.toHaveBeenCalled();
//         });
//
//         it('존재하지 않는 게시판이면 실패한다', async () => {
//             mockedNoticeRepository.findBoardById.mockResolvedValue(null);
//
//             await expect(
//                 noticeService.createNotice({
//                     user: adminUser,
//                     body,
//                 }),
//             ).rejects.toThrow(NotFoundError);
//
//             expect(mockedNoticeRepository.createNotice).not.toHaveBeenCalled();
//         });
//
//         it('NOTICE 게시판이 아니면 실패한다', async () => {
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 1n,
//                 type: 'COMPLAINT',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//             });
//
//             await expect(
//                 noticeService.createNotice({
//                     user: adminUser,
//                     body,
//                 }),
//             ).rejects.toThrow(BadRequestError);
//
//             expect(mockedNoticeRepository.createNotice).not.toHaveBeenCalled();
//         });
//     });
//
//     describe('getNoticeList', () => {
//         it('공지 목록을 조회할 수 있다', async () => {
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 1n,
//                 type: 'NOTICE',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//             });
//
//             mockedNoticeRepository.findNoticeList.mockResolvedValue({
//                 notices: [
//                     {
//                         id: 10n,
//                         userId: 16n,
//                         boardId: 1n,
//                         category: 'COMMUNITY',
//                         title: '목록 테스트',
//                         createdAt: new Date('2026-04-03T00:00:00.000Z'),
//                         updatedAt: new Date('2026-04-03T00:00:00.000Z'),
//                         viewCount: 3,
//                         isPinned: true,
//                         user: { name: '관리자' },
//                         _count: { comments: 2 },
//                     },
//                 ],
//                 totalCount: 1,
//             });
//
//             const result = await noticeService.getNoticeList({
//                 boardId: 1n,
//                 page: 1,
//                 limit: 10,
//                 category: undefined,
//                 search: undefined,
//             }, adminUser.id);
//
//             expect(mockedNoticeRepository.findBoardById).toHaveBeenCalledWith(1n);
//             expect(mockedNoticeRepository.findNoticeList).toHaveBeenCalledWith({
//                 boardId: 1n,
//                 page: 1,
//                 limit: 10,
//                 category: undefined,
//                 search: undefined,
//             });
//
//             expect(result.totalCount).toBe(1);
//             expect(result.notices[0]).toMatchObject({
//                 noticeId: '10',
//                 userId: '16',
//                 category: 'COMMUNITY',
//                 title: '목록 테스트',
//                 writerName: '관리자',
//                 viewsCount: 3,
//                 commentsCount: 2,
//                 isPinned: true,
//             });
//         });
//
//         it('공지 게시판이 아니면 목록 조회에 실패한다', async () => {
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 1n,
//                 type: 'COMPLAINT',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt : new Date(),
//             });
//
//             await expect(
//                 noticeService.getNoticeList({
//                     boardId: 1n,
//                     page: 1,
//                     limit: 10,
//                 }),
//             ).rejects.toThrow(BadRequestError);
//
//             expect(mockedNoticeRepository.findNoticeList).not.toHaveBeenCalled();
//         });
//     });
//
//     describe('getNoticeDetail', () => {
//         const mockNotice = {
//             id: 1n,
//             userId: 16n,
//             boardId: 1n,
//             category: 'COMMUNITY',
//             title: '상세 테스트',
//             content: '공지 상세 내용',
//             createdAt: new Date('2026-04-03T00:00:00.000Z'),
//             updatedAt: new Date('2026-04-03T00:00:00.000Z'),
//             viewCount: 3,
//             isPinned: true,
//             user: { id: 16n, name: '관리자' },
//             board: { id: 1n, type: 'NOTICE' },
//             _count: { comments: 1 },
//             comments: [
//                 {
//                     id: 100n,
//                     userId: 4n,
//                     content: '댓글입니다',
//                     createdAt: new Date('2026-04-03T01:00:00.000Z'),
//                     updatedAt: new Date('2026-04-03T01:00:00.000Z'),
//                     User: { id: 4n, name: '일반유저' },
//                 },
//             ],
//         };
//
//         it('공지 상세를 조회할 수 있다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue(mockNotice);
//             mockedNoticeRepository.increaseViewCount.mockResolvedValue({});
//
//             const result = await noticeService.getNoticeDetail({ noticeId: 1n });
//
//             expect(mockedNoticeRepository.findNoticeById).toHaveBeenCalledTimes(1);
//             expect(mockedNoticeRepository.findNoticeById).toHaveBeenCalledWith(1n);
//             expect(mockedNoticeRepository.increaseViewCount).toHaveBeenCalledWith(1n);
//
//             expect(result).toMatchObject({
//                 noticeId: '1',
//                 userId: '16',
//                 category: 'COMMUNITY',
//                 title: '상세 테스트',
//                 writerName: '관리자',
//                 viewsCount: 4,
//                 commentsCount: 1,
//                 isPinned: true,
//                 content: '공지 상세 내용',
//                 boardName: 'NOTICE',
//             });
//
//             expect(result.comments[0]).toMatchObject({
//                 id: '100',
//                 userId: '4',
//                 content: '댓글입니다',
//                 writerName: '일반유저',
//             });
//         });
//
//         it('존재하지 않는 공지면 실패한다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue(null);
//
//             await expect(noticeService.getNoticeDetail({ noticeId: 1n })).rejects.toThrow(NotFoundError);
//
//             expect(mockedNoticeRepository.increaseViewCount).not.toHaveBeenCalled();
//         });
//     });
//
//     describe('updateNotice', () => {
//         const adminUser = {
//             id: '16',
//             role: 'ADMIN',
//             name: '관리자',
//         } as any;
//
//         const normalUser = {
//             id: '4',
//             role: 'USER',
//             name: '일반유저',
//         } as any;
//
//         it('관리자는 공지를 수정할 수 있다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue({
//                 id: 1n,
//                 boardId: 1n,
//             } as any);
//
//             mockedNoticeRepository.updateNotice.mockResolvedValue({
//                 id: 1n,
//                 userId: 16n,
//                 boardId: 1n,
//                 category: 'COMMUNITY',
//                 title: '수정된 제목',
//                 createdAt: new Date('2026-04-03T00:00:00.000Z'),
//                 updatedAt: new Date('2026-04-04T00:00:00.000Z'),
//                 viewCount: 10,
//                 isPinned: false,
//                 user: { id: 16n, name: '관리자' },
//                 _count: { comments: 2 },
//             } as any);
//
//             const body = { title: '수정된 제목' };
//
//             const result = await noticeService.updateNotice({
//                 user: adminUser,
//                 noticeId: 1n,
//                 body,
//             } as any);
//
//             expect(mockedNoticeRepository.updateNotice).toHaveBeenCalledWith({
//                 noticeId: 1n,
//                 data: body,
//             });
//
//             expect(result).toMatchObject({
//                 noticeId: '1',
//                 userId: '16',
//                 category: 'COMMUNITY',
//                 title: '수정된 제목',
//                 writerName: '관리자',
//                 viewsCount: 10,
//                 commentsCount: 2,
//                 isPinned: false,
//             });
//         });
//
//         it('일반 유저는 공지를 수정할 수 없다', async () => {
//             await expect(
//                 noticeService.updateNotice({
//                     user: normalUser,
//                     noticeId: 1n,
//                     body: { title: '수정된 제목' },
//                 }),
//             ).rejects.toThrow(ForbiddenError);
//
//             expect(mockedNoticeRepository.findNoticeById).not.toHaveBeenCalled();
//             expect(mockedNoticeRepository.updateNotice).not.toHaveBeenCalled();
//         });
//
//         it('존재하지 않는 공지는 수정할 수 없다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue(null);
//
//             await expect(
//                 noticeService.updateNotice({
//                     user: adminUser,
//                     noticeId: 1n,
//                     body: { title: '수정된 제목' },
//                 }),
//             ).rejects.toThrow(NotFoundError);
//
//             expect(mockedNoticeRepository.updateNotice).not.toHaveBeenCalled();
//         });
//
//         it('boardId가 있으면 게시판 유효성 검사를 한다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue({
//                 id: 1n,
//                 boardId: 1n,
//
//             });
//
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 2n,
//                 type: 'NOTICE',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//             });
//
//             mockedNoticeRepository.updateNotice.mockResolvedValue({
//                 id: 1n,
//                 userId: 16n,
//                 boardId: 2n,
//                 category: 'COMMUNITY',
//                 title: '제목',
//                 createdAt: new Date('2026-04-03T00:00:00.000Z'),
//                 updatedAt: new Date('2026-04-04T00:00:00.000Z'),
//                 viewCount: 0,
//                 isPinned: false,
//                 user: { id: 16n, name: '관리자' },
//                 _count: { comments: 0 },
//             });
//
//             await noticeService.updateNotice({
//                 user: adminUser,
//                 noticeId: 1n,
//                 body: { boardId: 2n },
//             });
//
//             expect(mockedNoticeRepository.findBoardById).toHaveBeenCalledWith(2n);
//         });
//
//         it('NOTICE 게시판이 아닌 boardId로 수정하면 실패한다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue({
//                 id: 1n,
//                 boardId: 1n,
//             });
//
//             mockedNoticeRepository.findBoardById.mockResolvedValue({
//                 id: 2n,
//                 type: 'COMPLAINT',
//                 apartmentId: 1n,
//                 createdAt : new Date(),
//                 updatedAt: new Date(),
//             });
//
//             await expect(
//                 noticeService.updateNotice({
//                     user: adminUser,
//                     noticeId: 1n,
//                     body: { boardId: 2n },
//                 }),
//             ).rejects.toThrow(BadRequestError);
//
//             expect(mockedNoticeRepository.updateNotice).not.toHaveBeenCalled();
//         });
//     });
//
//     describe('deleteNotice', () => {
//         const adminUser = {
//             id: '16',
//             role: 'ADMIN',
//             name: '관리자',
//         };
//
//         const normalUser = {
//             id: '4',
//             role: 'USER',
//             name: '일반유저',
//         };
//
//         it('관리자는 공지를 삭제할 수 있다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue({
//                 id: 1n,
//             });
//
//             mockedNoticeRepository.deleteNotice.mockResolvedValue({});
//
//             await noticeService.deleteNotice({
//                 user: adminUser,
//                 noticeId: 1n,
//             });
//
//             expect(mockedNoticeRepository.findNoticeById).toHaveBeenCalledWith(1n);
//             expect(mockedNoticeRepository.deleteNotice).toHaveBeenCalledWith(1n);
//         });
//
//         it('일반 유저는 공지를 삭제할 수 없다', async () => {
//             await expect(
//                 noticeService.deleteNotice({
//                     user: normalUser,
//                     noticeId: 1n,
//                 }),
//             ).rejects.toThrow(ForbiddenError);
//
//             expect(mockedNoticeRepository.findNoticeById).not.toHaveBeenCalled();
//             expect(mockedNoticeRepository.deleteNotice).not.toHaveBeenCalled();
//         });
//
//         it('존재하지 않는 공지는 삭제할 수 없다', async () => {
//             mockedNoticeRepository.findNoticeById.mockResolvedValue(null);
//
//             await expect(
//                 noticeService.deleteNotice({
//                     user: adminUser,
//                     noticeId: 1n,
//                 }),
//             ).rejects.toThrow(NotFoundError);
//
//             expect(mockedNoticeRepository.deleteNotice).not.toHaveBeenCalled();
//         });
//     });
// });