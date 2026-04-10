import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import optionRouter from '../src/routers/option.router';
import pollRouter from '../src/routers/poll.router';
import { PollService } from '../src/services/poll.service';
import { AuthUser } from '../src/types/poll.type';

jest.mock('passport', () => ({
    authenticate: jest.fn(() => (req: Request, res: Response, next: NextFunction) => {
        next();
    }),
    use: jest.fn(),
}));

jest.mock('../src/services/poll.service');

const app = express();
app.use(express.json());

let mockUser: AuthUser | null = null;

app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).user = mockUser;
    next();
});

app.use('/api/polls', pollRouter);
app.use('/api/options', optionRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

describe('Poll 시스템 통합 테스트', () => {
    const mockedService = PollService.prototype as jest.Mocked<PollService>;

    const adminUser: AuthUser = { 
        id: '1', 
        role: 'ADMIN', 
        apartmentId: 'apt-uuid-123',
        residentDong: '', 
        boardId: { POLL: 'poll-board-id' } 
    };

    const residentUser: AuthUser = { 
        id: '2', 
        role: 'USER', 
        apartmentId: 'apt-uuid-123', 
        residentDong: '101',
        boardId: { POLL: 'poll-board-id' }
    };

    const otherResident: AuthUser = { 
        id: '3', 
        role: 'USER', 
        apartmentId: 'apt-uuid-123', 
        residentDong: '102',
        boardId: { POLL: 'poll-board-id' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/polls (투표 등록)', () => {
        it('성공: 관리자는 투표를 생성할 수 있다.', async () => {
            mockUser = adminUser;
            mockedService.createPoll.mockResolvedValue({ id: 1 } as any);

            const res = await request(app)
                .post('/api/polls')
                .send({
                    title: '엘리베이터 교체 건',
                    content: '내용',
                    startDate: new Date().toISOString(),
                    endDate: new Date().toISOString(),
                    options: ['찬성', '반대'],
                    apartmentId: '1'
                });
            expect(res.status).toBe(201);
            expect(res.body.message).toBe('투표가 등록되었습니다.');
        });

        it('실패: 일반 입주민은 투표를 생성할 수 없다.', async () => {
            mockUser = residentUser;
            mockedService.createPoll.mockRejectedValue(new Error('관리자만 투표를 생성할 수 있습니다.'));

            const res = await request(app).post('/api/polls').send({ apartmentId: '1' });
            expect(res.status).toBe(500);
            expect(res.body.message).toContain('관리자만 투표를 생성할 수 있습니다.');
        });
    });

    describe('GET /api/polls (목록 및 필터)', () => {
        it('성공: 입주민은 투표 목록을 볼 수 있다.', async () => {
            mockUser = residentUser;
            mockedService.getPolls.mockResolvedValue([] as any);

            const res = await request(app).get('/api/polls').query({ status: 'IN_PROGRESS' });
            expect(res.status).toBe(200);
        });
    });

    describe('POST /api/options/:optionId/vote (투표 실시)', () => {
        it('성공: 권한이 있는 입주민은 투표할 수 있다.', async () => {
            mockUser = residentUser;
            mockedService.vote.mockResolvedValue({ id: 100, userId: 2, optionId: 10 } as any);

            const res = await request(app)
                .post('/api/options/10/vote');

            expect(res.status).toBe(201);
            expect(res.body.message).toBe('투표가 완료되었습니다.');
        });

        it('실패: 다른 동 주민 전용 투표에는 참여할 수 없다.', async () => {
            mockUser = otherResident;
            mockedService.vote.mockRejectedValue(new Error('투표 권한이 없습니다.'));

            const res = await request(app)
                .post('/api/options/10/vote'); 
                
            expect(res.status).toBe(500);
            expect(res.text).toContain('투표 권한이 없습니다');
        });
    });

    describe('PATCH /api/polls/:pollId (수정 및 마감)', () => {
        it('실패: 이미 시작된 투표는 제목이나 내용을 수정할 수 없다.', async () => {
            mockUser = adminUser;
            mockedService.updatePoll.mockRejectedValue(new Error('시작된 투표의 내용은 수정할 수 없습니다.'));

            const res = await request(app)
                .patch('/api/polls/1')
                .send({ title: '수정 시도' });
            expect(res.status).toBe(500);
            expect(res.text).toContain('시작된 투표의 내용은 수정할 수 없습니다');
        });

        it('성공: 관리자는 투표를 마감할 수 있다.', async () => {
            mockUser = adminUser;
            mockedService.updatePoll.mockResolvedValue({ id: 1 } as any);

            const res = await request(app)
                .patch('/api/polls/1')
                .send({ status: 'CLOSED' });
            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/polls/:pollId (삭제)', () => {
        it('실패: 시작된 투표는 삭제할 수 없다.', async () => {
            mockUser = adminUser;
            mockedService.deletePoll.mockRejectedValue(new Error('시작된 투표는 삭제할 수 없습니다.'));

            const res = await request(app).delete('/api/polls/1');
            expect(res.status).toBe(500);
            expect(res.text).toContain('시작된 투표는 삭제할 수 없습니다');
        });
        
        it('성공: 시작 전인 투표는 삭제가 가능하다.', async () => {
            mockUser = adminUser;
            mockedService.deletePoll.mockResolvedValue({ id: 99 } as any);

            const res = await request(app).delete('/api/polls/99');
            expect(res.status).toBe(200);
        });
    });
});