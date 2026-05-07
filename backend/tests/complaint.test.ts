import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { ComplaintService } from '../src/services/complaint.service';

jest.mock('../src/services/notification.service', () => ({
    createNotification: jest.fn(),
}));
jest.mock('../src/lib/socket', () => ({}));
jest.mock('../src/lib/prisma', () => ({
    prisma: { $transaction: jest.fn() },
}));

jest.mock('../src/services/complaint.service');

const app = express();
app.use(express.json());

let mockUser: any = null;

app.use((req: Request, res: Response, next: NextFunction) => {
    (req as any).user = mockUser;
    next();
});

const mockedService = ComplaintService.prototype as jest.Mocked<ComplaintService>;

app.post('/api/complaints', async (req, res, next) => {
    try {
        const result = await mockedService.createComplaint((req as any).user, req.body);
        res.status(201).json({ message: '민원이 등록되었습니다.', data: result });
    } catch (e) { next(e); }
});

app.get('/api/complaints/:id', async (req, res, next) => {
    try {
        const result = await mockedService.getComplaintDetail(req.params.id, (req as any).user);
        const serialized = JSON.parse(JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v));
        res.status(200).json(serialized);
    } catch (e) { next(e); }
});

app.patch('/api/complaints/:id', async (req, res, next) => {
    try {
        const result = await mockedService.updateComplaint(req.params.id, (req as any).user, req.body);
        res.status(200).json({ message: '민원이 수정되었습니다.', data: result });
    } catch (e) { next(e); }
});

app.patch('/api/complaints/:id/status', async (req, res, next) => {
    try {
        const result = await mockedService.updateComplaintStatus(req.params.id, (req as any).user, req.body.status);
        res.status(200).json({ message: '상태가 변경되었습니다.', data: result });
    } catch (e) { next(e); }
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

describe('민원 API 예외 및 기본 검증 테스트', () => {
    const adminUser = { id: '1', role: 'ADMIN', apartmentId: '1' };
    const residentUser = { id: '2', role: 'USER', apartmentId: '1' };
    const otherUser = { id: '3', role: 'USER', apartmentId: '2' };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = null;
    });

    describe('1. 권한 검증 (Forbidden)', () => {
        it('실패: 본인이 작성하지 않은 민원을 수정하려고 하면 403을 반환해야 한다', async () => {
            mockUser = otherUser;
            mockedService.updateComplaint.mockRejectedValue({ status: 403, message: '본인이 작성한 민원만 수정할 수 있습니다.' });

            const res = await request(app)
                .patch('/api/complaints/1')
                .send({ title: '해킹 시도' });
            
            expect(res.status).toBe(403);
            expect(res.body.message).toContain('본인이 작성한');
        });

        it('실패: 일반 유저가 관리자 전용 API(상태 변경) 호출 시 거부되어야 한다', async () => {
            mockUser = residentUser;
            mockedService.updateComplaintStatus.mockRejectedValue({ status: 403, message: '관리자만 민원 상태를 변경할 수 있습니다.' });

            const res = await request(app)
                .patch('/api/complaints/1/status')
                .send({ status: 'PROCESSING' });
            
            expect(res.status).toBe(403);
            expect(res.body.message).toContain('관리자만');
        });
    });

    describe('2. 데이터 유효성 및 존재 여부', () => {
        it('실패: 민원 생성 시 필수 필드 누락 등으로 서비스 에러 발생 시 400을 반환한다', async () => {
            mockUser = residentUser;
            mockedService.createComplaint.mockRejectedValue({ status: 400, message: '필수 값이 누락되었습니다.' });

            const res = await request(app)
                .post('/api/complaints')
                .send({ content: '제목 없음' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('필수 값이 누락되었습니다.');
        });

        it('실패: 존재하지 않는 민원 ID로 상세 조회 시 404를 반환해야 한다', async () => {
            mockUser = residentUser;
            mockedService.getComplaintDetail.mockRejectedValue({ status: 404, message: '민원을 찾을 수 없습니다.' });

            const res = await request(app).get('/api/complaints/999');

            expect(res.status).toBe(404);
            expect(res.body.message).toBe('민원을 찾을 수 없습니다.');
        });
    });

    describe('3. 정상 흐름 확인', () => {
        it('성공: 작성자는 본인의 민원 상세 내용을 조회할 수 있어야 한다', async () => {
            mockUser = residentUser;
            const mockData = {
                id: BigInt(1),
                title: '기존 민원',
                content: '내용',
                status: 'PENDING',
                userId: BigInt(2)
            };
            mockedService.getComplaintDetail.mockResolvedValue(mockData as any);

            const res = await request(app).get('/api/complaints/1');

            expect(res.status).toBe(200);
            expect(res.body.title).toBe('기존 민원');
            expect(res.body.id).toBe('1');
        });
    });
});