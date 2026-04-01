import {
    CreateComplaintReqDto,
    DeleteComplaintReqDto,
    GetComplaintDetailReqDto,
    GetComplaintListReqDto,
    UpdateComplaintReqDto,
    UpdateComplaintStatusReqDto,
} from '../dtos/complaint.dto';
import { BadRequestError } from '../errors/BadRequestError';
import { ForbiddenError } from '../errors/ForbiddenError';
import { NotFoundError } from '../errors/NotFoundError';
import { prisma } from '../lib/prisma';
import { ComplaintRepository } from '../repositories/complaint.repository';
import { compact } from '../utils/object.util';

export class ComplaintService {
    private complaintRepo = new ComplaintRepository();
    private isAdmin(role: string): boolean {
        return role === 'ADMIN' || role === 'SUPER_ADMIN';
    }

    // 민원 등록
    async createComplaint(user: CreateComplaintReqDto['user'], body: CreateComplaintReqDto['body']) {
        return await prisma.$transaction(async (tx) => {
            const newComplaint = await tx.complaint.create({
                data: {
                    title: body.title,
                    content: body.content,
                    isPrivate: body.isPrivate,
                    status: 'PENDING',
                    userId: BigInt(user.id),
                    apartmentId: BigInt(body.apartmentId),
                },
            });

            const admins = await tx.user.findMany({
                where: {
                    apartmentId: BigInt(body.apartmentId),
                    role: { in: ['ADMIN', 'SUPER_ADMIN'] },
                },
                select: { id: true },
            });

            if (admins.length > 0) {
                const notifications = admins.map((admin) => ({
                    userId: admin.id,
                    content: `[신규 민원] ${body.title}`,
                }));
                await tx.notification.createMany({ data: notifications });
                // TODO: tx 완료 후 소켓 전송 로직 호출
            }

            return newComplaint;
        });
    }

    // 민원 목록 조회
    async getComplaintList(user: GetComplaintListReqDto['user'], query: GetComplaintListReqDto['query']) {
        const skip = (query.page - 1) * query.limit;
        return await this.complaintRepo.findMany(BigInt(user.apartmentId), skip, query.limit, query.status, query.keyword);
    }

    // 민원 상세 조회
    async getComplaintDetail(complaintId: string, user: GetComplaintDetailReqDto['user']) {
        const complaint = await this.complaintRepo.findById(BigInt(complaintId));
        if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');

        if (complaint.isPrivate) {
            const isAuthor = complaint.userId === BigInt(user.id);
            if (!isAuthor && !this.isAdmin(user.role)) {
                throw new ForbiddenError('비공개 민원은 작성자와 관리자만 확인할 수 있습니다.');
            }
        }

        return complaint;
    }
    // 민원 수정
    async updateComplaint(complaintId: string, user: UpdateComplaintReqDto['user'], body: UpdateComplaintReqDto['body']) {
        const complaint = await this.complaintRepo.findById(BigInt(complaintId));
        if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');

        if (complaint.userId !== BigInt(user.id)) {
            throw new ForbiddenError('본인이 작성한 민원만 수정할 수 있습니다.');
        }

        if (complaint.status !== 'PENDING') {
            throw new BadRequestError('처리가 시작된 민원은 수정할 수 없습니다.');
        }

        const { title, content, isPrivate } = body;
        const updateData = compact({ title, content, isPrivate });

        return await this.complaintRepo.update(BigInt(complaintId), updateData);
    }

    //  민원 상태 변경 (관리자 전용)
    async updateComplaintStatus(
        complaintId: string,
        user: UpdateComplaintStatusReqDto['user'], // 호출자 정보 추가
        status: UpdateComplaintStatusReqDto['body']['status'],
    ) {
        if (!this.isAdmin(user.role)) {
            throw new ForbiddenError('관리자만 민원 상태를 변경할 수 있습니다.');
        }

        const complaint = await this.complaintRepo.findById(BigInt(complaintId));
        if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');

        return await prisma.$transaction(async (tx) => {
            const updated = await tx.complaint.update({
                where: { id: BigInt(complaintId) },
                data: { status },
            });

            await tx.notification.create({
                data: {
                    userId: complaint.userId,
                    content: `작성하신 민원의 상태가 [${status}](으)로 변경되었습니다.`,
                },
            });

            return updated;
        });
    }

    // 민원 삭제
    async deleteComplaint(complaintId: string, user: DeleteComplaintReqDto['user']) {
        const complaint = await this.complaintRepo.findById(BigInt(complaintId));
        if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');

        if (complaint.userId !== BigInt(user.id)) {
            throw new ForbiddenError('본인이 작성한 민원만 삭제할 수 있습니다.');
        }

        if (complaint.status !== 'PENDING') {
            throw new BadRequestError('처리가 시작된 민원은 삭제할 수 없습니다.');
        }

        return await this.complaintRepo.delete(BigInt(complaintId));
    }
}
