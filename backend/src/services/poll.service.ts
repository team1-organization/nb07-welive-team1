import { PollStatus } from '../../generated/prisma';
import { prisma } from '../lib/prisma';
import { PollRepository } from '../repositories/poll.repository';
import { AuthUser, CreatePollData, PollFilterQuery, UpdatePollData } from '../types/poll.type';

export class PollService {
    private pollRepository = new PollRepository();

    async createPoll(user: AuthUser, data: CreatePollData) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new Error('관리자만 투표를 생성할 수 있습니다.');
        }
        if (new Date(data.startDate) >= new Date(data.endDate)) {
            throw new Error('종료일은 시작일보다 늦어야 합니다.');
        }
        const finalBuildingPermission = data.buildingPermission ?? (data.building ? Number(data.building) : 0);

        const createData: CreatePollData = {
            ...data,
            buildingPermission: finalBuildingPermission,
        };

        return await this.pollRepository.create(BigInt(user.id), createData);
    }

    async getPolls(user: AuthUser, filter: PollFilterQuery) {
        if (!user.apartmentId) throw new Error('소속된 아파트 정보가 없습니다.');

        const aptId = BigInt(user.apartmentId);
        let userBuildingNumber: number | undefined = undefined;

        if (user.role === 'USER' && user.residentDong) {
            userBuildingNumber = parseInt(user.residentDong, 10);
        }

        const polls = await this.pollRepository.findAll(filter, aptId, userBuildingNumber);

        return polls.map((poll) => ({
            ...poll,
            status: this.getComputedStatus(poll.status, poll.startDate, poll.endDate),
            pollId: poll.id.toString(),
            id: poll.id.toString(),
            buildingPermission: poll.buildingPermission,
            boardId: poll.boardId.toString(),
            userId: poll.userId.toString(),
            options: poll.pollOptions.map((option) => ({
                id: option.id.toString(),
                title: option.title,
                voteCount: option._count?.votes || 0,
            })),
        }));
    }
    async getPollDetail(user: AuthUser, pollId: bigint) {
        const poll = await this.pollRepository.findById(pollId);
        if (!poll) throw new Error('투표를 찾을 수 없습니다.');

        if (user.role === 'USER') {
            if (poll.buildingPermission !== 0) {
                const userBuildingNumber = user.residentDong ? parseInt(user.residentDong, 10) : -1;
                if (poll.buildingPermission !== userBuildingNumber) {
                    throw new Error('해당 투표에 대한 접근 권한이 없습니다.');
                }
            }
        }
        const computedStatus = this.getComputedStatus(poll.status, poll.startDate, poll.endDate);
        const isClosed = computedStatus === PollStatus.CLOSED;
        const showResults = user.role !== 'USER' || isClosed;

        return {
            ...poll,
            status: computedStatus,
            pollId: poll.id.toString(),
            id: poll.id.toString(),
            boardId: poll.boardId.toString(),
            userId: poll.userId.toString(),
            showResults,
            options: poll.pollOptions.map((option) => ({
                id: option.id.toString(),
                title: option.title,
                voteCount: option._count?.votes || 0,
            })),
            board: {
                ...poll.board,
                id: poll.board.id.toString(),
                apartmentId: poll.board.apartmentId.toString(),
            },
        };
    }

    async vote(user: AuthUser, optionId: bigint) {
        if (user.role !== 'USER') throw new Error('입주민만 투표할 수 있습니다.');

        const option = await prisma.pollOption.findUnique({
            where: { id: optionId },
            include: { poll: true },
        });

        if (!option) throw new Error('해당 투표 선택지를 찾을 수 없습니다.');
        const poll = option.poll;

        const currentStatus = this.getComputedStatus(poll.status, poll.startDate, poll.endDate);

        if (currentStatus !== PollStatus.IN_PROGRESS) {
            throw new Error('현재 투표 기간이 아닙니다.');
        }

        if (poll.buildingPermission !== 0) {
            const userBuildingNumber = user.residentDong ? parseInt(user.residentDong, 10) : -1;
            if (poll.buildingPermission !== userBuildingNumber) {
                throw new Error('투표 권한이 없습니다.');
            }
        }

        const newVote = await this.pollRepository.createVote(BigInt(user.id), optionId);

        return {
            ...newVote,
            id: newVote.id.toString(),
            userId: newVote.userId.toString(),
            optionId: newVote.optionId.toString(),
            updatedOption: {
                title: option?.title || '알 수 없는 항목',
            },
        };
    }

    async cancelVote(user: AuthUser, optionId: bigint) {
        if (user.role !== 'USER') throw new Error('입주민만 투표를 취소할 수 있습니다.');

        const option = await prisma.pollOption.findUnique({
            where: { id: optionId },
            include: { poll: true },
        });

        if (!option) throw new Error('해당 투표 선택지를 찾을 수 없습니다.');
        const poll = option.poll;

        const currentStatus = this.getComputedStatus(poll.status, poll.startDate, poll.endDate);

        if (currentStatus !== PollStatus.IN_PROGRESS) {
            throw new Error('종료된 투표는 취소할 수 없습니다.');
        }

        return await this.pollRepository.deleteVote(BigInt(user.id), optionId);
    }

    async updatePoll(user: AuthUser, pollId: bigint, data: UpdatePollData) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new Error('관리자 권한이 필요합니다.');
        }

        const poll = await this.pollRepository.findById(pollId);
        if (!poll) throw new Error('투표를 찾을 수 없습니다.');

        if (poll.startDate <= new Date() && (data.title || data.content)) {
            throw new Error('시작된 투표의 내용은 수정할 수 없습니다.');
        }

        if (data.status === PollStatus.CLOSED && poll.status !== PollStatus.CLOSED) {
            await this.closeAndCreateNotice(pollId, BigInt(user.id));
        }

        return await this.pollRepository.update(pollId, data);
    }

    async deletePoll(user: AuthUser, pollId: bigint) {
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            throw new Error('관리자 권한이 필요합니다.');
        }

        const poll = await this.pollRepository.findById(pollId);
        if (!poll) throw new Error('투표를 찾을 수 없습니다.');

        if (poll.startDate <= new Date()) {
            throw new Error('시작된 투표는 삭제할 수 없습니다.');
        }

        return await this.pollRepository.delete(pollId);
    }

    private async closeAndCreateNotice(pollId: bigint, adminId: bigint) {
        const poll = await this.pollRepository.findById(pollId);
        if (!poll) return;

        await prisma.$transaction(async (tx) => {
            await tx.poll.update({
                where: { id: pollId },
                data: { status: PollStatus.CLOSED },
            });

            const noticeBoard = await tx.board.findUnique({
                where: {
                    apartmentId_type: {
                        apartmentId: poll.board.apartmentId,
                        type: 'NOTICE',
                    },
                },
            });

            if (noticeBoard) {
                await tx.notice.create({
                    data: {
                        category: 'RESIDENT_VOTE',
                        title: `[투표 결과 안내] ${poll.title}`,
                        content: `해당 주민 투표가 종료되었습니다. 결과를 확인해 주세요.`,
                        userId: adminId,
                        boardId: noticeBoard.id,
                    },
                });
            }
        });
    }
    private getComputedStatus(status: PollStatus, startDate: Date, endDate: Date): PollStatus {
        if (status === PollStatus.CLOSED) return PollStatus.CLOSED;

        const now = new Date();

        if (now < startDate) return PollStatus.PENDING;
        if (now >= startDate && now <= endDate) return PollStatus.IN_PROGRESS;
        return PollStatus.CLOSED;
    }
}
