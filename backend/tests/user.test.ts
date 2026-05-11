import bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';

jest.mock('../src/routers/image.router', () => {
    return express.Router();
});

import server from '../src/app';
import { prisma } from '../src/lib/prisma';
import { safeString } from '../src/utils/string.util';

describe('User API 통합 테스트', () => {
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
                apartmentName: `유저테스트아파트_${testIndex}`,
                apartmentAddress: '서울시 테스트구',
                apartmentManagementNumber: `54321_${testIndex}`,
                startComplexNumber: '1',
                endComplexNumber: '10',
                startDongNumber: '101',
                endDongNumber: '110',
                startFloorNumber: '1',
                endFloorNumber: '20',
                startHoNumber: '1',
                endHoNumber: '4',
            },
        });

        apartmentId = safeString(apartment.id);

        const adminPassword = 'admin123!';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const adminUserId = `user_admin_${testIndex}_${Date.now()}`;
        const adminEmail = `user_admin_${testIndex}_${Date.now()}@test.com`;

        await prisma.user.create({
            data: {
                userId: adminUserId,
                password: hashedPassword,
                name: '계정관리자',
                email: adminEmail,
                contact: `0107777${String(testIndex).padStart(4, '0')}`,
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

    describe('GET /api/users/resident-accounts', () => {
        it('관리자는 자기 아파트의 PENDING 입주민 계정 신청 목록을 조회할 수 있다', async () => {
            const resident1 = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '신청입주민1',
                    contact: '01011112222',
                    building: '101',
                    unitNumber: '1001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const resident2 = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '신청입주민2',
                    contact: '01033334444',
                    building: '102',
                    unitNumber: '1202',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            await prisma.user.create({
                data: {
                    userId: `pending_user_1_${testIndex}`,
                    password: 'hash',
                    name: '신청입주민1',
                    email: `pending_user_1_${testIndex}@test.com`,
                    contact: '01011112222',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '101',
                    unitNumber: '1001',
                    apartmentId: BigInt(apartmentId),
                    residentId: resident1.id,
                },
            });

            await prisma.user.create({
                data: {
                    userId: `pending_user_2_${testIndex}`,
                    password: 'hash',
                    name: '신청입주민2',
                    email: `pending_user_2_${testIndex}@test.com`,
                    contact: '01033334444',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '102',
                    unitNumber: '1202',
                    apartmentId: BigInt(apartmentId),
                    residentId: resident2.id,
                },
            });

            await prisma.user.create({
                data: {
                    userId: `approved_user_${testIndex}`,
                    password: 'hash',
                    name: '승인입주민',
                    email: `approved_user_${testIndex}@test.com`,
                    contact: '01055556666',
                    role: 'USER',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    building: '103',
                    unitNumber: '1303',
                    apartmentId: BigInt(apartmentId),
                },
            });

            const otherApartment = await prisma.apartment.create({
                data: {
                    apartmentName: `다른아파트_${testIndex}`,
                    apartmentAddress: '다른 주소',
                    apartmentManagementNumber: `99999_${testIndex}`,
                    startComplexNumber: '1',
                    endComplexNumber: '10',
                    startDongNumber: '101',
                    endDongNumber: '110',
                    startFloorNumber: '1',
                    endFloorNumber: '20',
                    startHoNumber: '1',
                    endHoNumber: '4',
                },
            });

            await prisma.user.create({
                data: {
                    userId: `other_pending_user_${testIndex}`,
                    password: 'hash',
                    name: '다른아파트입주민',
                    email: `other_pending_user_${testIndex}@test.com`,
                    contact: '01088889999',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '201',
                    unitNumber: '2001',
                    apartmentId: otherApartment.id,
                },
            });

            const response = await request(server).get('/api/users/resident-accounts').set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('입주민 계정 신청 목록 조회 성공');
            expect(response.body.count).toBe(2);
            expect(response.body.totalCount).toBe(2);
            expect(response.body.users).toHaveLength(2);
            expect(response.body.users[0]).toHaveProperty('id');
            expect(response.body.users[0]).toHaveProperty('userId');
            expect(response.body.users[0]).toHaveProperty('approvalStatus');
            expect(response.body.users[0]).toHaveProperty('isRegistered');
        });

        it('keyword, building, unitNumber 조건으로 필터링할 수 있다', async () => {
            const resident1 = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '홍길동',
                    contact: '01012341234',
                    building: '101',
                    unitNumber: '1001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const resident2 = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '김영희',
                    contact: '01099998888',
                    building: '102',
                    unitNumber: '1202',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            await prisma.user.createMany({
                data: [
                    {
                        userId: `resident_filter_user_1_${testIndex}`,
                        password: 'hash',
                        name: '홍길동',
                        email: `resident_filter_user_1_${testIndex}@test.com`,
                        contact: '01012341234',
                        role: 'USER',
                        joinStatus: 'PENDING',
                        isActive: false,
                        building: '101',
                        unitNumber: '1001',
                        apartmentId: BigInt(apartmentId),
                        residentId: resident1.id,
                    },
                    {
                        userId: `resident_filter_user_2_${testIndex}`,
                        password: 'hash',
                        name: '김영희',
                        email: `resident_filter_user_2_${testIndex}@test.com`,
                        contact: '01099998888',
                        role: 'USER',
                        joinStatus: 'PENDING',
                        isActive: false,
                        building: '102',
                        unitNumber: '1202',
                        apartmentId: BigInt(apartmentId),
                        residentId: resident2.id,
                    },
                ],
            });

            const response = await request(server)
                .get('/api/users/resident-accounts')
                .query({
                    keyword: '홍길동',
                    building: '101',
                    unitNumber: '1001',
                })
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.count).toBe(1);
            expect(response.body.totalCount).toBe(1);
            expect(response.body.users[0].name).toBe('홍길동');
            expect(response.body.users[0].building).toBe('101');
            expect(response.body.users[0].unitNumber).toBe('1001');
        });

        it('관리자가 아니면 403을 반환한다', async () => {
            const password = 'user1234!';
            const hashedPassword = await bcrypt.hash(password, 10);

            await prisma.user.create({
                data: {
                    userId: `normal_user_${testIndex}`,
                    password: hashedPassword,
                    name: '일반사용자',
                    email: `normal_user_${testIndex}@test.com`,
                    contact: '01022223333',
                    role: 'USER',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    apartmentId: BigInt(apartmentId),
                },
            });

            const loginRes = await request(server)
                .post('/api/auth/login')
                .send({
                    username: `normal_user_${testIndex}`,
                    password,
                });

            const response = await request(server).get('/api/users/resident-accounts').set('Authorization', `Bearer ${loginRes.body.accessToken}`);

            expect(response.status).toBe(403);
            expect(response.body.message).toBe('관리자만 접근 가능합니다.');
        });
    });

    describe('PATCH /api/users/resident-accounts/:userId', () => {
        it('관리자는 자기 아파트 입주민 계정을 수정할 수 있다', async () => {
            const resident = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '수정전입주민',
                    contact: '01011110000',
                    building: '101',
                    unitNumber: '1001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const user = await prisma.user.create({
                data: {
                    userId: `update_target_user_${testIndex}`,
                    password: 'hash',
                    name: '수정전입주민',
                    email: `update_target_user_${testIndex}@test.com`,
                    contact: '01011110000',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '101',
                    unitNumber: '1001',
                    apartmentId: BigInt(apartmentId),
                    residentId: resident.id,
                },
            });

            const response = await request(server)
                .patch(`/api/users/resident-accounts/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '수정후입주민',
                    email: `updated_target_user_${testIndex}@test.com`,
                    contact: '01099990000',
                    building: '105',
                    unitNumber: '1501',
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('입주민 계정 수정이 완료되었습니다.');
            expect(response.body.user.name).toBe('수정후입주민');
            expect(response.body.user.email).toBe(`updated_target_user_${testIndex}@test.com`);
            expect(response.body.user.contact).toBe('01099990000');
            expect(response.body.user.building).toBe('105');
            expect(response.body.user.unitNumber).toBe('1501');

            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
            });

            const updatedResident = await prisma.resident.findUnique({
                where: { id: resident.id },
            });

            expect(updatedUser?.name).toBe('수정후입주민');
            expect(updatedUser?.email).toBe(`updated_target_user_${testIndex}@test.com`);
            expect(updatedUser?.contact).toBe('01099990000');
            expect(updatedUser?.building).toBe('105');
            expect(updatedUser?.unitNumber).toBe('1501');

            expect(updatedResident?.name).toBe('수정후입주민');
            expect(updatedResident?.contact).toBe('01099990000');
            expect(updatedResident?.building).toBe('105');
            expect(updatedResident?.unitNumber).toBe('1501');
        });

        it('중복 이메일이면 400을 반환한다', async () => {
            const resident = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '이메일수정대상',
                    contact: '01012340000',
                    building: '101',
                    unitNumber: '1001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const user = await prisma.user.create({
                data: {
                    userId: `email_update_target_${testIndex}`,
                    password: 'hash',
                    name: '이메일수정대상',
                    email: `email_update_target_${testIndex}@test.com`,
                    contact: '01012340000',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '101',
                    unitNumber: '1001',
                    apartmentId: BigInt(apartmentId),
                    residentId: resident.id,
                },
            });

            await prisma.user.create({
                data: {
                    userId: `duplicated_email_user_${testIndex}`,
                    password: 'hash',
                    name: '중복이메일사용자',
                    email: `duplicated_email_user_${testIndex}@test.com`,
                    contact: '01056780000',
                    role: 'USER',
                    joinStatus: 'APPROVED',
                    isActive: true,
                    apartmentId: BigInt(apartmentId),
                },
            });

            const response = await request(server)
                .patch(`/api/users/resident-accounts/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: `duplicated_email_user_${testIndex}@test.com`,
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('이미 가입된 이메일입니다.');
        });

        it('다른 아파트 입주민 계정 수정은 404를 반환한다', async () => {
            const otherApartment = await prisma.apartment.create({
                data: {
                    apartmentName: `수정다른아파트_${testIndex}`,
                    apartmentAddress: '다른 주소',
                    apartmentManagementNumber: `77777_${testIndex}`,
                    startComplexNumber: '1',
                    endComplexNumber: '10',
                    startDongNumber: '101',
                    endDongNumber: '110',
                    startFloorNumber: '1',
                    endFloorNumber: '20',
                    startHoNumber: '1',
                    endHoNumber: '4',
                },
            });

            const otherResident = await prisma.resident.create({
                data: {
                    apartmentId: otherApartment.id,
                    name: '다른아파트입주민',
                    contact: '01055550000',
                    building: '201',
                    unitNumber: '2001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const otherUser = await prisma.user.create({
                data: {
                    userId: `other_apartment_update_user_${testIndex}`,
                    password: 'hash',
                    name: '다른아파트입주민',
                    email: `other_apartment_update_user_${testIndex}@test.com`,
                    contact: '01055550000',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '201',
                    unitNumber: '2001',
                    apartmentId: otherApartment.id,
                    residentId: otherResident.id,
                },
            });

            const response = await request(server)
                .patch(`/api/users/resident-accounts/${safeString(otherUser.id)}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: '수정시도',
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('입주민 계정을 찾을 수 없습니다.');
        });
    });

    describe('DELETE /api/users/resident-accounts/:userId', () => {
        it('관리자는 자기 아파트 입주민 계정을 삭제할 수 있다', async () => {
            const resident = await prisma.resident.create({
                data: {
                    apartmentId: BigInt(apartmentId),
                    name: '삭제대상입주민',
                    contact: '01077770000',
                    building: '101',
                    unitNumber: '1001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const user = await prisma.user.create({
                data: {
                    userId: `delete_target_user_${testIndex}`,
                    password: 'hash',
                    name: '삭제대상입주민',
                    email: `delete_target_user_${testIndex}@test.com`,
                    contact: '01077770000',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '101',
                    unitNumber: '1001',
                    apartmentId: BigInt(apartmentId),
                    residentId: resident.id,
                },
            });

            const response = await request(server)
                .delete(`/api/users/resident-accounts/${safeString(user.id)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('입주민 계정 삭제가 완료되었습니다.');

            const deletedUser = await prisma.user.findUnique({
                where: { id: user.id },
            });

            const updatedResident = await prisma.resident.findUnique({
                where: { id: resident.id },
            });

            expect(deletedUser).toBeNull();
            expect(updatedResident?.isRegistered).toBe(false);
        });

        it('다른 아파트 입주민 계정 삭제는 404를 반환한다', async () => {
            const otherApartment = await prisma.apartment.create({
                data: {
                    apartmentName: `삭제다른아파트_${testIndex}`,
                    apartmentAddress: '다른 주소',
                    apartmentManagementNumber: `88888_${testIndex}`,
                    startComplexNumber: '1',
                    endComplexNumber: '10',
                    startDongNumber: '101',
                    endDongNumber: '110',
                    startFloorNumber: '1',
                    endFloorNumber: '20',
                    startHoNumber: '1',
                    endHoNumber: '4',
                },
            });

            const otherResident = await prisma.resident.create({
                data: {
                    apartmentId: otherApartment.id,
                    name: '다른아파트삭제대상',
                    contact: '01044440000',
                    building: '301',
                    unitNumber: '3001',
                    isRegistered: true,
                    approvalStatus: 'PENDING',
                },
            });

            const otherUser = await prisma.user.create({
                data: {
                    userId: `other_apartment_delete_user_${testIndex}`,
                    password: 'hash',
                    name: '다른아파트삭제대상',
                    email: `other_apartment_delete_user_${testIndex}@test.com`,
                    contact: '01044440000',
                    role: 'USER',
                    joinStatus: 'PENDING',
                    isActive: false,
                    building: '301',
                    unitNumber: '3001',
                    apartmentId: otherApartment.id,
                    residentId: otherResident.id,
                },
            });

            const response = await request(server)
                .delete(`/api/users/resident-accounts/${safeString(otherUser.id)}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('입주민 계정을 찾을 수 없습니다.');
        });
    });
});
