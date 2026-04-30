import { NextFunction, Request, Response } from 'express';
import { PollStatus } from '../../generated/prisma';
import { PollService } from '../services/poll.service';
import { AuthUser, CreatePollData, PollFilterQuery, UpdatePollData } from '../types/poll.type';

export class PollController {
    private pollService = new PollService();

    createPoll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const body = req.body;
            const targetBoardId = body.boardId || body.apartmentId;
            if (!targetBoardId) {
                return res.status(400).json({ message: 'boardId를 찾을 수 없습니다' });
            }
            const data: CreatePollData = {
                title: body.title,
                content: body.content,
                buildingPermission: body.building || 0,
                startDate: body.startDate,
                endDate: body.endDate,
                options: body.options,
                boardId: BigInt(targetBoardId),
            };

            const result = await this.pollService.createPoll(user, data);
            res.status(201).json({ message: '투표가 등록되었습니다.', data: result });
        } catch (error) {
            next(error);
        }
    };

    getPolls = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;

            const query: PollFilterQuery = {
                status: typeof req.query.status === 'string' ? (req.query.status as PollStatus) : undefined,
                buildingPermission: typeof req.query.building === 'string' ? parseInt(req.query.building, 10) : undefined,
                searchKeyword: typeof req.query.searchKeyword === 'string' ? req.query.searchKeyword : undefined,
            };

            const result = await this.pollService.getPolls(user, query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    getPollDetail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;
            const pollId = BigInt(String(req.params.pollId));

            const result = await this.pollService.getPollDetail(user, pollId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    vote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;
            const optionId = BigInt(String(req.params.optionId));

            const result = await this.pollService.vote(user, optionId);
            res.status(201).json({ message: '투표가 완료되었습니다.', data: result });
        } catch (error) {
            next(error);
        }
    };

    cancelVote = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;
            const optionId = BigInt(String(req.params.optionId));

            await this.pollService.cancelVote(user, optionId);
            res.status(200).json({ message: '투표가 취소되었습니다.' });
        } catch (error) {
            next(error);
        }
    };

    updatePoll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;
            const pollId = BigInt(String(req.params.pollId));

            const data: UpdatePollData = {
                title: req.body.title,
                content: req.body.content,
                status: req.body.status,
                startDate: req.body.startDate,
                endDate: req.body.endDate,
                buildingPermission: req.body.building,
            };

            const result = await this.pollService.updatePoll(user, pollId, data);
            res.status(200).json({ message: '투표가 수정되었습니다.', data: result });
        } catch (error) {
            next(error);
        }
    };

    deletePoll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user) throw new Error('인증되지 않은 사용자입니다.');
            const user = req.user as unknown as AuthUser;
            const pollId = BigInt(String(req.params.pollId));

            await this.pollService.deletePoll(user, pollId);
            res.status(200).json({ message: '투표가 삭제되었습니다.' });
        } catch (error) {
            next(error);
        }
    };
}
