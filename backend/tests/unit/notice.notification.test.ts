import { BadRequestError } from '../../src/errors/BadRequestError';
import { ForbiddenError } from '../../src/errors/ForbiddenError';
import { NotFoundError } from '../../src/errors/NotFoundError';
import socket from '../../src/lib/socket';
import * as authRepository from '../../src/repositories/auth.repository';
import * as noticeRepository from '../../src/repositories/notice.repository';
import * as notificationRepository from '../../src/repositories/notification.repository';
import { createNotice } from '../../src/services/notice.service';

jest.mock('../../src/repositories/notice.repository');
jest.mock('../../src/repositories/auth.repository');
jest.mock('../../src/repositories/notification.repository');
jest.mock('../../src/lib/socket');

describe('createNotice notification', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('공지 등록 후 같은 아파트 USER에게 NOTICE 알림을 일괄 생성하고 소켓 전송한다', async () => {
        const mockAdmin = { id: '1', role: 'ADMIN' } as any;

        const mockBoard = {
            id: BigInt(10),
            apartmentId: BigInt(100),
            type: 'NOTICE',
        };

        const mockNotice = {
            id: BigInt(999),
            title: '테스트 공지',
        };

        const mockUsers = [{ id: BigInt(2) }, { id: BigInt(3) }];

        (noticeRepository.findBoardById as jest.Mock).mockResolvedValue(mockBoard);
        (noticeRepository.createNotice as jest.Mock).mockResolvedValue(mockNotice);
        (authRepository.findUsersByRole as jest.Mock).mockResolvedValue(mockUsers);
        (notificationRepository.createManyNotification as jest.Mock).mockResolvedValue([]);

        await createNotice({
            user: mockAdmin,
            body: {
                boardId: BigInt(10),
                category: 'EMERGENCY',
                title: '테스트 공지',
                content: '내용',
                isPinned: false,
            },
        } as any);

        expect(authRepository.findUsersByRole).toHaveBeenCalledWith('USER', '100');

        expect(notificationRepository.createManyNotification).toHaveBeenCalledWith([
            {
                type: 'NOTICE',
                content: '[공지] 테스트 공지',
                referenceId: '999',
                userId: '2',
            },
            {
                type: 'NOTICE',
                content: '[공지] 테스트 공지',
                referenceId: '999',
                userId: '3',
            },
        ]);

        expect(socket.broadcastToRoom).toHaveBeenCalledWith(
            'A:100:USER',
            expect.objectContaining({
                type: 'NOTICE',
                content: '[공지] 테스트 공지',
                referenceId: '999',
                isRead: false,
            }),
        );
    });

    it('같은 아파트 USER가 없으면 알림을 생성하거나 전송하지 않는다', async () => {
        const mockAdmin = { id: '1', role: 'ADMIN' } as any;

        const mockBoard = {
            id: BigInt(10),
            apartmentId: BigInt(100),
            type: 'NOTICE',
        };

        const mockNotice = {
            id: BigInt(999),
            title: '테스트 공지',
        };

        (noticeRepository.findBoardById as jest.Mock).mockResolvedValue(mockBoard);
        (noticeRepository.createNotice as jest.Mock).mockResolvedValue(mockNotice);
        (authRepository.findUsersByRole as jest.Mock).mockResolvedValue([]);

        await createNotice({
            user: mockAdmin,
            body: {
                boardId: BigInt(10),
                category: 'EMERGENCY',
                title: '테스트 공지',
                content: '내용',
                isPinned: false,
            },
        } as any);

        expect(authRepository.findUsersByRole).toHaveBeenCalledWith('USER', '100');
        expect(notificationRepository.createManyNotification).not.toHaveBeenCalled();
        expect(socket.broadcastToRoom).not.toHaveBeenCalled();
    });
});
it('관리자가 아닌 사용자는 공지를 등록할 수 없다', async () => {
    const mockUser = {
        id: '2',
        role: 'USER',
    } as any;

    await expect(
        createNotice({
            user: mockUser,
            body: {
                boardId: BigInt(10),
                category: 'EMERGENCY',
                title: '테스트 공지',
                content: '내용',
                isPinned: false,
            },
        } as any),
    ).rejects.toThrow(ForbiddenError);

    expect(noticeRepository.findBoardById).not.toHaveBeenCalled();
    expect(noticeRepository.createNotice).not.toHaveBeenCalled();
    expect(notificationRepository.createManyNotification).not.toHaveBeenCalled();
    expect(socket.broadcastToRoom).not.toHaveBeenCalled();
});

it('공지 게시판이 없으면 실패한다', async () => {
    const mockAdmin = {
        id: '1',
        role: 'ADMIN',
    } as any;

    (noticeRepository.findBoardById as jest.Mock).mockResolvedValue(null);

    await expect(
        createNotice({
            user: mockAdmin,
            body: {
                boardId: BigInt(10),
                category: 'EMERGENCY',
                title: '테스트 공지',
                content: '내용',
                isPinned: false,
            },
        } as any),
    ).rejects.toThrow(NotFoundError);

    expect(noticeRepository.createNotice).not.toHaveBeenCalled();
    expect(notificationRepository.createManyNotification).not.toHaveBeenCalled();
    expect(socket.broadcastToRoom).not.toHaveBeenCalled();
});

it('NOTICE 게시판이 아니면 실패한다', async () => {
    const mockAdmin = {
        id: '1',
        role: 'ADMIN',
    } as any;

    const mockBoard = {
        id: BigInt(10),
        apartmentId: BigInt(100),
        type: 'COMPLAINT',
    };

    (noticeRepository.findBoardById as jest.Mock).mockResolvedValue(mockBoard);

    await expect(
        createNotice({
            user: mockAdmin,
            body: {
                boardId: BigInt(10),
                category: 'EMERGENCY',
                title: '테스트 공지',
                content: '내용',
                isPinned: false,
            },
        } as any),
    ).rejects.toThrow(BadRequestError);

    expect(noticeRepository.createNotice).not.toHaveBeenCalled();
    expect(notificationRepository.createManyNotification).not.toHaveBeenCalled();
    expect(socket.broadcastToRoom).not.toHaveBeenCalled();
});