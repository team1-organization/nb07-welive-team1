import bcrypt from 'bcrypt';
import request from 'supertest';
import server from '../src/app';
import { prisma } from '../src/lib/prisma';
import { safeString } from '../src/utils/string.util';

describe('Resident API 통합 테스트', () => {
    let apartmentId: string;
    let adminToken: string;
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
    let testIndex = 0;

    beforeAll(async () => {
        jest.setTimeout(20000);
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        await prisma.$connect();
    });

    beforeEach(async () => {
        testIndex += 1;

        await prisma.user.deleteMany();
        await prisma.resident.deleteMany();
        await prisma.board.deleteMany();
        await prisma.apartment.deleteMany();

        const apartment = await prisma.apartment.create({
            data: {
                apartmentName: `테스트아파트_${testIndex}`,
                apartmentAddress: '서울시 테스트구',
                apartmentManagementNumber: `12345_${testIndex}`,
            },
        });

        apartmentId = safeString(apartment.id);

        const adminPassword = 'admin123!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const unique = `${testIndex}_${Date.now()}`;

        const adminUserId = `resident_admin_${unique}`;
        const adminEmail = `resident_admin_${unique}@test.com`;

        await prisma.user.create({
            data: {
                userId: adminUserId,
                password: hashedPassword,
                name: '입주민관리자',
                email: adminEmail,
                contact: `0101234${String(testIndex).padStart(4, '0')}`,
                role: 'ADMIN',
                joinStatus: 'APPROVED',
                isActive: true,
                apartmentId: BigInt(apartmentId),
            },
        });

        const loginRes = await request(server).post('/api/auth/login').send({
            username: adminUserId,
            password: adminPassword,
        });

        adminToken = loginRes.body.accessToken;
    });

    afterAll(async () => {
        await prisma.$disconnect();
        consoleErrorSpy.mockRestore();
        jest.clearAllTimers();
        await new Promise((resolve) => setTimeout(resolve, 100));
    });

    describe('GET /api/residents/file/template', () => {
        it('입주민 업로드 템플릿을 다운로드한다', async () => {
            const response = await request(server).get('/api/residents/file/template').set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toMatch(/filename\*=UTF-8''/);
            expect(response.text).toBe('name,contact,building,unitNumber,isHouseholder\n');
        });
    });

    describe('POST /api/residents/from-file', () => {
        it('CSV 파일로 입주민을 등록한다', async () => {
            const csvContent =
                'name,contact,building,unitNumber,isHouseholder\n' +
                '홍길동,01012345678,101,1001,HOUSEHOLDER\n' +
                '김영희,01099998888,102,1202,HOUSEMEMBER\n';

            const response = await request(server)
                .post('/api/residents/from-file')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(csvContent, 'utf-8'), 'residents.csv');

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                message: '2명의 입주민이 등록되었습니다',
                count: 2,
            });

            const residents = await prisma.resident.findMany({
                where: {
                    apartmentId: BigInt(apartmentId),
                },
                orderBy: [{ building: 'asc' }, { unitNumber: 'asc' }],
            });

            expect(residents).toHaveLength(2);
            expect(residents[0]?.name).toBe('홍길동');
            expect(residents[0]?.contact).toBe('01012345678');
            expect(residents[0]?.building).toBe('101');
            expect(residents[0]?.unitNumber).toBe('1001');
            expect(residents[0]?.isHouseholder).toBe('HOUSEHOLDER');

            expect(residents[1]?.name).toBe('김영희');
            expect(residents[1]?.contact).toBe('01099998888');
            expect(residents[1]?.building).toBe('102');
            expect(residents[1]?.unitNumber).toBe('1202');
            expect(residents[1]?.isHouseholder).toBe('HOUSEMEMBER');
        });

        it('파일 양식이 올바르지 않으면 400을 반환한다', async () => {
            const csvContent = 'wrong,contact,building,unitNumber,isHouseholder\n' + '홍길동,01012345678,101,1001,HOUSEHOLDER\n';

            const response = await request(server)
                .post('/api/residents/from-file')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(csvContent, 'utf-8'), 'wrong.csv');

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('파일 양식이 올바르지 않습니다. 양식 다운로드 후 다시 업로드해주세요.');
        });

        it('파일이 없으면 400을 반환한다', async () => {
            const response = await request(server).post('/api/residents/from-file').set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('업로드할 파일을 선택해주세요.');
        });

        it('파일 안에 중복된 입주민 정보가 있으면 409를 반환한다', async () => {
            const csvContent =
                'name,contact,building,unitNumber,isHouseholder\n' +
                '홍길동,01012345678,101,1001,HOUSEHOLDER\n' +
                '홍길순,01012345678,101,1001,HOUSEMEMBER\n';

            const response = await request(server)
                .post('/api/residents/from-file')
                .set('Authorization', `Bearer ${adminToken}`)
                .attach('file', Buffer.from(csvContent, 'utf-8'), 'duplicated.csv');

            expect(response.status).toBe(409);
            expect(response.body.message).toBe('동, 호수, 연락처가 동일한 입주민 정보가 파일 안에 중복되어 있습니다.');
        });
    });

    describe('GET /api/residents/file', () => {
        beforeEach(async () => {
            await prisma.resident.createMany({
                data: [
                    {
                        apartmentId: BigInt(apartmentId),
                        name: '홍길동',
                        contact: '01012345678',
                        building: '101',
                        unitNumber: '1001',
                        residenceStatus: 'RESIDENCE',
                        isHouseholder: 'HOUSEHOLDER',
                        isRegistered: true,
                        approvalStatus: 'APPROVED',
                    },
                    {
                        apartmentId: BigInt(apartmentId),
                        name: '김영희',
                        contact: '01099998888',
                        building: '102',
                        unitNumber: '1202',
                        residenceStatus: 'NO_RESIDENCE',
                        isHouseholder: 'HOUSEMEMBER',
                        isRegistered: false,
                        approvalStatus: 'PENDING',
                    },
                ],
            });
        });

        it('입주민 목록 파일을 다운로드한다', async () => {
            const response = await request(server).get('/api/residents/file').set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toMatch(/filename\*=UTF-8''/);
            expect(response.text).toContain('building,unitNumber,name,contact,residenceStatus,isHouseholder,isRegistered');
            expect(response.text).toContain('101,1001,홍길동,01012345678,RESIDENCE,HOUSEHOLDER,true');
            expect(response.text).toContain('102,1202,김영희,01099998888,NO_RESIDENCE,HOUSEMEMBER,false');
        });

        it('필터 조건으로 입주민 목록 파일을 다운로드한다', async () => {
            const response = await request(server).get('/api/residents/file?building=101').set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.text).toContain('101,1001,홍길동,01012345678,RESIDENCE,HOUSEHOLDER,true');
            expect(response.text).not.toContain('102,1202,김영희,01099998888,NO_RESIDENCE,HOUSEMEMBER,false');
        });
    });

    describe('GET /api/residents', () => {
        beforeEach(async () => {
            await prisma.resident.createMany({
                data: [
                    {
                        apartmentId: BigInt(apartmentId),
                        name: '홍길동',
                        contact: '01012345678',
                        building: '101',
                        unitNumber: '1001',
                        residenceStatus: 'RESIDENCE',
                        isHouseholder: 'HOUSEHOLDER',
                        isRegistered: true,
                        approvalStatus: 'APPROVED',
                    },
                    {
                        apartmentId: BigInt(apartmentId),
                        name: '김영희',
                        contact: '01099998888',
                        building: '102',
                        unitNumber: '1202',
                        residenceStatus: 'NO_RESIDENCE',
                        isHouseholder: 'HOUSEMEMBER',
                        isRegistered: false,
                        approvalStatus: 'PENDING',
                    },
                ],
            });
        });

        it('입주민 목록을 조회한다', async () => {
            const response = await request(server).get('/api/residents').set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('입주민 목록 조회 성공');
            expect(response.body.count).toBe(2);
            expect(response.body.totalCount).toBe(2);
            expect(response.body.residents).toHaveLength(2);
        });
    });

    describe('POST /api/residents/from-users/:userId', () => {
        it('사용자 정보로 입주민을 생성하고 연결한다', async () => {
            const user = await prisma.user.create({
                data: {
                    userId: `from_user_${testIndex}`,
                    password: 'hash',
                    name: '사용자입주민',
                    email: `from_user_${testIndex}@test.com`,
                    contact: '01077778888',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '105',
                    unitNumber: '1501',
                    apartmentId: BigInt(apartmentId),
                },
            });

            const response = await request(server)
                .post(`/api/residents/from-users/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(201);
            expect(response.body.userId).toBe(safeString(user.id));
            expect(response.body.building).toBe('105');
            expect(response.body.unitNumber).toBe('1501');
            expect(response.body.isRegistered).toBe(true);

            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
            });

            expect(updatedUser?.residentId).not.toBeNull();
        });

        it('이미 resident와 연결된 사용자는 409를 반환한다', async () => {
            const resident = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '기존입주민',
                    contact: '01012121212',
                    building: '106',
                    unitNumber: '1601',
                    isRegistered: true,
                },
            });

            const user = await prisma.user.create({
                data: {
                    userId: `linked_user_${testIndex}`,
                    password: 'hash',
                    name: '기존연결사용자',
                    email: `linked_user_${testIndex}@test.com`,
                    contact: '01012121212',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '106',
                    unitNumber: '1601',
                    apartmentId: BigInt(apartmentId),
                    residentId: resident.id,
                },
            });

            const response = await request(server)
                .post(`/api/residents/from-users/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(409);
            expect(response.body.message).toBe('이미 입주민 명부와 연결된 사용자입니다.');
        });

        it('동/호 정보가 없는 사용자는 400을 반환한다', async () => {
            const user = await prisma.user.create({
                data: {
                    userId: `no_unit_user_${testIndex}`,
                    password: 'hash',
                    name: '동호없음',
                    email: `no_unit_user_${testIndex}@test.com`,
                    contact: '01034343434',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    apartmentId: BigInt(apartmentId),
                },
            });

            const response = await request(server)
                .post(`/api/residents/from-users/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('사용자 정보에 동/호 정보가 없습니다.');
        });

        it('이미 등록된 입주민 정보와 중복되면 409를 반환한다', async () => {
            await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '중복입주민',
                    contact: '01056565656',
                    building: '107',
                    unitNumber: '1701',
                },
            });

            const user = await prisma.user.create({
                data: {
                    userId: `duplicated_user_${testIndex}`,
                    password: 'hash',
                    name: '중복사용자',
                    email: `duplicated_user_${testIndex}@test.com`,
                    contact: '01056565656',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '107',
                    unitNumber: '1701',
                    apartmentId: BigInt(apartmentId),
                },
            });

            const response = await request(server)
                .post(`/api/residents/from-users/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(409);
            expect(response.body.message).toBe('이미 등록된 입주민입니다.');
        });
    });
});
