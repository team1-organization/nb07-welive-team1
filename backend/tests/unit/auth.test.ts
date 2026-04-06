import { prisma } from '../../src/lib/prisma';
import { safeString } from '../../src/utils/string.util';
import bcrypt from 'bcrypt';
import request from 'supertest';
import server from '../../src/app';
describe('Auth API 통합 테스트', () => {
    let apartmentId: string;
    let adminToken: string;
    let residentId: string;
    let superAdminToken: string;

    beforeAll(async () => {
        await prisma.$connect();
    });

    beforeEach(async () => {

        await prisma.user.deleteMany();
        await prisma.resident.deleteMany();
        await prisma.board.deleteMany();
        await prisma.apartment.deleteMany();

        const newApartment = await prisma.apartment.create({
            data: {
                apartmentName: '테스트아파트',
                apartmentAddress: '서울시 테스트구',
                apartmentManagementNumber: '12345',
            }
        });
        apartmentId = safeString(newApartment.id)
    })

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('1. 회원가입', () => {
        it('일반 유저가 가입하면 입주민 명부에 생성되고 PENDING 상태가 된다.', async () => {
            const signupData = {
                username: 'user01',
                password: 'password123!',
                name: '홍길동',
                email: 'user01@test.com',
                contact: '01012345678',
                apartmentName: '테스트아파트',
                apartmentDong: '101',
                apartmentHo: '101',
                role:'USER'
            };
            const response = await request(server)
                .post('/api/auth/signup')
                .send(signupData);

            expect(response.status).toBe(201);

            expect(response.body.username).toBe(signupData.username);
            expect(response.body.joinStatus).toBe('PENDING');
            const user = await prisma.user.findUnique({ where: { userId: 'user01' } });
            expect(user).toBeDefined();
        });

        it('이미 존재하는 아이디로 가입 시 400 에러를 반환한다.', async () => {
            await prisma.user.create({
                data: {
                    userId: 'existed',
                    password: 'password123!',
                    name: '기존유저',
                    email: 'old@test.com',
                    contact: '01000000000',
                    role: 'USER',
                    joinStatus: 'APPROVED',
                    isActive : true,
                }
            });
            const signupData = {
                username: 'existed',
                password: 'password123!',
                name: '새유저',
                email: 'new@test.com',
                contact: '01011112222',
                apartmentName: '테스트아파트',
                apartmentDong: '102',
                apartmentHo: '202',
                role:'USER',
                joinStatus: 'PENDING',
                isActive : false,
            };
            const response = await request(server)
                .post('/api/auth/signup')
                .send(signupData);

            expect(response.status).toBe(400);
            expect(response.body.message).toContain('이미 사용중인 아이디입니다');
        });
    });
    describe('2. 로그인', () => {
        it('올바른 비밀번호로 로그인하면 쿠키에 토큰이 설정된다.', async () => {
            const password = 'password123!';
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.create({
                data: {
                    userId: 'test_user2',
                    password: hashedPassword,
                    name: '이름',
                    email: 'login@test.com',
                    contact: '01099998888',
                    role: 'USER',
                    joinStatus: 'APPROVED',
                    isActive: true
                }
            });

            const response = await request(server)
                .post('/api/auth/login')
                .send({ username: 'test_user2', password });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });
    });
    describe('3. 입주민 상태 변경', () => {
        beforeEach(async () => {
            const adminPass = 'admin123!';
            const hashedAdminPass = await bcrypt.hash(adminPass, 10);
            await prisma.user.create({
                data: {
                    userId: 'admin01',
                    password: hashedAdminPass,
                    name: '관리자',
                    email: 'admin@test.com',
                    contact: '01055554444',
                    role: 'ADMIN',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    apartmentId: BigInt(apartmentId)
                }
            });
            const loginRes = await request(server)
                .post('/api/auth/login')
                .send({ username: 'admin01', password: adminPass });
            adminToken = loginRes.body.accessToken;

            const resident = await prisma.resident.create({
                data: {
                    name: '입주민',
                    contact: '01011112222',
                    building: '101',
                    unitNumber: '101',
                    apartmentId: BigInt(apartmentId),
                    approvalStatus: 'PENDING'
                }
            });
            residentId = safeString(resident.id);
            await prisma.user.create({
                data: {
                    userId: 'res01',
                    password: 'hash',
                    name: '입주민',
                    email: 'res@test.com',
                    contact: '01011112222',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    residentId: resident.id,
                    apartmentId: BigInt(apartmentId)
                }
            });
        })
        it('관리자가 아파트 입주민을 승인하면 User의 isActive가 true가 된다.', async () => {
            const response = await request(server)
                .patch(`/api/auth/residents/${residentId}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'APPROVED', isActive : true });

            expect(response.status).toBe(200);

            const updatedUser = await prisma.user.findFirst(
                { where: { residentId: BigInt(residentId) }
                });
            expect(updatedUser?.joinStatus).toBe('APPROVED');
            expect(updatedUser?.isActive).toBe(true);
        })
        it('다른 아파트 관리자가 승인을 시도하면 403 에러를 반환한다.', async () => {
            const otherApt = await prisma.apartment.create({
                data: {
                    apartmentName: '다른아파트',
                    apartmentAddress: '주소',
                    apartmentManagementNumber: '999'
                }
            });
            const otherAdminPass = 'pass!';
            await prisma.user.create({
                data: {
                    userId: 'otherAdmin',
                    password: await bcrypt.hash(otherAdminPass, 10),
                    name: '타관리자',
                    email: 'other@test.com',
                    contact: '0101',
                    role: 'ADMIN',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    apartmentId: otherApt.id
                }
            });
            const loginRes = await request(server)
                .post('/api/auth/login')
                .send({ username: 'otherAdmin', password: otherAdminPass });

            const otherToken = loginRes.body.accessToken;

            const response = await request(server)
                .patch(`/api/auth/residents/${residentId}/status`)
                .set('Authorization', `Bearer ${otherToken}`)
                .send({ status: 'APPROVED' });

            expect(response.status).toBe(403);
            expect(response.body.message).toContain('자신의 아파트');
        })
    })
    describe('4. 슈퍼 관리자 및 권한 테스트', () => {
        beforeEach(async () => {
            const spPass = 'super123!';
            await prisma.user.create({
                data: {
                    userId: 'super01',
                    password: await bcrypt.hash(spPass, 10),
                    name: '최고관리자',
                    email: 'super@test.com',
                    contact: '01011110000',
                    role: 'SUPER_ADMIN',
                    joinStatus: 'APPROVED',
                    isActive: true
                }
            });
            const loginRes = await request(server)
                .post('/api/auth/login')
                .send({ username: 'super01', password: spPass });

            superAdminToken = loginRes.body.accessToken;

            const normalAdminPass = 'normalAdmin123!';
            await prisma.user.create({
                data: {
                    userId: 'normalAdmin',
                    password: await bcrypt.hash(normalAdminPass, 10),
                    name: '일반관리자',
                    email: 'normaladmin@test.com',
                    contact: '01033334444',
                    role: 'ADMIN',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    apartmentId: BigInt(apartmentId),
                },
            });
            const adminLoginRes = await request(server)
                .post('/api/auth/login')
                .send({ username: 'normalAdmin', password: normalAdminPass });

            adminToken = adminLoginRes.body.accessToken;
        });
        it('슈퍼 관리자는 대기 중인 관리자를 승인할 수 있다.', async () => {

            const pendingAdmin  = await prisma.user.create({
                data: {
                    userId: 'pending_admin',
                    password: 'hash',
                    name: '대기관리자',
                    email: 'p_admin@test.com',
                    contact: '01022223333',
                    role: 'ADMIN',
                    joinStatus: 'PENDING',
                    isActive: false
                }
            });


            const response = await request(server)
                .patch(`/api/auth/admins/${safeString(pendingAdmin.id)}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'APPROVED' });

            expect(response.status).toBe(200);

            const updated = await prisma.user.findUnique({
                where: {
                    id: pendingAdmin.id
                }
            });
            expect(updated?.joinStatus).toBe('APPROVED');
            expect(updated?.isActive).toBe(true);
        });

        it('일반 관리자가 관리자 상태 변경 API를 호출하면 403을 반환한다.', async () => {
            const targetAdmin = await prisma.user.create({
                data: {
                    userId: 'target_admin',
                    password: 'hash',
                    name: '대상관리자',
                    email: 'target_admin@test.com',
                    contact: '01055556666',
                    role: 'ADMIN',
                    joinStatus: 'PENDING',
                    isActive: false,
                },
            });
            const response = await request(server)
                .patch(`/api/auth/admins/${safeString(targetAdmin.id)}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'APPROVED' });

            expect(response.status).toBe(403);
        });
    })
    describe('5. 거절 계정 정리 (Cleanup)', () => {
        let cleanAdminToken: string; // 이 블록 전용 토큰

        beforeEach(async () => {
            // 1. 관리자 생성
            const adminPass = 'admin123!';
            await prisma.user.create({
                data: {
                    userId: 'cleanAdmin',
                    password: await bcrypt.hash(adminPass, 10),
                    name: '정리관리자',
                    email: 'clean@test.com',
                    contact: '01011112222',
                    role: 'ADMIN',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    apartmentId: BigInt(apartmentId)
                }
            });

            const loginRes = await request(server)
                .post('/api/auth/login')
                .send({ username: 'cleanAdmin', password: adminPass });
            cleanAdminToken = loginRes.body.accessToken;
        });
        it('관리자가 자기 아파트의 거절된 유저를 일괄 삭제한다.', async () => {
            // 거절된 유저 생성
            const testPass = 'admin123!';
            await prisma.user.create({
                data: {
                    userId: 'rejected_user',
                    password: await bcrypt.hash(testPass, 10),
                    name: '삭제테스트',
                    email: 'rejected@test.com',
                    contact: '01011112222',
                    role: 'USER',
                    joinStatus: 'REJECTED',
                    isActive: true,
                    apartmentId: BigInt(apartmentId)
                }
            });

            const response = await request(server)
                .post('/api/auth/cleanup')
                .set('Authorization', `Bearer ${cleanAdminToken}`);

            expect(response.status).toBe(200);

            const user = await prisma.user.findUnique({
                where: {
                    userId: 'rejected_user'
                }
            });
            expect(user).toBeNull();
        });
    })
})






